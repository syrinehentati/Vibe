from google import genai
from app.config import settings

class ToneService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.gemini_api_key)

    def detect(self, email_history: list[str]) -> str:
        history_text = "\n---\n".join(email_history)

        prompt = f"""
        Read these emails and describe the person's tone in 
        one short sentence. Be specific.
        
        Examples of good answers:
        - "Casual and friendly, uses humor to soften urgency"
        - "Formal and direct, gets straight to the point"
        - "Anxious but polite, apologizes a lot"

        Emails:
        {history_text}

        Respond with ONLY the tone description. No extra text.
        """

        response = self.client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt
        )
        return response.text.strip()