import requests

def send_sms(phone, message):
    url = "http://10.11.144.88:8080/send_sms"
    
    params = {
        "number": phone,
        "msg": message
    }

    try:
        response = requests.get(url, params=params)
        print("SMS sent:", response.text)
    except Exception as e:
        print("SMS failed:", e)