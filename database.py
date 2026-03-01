import os
import logging
from pymongo import MongoClient
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
MONGO_URI = os.getenv('MONGO_URI', 'mongodb+srv://admin:password@cluster.mongodb.net/earngram?retryWrites=true&w=majority')

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)

def test_connection():
    try:
        client.admin.command('ping')
        logger.info("Successfully connected to MongoDB.")
        return True
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
        return False

# Test connection in background or on first request
# For now, we just define the collections
db = client['earngram_prod']

users_col = db['users']
transactions_col = db['transactions']
withdrawals_col = db['withdrawals']
tasks_col = db['tasks']
ad_tasks_col = db['ad_tasks']
settings_col = db['settings']
deposits_col = db['deposits']

# Referral Percentages: Level 1 (10%), Level 2 (5%), Level 3 (2%), Level 4 (1%)
REF_PERCENTAGES = [0.10, 0.05, 0.02, 0.01]

def get_user(user_id):
    """Fetch user by Telegram ID."""
    try:
        if not user_id:
            logger.error("get_user called with empty user_id")
            return None
        return users_col.find_one({"id": int(user_id)})
    except ValueError:
        logger.error(f"Invalid user_id format: {user_id}")
        return None
    except Exception as e:
        logger.error(f"Error fetching user {user_id}: {e}")
        return None

def create_user(tg_user, inviter_id=None):
    """Initialize a new user or return existing."""
    try:
        user = get_user(tg_user.id)
        if not user:
            new_user = {
                "id": tg_user.id,
                "username": tg_user.username or f"user_{tg_user.id}",
                "balanceRiyal": 0.0,
                "balanceCrypto": 0.0,
                "totalEarningsRiyal": 0.0,
                "referrals": 0,
                "invitedBy": int(inviter_id) if inviter_id and str(inviter_id).isdigit() else None,
                "isBanned": False,
                "warningCount": 0,
                "isVerified": False,
                "lastDepositAttempt": None,
                "createdAt": datetime.utcnow()
            }
            users_col.insert_one(new_user)
            logger.info(f"Created new user: {tg_user.id}")
            
            # Update inviter count
            if new_user["invitedBy"]:
                users_col.update_one({"id": new_user["invitedBy"]}, {"$inc": {"referrals": 1}})
            return new_user
        return user
    except Exception as e:
        logger.error(f"Error creating user {tg_user.id}: {e}")
        return None

def add_strike(user_id):
    """Add a warning/strike. Ban if >= 3."""
    try:
        user = get_user(user_id)
        if not user: 
            return False
        
        new_warnings = user.get("warningCount", 0) + 1
        is_banned = new_warnings >= 3
        
        users_col.update_one(
            {"id": user_id},
            {"$set": {"warningCount": new_warnings, "isBanned": is_banned}}
        )
        logger.info(f"Added strike to user {user_id}. Total warnings: {new_warnings}. Banned: {is_banned}")
        return is_banned
    except Exception as e:
        logger.error(f"Error adding strike to user {user_id}: {e}")
        return False

def process_reward(user_id, amount_riyal, task_name="Video Task"):
    """Adds balance to user and pays out 4 levels of referrals."""
    try:
        # Ensure user_id is integer
        user_id = int(user_id)
        
        # 1. Update primary user
        users_col.update_one(
            {"id": user_id},
            {
                "$inc": {
                    "balanceRiyal": amount_riyal,
                    "totalEarningsRiyal": amount_riyal
                }
            }
        )
        
        # 2. Log transaction
        transactions_col.insert_one({
            "userId": user_id,
            "amount": amount_riyal,
            "type": "EARNING",
            "description": task_name,
            "timestamp": datetime.utcnow()
        })
        logger.info(f"Processed reward of {amount_riyal} SAR for user {user_id} ({task_name})")

        # 3. Handle Referrals (4 Levels)
        current_user = get_user(user_id)
        if not current_user:
            return

        parent_id = current_user.get("invitedBy")
        
        for level, pct in enumerate(REF_PERCENTAGES):
            if not parent_id:
                break
                
            commission = amount_riyal * pct
            users_col.update_one(
                {"id": parent_id},
                {
                    "$inc": {
                        "balanceRiyal": commission,
                        "totalEarningsRiyal": commission
                    }
                }
            )
            
            transactions_col.insert_one({
                "userId": parent_id,
                "amount": commission,
                "type": "EARNING",
                "description": f"Ref Commission (Lvl {level+1}) from {user_id}",
                "timestamp": datetime.utcnow()
            })
            logger.info(f"Paid referral commission of {commission} SAR to user {parent_id} (Level {level+1})")
            
            # Get next parent
            parent_user = get_user(parent_id)
            parent_id = parent_user.get("invitedBy") if parent_user else None

    except Exception as e:
        logger.error(f"Error processing reward for user {user_id}: {e}")

