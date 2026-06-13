from google import generativeai as genai
from app.config import settings
from app.schemas.email_schema import EmailRequest, EmailResponse
from app.services.tone_service import ToneService
genai.configure(api_key=settings.gemini_api_key)

class EmailService:
    def __init__(self):
        self.model = genai.GenerativeModel("gemini-3.5-flash")
        self.tone_service = ToneService()
        
    def _build_prompt(self, request: EmailRequest, detected_tone: str) -> str:
        history_text = "\n---\n".join(request.email_history)
        technical = "Use technical language." if request.config.technical else "keep it simple."
        extra = f"Additional instructions: {request.config.extra_instructions}" if request.config.extra_instructions else ""

        return f"""
        You are an AI email assistant. Analyze the email history below and detect:
        1. The contact's writing tone and style
        2. The appropriate subject for the new email

       Email history from this customer:
    {history_text}

    Their detected tone: {detected_tone}

    Write an email about:
    {request.context}

    Match their tone EXACTLY. Write like them, not like a robot.
    {technical}
    {extra}

    Respond in this exact JSON format:
    {{
        "email": "the generated email body",
        "detected_tone": "{detected_tone}",
        "subject": "suggested subject line"
    }}
    """

    def generate(self, request: EmailRequest) -> EmailResponse:
        detected_tone = self.tone_service.detect(request.email_history)
        prompt = self._build_prompt(request,detected_tone)
        response = self.model.generate_content(prompt)
        
        import json
        clean = response.text.strip().replace("```json", "").replace("```", "")
        data = json.loads(clean)
        
        return EmailResponse(**data)