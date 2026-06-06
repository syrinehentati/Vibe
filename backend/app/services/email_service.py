from google import generativeai as genai
from app.config import settings
from app.schemas.email_schema import EmailRequest, EmailResponse

genai.configure(api_key=settings.gemini_api_key)

class EmailService:
    def __init__(self):
        self.model = genai.GenerativeModel("gemini-3-flash-preview")

    def _build_prompt(self, request: EmailRequest) -> str:
        history_text = "\n---\n".join(request.email_history)
        technical = "Use technical language." if request.config.technical else "Avoid technical jargon, keep it simple."
        extra = f"Additional instructions: {request.config.extra_instructions}" if request.config.extra_instructions else ""

        return f"""
        You are an AI email assistant. Analyze the email history below and detect:
        1. The contact's writing tone and style
        2. The appropriate subject for the new email

        Email history:
        {history_text}

        Now generate an email about:
        {request.context}

        Tone: {request.config.tone}
        {technical}
        {extra}

        Respond in this exact JSON format:
        {{
            "email": "the generated email body",
            "detected_tone": "tone you detected from the history",
            "subject": "suggested subject line"
        }}
        """

    def generate(self, request: EmailRequest) -> EmailResponse:
        prompt = self._build_prompt(request)
        response = self.model.generate_content(prompt)
        
        import json
        clean = response.text.strip().replace("```json", "").replace("```", "")
        data = json.loads(clean)
        
        return EmailResponse(**data)