def request_withdrawal(user_id, amount, method, address, currency="SAR"):
    """Handle withdrawal request and deduct balance."""
    try:
        field = "balanceRiyal" if currency == "SAR" else "balanceCrypto"
        
        user = get_user(user_id)
        if not user:
            return False, "User not found"

        if user.get(field, 0) < amount:
            return False, "Insufficient balance"
            
        withdrawal = {
            "userId": user_id,
            "amount": amount,
            "currency": currency,
            "method": method,
            "address": address,
            "status": "PENDING",
            "createdAt": datetime.utcnow()
        }
        
        # Deduct balance
        users_col.update_one({"id": user_id}, {"$inc": {field: -amount}})
        # Record withdrawal
        withdrawals_col.insert_one(withdrawal)
        
        logger.info(f"User {user_id} requested withdrawal of {amount} {currency} via {method}")
        return True, "Withdrawal requested successfully"
    except Exception as e:
        logger.error(f"Error requesting withdrawal for user {user_id}: {e}")
        return False, "An error occurred while processing the withdrawal"

def get_payout_stats():
    """Calculate global payout statistics using MongoDB aggregation."""
    try:
        now = datetime.utcnow()
        last_24h = now - timedelta(hours=24)
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Base match for completed withdrawals
        base_match = {"status": "COMPLETED"}

        # Total Stats
        total_pipeline = [
            {"$match": base_match},
            {"$group": {
                "_id": "$currency",
                "totalAmount": {"$sum": "$amount"},
                "count": {"$sum": 1},
                "uniqueUsers": {"$addToSet": "$userId"}
            }}
        ]
        
        # Daily Stats
        daily_pipeline = [
            {"$match": {**base_match, "processedAt": {"$gte": last_24h}}},
            {"$group": {
                "_id": "$currency",
                "totalAmount": {"$sum": "$amount"}
            }}
        ]

        # Monthly Stats
        monthly_pipeline = [
            {"$match": {**base_match, "processedAt": {"$gte": start_of_month}}},
            {"$group": {
                "_id": "$currency",
                "totalAmount": {"$sum": "$amount"}
            }}
        ]

        totals = list(withdrawals_col.aggregate(total_pipeline))
        daily = list(withdrawals_col.aggregate(daily_pipeline))
        monthly = list(withdrawals_col.aggregate(monthly_pipeline))

        # Unique users count (global)
        unique_users_pipeline = [
            {"$match": base_match},
            {"$group": {"_id": None, "users": {"$addToSet": "$userId"}}},
            {"$project": {"count": {"$size": "$users"}}}
        ]
        unique_users_res = list(withdrawals_col.aggregate(unique_users_pipeline))
        total_users = unique_users_res[0]['count'] if unique_users_res else 0

        stats = {
            "totalSAR": 0.0,
            "totalUSDT": 0.0,
            "totalUsers": total_users,
            "dailySAR": 0.0,
            "dailyUSDT": 0.0,
            "monthlySAR": 0.0,
            "monthlyUSDT": 0.0
        }

        for item in totals:
            if item['_id'] == 'SAR': stats['totalSAR'] = item['totalAmount']
            else: stats['totalUSDT'] = item['totalAmount']
            
        for item in daily:
            if item['_id'] == 'SAR': stats['dailySAR'] = item['totalAmount']
            else: stats['dailyUSDT'] = item['totalAmount']

        for item in monthly:
            if item['_id'] == 'SAR': stats['monthlySAR'] = item['totalAmount']
            else: stats['monthlyUSDT'] = item['totalAmount']

        return stats
    except Exception as e:
        logger.error(f"Error calculating payout stats: {e}")
        return None
    """Fetch withdrawal history for a specific user."""
    try:
        withdrawals = list(withdrawals_col.find({"userId": int(user_id)}).sort("createdAt", -1))
        for w in withdrawals:
            w['_id'] = str(w['_id'])
        return withdrawals
    except Exception as e:
        logger.error(f"Error fetching withdrawals for user {user_id}: {e}")
        return []

