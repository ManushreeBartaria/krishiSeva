import requests
from app.utils.translate import translate_text

def send_sms(phone, message, language="en"):
    
    # 🌐 Translate message
    translated_msg = translate_text(message, language)

    url = "http://10.11.144.88:8080/send_sms"
    
    params = {
        "number": phone,
        "msg": translated_msg
    }

    try:
        requests.get(url, params=params)
    except Exception as e:
        print("SMS failed:", e)