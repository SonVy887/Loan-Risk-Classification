# Đồ Án Máy Học (Project 1): Phân Loại Rủi Ro Khoản Vay — Notebooks & FastAPI

Hệ thống Machine Learning tác vụ **Binary Classification** triển khai dưới dạng **REST API (Backend - FastAPI)** dựa trên tập dữ liệu [Loan Approval | Classification (Kaggle)](https://www.kaggle.com/datasets/sumit12100012/loan-approval-classification) (`45.000` bản ghi, `13` đặc trưng đầu vào, biến mục tiêu `loan_status`: `0` = Từ chối, `1` = Được duyệt).

---

## 1. Cấu trúc dự án

```text
D:\Machine Learning\
├── data/
│   ├── raw/loan_data.csv              # Dữ liệu gốc từ Kaggle
│   └── processed/                     # train.csv (80%) & test.csv (20%) đã lọc outlier
├── notebooks/
│   ├── 01_eda.ipynb                   # Khám phá dữ liệu, mất cân bằng lớp, outlier, xung đột nhãn
│   ├── 02_preprocessing.ipynb         # Lọc outlier, chia tập stratify=y, ColumnTransformer chống Data Leakage
│   ├── 03_train_compare_4models.ipynb # So sánh 4 thuật toán Classification bằng 5-Fold Stratified CV
│   └── 04_tuning_and_export.ipynb     # Tuning XGBoost, Confusion Matrix, ROC Curve & xuất 4 .joblib
├── models/
│   ├── logistic_regression.joblib
│   ├── svm.joblib
│   ├── random_forest.joblib
│   ├── xgboost.joblib                 # Best Model
│   └── metadata.json                  # Metrics & Confusion Matrix của cả 4 mô hình
├── api/
│   ├── schemas.py                     # Pydantic validation + quy đổi VND -> USD + tính loan_percent_income
│   ├── predictor.py                   # ModelRegistry nạp 4 pipelines 1 lần khi startup
│   └── main.py                        # FastAPI endpoints (/health, /models, /predict, /predict/compare)
├── tests/
│   └── test_api.py                    # 5 bài kiểm thử tự động với pytest & TestClient
├── requirements.txt
├── .gitignore
└── README.md
```

---

## 2. Kết quả so sánh 4 thuật toán Classification (trên `8.999` mẫu Test)

Sau khi loại bỏ `7` bản ghi ngoại lai (`person_age > 100`), còn `44.993` bản ghi chia `80/20` có phân tầng (`stratify=y`):

| Thuật toán | Accuracy | Precision | Recall | F1-score | ROC-AUC | Train (s) | Dung lượng |
|---|---:|---:|---:|---:|---:|---:|---:|
| **XGBoost (Best Model)** | **93,82%** | 89,15% | **82,20%** | **85,54%** | **97,92%** | 1,09s | 1,28 MB |
| **Random Forest** | 92,72% | **90,01%** | 75,65% | 82,21% | 97,32% | 1,13s | 36,84 MB |
| **SVM (`LinearSVC` + Calibrated)** | 89,50% | 77,26% | 74,75% | 75,98% | 95,22% | 0,56s | 7,6 KB |
| **Logistic Regression** | 89,47% | 77,17% | 74,70% | 75,91% | 95,23% | 0,21s | 5,9 KB |

- **Lý do chọn XGBoost làm `best_model`**: Đạt **F1-score (`85,54%`)** và **ROC-AUC (`97,92%`)** cao nhất, giảm mạnh số ca từ chối nhầm khách tốt (`FN = 356` so với `487` của Random Forest), đồng thời dung lượng model nhẹ hơn Random Forest gần **30 lần** (`1,28 MB` vs `36,84 MB`).

---

## 3. Hướng dẫn cài đặt & chạy dự án

### Bước 1: Tạo môi trường ảo & cài thư viện
```powershell
cd "D:\Machine Learning"
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### Bước 2: Chạy REST API (FastAPI)
```powershell
.\.venv\Scripts\python.exe -m uvicorn api.main:app --reload --port 8000
```
Mở tài liệu tương tác Swagger UI tại: **`http://localhost:8000/docs`**

Các endpoint chính:
- `GET /health` — Kiểm tra trạng thái server & danh sách 4 model đã nạp.
- `GET /models` — Trả về bảng đánh giá & Confusion Matrix của cả 4 thuật toán (`metadata.json`).
- `POST /predict` — Dự đoán 1 hồ sơ (mặc định dùng `best_model` là `xgboost`, hỗ trợ đổi sang từng thuật toán). Tự động quy đổi tiền tệ `VND → USD` (`1 USD = 25.000đ`).
- `POST /predict/compare` — Chạy đồng thời cả 4 thuật toán trên 1 hồ sơ và trả về mức độ đồng thuận (ưu tiên theo `best_model` nếu hòa `2/4`).

### Bước 3: Chạy kiểm thử tự động (`pytest`)
```powershell
.\.venv\Scripts\python.exe -m pytest -v
```
Kết quả kỳ vọng: **`5 passed`** (`test_health`, `test_models_metadata`, `test_predict_best_model`, `test_predict_compare_all_4`, `test_predict_invalid_age_returns_422`).
