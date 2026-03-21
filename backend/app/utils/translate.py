from deep_translator import GoogleTranslator

def translate_text(text, target_lang):
    try:
        if target_lang == "en":
            return text
        
        translated = GoogleTranslator(source='auto', target=target_lang).translate(text)
        return translated
    except Exception as e:
        print("Translation failed:", e)
        return text