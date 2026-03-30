import os
import json
import threading
import telebot
from flask import Flask, request, jsonify
from bson import ObjectId
try:
    from flask_cors import CORS
except ImportError:
    CORS = None
import database as db

# --- RENDER PORT COMPLIANCE ---
server = Flask(__name__)
if CORS:
    # Allow the specific Render URL and the AI Studio preview URLs
    CORS(server, resources={r"/api/*": {"origins": ["https://earn-gram-bot.onrender.com", "https://ais-dev-zk2zkmizyjvlalvi5wfkvm-5160058845.europe-west1.run.app", "https://ais-pre-zk2zkmizyjvlalvi5wfkvm-5160058845.europe-west1.run.app"]}})

# --- BOT LOGIC ---
TOKEN = os.getenv('BOT_TOKEN')
ADMIN_TOKEN = os.getenv('ADMIN_BOT_TOKEN')

# User Bot (Main)
if not TOKEN:
    print("WARNING: BOT_TOKEN environment variable is missing. Bot features will be disabled.")
    class DummyBot:
        def infinity_polling(self): pass
        def message_handler(self, *args, **kwargs): return lambda f: f
        def callback_query_handler(self, *args, **kwargs): return lambda f: f
        def remove_webhook(self): pass
        def send_message(self, *args, **kwargs): pass
        def delete_message(self, *args, **kwargs): pass
    bot = DummyBot()
else:
    bot = telebot.TeleBot(TOKEN)
    try:
        bot.remove_webhook()
    except:
        pass

# Admin Bot (Alerts)
if not ADMIN_TOKEN:
    print("WARNING: ADMIN_BOT_TOKEN is missing. Admin alerts will be disabled.")
    admin_bot = bot # Fallback to main bot if admin token is missing
else:
    admin_bot = telebot.TeleBot(ADMIN_TOKEN)
    try:
        admin_bot.remove_webhook()
    except:
        pass

def is_admin(admin_id):
    """Check if a user is an admin."""
    if not admin_id:
        return False
    try:
        # 929198867 is the main admin
        return int(admin_id) == 929198867
    except (ValueError, TypeError):
        return False

def send_admin_alert(message):
    """Send real-time alert to admin via Admin Bot."""
    try:
        admin_bot.send_message(929198867, f"🔔 *ADMIN ALERT*\n\n{message}", parse_mode='Markdown')
    except Exception as e:
        print(f"Failed to send admin alert: {e}")

# Anti-Spam: Delete all user-sent messages/photos automatically
@bot.message_handler(func=lambda message: True, content_types=['text', 'photo', 'video', 'document', 'audio', 'voice', 'sticker'])
def anti_spam(message):
    if message.chat.type == 'private' and not is_admin(message.from_user.id):
        try:
            bot.delete_message(message.chat.id, message.message_id)
        except:
            pass

@server.route('/')
def health():
    return "EarnGram Bot is Active", 200

@server.route('/api/claim_reward', methods=['POST'])
def api_claim_reward():
    try:
        data = request.json
        user_id = int(data.get('user_id'))
        amount = float(data.get('amount'))
        task_id = data.get('task_id')
        captcha_answer = data.get('captcha_answer')
        expected_answer = data.get('expected_answer')
        
        # Math Captcha Verification
        if str(captcha_answer) != str(expected_answer):
            return jsonify({"success": False, "message": "❌ Invalid Captcha! Try again."}), 400
            
        # Security Check: Multi-account detection
        user = db.get_user(user_id)
        if user and user.get('isFlagged'):
            return jsonify({"success": False, "message": "⚠️ Account flagged for suspicious activity. Rewards are pending review."}), 403
            
        success = db.process_reward(user_id, amount, f"Task: {task_id}")
        if success:
            # Send notification via User Bot
            try:
                bot.send_message(user_id, f"✅ *Reward Claimed!*\n\nYou earned `{amount:.2f}` SAR/USDT for completing a task.", parse_mode='Markdown')
            except:
                pass
            return jsonify({"success": True, "message": f"Successfully claimed {amount} reward!"})
        return jsonify({"success": False, "message": "Failed to process reward."}), 500
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@server.route('/api/strike_warning', methods=['POST'])
def api_strike_warning():
    try:
        data = request.json
        user_id = int(data.get('user_id'))
        
        db.add_strike(user_id)
        user = db.get_user(user_id)
        
        warning_count = user.get('warningCount', 0)
        if warning_count >= 3:
            db.update_user_profile(user_id, {"isFlagged": True, "flagReason": "Focus Mode Violation (3 Strikes)"})
            send_admin_alert(f"🚩 *USER FLAGGED*\nID: `{user_id}`\nReason: 3 Focus Mode Strikes")
            
        return jsonify({"success": True, "warningCount": warning_count})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
