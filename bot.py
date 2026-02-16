
import telebot
import os

# CONFIGURATION
API_TOKEN = 'YOUR_BOT_TOKEN_HERE'
ADMIN_TELEGRAM_ID = 12345678 # Replace with your actual Telegram User ID

bot = telebot.TeleBot(API_TOKEN)

def is_admin(user_id):
    return user_id == ADMIN_TELEGRAM_ID

@bot.message_handler(commands=['start'])
def start(message):
    user_id = message.from_user.id
    welcome_text = "Welcome to EarnGram! 🚀\n\nClick the button below to start earning."
    
    # Inline button to open the Web App
    markup = telebot.types.InlineKeyboardMarkup()
    web_app_url = "https://your-webapp-url.com" # Replace with your deployed URL
    button = telebot.types.InlineKeyboardButton(text="Open App", web_app={"url": web_app_url})
    markup.add(button)
    
    bot.send_message(message.chat.id, welcome_text, reply_markup=markup)

@bot.message_handler(commands=['admin'])
def admin_panel(message):
    if not is_admin(message.from_user.id):
        bot.reply_to(message, "🚫 Access Denied: Admin only.")
        return
    
    bot.reply_to(message, "🛠️ Admin recognized. You can use /broadcast <message> to alert all users.")

@bot.message_handler(commands=['broadcast'])
def broadcast(message):
    if not is_admin(message.from_user.id):
        bot.reply_to(message, "🚫 Access Denied.")
        return
    
    msg_parts = message.text.split(' ', 1)
    if len(msg_parts) < 2:
        bot.reply_to(message, "Usage: /broadcast <your message>")
        return
    
    broadcast_text = msg_parts[1]
    # Logic to fetch all users from your database and loop through them
    # for user_id in all_users:
    #     try: bot.send_message(user_id, broadcast_text)
    #     except: pass
    
    bot.send_message(message.chat.id, f"✅ Broadcast sent: {broadcast_text}")

if __name__ == '__main__':
    print("EarnGram Bot is running...")
    bot.infinity_polling()
