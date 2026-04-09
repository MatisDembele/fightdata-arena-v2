from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import fighters, quiz

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Fight Data Arena API",
    description="API de frame data Street Fighter 6",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://fightdata-arena-v2.vercel.app",
        "https://fightdata-arena-v2-git-main-matisdembeles-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fighters.router, prefix="/api")
app.include_router(quiz.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Fight Data Arena API", "status": "ok"}