def get_all_withdrawals(status=None):
    """Fetch all withdrawal requests, optionally filtered by status."""
    try:
        query = {"status": status} if status else {}
        withdrawals = list(withdrawals_col.find(query).sort("createdAt", -1))
        for w in withdrawals:
            w['_id'] = str(w['_id'])
        return withdrawals
    except Exception as e:
        logger.error(f"Error fetching all withdrawals: {e}")
        return []

def process_withdrawal_action(withdrawal_id, action):
    """Approve or Reject a withdrawal."""
    from bson import ObjectId
    try:
        status = "COMPLETED" if action == "approve" else "REJECTED"
        withdrawal = withdrawals_col.find_one({"_id": ObjectId(withdrawal_id)})
        
        if not withdrawal or withdrawal['status'] != 'PENDING':
            return False, "Withdrawal not found or already processed"
            
        # If rejected, refund balance
        if action == "reject":
            field = "balanceRiyal" if withdrawal['currency'] == "SAR" else "balanceCrypto"
            users_col.update_one({"id": withdrawal['userId']}, {"$inc": {field: withdrawal['amount']}})
            
        withdrawals_col.update_one(
            {"_id": ObjectId(withdrawal_id)},
            {"$set": {"status": status, "processedAt": datetime.utcnow()}}
        )
        return True, f"Withdrawal {status.lower()} successfully"
    except Exception as e:
        logger.error(f"Error processing withdrawal {withdrawal_id}: {e}")
        return False, str(e)
def get_user_stats(user_id):
    """Get the current balance and rank of a user."""
    try:
        user = get_user(user_id)
        if user:
            total_earnings = user.get("totalEarningsRiyal", 0.0)
            # Calculate rank: number of users with strictly greater earnings + 1
            rank = users_col.count_documents({"totalEarningsRiyal": {"$gt": total_earnings}}) + 1
            return {
                "balance_sar": user.get("balanceRiyal", 0.0),
                "balance_usdt": user.get("balanceCrypto", 0.0),
                "total_earnings_sar": total_earnings,
                "rank": rank,
                "is_flagged": user.get("isFlagged", False),
                "flag_reason": user.get("flagReason", ""),
                "device_id": user.get("deviceId")
            }
        return None
    except Exception as e:
        logger.error(f"Error fetching stats for user {user_id}: {e}")
        return None

def get_leaderboard(limit=10):
    """Get the top users by totalEarningsRiyal."""
    try:
        users = users_col.find({}, {"_id": 0, "id": 1, "username": 1, "totalEarningsRiyal": 1}).sort("totalEarningsRiyal", -1).limit(limit)
        return list(users)
    except Exception as e:
        logger.error(f"Error fetching leaderboard: {e}")
        return []

# --- TASK MANAGEMENT ---

def add_task(task_data):
    """Add a new video task."""
    try:
        # Explicitly set status to active
        task_data['status'] = 'active'
        tasks_col.insert_one(task_data)
        print(f"Task saved to DB: {task_data.get('id')}")
        return True
    except Exception as e:
        logger.error(f"Error adding task: {e}")
        return False

def get_tasks():
    """Get all video tasks with active status."""
    try:
        tasks = list(tasks_col.find({"status": "active"}, {"_id": 0}))
        return tasks
    except Exception as e:
        logger.error(f"Error fetching tasks: {e}")
        return []

def delete_task(task_id):
    """Delete a video task by ID."""
    try:
        tasks_col.delete_one({"id": task_id})
        return True
    except Exception as e:
        logger.error(f"Error deleting task {task_id}: {e}")
        return False

def add_ad_task(ad_data):
    """Add a new ad task."""
    try:
        ad_tasks_col.insert_one(ad_data)
        return True
    except Exception as e:
        logger.error(f"Error adding ad task: {e}")
        return False

