from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, sources, generation, preferences
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="DailyBrief API",
    description="Personalized daily podcast generator",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "https://custompodcast.vercel.app",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(sources.router, tags=["sources"])
app.include_router(generation.router, tags=["generation"])
app.include_router(preferences.router, prefix="/user", tags=["preferences"])


@app.get("/")
async def root():
    return {"message": "DailyBrief API", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
