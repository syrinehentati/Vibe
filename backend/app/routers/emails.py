from fastapi import APIRouter, HTTPException
from app.schemas.email_schema import EmailRequest, EmailResponse
from app.services.email_service import EmailService
from app.services.tone_service import ToneService
from app.config import settings

router = APIRouter(
    prefix="/emails",
    tags=["emails"]
)

email_service = EmailService()

@router.post("/generate", response_model=EmailResponse)
def generate_email(request: EmailRequest):
    try:
        return email_service.generate(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

tone_service = ToneService()

@router.get("/health")
def health():
    return {
        "status": "ok",
        "model": "gemini-1.5-flash",
        "environement": settings.environment
    }