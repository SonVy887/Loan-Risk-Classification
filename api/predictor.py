import json
from pathlib import Path
import joblib
import pandas as pd

from api.schemas import LoanInput, SinglePredictionResponse

ROOT_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT_DIR / "models"
MODEL_NAMES = ["logistic_regression", "svm", "random_forest", "xgboost"]


class ModelRegistry:
    def __init__(self) -> None:
        self.models: dict = {}
        self.metadata: dict = {}

    def load(self) -> None:
        """Nạp metadata.json và 4 file .joblib vào RAM 1 lần khi startup."""
        self.models.clear()
        meta_path = MODELS_DIR / "metadata.json"
        self.metadata = json.loads(meta_path.read_text(encoding="utf-8")) if meta_path.exists() else {}

        for name in MODEL_NAMES:
            path = MODELS_DIR / f"{name}.joblib"
            if path.exists():
                self.models[name] = joblib.load(path)

    @property
    def best_model_name(self) -> str:
        best = self.metadata.get("best_model")
        return best if best in self.models else next(iter(self.models.keys()), "")

    def predict_one(self, features: LoanInput, model_name: str = "best") -> SinglePredictionResponse:
        resolved = self.best_model_name if model_name == "best" else model_name
        if resolved not in self.models:
            raise KeyError(f"Không tìm thấy mô hình '{resolved}'.")

        pipeline = self.models[resolved]
        df = pd.DataFrame([features.to_model_row()])
        ## 
        pred = int(pipeline.predict(df)[0])
        proba = pipeline.predict_proba(df)[0]

        prob_rejected = round(float(proba[0]), 4)
        prob_approved = round(float(proba[1]), 4)
        confidence = prob_approved if pred == 1 else prob_rejected

        return SinglePredictionResponse(
            model_used=resolved,
            is_best_model=(resolved == self.best_model_name),
            prediction=pred,
            label="Được duyệt" if pred == 1 else "Từ chối",
            confidence=confidence,
            probabilities={"rejected": prob_rejected, "approved": prob_approved},
        )

    def predict_compare(self, features: LoanInput) -> dict:
        results = [self.predict_one(features, name) for name in MODEL_NAMES if name in self.models]
        approved_votes = sum(1 for r in results if r.prediction == 1)
        rejected_votes = len(results) - approved_votes
        total = len(results)

        if approved_votes > rejected_votes:
            consensus_label = "Được duyệt"
            consensus_ratio = f"{approved_votes}/{total} mô hình đồng thuận: Được duyệt"
        elif rejected_votes > approved_votes:
            consensus_label = "Từ chối"
            consensus_ratio = f"{rejected_votes}/{total} mô hình đồng thuận: Từ chối"
        else:
            best_res = next(r for r in results if r.is_best_model)
            consensus_label = best_res.label
            consensus_ratio = f"Hòa {approved_votes}/{total} — Ưu tiên theo {self.best_model_name}: {best_res.label}"

        return {
            "best_model": self.best_model_name,
            "consensus_label": consensus_label,
            "consensus_ratio": consensus_ratio,
            "results": results,
        }


registry = ModelRegistry()