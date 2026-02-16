
import telebot
import os
import json
import threading
from flask import Flask
import database as db

# --- RENDER KEEP-ALIVE HACK ---
# Render requires a web server listening on a port to mark a deployment as successful.
app = Flask(__name__)

@app.route('/')
def health_check():
    return "EarnGram Bot is Alive!", 200

def run_web_server():
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)

# --- BOT CONFIGURATION ---
API_TOKEN = os.getenv('BOT_TOKEN', 'YOUR_BOT_TOKEN_HERE')
ADMIN_ID = 12345678  # Your Telegram ID
CHANNELS = ['@EarnGramNews', '@EarnGramSupport', '@EarnGramCrypto', '@EarnGramGlobal', '@EarnGramCommunity']
WEB_APP_URL = os.getenv('WEB_APP_URL', 'https://your-webapp-url.com')

bot = telebot.TeleBot(API_TOKEN)

def check_membership(user_id):
    """Verifies user is in all mandatory channels."""
    for channel in CHANNELS:
        try:
            member = bot.get_chat_member(channel, user_id)
            if member.status in ['left', 'kicked']:
                return False
        except Exception:
            return False
    return True

@bot.message_handler(commands=['start'])
def start(message):
    user_id = message.from_user.id
    
    # Check for referral argument: /start 12345678
    args = message.text.split()
    inviter_id = args[1] if len(args) > 1 else None
    
    # Initialize User in DB
    user = db.get_or_create_user(message.from_user, inviter_id)
    
    if not check_membership(user_id):
        welcome_text = "🛡️ *Verification Required*\n\nPlease join our mandatory channels before you can start earning:\n\n"
        welcome_text += "\n".join(CHANNELS)
        bot.send_message(message.chat.id, welcome_text, parse_mode="Markdown")
        return

    markup = telebot.types.InlineKeyboardMarkup()
    markup.add(telebot.types.InlineKeyboardButton(text="🚀 Launch EarnGram", web_app=telebot.types.WebAppInfo(url=WEB_APP_URL)))
    
    bot.send_message(
        message.chat.id, 
        f"Welcome back, {message.from_user.first_name}! 💰\n\nYour Balance: {user.get('balanceRiyal', 0.0):.2f} SAR\nReady to earn?", 
        reply_markup=markup
    )

@bot.message_handler(content_types=['web_app_data'])
def handle_webapp_data(message):
    """Handles 'success' signals sent from the Mini App via tg.sendData()."""
    try:
        data = json.loads(message.web_app_data.data)
        if data.get('status') == 'success':
            # Reward amount (Logic from database.py handles the 4-level commission)
            reward = 0.50 
            db.add_reward(message.from_user.id, reward, f"Task Success: {data.get('task_url')}")
            
            bot.send_message(message.chat.id, f"✅ Verified! {reward} SAR added to your balance.")
    except Exception as e:
        print(f"WebAppData Error: {e}")

@bot.message_handler(commands=['broadcast'])
def broadcast(message):
    if message.from_user.id != ADMIN_ID: return
    
    msg_text = message.text.replace('/broadcast', '').strip()
    if not msg_text:
        bot.reply_to(message, "Usage: /broadcast <message>")
        return
        
    users = db.users_col.find({}, {"id": 1})
    count = 0
    for user in users:
        try:
            bot.send_message(user['id'], f"📢 *ANNOUNCEMENT*\n\n{msg_text}", parse_mode="Markdown")
            count += 1
        except: pass
    
    bot.reply_to(message, f"✅ Broadcast sent to {count} users.")

@bot.message_handler(commands=['withdrawals'])
def view_withdrawals(message):
    if message.from_user.id != ADMIN_ID: return
    
    pending = db.withdrawals_col.find({"status": "PENDING"}).limit(10)
    response = "💰 *Pending Withdrawals*\n\n"
    
    found = False
    for w in pending:
        found = True
        response += f"👤 ID: `{w['userId']}`\n💵 {w['amount']} {w['currency']}\n🏦 {w['method']}\n📍 `{w['address']}`\n\n"
    
    if not found:
        response += "_No pending requests found._"
        
    bot.send_message(message.chat.id, response, parse_mode="Markdown")

if __name__ == '__main__':
    # Start the Flask server in a separate thread
    web_thread = threading.Thread(target=run_web_server)
    web_thread.daemon = True
    web_thread.start()
    
    print("EarnGram Bot Backend Online with Web Server for Render.")
    bot.infinity_polling()
