from google import generativeai as genai
from app.config import settings

genai.configure(api_key=settings.gemini_api_key)

class ToneService:
    def __init__(self):
        self.model = genai.GenerativeModel("gemini-3.5-flash")
    
    def detect(self, email_history: list[str])-> str:
        history_text = "\n---\n".join(email_history)
        prompt = f"""
        Read these emails and describe the person's tone in one short sentence. Be specific.set
        Examples of good answers:
        - "Casual and friendly, uses humor to soften urgency"
        - "Formal and direct, gets straight to the point"
        - "Anxious but polite, apologizes a lot"

        Emails:
        {history_text}

        Respond with ONLY the tone description. No extra text.
        """
        response = self.model.generate_content(prompt)
        return response.text.strip()
    