FROM python:3.14-slim

# Tạo user uid 1000 theo chuẩn bảo mật của Hugging Face Spaces
RUN useradd -m -u 1000 user
WORKDIR /app

# Chỉ cài các thư viện cần thiết cho API để build nhanh
RUN pip install --no-cache-dir \
    fastapi \
    "uvicorn[standard]" \
    pydantic \
    numpy \
    pandas \
    scikit-learn \
    xgboost \
    joblib

# Sao chép code API và 4 mô hình đã huấn luyện
COPY --chown=user:user api ./api
COPY --chown=user:user models ./models

USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

EXPOSE 7860

CMD ["sh", "-c", "uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