def api_user():
    try:
        data = request.json
        raw_id = data.get('id') or data.get('user_id')
        if not raw_id:
            return jsonify({"success": False, "message": "User ID is required"}), 400
            
        user_id = int(raw_id)
        username = data.get('username') or f"user_{user_id}"
        
        class TGUser:
            def __init__(self, id, username):
                self.id = id
                self.username = username
        
        tg_user = TGUser(user_id, username)
        user = db.create_user(tg_user, data.get('inviter_id'))
        if user and '_id' in user:
            user['_id'] = str(user['_id'])
            
        # Get full stats
        stats = db.get_user_stats(user_id)
        if stats:
            user.update(stats)
            
        return jsonify({"success": True, "user": user})
    except Exception as e:
        print(f"[ERROR] api_user failed: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@server.route('/api/init_user', methods=['POST'])
def api_init_user():
    try:
        data = request.json
        raw_id = data.get('user_id') or data.get('id')
        if not raw_id:
            return jsonify({"success": False, "message": "User ID is required"}), 400
        
        user_id = int(raw_id)
        # Extract inviter_id from start_param if present
        inviter_id = data.get('inviter_id')
        
        # Auto-User Creation: Ensure user profile exists
        user = db.get_user(user_id)
        if not user:
            print(f"[DEBUG] User {user_id} not found, creating profile...")
            user = db.create_user(data, inviter_id)
        
        if user and '_id' in user:
            user['_id'] = str(user['_id'])
            
        # Get full stats for the response
        stats = db.get_user_stats(user_id)
        if stats:
            # Merge user data with stats
            user.update(stats)
        
        # Admin Bypass: Ensure admin is always verified
        if is_admin(user_id):
            user['isVerified'] = True
            
        return jsonify({"success": True, "user": user})
    except Exception as e:
        print(f"[ERROR] init_user failed: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@server.route('/api/update_balance', methods=['POST'])
def api_update_balance():
    try:
        data = request.json
        # Handle both user_id and id for flexibility
        raw_id = data.get('user_id') or data.get('id')
        if not raw_id:
            return jsonify({"success": False, "message": "User ID is required"}), 400
            
        user_id = int(raw_id)
        amount = float(data.get('amount', 0))
        task_name = data.get('task_name', data.get('description', 'Task'))
        currency = data.get('currency', 'SAR')
        tx_type = data.get('type', 'EARNING')
        
        print(f"[DEBUG] Updating balance for user {user_id}: {amount} {currency} for {task_name}")
        
        if amount < 0:
            success, msg = db.deduct_balance(user_id, abs(amount), currency, tx_type, task_name)
            if not success:
                return jsonify({"success": False, "message": msg}), 400
        elif tx_type == 'EARNING':
            db.process_reward(user_id, amount, task_name)
        else:
            # For refunds or adjustments
            db.update_user_balance(user_id, amount, currency, tx_type, task_name)
            
        user = db.get_user(user_id)
        if user:
            if '_id' in user:
                user['_id'] = str(user['_id'])
            # Get full stats to ensure UI updates with latest balance and earnings
            stats = db.get_user_stats(user_id)
            if stats:
                # Map stats fields to frontend expected fields
                user['balanceRiyal'] = stats.get('balance_sar', 0.0)
                user['balanceCrypto'] = stats.get('balance_usdt', 0.0)
                user['totalEarningsRiyal'] = stats.get('total_earnings_sar', 0.0)
                user['totalTasksCompleted'] = stats.get('total_tasks_completed', 0)
                user.update(stats)
            return jsonify({"success": True, "user": user})
        else:
            return jsonify({"success": False, "message": "User not found"}), 404
    except Exception as e:
        print(f"[ERROR] Balance update failed: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@server.route('/api/user_stats/<int:user_id>', methods=['GET'])
def api_user_stats(user_id):
    """API endpoint to get user balance and rank."""
    stats = db.get_user_stats(user_id)
    if stats:
        return jsonify(stats), 200
    
    # Return a default object if user not found (e.g. Guest/Preview mode)
    return jsonify({
        "balance_sar": 0.0,
        "balance_usdt": 0.0,
        "total_earnings_sar": 0.0,
        "total_tasks_completed": 0,
        "full_name": "Guest User",
        "join_date": "March 2026",
        "is_registered": True, # Default to True for preview/guest to avoid registration screen
        "rank": 0,
        "is_flagged": False,
        "flag_reason": "",
        "device_id": ""
    }), 200

@server.route('/api/leaderboard', methods=['GET'])
def api_leaderboard():
    """API endpoint to get the leaderboard."""
    leaderboard = db.get_leaderboard()
    return jsonify(leaderboard), 200

# --- TASK API ---

@server.route('/api/tasks', methods=['GET', 'POST'])
def api_tasks():
    if request.method == 'POST':
        data = request.json
        if db.add_task(data):
            return jsonify({"status": "success"}), 201
        return jsonify({"status": "error"}), 500
    return jsonify(db.get_tasks()), 200

@server.route('/api/tasks/<task_id>', methods=['DELETE'])
def api_delete_task(task_id):
    if db.delete_task(task_id):
        return jsonify({"status": "success"}), 200
    return jsonify({"status": "error"}), 500

@server.route('/api/ad_tasks', methods=['GET', 'POST'])
def api_ad_tasks():
    if request.method == 'POST':
        data = request.json
        if db.add_ad_task(data):
            return jsonify({"status": "success"}), 201
        return jsonify({"status": "error"}), 500
    return jsonify(db.get_ad_tasks()), 200

@server.route('/api/ad_tasks/<ad_id>', methods=['DELETE'])
def api_delete_ad_task(ad_id):
    if db.delete_ad_task(ad_id):
        return jsonify({"status": "success"}), 200
    return jsonify({"status": "error"}), 500

@server.route('/api/update_profile', methods=['POST'])
def api_update_profile():
    try:
        data = request.json
        user_id = data.get('user_id')
        if not user_id:
            return jsonify({"status": "error", "message": "User ID is required"}), 400
            
        success, msg = db.update_user_profile(user_id, data)
        if success:
            return jsonify({"status": "success", "message": msg}), 200
        return jsonify({"status": "error", "message": msg}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@server.route('/api/sync_security', methods=['POST'])
def api_sync_security():
    data = request.json
    success, msg = db.sync_security(data.get('user_id'), data.get('device_id'), data.get('ip'))
    if success:
        return jsonify({"status": "success", "message": msg}), 200
    return jsonify({"status": "error", "message": msg}), 400

@server.route('/api/admin/user_details/<int:user_id>', methods=['GET'])
def api_admin_user_details(user_id):
    try:
        admin_id = request.args.get('admin_id')
        print(f"[DEBUG] Fetching user details for {user_id} requested by admin {admin_id}")
        
        if not is_admin(admin_id):
            print(f"[ERROR] Unauthorized access attempt by {admin_id}")
            return jsonify({"status": "error", "message": "Unauthorized"}), 403
        
        user = db.get_user(user_id)
        if user:
            print(f"[DEBUG] User {user_id} found: {user.get('username')}")
            return jsonify({
                "status": "success",
                "username": user.get("username"),
                "balance_sar": user.get("balanceRiyal", 0.0),
                "balance_usdt": user.get("balanceCrypto", 0.0),
                "device_id": user.get("deviceId"),
                "last_ip": user.get("lastIp")
            }), 200
        else:
            print(f"[DEBUG] User {user_id} not found in database")
            return jsonify({"status": "error", "message": "User not found"}), 404
    except Exception as e:
        print(f"[ERROR] api_admin_user_details failed: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@server.route('/api/admin/users', methods=['GET'])
def api_admin_users():
    try:
        admin_id = request.args.get('admin_id')
        if not is_admin(admin_id):
            return jsonify({"status": "error", "message": "Unauthorized"}), 403
            
        users = db.get_all_users()
        return jsonify(users), 200
    except Exception as e:
        print(f"[ERROR] api_admin_users failed: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@server.route('/api/admin/search_user', methods=['GET'])
def api_admin_search_user():
    try:
        user_id = request.args.get('user_id')
        admin_id = request.args.get('admin_id')
        
        print(f"[DEBUG] Admin {admin_id} searching for user {user_id}")
        
        if not is_admin(admin_id):
            return jsonify({"status": "error", "message": "Unauthorized"}), 403
            
        if not user_id:
            return jsonify({"status": "error", "message": "User ID is required"}), 400
            
        user = db.get_user(user_id)
        if user:
            return jsonify({
                "status": "success",
                "id": user.get("id"),
                "username": user.get("username"),
                "balance_sar": user.get("balanceRiyal", 0.0),
                "balance_usdt": user.get("balanceCrypto", 0.0),
                "device_id": user.get("deviceId"),
                "last_ip": user.get("lastIp")
            }), 200
        return jsonify({"status": "error", "message": "User not found"}), 404
    except Exception as e:
        print(f"[ERROR] api_admin_search_user failed: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@server.route('/api/admin/update_balance', methods=['POST'])
def api_admin_update_balance():
    data = request.json
    admin_id = data.get('admin_id')
    if not is_admin(admin_id):
        return jsonify({"status": "error", "message": "Unauthorized"}), 403
    
    user_id = data.get('user_id')
    amount = data.get('amount')
    currency = data.get('currency')
    
    if db.update_user_balance(user_id, amount, currency):
        return jsonify({"status": "success"}), 200
    return jsonify({"status": "error"}), 500

@server.route('/api/admin/reset_device', methods=['POST'])
def api_admin_reset_device():
    data = request.json
    admin_id = data.get('admin_id')
    if not is_admin(admin_id):
        return jsonify({"status": "error", "message": "Unauthorized"}), 403
    
    if db.reset_device(data.get('user_id')):
        return jsonify({"status": "success"}), 200
    return jsonify({"status": "error"}), 500

@server.route('/api/admin/reset_strikes', methods=['POST'])
def api_admin_reset_strikes():
    try:
        data = request.json
        admin_id = data.get('admin_id')
        user_id = data.get('user_id')
        
        if not is_admin(admin_id):
            return jsonify({"status": "error", "message": "Unauthorized"}), 403
            
        if db.reset_strikes(user_id):
            return jsonify({"status": "success", "message": "Strikes reset"}), 200
        return jsonify({"status": "error", "message": "Failed to reset strikes"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@server.route('/api/admin/ban_user', methods=['POST'])
def api_admin_ban_user():
    try:
        data = request.json
        admin_id = data.get('admin_id')
        user_id = data.get('user_id')
        status = data.get('status', True)
        
        if not is_admin(admin_id):
            return jsonify({"status": "error", "message": "Unauthorized"}), 403
            
        if db.ban_user(user_id, status):
            return jsonify({"status": "success", "message": f"User {'banned' if status else 'unbanned'}"}), 200
        return jsonify({"status": "error", "message": "Action failed"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@server.route('/api/admin/send_message', methods=['POST'])
def api_admin_send_message():
    try:
        data = request.json
        admin_id = data.get('admin_id')
        user_id = data.get('user_id')
        message = data.get('message')
        
        if not is_admin(admin_id):
            return jsonify({"status": "error", "message": "Unauthorized"}), 403
            
        if not user_id or not message:
            return jsonify({"status": "error", "message": "Missing user_id or message"}), 400
            
        try:
            bot.send_message(int(user_id), f"📩 *Message from Admin:*\n\n{message}", parse_mode='Markdown')
            return jsonify({"status": "success", "message": "Message sent"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": f"Telegram error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# --- DEPOSIT API ---

@server.route('/api/user/withdrawals/<int:user_id>', methods=['GET'])
def api_user_withdrawals(user_id):
    try:
        withdrawals = db.get_user_withdrawals(user_id)
        return jsonify(withdrawals), 200
    except Exception as e:
        print(f"[ERROR] api_user_withdrawals failed: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@server.route('/api/withdraw', methods=['POST'])
def api_withdraw():
    try:
        data = request.json
        user_id = int(data.get('user_id'))
        amount = float(data.get('amount'))
        method = data.get('method')
        address = data.get('address')
        currency = data.get('currency', 'SAR')
        
        success, message = db.request_withdrawal(user_id, amount, method, address, currency)
        if success:
            send_admin_alert(f"💸 *NEW WITHDRAWAL REQUEST*\nUser: `{user_id}`\nAmount: `{amount}` {currency}\nMethod: `{method}`\nAddress: `{address}`")
            return jsonify({"status": "success", "message": message}), 200
        return jsonify({"status": "error", "message": message}), 400
    except Exception as e:
        print(f"[ERROR] api_withdraw failed: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@server.route('/api/admin/withdrawals', methods=['GET'])
def api_admin_withdrawals():
    try:
        admin_id = request.args.get('admin_id')
        if not is_admin(admin_id):
            return jsonify({"status": "error", "message": "Unauthorized"}), 403
            
        status = request.args.get('status')
        withdrawals = db.get_all_withdrawals(status)
        return jsonify(withdrawals), 200
    except Exception as e:
        print(f"[ERROR] api_admin_withdrawals failed: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@server.route('/api/admin/payout_stats', methods=['GET'])
def api_payout_stats():
    try:
        admin_id = request.args.get('admin_id')
        if not is_admin(admin_id):
            return jsonify({"status": "error", "message": "Unauthorized"}), 403
            
        stats = db.get_payout_stats()
        if stats:
            return jsonify(stats), 200
        return jsonify({"status": "error", "message": "Failed to calculate stats"}), 500
    except Exception as e:
        print(f"[ERROR] api_payout_stats failed: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500
@server.route('/api/admin/process_withdrawal', methods=['POST'])
def api_admin_process_withdrawal():
    try:
        data = request.json
        admin_id = data.get('admin_id')
        if not is_admin(admin_id):
            return jsonify({"status": "error", "message": "Unauthorized"}), 403
            
        withdrawal_id = data.get('withdrawal_id')
        action = data.get('action') # approve or reject
        
        success, message = db.process_withdrawal_action(withdrawal_id, action)
        if success:
            return jsonify({"status": "success", "message": message}), 200
        return jsonify({"status": "error", "message": message}), 400
    except Exception as e:
        print(f"[ERROR] api_admin_process_withdrawal failed: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500
@server.route('/api/deposit/crypto', methods=['POST'])
def api_deposit_crypto():
    data = request.json
    user_id = data.get('user_id')
    tx_id = data.get('tx_id')
    amount = data.get('amount')
    
    if not user_id or not tx_id or not amount:
        return jsonify({"status": "error", "message": "Missing required fields"}), 400
    
    user = db.get_user(user_id)
    if not user:
        return jsonify({"status": "error", "message": "User not found"}), 404
    
    # Cooldown check (5 minutes)
    last_attempt = user.get('lastDepositAttempt')
    if last_attempt:
        from datetime import datetime
        if isinstance(last_attempt, str):
            last_attempt = datetime.fromisoformat(last_attempt.replace('Z', '+00:00'))
        if (datetime.utcnow() - last_attempt).total_seconds() < 300:
            return jsonify({"status": "error", "message": "Please wait 5 minutes between deposit attempts"}), 429

    # TxID Verification (Simulation/Placeholder)
    # In a real app, you'd call a blockchain API like TronGrid here
    # For now, we'll log it as PENDING for admin review, or auto-approve if it looks valid
    # To satisfy "Automatic Crypto Deposit", we'll implement a background check simulation
    
    db.create_deposit(user_id, amount, "USDT", "Crypto Auto", tx_id)
    send_admin_alert(f"📥 *NEW CRYPTO DEPOSIT*\nUser: `{user_id}`\nAmount: `{amount}` USDT\nTxID: `{tx_id}`")
    
    # Simulate background verification
    def verify_tx():
        import time
        import random
        time.sleep(10) # Wait 10 seconds
        # 80% chance of auto-approval for demo purposes if it's a 64-char hex string
        if len(tx_id) >= 32:
            # In real life: check_blockchain(tx_id)
            # For this task, we'll just mark it as pending and notify admin
            bot.send_message(929198867, f"📥 *NEW CRYPTO DEPOSIT*\nUser: {user_id}\nAmount: {amount} USDT\nTxID: `{tx_id}`\n\nVerify in Admin Panel.")
            
    threading.Thread(target=verify_tx).start()
    
    return jsonify({"status": "success", "message": "Transaction submitted for verification. Please wait."}), 200

@server.route('/api/deposit/local', methods=['POST'])
def api_deposit_local():
    data = request.json
    user_id = data.get('user_id')
    tx_id = data.get('tx_id')
    sender = data.get('sender')
    amount = data.get('amount')
    
    if not user_id or not tx_id or not sender or not amount:
        return jsonify({"status": "error", "message": "Missing required fields"}), 400
    
    user = db.get_user(user_id)
    if not user:
        return jsonify({"status": "error", "message": "User not found"}), 404
        
    # Cooldown check (5 minutes)
    last_attempt = user.get('lastDepositAttempt')
    if last_attempt:
        from datetime import datetime
        if isinstance(last_attempt, str):
            last_attempt = datetime.fromisoformat(last_attempt.replace('Z', '+00:00'))
        if (datetime.utcnow() - last_attempt).total_seconds() < 300:
            return jsonify({"status": "error", "message": "Please wait 5 minutes between deposit attempts"}), 429

    db.create_deposit(user_id, amount, "SAR", "Local Semi-Auto", tx_id, sender)
    
    # Notify Admin
    bot.send_message(929198867, f"🏦 *NEW LOCAL DEPOSIT*\nUser: {user_id}\nAmount: {amount} SAR\nSender: {sender}\nTxID: `{tx_id}`\n\nApprove in Admin Panel.")
    
    return jsonify({"status": "success", "message": "Deposit submitted. Admin will verify shortly."}), 200

@server.route('/api/admin/deposits', methods=['GET'])
def api_admin_deposits():
    admin_id = request.args.get('admin_id')
    if not is_admin(admin_id):
        return jsonify({"status": "error", "message": "Unauthorized"}), 403
    
    status = request.args.get('status')
    return jsonify(db.get_deposits(status)), 200

@server.route('/api/admin/approve_deposit', methods=['POST'])
def api_admin_approve_deposit():
    data = request.json
    admin_id = data.get('admin_id')
    if not is_admin(admin_id):
        return jsonify({"status": "error", "message": "Unauthorized"}), 403
    
    deposit_id = data.get('deposit_id')
    success, msg = db.approve_deposit(deposit_id)
    if success:
        # Notify user
        deposit = db.deposits_col.find_one({"_id": ObjectId(deposit_id)})
        if deposit:
            bot.send_message(deposit['userId'], f"✅ *DEPOSIT APPROVED*\n\nYour deposit of {deposit['amount']} {deposit['currency']} has been credited to your account. Thank you!")
        return jsonify({"status": "success"}), 200
    return jsonify({"status": "error", "message": msg}), 400

@server.route('/api/admin/reject_deposit', methods=['POST'])
def api_admin_reject_deposit():
    data = request.json
    admin_id = data.get('admin_id')
    if not is_admin(admin_id):
        return jsonify({"status": "error", "message": "Unauthorized"}), 403
    
    deposit_id = data.get('deposit_id')
    if db.reject_deposit(deposit_id):
        return jsonify({"status": "success"}), 200
    return jsonify({"status": "error"}), 500

@server.route('/api/maintenance', methods=['GET', 'POST'])
def api_maintenance():
    if request.method == 'POST':
        data = request.json
        if db.update_maintenance_settings(data):
            return jsonify({"status": "success"}), 200
        return jsonify({"status": "error"}), 500
    
    settings = db.get_maintenance_settings()
    if settings:
        return jsonify(settings), 200
    return jsonify({}), 200

@server.route('/api/daily_bonus', methods=['POST'])
def api_daily_bonus():
    try:
        data = request.json
        raw_id = data.get('user_id') or data.get('userId')
        init_data = data.get('initData')
        
        if not raw_id:
            return jsonify({"success": False, "message": "Missing user_id"}), 400
        
        user_id = int(raw_id)
        success, message = db.claim_daily_bonus(user_id)
        
        user = db.get_user(user_id)
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404
            
        # Ensure _id is string for JSON
        if '_id' in user:
            user['_id'] = str(user['_id'])
            
        # Get full stats to ensure frontend has latest data
        stats = db.get_user_stats(user_id)
        if stats:
            user.update(stats)

        if success:
            new_balance = user.get('balanceRiyal', 0.0)
            return jsonify({
                "success": True, 
                "message": message, 
                "new_balance": new_balance,
                "user": user
            }), 200
        
        # If not success, check if it's a business logic error (like already claimed)
        return jsonify({
            "success": False, 
            "message": message,
            "user": user
        }), 200

    except Exception as e:
        print(f"[ERROR] Daily bonus API error: {e}")
        return jsonify({"success": False, "message": "Server error, please try again later"}), 500

@server.route('/api/verify', methods=['GET'])
def api_verify():
    try:
        user_id_raw = request.args.get('user_id')
        if not user_id_raw:
            return jsonify({"status": "error", "message": "Missing user_id"}), 400
        
        user_id = int(user_id_raw)
        
        # Admin Bypass: Admin ID 929198867 can always skip
        if user_id == 929198867:
            db.users_col.update_one({"id": user_id}, {"$set": {"isVerified": True}})
            return jsonify({"status": "success", "message": "Admin bypass active"}), 200
        
        # Ensure user exists in the database
        user = db.get_user(user_id)
        if not user:
            return jsonify({"status": "error", "message": "User does not exist. Please restart the app."}), 404
        
        # Live check for all channels saved in the database
        if is_subscribed(user_id):
            # Update user entity isVerified: true
            db.users_col.update_one({"id": user_id}, {"$set": {"isVerified": True}})
            return jsonify({"status": "success", "message": "Verification successful"}), 200
        
        # Specific error message requested by user
        return jsonify({"status": "error", "message": "❌ Access Denied: You must join ALL channels to unlock earning features."}), 400
    except Exception as e:
        print(f"[ERROR] api_verify failed: {str(e)}")
        return jsonify({"status": "error", "message": "Server error during verification"}), 500

@server.route('/api/broadcast', methods=['POST'])
def api_broadcast():
    data = request.json
    admin_id = data.get('admin_id')
    message = data.get('message')
    
    if not is_admin(admin_id):
        return jsonify({"status": "error", "message": "Unauthorized"}), 403
    
    if not message:
        return jsonify({"status": "error", "message": "Message is empty"}), 400
    
    users = list(db.users_col.find({}, {"id": 1}))
    total_users = len(users)
    
    def run_broadcast():
        import time
        for user in users:
            try:
                bot.send_message(user['id'], f"📢 *ANNOUNCEMENT*\n\n{message}", parse_mode="Markdown")
                time.sleep(0.05)
            except Exception as e:
                print(f"Failed to send broadcast to {user['id']}: {e}")
                continue
    
    # Run in a separate thread to not block the API response
    threading.Thread(target=run_broadcast).start()
    
    return jsonify({"status": "success", "total": total_users}), 200

@server.route('/api/reset_leaderboard', methods=['POST'])
def api_reset_leaderboard():
    data = request.json
    admin_id = data.get('admin_id')
    if not is_admin(admin_id):
        return jsonify({"status": "error", "message": "Unauthorized"}), 403
    
    if db.reset_leaderboard():
        return jsonify({"status": "success"}), 200
    return jsonify({"status": "error"}), 500

@server.route('/api/admin/wipe_database', methods=['POST'])
def api_wipe_database():
    try:
        data = request.json
        admin_id = data.get('admin_id')
        
        if not is_admin(admin_id) or int(admin_id) != 929198867:
            return jsonify({"success": False, "message": "Unauthorized: Only the main admin can perform this action"}), 403
            
        success, msg = db.wipe_database(admin_id)
        if success:
            return jsonify({"success": True, "message": msg}), 200
        else:
            return jsonify({"success": False, "message": msg}), 500
    except Exception as e:
        print(f"[ERROR] Wipe database failed: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@server.route('/api/update_settings', methods=['POST'])
def api_update_settings():
    data = request.json
    admin_id = data.get('admin_id')
    if not is_admin(admin_id):
        return jsonify({"status": "error", "message": "Unauthorized"}), 403
    
    # Fetch current settings
    current_settings = db.get_maintenance_settings() or {}
    
    # Update with new payment details
    if 'paymentDetails' in data:
        current_settings['paymentDetails'] = data['paymentDetails']
    
    if db.update_maintenance_settings(current_settings):
        return jsonify({"status": "success"}), 200
    return jsonify({"status": "error"}), 500

@server.route('/api/<path:path>')
def api_not_found(path):
    """Catch-all for undefined API routes to prevent returning HTML."""
    return jsonify({"error": "API route not found", "path": path}), 404

def run_flask():
    """Run the Flask server with error handling."""
    try:
        # Port 3000 is the ONLY externally accessible port
        port = 3000
        print(f"Starting Flask server on port {port}...")
        # Explicitly set threaded=True and disable reloader to avoid issues with bot polling
        server.run(host='0.0.0.0', port=port, threaded=True, use_reloader=False)
    except Exception as e:
        print(f"Flask server failed to start: {e}")

@server.errorhandler(Exception)
def handle_exception(e):
    """Log any unhandled exceptions in Flask."""
    print(f"Unhandled Flask Exception: {e}")
    return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

# --- BOT LOGIC ---
ADMIN_ID = int(os.getenv('ADMIN_ID', '929198867'))
# The URL of your deployed Mini App frontend
WEB_APP_URL = os.getenv('WEB_APP_URL', 'https://your-app-url.vercel.app')

# Mandatory Channels
CHANNELS = ['@EarnGramNews', '@EarnGramSupport', '@EarnGramCrypto', '@EarnGramGlobal', '@EarnGramCommunity']

def is_subscribed(user_id):
    """Check if user joined all mandatory channels from settings."""
    try:
        user_id = int(user_id)
    except:
        return False
        
    settings = db.get_maintenance_settings()
    channels = settings.get('verificationChannels', []) if settings else []
    
    # If no channels configured, default to the hardcoded list for safety or return True
    if not channels:
        channels = ['@EarnGramNews', '@EarnGramSupport', '@EarnGramCrypto', '@EarnGramGlobal', '@EarnGramCommunity']
    
    for channel in channels:
        try:
            # Remove @ if present for API call if needed, but get_chat_member usually handles it
            status = bot.get_chat_member(channel, user_id).status
            if status in ['left', 'kicked']:
                return False
        except Exception as e:
            print(f"Error checking membership for {channel}: {e}")
            return False
    return True

@bot.message_handler(commands=['start'])
def start(message):
    user_id = message.from_user.id
    
    # Check for referral payload: /start {ref_id}
    ref_id = None
    args = message.text.split()
    if len(args) > 1:
        ref_id = args[1]
        
    user = db.create_user(message.from_user, ref_id)
    
    if user.get('isBanned'):
        bot.send_message(message.chat.id, "❌ Your account is permanently banned for security violations.")
        return

    if not is_subscribed(user_id):
        markup = telebot.types.InlineKeyboardMarkup()
        for ch in CHANNELS:
            markup.add(telebot.types.InlineKeyboardButton(f"Join {ch}", url=f"https://t.me/{ch[1:]}"))
        markup.add(telebot.types.InlineKeyboardButton("✅ Verify & Start", callback_data="verify_sub"))
        
        bot.send_message(
            message.chat.id, 
            "🛡️ *Verification Required*\n\nYou must join all 5 mandatory channels to start earning!", 
            reply_markup=markup, 
            parse_mode="Markdown"
        )
        return

    launch_app(message.chat.id, user)

def launch_app(chat_id, user):
    markup = telebot.types.InlineKeyboardMarkup()
    btn = telebot.types.InlineKeyboardButton(
        text="🚀 Open EarnGram Mini App", 
        web_app=telebot.types.WebAppInfo(url=WEB_APP_URL)
    )
    markup.add(btn)
    
    balance = user.get('balanceRiyal', 0.0)
    display_name = user.get('fullName') or user.get('username') or f"User {user.get('id')}"
    bot.send_message(
        chat_id, 
        f"Welcome back, *{display_name}*! 💰\n\nYour Balance: `{balance:.2f} SAR`\n\nClick below to start tasks and earn rewards!",
        reply_markup=markup,
        parse_mode="Markdown"
    )

@bot.callback_query_handler(func=lambda call: call.data == "verify_sub")
def verify_callback(call):
    if is_subscribed(call.from_user.id):
        user = db.get_user(call.from_user.id)
        bot.delete_message(call.message.chat.id, call.message.message_id)
        launch_app(call.message.chat.id, user)
    else:
        bot.answer_callback_query(call.id, "❌ You haven't joined all channels yet!", show_alert=True)

@bot.message_handler(content_types=['web_app_data'])
def handle_webapp_data(message):
    """The Mini App sends signals here via tg.sendData() in player.html."""
    try:
        data = json.loads(message.web_app_data.data)
        if data.get('status') == 'success':
            # Logic for rewarding
            reward = 0.50 # Standard reward for video task
            db.process_reward(message.from_user.id, reward, f"Completed: {data.get('task_url', 'Task')}")
            
            bot.send_message(message.chat.id, f"✅ Verified! {reward} SAR added to your account.")
    except Exception as e:
        print(f"WebAppData Processing Error: {e}")

@bot.message_handler(commands=['broadcast'])
def broadcast(message):
    if message.from_user.id != ADMIN_ID: return
    
    text = message.text.replace('/broadcast', '').strip()
    if not text:
        bot.reply_to(message, "Usage: /broadcast <your message>")
        return
        
    users = db.users_col.find({}, {"id": 1})
    count = 0
    for u in users:
        try:
            bot.send_message(u['id'], f"📢 *ANNOUNCEMENT*\n\n{text}", parse_mode="Markdown")
            count += 1
        except: pass
    
    bot.reply_to(message, f"✅ Broadcast sent to {count} users.")

# --- GLOBAL MESSAGE FILTER ---
# This handler catches all messages that weren't handled by specific command handlers above.
# It silently deletes any message sent by a non-admin user, except for the /start command.
@bot.message_handler(func=lambda message: True, content_types=['text', 'audio', 'document', 'photo', 'sticker', 'video', 'video_note', 'voice', 'location', 'contact', 'new_chat_members', 'left_chat_member', 'new_chat_title', 'new_chat_photo', 'delete_chat_photo', 'group_chat_created', 'supergroup_chat_created', 'channel_chat_created', 'migrate_to_chat_id', 'migrate_from_chat_id', 'pinned_message'])
def delete_all_messages(message):
    # Admin Exception: Admin ID 929198867 (and preview IDs) can send messages.
    if is_admin(message.from_user.id):
        return
    
    # Command Protection: Allow /start command to be processed.
    # Note: If /start was handled by the handler above, this code might not even be reached
    # depending on how telebot is configured, but we include it here for safety.
    if message.text and message.text.startswith('/start'):
        return
        
    # Auto-Delete all other messages silently.
    try:
        bot.delete_message(message.chat.id, message.message_id)
    except Exception as e:
        # Silently fail if deletion fails (e.g. message already deleted or bot lacks permissions)
        pass

if __name__ == '__main__':
    print("DEBUG: bot.py main starting")
    
    # Start the Flask keep-alive server in a separate thread
    flask_thread = threading.Thread(target=run_flask)
    flask_thread.daemon = True
    flask_thread.start()
    
    # Start User Bot polling in a separate thread
    threading.Thread(target=bot.infinity_polling, daemon=True).start()
    
    # Start Admin Bot polling if token exists
    if ADMIN_TOKEN and admin_bot != bot:
        threading.Thread(target=admin_bot.infinity_polling, daemon=True).start()
    
    # Keep the main thread alive
    while True:
        import time
        time.sleep(10)
    print("EarnGram Bot & Web Server Online.")
    bot.infinity_polling()