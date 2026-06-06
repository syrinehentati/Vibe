from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import emails

app = FastAPI(
    title="Vibe API",
    description="AI email agent that reads tone and generates perfectly matched emails",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(emails.router)

@app.get("/")
def root():
    return {"message": "Vibe API is running"}