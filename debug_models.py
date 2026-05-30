
import google.generativeai as genai

GEMINI_API_KEY = "AIzaSyBUYXZVbgqf_JqYvEdaU_Fr8XsQH_al5hQ"
genai.configure(api_key=GEMINI_API_KEY)

print("Listing available models...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
except Exception as e:
    print(f"Error listing models: {e}")
