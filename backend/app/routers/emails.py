from fastapi import APIRouter, HTTPException
from app.schemas.email_schema import EmailRequest, EmailResponse
from app.services.email_service import EmailService

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