from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from api.predictor import registry
from api.schemas import (
    ComparePredictionResponse,
    LoanInput,
    PredictRequest,
    SinglePredictionResponse,
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    registry.load()  # Nạp 4 model + metadata.json 1 lần khi bật server
    yield


app = FastAPI(
    title="API Phân Loại Rủi Ro Khoản Vay",
    description="REST API triển khai 4 mô hình Classification (mặc định dùng XGBoost + hỗ trợ so sánh 4 thuật toán).",
    version="1.0.0",
    lifespan=lifespan,
)

# Bật CORS cho phép cả localhost và domain Web khi deploy (Vercel) gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "loaded_models": list(registry.models.keys()),
        "best_model": registry.best_model_name or None,
    }


@app.get("/models")
def get_models():
    if not registry.metadata:
        raise HTTPException(status_code=503, detail="Chưa có models/metadata.json.")
    return registry.metadata


@app.post("/predict", response_model=SinglePredictionResponse)
def predict(req: PredictRequest):
    try:
        return registry.predict_one(req.features, req.model_name)
    except KeyError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/predict/compare", response_model=ComparePredictionResponse)
def predict_compare(features: LoanInput):
    return registry.predict_compare(features)