def get_ad_tasks():
    """Get all ad tasks."""
    try:
        ads = list(ad_tasks_col.find({}, {"_id": 0}))
        return ads
    except Exception as e:
        logger.error(f"Error fetching ad tasks: {e}")
        return []

def delete_ad_task(ad_id):
    """Delete an ad task by ID."""
    try:
        ad_tasks_col.delete_one({"id": ad_id})
        return True
    except Exception as e:
        logger.error(f"Error deleting ad task {ad_id}: {e}")
        return False

def sync_security(user_id, device_id, ip):
    """Update user device/IP info and flag multi-accounts."""
    try:
        user_id = int(user_id)
        current_user = get_user(user_id)
        if not current_user:
            return False, "User not found"

        # 1. Check for other accounts on this device
        other_user = users_col.find_one({
            "id": {"$ne": user_id},
            "deviceId": device_id
        })

        is_flagged = current_user.get("isFlagged", False)
        flag_reason = current_user.get("flagReason", "")

        if other_user:
            is_flagged = True
            flag_reason = f"Same Device ID as User_{other_user['id']}"
            logger.warning(f"Security Alert: User {user_id} using same device as {other_user['id']}")

        # 2. IP Tracking (more than 2 accounts from same IP)
        ip_count = users_col.count_documents({"lastIp": ip, "id": {"$ne": user_id}})
        if ip_count >= 2:
            is_flagged = True
            if not flag_reason:
                flag_reason = f"IP Address Shared with {ip_count} other accounts"
            logger.warning(f"Security Alert: IP {ip} shared by {ip_count + 1} users")

        # 3. Update user
        update_data = {
            "lastIp": ip,
            "isFlagged": is_flagged,
            "flagReason": flag_reason
        }
        
        # Only set deviceId if not already set (Primary Account logic)
        if not current_user.get("deviceId"):
            update_data["deviceId"] = device_id

        users_col.update_one({"id": user_id}, {"$set": update_data})
        return True, "Security synced"
    except Exception as e:
        logger.error(f"Error syncing security for user {user_id}: {e}")
        return False, str(e)

def reset_device(user_id):
    """Clear device ID and last IP for a user (Admin only action)."""
    try:
        users_col.update_one(
            {"id": int(user_id)},
            {"$set": {"deviceId": None, "lastIp": None, "isFlagged": False, "flagReason": ""}}
        )
        return True
    except Exception as e:
        logger.error(f"Error resetting device for user {user_id}: {e}")
        return False

def get_maintenance_settings():
    """Fetch global maintenance and system settings."""
    try:
        settings = settings_col.find_one({"type": "maintenance"})
        if settings:
            settings.pop('_id', None)
            return settings
        return None
    except Exception as e:
        logger.error(f"Error fetching maintenance settings: {e}")
        return None

def claim_daily_bonus(user_id):
    """Check and process daily bonus (1.00 SAR)."""
    try:
        user = get_user(user_id)
        if not user:
            return False, "User not found"
        
        last_claim = user.get("dailyBonusLastClaim")
        now = datetime.utcnow()
        
        if last_claim:
            # Handle both datetime objects and ISO strings
            if isinstance(last_claim, str):
                try:
                    # Remove 'Z' if present and convert
                    clean_ts = last_claim.replace('Z', '+00:00')
                    last_claim_dt = datetime.fromisoformat(clean_ts)
                except Exception as e:
                    logger.error(f"Error parsing timestamp {last_claim}: {e}")
                    last_claim_dt = None
            else:
                last_claim_dt = last_claim
            
            if last_claim_dt:
                # Ensure both are naive or both are aware. datetime.utcnow() is naive.
                if last_claim_dt.tzinfo is not None:
                    last_claim_dt = last_claim_dt.replace(tzinfo=None)
                
                diff = (now - last_claim_dt).total_seconds()
                if diff < 24 * 3600:
                    remaining = int(24 * 3600 - diff)
                    hours = remaining // 3600
                    minutes = (remaining % 3600) // 60
                    return False, f"Already claimed. Try again in {hours}h {minutes}m"
        
        # Process reward (1.00 SAR)
        reward = 1.00
        process_reward(user_id, reward, "Daily Bonus")
        
        # Update last claim time
        users_col.update_one({"id": user_id}, {"$set": {"dailyBonusLastClaim": now}})
        
        return True, "Daily Bonus Claimed! +1.00 SAR"
    except Exception as e:
        logger.error(f"Error claiming daily bonus for user {user_id}: {e}")
        return False, "Server error, please try again"

