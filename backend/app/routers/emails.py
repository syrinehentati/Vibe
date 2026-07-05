from fastapi import APIRouter, HTTPException
from app.schemas.email_schema import (
    EmailRequest,
    EmailResponse,
    RankContextRequest,
    RankContextResponse,
    RankedEmail,
)
from app.services.email_service import EmailService
from app.services.embedding_service import EmbeddingService
from app.config import settings

router = APIRouter(
    prefix="/emails",
    tags=["emails"],
)

email_service = EmailService()
embedding_service = EmbeddingService()


@router.post("/generate", response_model=EmailResponse)
def generate_email(request: EmailRequest):
    try:
        return email_service.generate(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rank-context", response_model=RankContextResponse)
def rank_context(request: RankContextRequest):
    try:
        query = f"{request.context}\n\n{request.current_email}"
        texts = [f"{c.subject}\n{c.snippet}" for c in request.candidates]
        ranked = embedding_service.rank(query, texts, request.top_k)
        return RankContextResponse(results=[
            RankedEmail(
                id=request.candidates[i].id,
                subject=request.candidates[i].subject,
                snippet=request.candidates[i].snippet[:300],
                score=round(score, 4),
            )
            for i, score in ranked
        ])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
def health():
    return {
        "status": "ok",
        "model": "gemini-3.5-flash",
        "environment": settings.environment,
    }
