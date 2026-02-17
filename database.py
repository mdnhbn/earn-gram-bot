import os
from pymongo import MongoClient
from datetime import datetime
from bson import ObjectId

# Configuration
MONGO_URI = os.getenv('MONGO_URI', 'mongodb+srv://admin:password@cluster.mongodb.net/earngram?retryWrites=true&w=majority')
client = MongoClient(MONGO_URI)
db = client['earngram_prod']

users_col = db['users']
transactions_col = db['transactions']
withdrawals_col = db['withdrawals']

# Referral Percentages: Level 1 (10%), Level 2 (5%), Level 3 (2%), Level 4 (1%)
REF_PERCENTAGES = [0.10, 0.05, 0.02, 0.01]

def get_user(user_id):
    """Fetch user by Telegram ID."""
    return users_col.find_one({"id": int(user_id)})

def create_user(tg_user, inviter_id=None):
    """Initialize a new user or return existing."""
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
            "createdAt": datetime.utcnow()
        }
        users_col.insert_one(new_user)
        # Update inviter count
        if new_user["invitedBy"]:
            users_col.update_one({"id": new_user["invitedBy"]}, {"$inc": {"referrals": 1}})
        return new_user
    return user

def add_strike(user_id):
    """Add a warning/strike. Ban if >= 3."""
    user = get_user(user_id)
    if not user: return
    
    new_warnings = user.get("warningCount", 0) + 1
    is_banned = new_warnings >= 3
    
    users_col.update_one(
        {"id": user_id},
        {"$set": {"warningCount": new_warnings, "isBanned": is_banned}}
    )
    return is_banned

def process_reward(user_id, amount_riyal, task_name="Video Task"):
    """Adds balance to user and pays out 4 levels of referrals."""
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

    # 3. Handle Referrals (4 Levels)
    current_user = get_user(user_id)
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
        
        # Get next parent
        parent_user = get_user(parent_id)
        parent_id = parent_user.get("invitedBy") if parent_user else None

def request_withdrawal(user_id, amount, method, address, currency="SAR"):
    """Handle withdrawal request and deduct balance."""
    field = "balanceRiyal" if currency == "SAR" else "balanceCrypto"
    
    user = get_user(user_id)
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
    
    users_col.update_one({"id": user_id}, {"$inc": {field: -amount}})
    withdrawals_col.insert_one(withdrawal)
    return True, "Withdrawal requested successfully"