def update_maintenance_settings(settings_data):
    """Update global maintenance and system settings."""
    try:
        # Ensure type is set correctly
        settings_data["type"] = "maintenance"
        settings_col.update_one(
            {"type": "maintenance"},
            {"$set": settings_data},
            upsert=True
        )
        return True
    except Exception as e:
        logger.error(f"Error updating maintenance settings: {e}")
        return False

def admin_update_balance(user_id, amount, currency):
    """Update user balance (Admin only action)."""
    try:
        field = "balanceRiyal" if currency == "SAR" else "balanceCrypto"
        users_col.update_one(
            {"id": int(user_id)},
            {"$inc": {field: float(amount)}}
        )
        return True
    except Exception as e:
        logger.error(f"Error updating balance for user {user_id}: {e}")
        return False

def reset_leaderboard():
    """Reset total earnings for all users (New Season)."""
    try:
        users_col.update_many({}, {"$set": {"totalEarningsRiyal": 0.0}})
        return True
    except Exception as e:
        logger.error(f"Error resetting leaderboard: {e}")
        return False

# --- DEPOSIT MANAGEMENT ---

def create_deposit(user_id, amount, currency, method, tx_id, sender_number=None):
    """Create a new deposit record."""
    try:
        deposit = {
            "userId": int(user_id),
            "amount": float(amount),
            "currency": currency,
            "method": method,
            "txId": tx_id,
            "senderNumber": sender_number,
            "status": "PENDING",
            "createdAt": datetime.utcnow()
        }
        deposits_col.insert_one(deposit)
        # Update last attempt for cooldown
        users_col.update_one({"id": int(user_id)}, {"$set": {"lastDepositAttempt": datetime.utcnow()}})
        return True
    except Exception as e:
        logger.error(f"Error creating deposit: {e}")
        return False

def get_deposits(status=None):
    """Get deposit records."""
    try:
        query = {"status": status} if status else {}
        deposits = list(deposits_col.find(query).sort("createdAt", -1))
        for d in deposits:
            d['_id'] = str(d['_id'])
        return deposits
    except Exception as e:
        logger.error(f"Error fetching deposits: {e}")
        return []

def approve_deposit(deposit_id):
    """Approve a deposit and credit user balance."""
    from bson import ObjectId
    try:
        deposit = deposits_col.find_one({"_id": ObjectId(deposit_id)})
        if not deposit or deposit['status'] != 'PENDING':
            return False, "Deposit not found or already processed"
        
        user_id = deposit['userId']
        amount = deposit['amount']
        currency = deposit['currency'] # SAR or USDT
        
        # Credit user
        field = "balanceRiyal" if currency == "SAR" else "balanceCrypto"
        users_col.update_one({"id": user_id}, {"$inc": {field: amount}})
        
        # Log transaction
        transactions_col.insert_one({
            "userId": user_id,
            "amount": amount,
            "type": "DEPOSIT",
            "description": f"Deposit Approved ({deposit['method']})",
            "currency": currency,
            "timestamp": datetime.utcnow()
        })
        
        # Update deposit status
        deposits_col.update_one({"_id": ObjectId(deposit_id)}, {"$set": {"status": "APPROVED", "processedAt": datetime.utcnow()}})
        
        return True, "Deposit approved and credited"
    except Exception as e:
        logger.error(f"Error approving deposit: {e}")
        return False, str(e)

def reject_deposit(deposit_id):
    """Reject a deposit."""
    from bson import ObjectId
    try:
        deposits_col.update_one(
            {"_id": ObjectId(deposit_id)}, 
            {"$set": {"status": "REJECTED", "processedAt": datetime.utcnow()}}
        )
        return True
    except Exception as e:
        logger.error(f"Error rejecting deposit: {e}")
        return False
