from google import genai
from app.config import settings
from app.schemas.email_schema import EmailRequest, EmailResponse
from app.services.tone_service import ToneService


class EmailService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.tone_service = ToneService()

    def _build_prompt(self, request: EmailRequest, detected_tone: str) -> str:
        history_text = "\n---\n".join(request.email_history)
        technical = "Use technical language." if request.config.technical else "Keep it simple."
        extra = f"Extra instructions: {request.config.extra_instructions}" if request.config.extra_instructions else ""

        context_block = ""
        if request.selected_context:
            joined = "\n---\n".join(request.selected_context)
            context_block = (
                "\nRelevant past conversations about this subject "
                f"(use for facts and context):\n{joined}\n"
            )

        return f"""
        You are an AI email assistant.

        Email history from this customer (use this to match their tone):
        {history_text}

        Their detected tone: {detected_tone}
        {context_block}
        Write an email about:
        {request.context}

        Match their tone EXACTLY. Write like them, not like a robot.
        {technical}
        {extra}
        """

    def generate(self, request: EmailRequest) -> EmailResponse:
        detected_tone = self.tone_service.detect(request.email_history)
        prompt = self._build_prompt(request, detected_tone)

        response = self.client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": EmailResponse,
            },
        )
        return EmailResponse.model_validate_json(response.text)
