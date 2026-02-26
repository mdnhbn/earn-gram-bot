import os
import json
import threading
import telebot
from flask import Flask, request, jsonify
try:
    from flask_cors import CORS
except ImportError:
    CORS = None
import database as db

# --- RENDER PORT COMPLIANCE ---
server = Flask(__name__)
if CORS:
    CORS(server)

@server.route('/')
def health():
    return "EarnGram Bot is Active", 200

@server.route('/api/user', methods=['POST'])
def api_user():
    data = request.json
    class TGUser:
        def __init__(self, id, username):
            self.id = id
            self.username = username
    tg_user = TGUser(data.get('id'), data.get('username'))
    user = db.create_user(tg_user, data.get('inviter_id'))
    if '_id' in user:
        user['_id'] = str(user['_id'])
    return jsonify(user)

@server.route('/api/update_balance', methods=['POST'])
def api_update_balance():
    data = request.json
    user_id = data.get('id')
    amount = data.get('amount', 0)
    task_name = data.get('task_name', 'Task')
    db.process_reward(user_id, amount, task_name)
    user = db.get_user(user_id)
    if '_id' in user:
        user['_id'] = str(user['_id'])
    return jsonify(user)

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

@server.route('/api/sync_security', methods=['POST'])
def api_sync_security():
    data = request.json
    success, msg = db.sync_security(data.get('user_id'), data.get('device_id'), data.get('ip'))
    if success:
        return jsonify({"status": "success", "message": msg}), 200
    return jsonify({"status": "error", "message": msg}), 400

@server.route('/api/reset_device', methods=['POST'])
def api_reset_device():
    data = request.json
    if db.reset_device(data.get('user_id')):
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
    data = request.json
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({"status": "error", "message": "Missing user_id"}), 400
    
    success, message = db.claim_daily_bonus(user_id)
    if success:
        user = db.get_user(user_id)
        if user and '_id' in user:
            user['_id'] = str(user['_id'])
        return jsonify({"status": "success", "message": message, "user": user}), 200
    return jsonify({"status": "error", "message": message}), 400

@server.route('/api/verify', methods=['GET'])
def api_verify():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"status": "error", "message": "Missing user_id"}), 400
    
    if is_subscribed(int(user_id)):
        # Update user verification status in DB
        db.users_col.update_one({"id": int(user_id)}, {"$set": {"isVerified": True}})
        return jsonify({"status": "success", "message": "Verification successful"}), 200
    
    return jsonify({"status": "error", "message": "You haven't joined all channels yet!"}), 400

@server.route('/api/<path:path>')
def api_not_found(path):
    """Catch-all for undefined API routes to prevent returning HTML."""
    return jsonify({"error": "API route not found", "path": path}), 404

def run_flask():
    """Run the Flask server with error handling."""
    try:
        # Use a fixed port for internal API to avoid conflict with Vite on port 3000
        port = 8888
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
TOKEN = os.getenv('BOT_TOKEN')
if not TOKEN:
    print("WARNING: BOT_TOKEN environment variable is missing. Bot features will be disabled.")
    # Create a dummy bot object to avoid errors in the rest of the script
    class DummyBot:
        def infinity_polling(self): pass
        def message_handler(self, *args, **kwargs): return lambda f: f
        def callback_query_handler(self, *args, **kwargs): return lambda f: f
    bot = DummyBot()
else:
    bot = telebot.TeleBot(TOKEN)

ADMIN_ID = int(os.getenv('ADMIN_ID', '12345678'))
# The URL of your deployed Mini App frontend
WEB_APP_URL = os.getenv('WEB_APP_URL', 'https://your-app-url.vercel.app')

# Mandatory Channels
CHANNELS = ['@EarnGramNews', '@EarnGramSupport', '@EarnGramCrypto', '@EarnGramGlobal', '@EarnGramCommunity']

def is_subscribed(user_id):
    """Check if user joined all 5 channels."""
    for channel in CHANNELS:
        try:
            status = bot.get_chat_member(channel, user_id).status
            if status in ['left', 'kicked']:
                return False
        except Exception:
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
    bot.send_message(
        chat_id, 
        f"Welcome back, *{user['username']}*! 💰\n\nYour Balance: `{balance:.2f} SAR`\n\nClick below to start tasks and earn rewards!",
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

if __name__ == '__main__':
    print("DEBUG: bot.py main starting")
    # Start the Flask keep-alive server
    flask_thread = threading.Thread(target=run_flask)
    flask_thread.daemon = False
    flask_thread.start()
    
    print("EarnGram Bot & Web Server Online.")
    bot.infinity_polling()