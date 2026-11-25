from typing import Literal
from pydantic import BaseModel, Field

VND_PER_USD = 25000.0

ModelChoice = Literal[
    "best", "logistic_regression", "svm", "random_forest", "xgboost"
]


class LoanInput(BaseModel):
    person_age: float = Field(..., ge=18, le=100)
    person_gender: Literal["male", "female"]
    person_education: Literal["High School", "Associate", "Bachelor", "Master", "Doctorate"]
    person_income: float = Field(..., gt=0)
    person_emp_exp: int = Field(..., ge=0, le=80)
    person_home_ownership: Literal["RENT", "OWN", "MORTGAGE", "OTHER"]
    loan_amnt: float = Field(..., gt=0)
    loan_intent: Literal[
        "PERSONAL", "EDUCATION", "MEDICAL", "VENTURE", "HOMEIMPROVEMENT", "DEBTCONSOLIDATION"
    ]
    loan_int_rate: float = Field(..., ge=0, le=50)
    loan_percent_income: float | None = Field(default=None, ge=0, le=1)
    cb_person_cred_hist_length: float = Field(..., ge=0, le=60)
    credit_score: int = Field(..., ge=300, le=850)
    previous_loan_defaults_on_file: Literal["Yes", "No"]
    currency: Literal["USD", "VND"] = "VND"

    def to_model_row(self) -> dict:
        """Quy đổi về đúng 13 cột tiếng Anh + đơn vị USD khớp với tập train."""
        income_usd = self.person_income / VND_PER_USD if self.currency == "VND" else self.person_income
        loan_usd = self.loan_amnt / VND_PER_USD if self.currency == "VND" else self.loan_amnt
        ratio = (
            self.loan_percent_income
            if self.loan_percent_income is not None
            else round(min(1.0, loan_usd / max(income_usd, 1e-6)), 4)
        )
        return {
            "person_age": self.person_age,
            "person_gender": self.person_gender,
            "person_education": self.person_education,
            "person_income": round(income_usd, 2),
            "person_emp_exp": self.person_emp_exp,
            "person_home_ownership": self.person_home_ownership,
            "loan_amnt": round(loan_usd, 2),
            "loan_intent": self.loan_intent,
            "loan_int_rate": self.loan_int_rate,
            "loan_percent_income": ratio,
            "cb_person_cred_hist_length": self.cb_person_cred_hist_length,
            "credit_score": self.credit_score,
            "previous_loan_defaults_on_file": self.previous_loan_defaults_on_file,
        }


class PredictRequest(BaseModel):
    features: LoanInput
    model_name: ModelChoice = "best"

class SinglePredictionResponse(BaseModel):
    model_used: str
    is_best_model: bool
    prediction: int
    label: str
    confidence: float
    probabilities: dict[str, float]


class ComparePredictionResponse(BaseModel):
    best_model: str
    consensus_label: str
    consensus_ratio: str
    results: list[SinglePredictionResponse]