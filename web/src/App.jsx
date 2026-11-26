import { useCallback, useEffect, useMemo, useState } from "react";
import IosToggle from "./components/IosToggle";
import ResultCard3D from "./components/ResultCard3D";
import ModelsTab from "./components/ModelsTab";
import DatasetTab from "./components/DatasetTab";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

const SAMPLE_GOOD = {
  person_age: 32,
  person_gender: "male",
  person_education: "Bachelor",
  person_income: 480000000,
  person_emp_exp: 8,
  person_home_ownership: "MORTGAGE",
  loan_amnt: 120000000,
  loan_intent: "HOMEIMPROVEMENT",
  loan_int_rate: 8.5,
  cb_person_cred_hist_length: 8,
  credit_score: 760,
  previous_loan_defaults_on_file: "No",
  currency: "VND",
};

const SAMPLE_RISK = {
  person_age: 22,
  person_gender: "female",
  person_education: "High School",
  person_income: 300000000,
  person_emp_exp: 1,
  person_home_ownership: "RENT",
  loan_amnt: 210000000,
  loan_intent: "DEBTCONSOLIDATION",
  loan_int_rate: 17.5,
  cb_person_cred_hist_length: 2,
  credit_score: 520,
  previous_loan_defaults_on_file: "Yes",
  currency: "VND",
};

function formatDots(num) {
  if (num === "" || num === null || num === undefined) return "";
  const digits = String(num).replace(/\D/g, "");
  if (!digits) return "";
  return new Intl.NumberFormat("vi-VN").format(Number(digits));
}

function parseDots(str) {
  const digits = String(str).replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

const RISK_PRESETS = [
  { value: 0.3, label: "Nới lỏng", pct: "30%", hint: "Mở rộng khách hàng (Recall ~89.5%)" },
  { value: 0.5, label: "Tiêu chuẩn", pct: "50%", hint: "Cân bằng mặc định (F1 ~85.5%)" },
  { value: 0.7, label: "Siết chặt", pct: "70%", hint: "An toàn cao (Precision ~94.2%)" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("predict");
  const [form, setForm] = useState(SAMPLE_GOOD);
  const [modelName, setModelName] = useState("best");
  const [compareMode, setCompareMode] = useState(true);
  const [threshold, setThreshold] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [singleResult, setSingleResult] = useState(null);
  const [compareResult, setCompareResult] = useState(null);

  const loanPercentRatio = useMemo(() => {
    if (!form.person_income || form.person_income <= 0) return 0;
    return Math.min(1, form.loan_amnt / form.person_income);
  }, [form.loan_amnt, form.person_income]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const runAnalysis = useCallback(async (targetForm, isCompare, chosenModel) => {
    setLoading(true);
    setError("");
    try {
      const endpoint = isCompare ? "/predict/compare" : "/predict";
      const payload = isCompare
        ? targetForm
        : { features: targetForm, model_name: chosenModel };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(
          typeof errBody.detail === "string"
            ? errBody.detail
            : "Dữ liệu không hợp lệ."
        );
      }

      const data = await res.json();
      if (isCompare) {
        setCompareResult(data);
        setSingleResult(null);
      } else {
        setSingleResult(data);
        setCompareResult(null);
      }
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Chưa kết nối FastAPI (:8000)."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runAnalysis(SAMPLE_GOOD, true, "best");
  }, [runAnalysis]);

  const handleSubmit = (e) => {
    e.preventDefault();
    runAnalysis(form, compareMode, modelName);
  };

  const applyPreset = (preset) => {
    setForm(preset);
    runAnalysis(preset, compareMode, modelName);
  };

  return (
    <div className="min-h-screen relative overflow-hidden px-4 sm:px-8 pt-5 pb-12">
      {/* 3 Quả cầu 3D ánh bạc mờ */}
      <div className="pointer-events-none silver-orb fixed -bottom-24 -left-20 w-72 h-72 opacity-85" />
      <div className="pointer-events-none silver-orb fixed -top-12 -right-16 w-64 h-64 opacity-80" />
      <div className="pointer-events-none silver-orb absolute top-44 left-[56%] w-14 h-14 opacity-70 hidden lg:block" />

      {/* Navbar Kính Nổi */}
      <header className="relative z-20 max-w-6xl mx-auto glass-navbar rounded-[22px] px-5 sm:px-7 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-6 rounded-md border-[1.5px] border-slate-700 flex overflow-hidden opacity-80">
            <div className="w-2.5 border-r-[1.5px] border-slate-700 bg-slate-300/40" />
          </div>

          <div className="h-5 w-[1px] bg-slate-300" />

          <svg
            viewBox="0 0 28 28"
            className="w-6 h-6 text-slate-700 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          >
            <polygon points="14 4 24 9.5 14 15 4 9.5 14 4" fill="rgba(100,116,139,0.18)" />
            <polyline points="4 14 14 19.5 24 14" />
            <polyline points="4 18.5 14 24 24 18.5" />
          </svg>

          <div className="leading-tight">
            <span className="block font-bold text-base tracking-tight text-slate-900">
              LoanRisk AI
            </span>
            <span className="block text-[11px] text-slate-500">
              Thẩm Định Rủi Ro Khoản Vay
            </span>
          </div>
        </div>

        {/* iOS Segmented Control gọn gàng ở chính giữa */}
        <div className="mx-auto sm:mx-0 lg:absolute lg:left-1/2 lg:-translate-x-1/2 inline-flex p-1 rounded-full bg-[#d6dae2]/85 border border-white/70 shadow-inner">
          {[
            { id: "predict", label: "Thẩm Định" },
            { id: "models", label: "Mô Hình" },
            { id: "dataset", label: "Dữ Liệu" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-1.5 rounded-full text-sm transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-white/95 text-slate-900 shadow-[0_3px_10px_rgba(15,23,42,0.1)] font-semibold"
                  : "text-slate-600 hover:text-slate-900 font-medium"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="hidden lg:block w-24" />
      </header>

      {/* Main Layout */}
      <main className="relative z-10 max-w-6xl mx-auto pt-7">
        {activeTab === "models" ? (
          <ModelsTab />
        ) : activeTab === "dataset" ? (
          <DatasetTab />
        ) : (
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* Cột Trái: Form 13 đặc trưng tối giản */}
            <form
              onSubmit={handleSubmit}
              className="lg:col-span-7 glass-panel rounded-[28px] p-6 sm:p-7 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Thông Tin Hồ Sơ Vay
                </h1>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset(SAMPLE_GOOD)}
                    className="px-3.5 py-1.5 rounded-full bg-[#dcdfe6]/85 hover:bg-white border border-white/80 text-xs font-medium text-slate-700 transition-all cursor-pointer"
                  >
                    Mẫu hồ sơ tốt
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(SAMPLE_RISK)}
                    className="px-3.5 py-1.5 rounded-full bg-[#dcdfe6]/85 hover:bg-white border border-white/80 text-xs font-medium text-slate-700 transition-all cursor-pointer"
                  >
                    Mẫu rủi ro cao
                  </button>
                </div>
              </div>

              {/* Hàng 1: Tuổi | Giới tính | Học vấn */}
              <div className="grid sm:grid-cols-3 gap-3.5">
                <label className="space-y-1">
                  <span className="block text-xs font-medium text-slate-600">Tuổi</span>
                  <input
                    type="number"
                    min={18}
                    max={100}
                    value={form.person_age}
                    onChange={(e) => updateField("person_age", Number(e.target.value))}
                    className="ios-field"
                  />
                </label>

                <label className="space-y-1">
                  <span className="block text-xs font-medium text-slate-600">Giới tính</span>
                  <select
                    value={form.person_gender}
                    onChange={(e) => updateField("person_gender", e.target.value)}
                    className="ios-field"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="block text-xs font-medium text-slate-600">Học vấn</span>
                  <select
                    value={form.person_education}
                    onChange={(e) => updateField("person_education", e.target.value)}
                    className="ios-field"
                  >
                    <option value="High School">THPT</option>
                    <option value="Associate">Cao đẳng</option>
                    <option value="Bachelor">Đại học</option>
                    <option value="Master">Thạc sĩ</option>
                    <option value="Doctorate">Tiến sĩ</option>
                  </select>
                </label>
              </div>

              {/* Hàng 2: Kinh nghiệm | Nhà ở | Mục đích vay */}
              <div className="grid sm:grid-cols-3 gap-3.5">
                <label className="space-y-1">
                  <span className="block text-xs font-medium text-slate-600">
                    Kinh nghiệm (năm)
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={80}
                    value={form.person_emp_exp}
                    onChange={(e) =>
                      updateField("person_emp_exp", Number(e.target.value))
                    }
                    className="ios-field"
                  />
                </label>

                <label className="space-y-1">
                  <span className="block text-xs font-medium text-slate-600">Nhà ở</span>
                  <select
                    value={form.person_home_ownership}
                    onChange={(e) =>
                      updateField("person_home_ownership", e.target.value)
                    }
                    className="ios-field"
                  >
                    <option value="RENT">Thuê nhà</option>
                    <option value="OWN">Sở hữu nhà</option>
                    <option value="MORTGAGE">Thế chấp</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="block text-xs font-medium text-slate-600">
                    Mục đích vay
                  </span>
                  <select
                    value={form.loan_intent}
                    onChange={(e) => updateField("loan_intent", e.target.value)}
                    className="ios-field"
                  >
                    <option value="PERSONAL">Cá nhân</option>
                    <option value="EDUCATION">Giáo dục</option>
                    <option value="MEDICAL">Y tế</option>
                    <option value="VENTURE">Khởi nghiệp</option>
                    <option value="HOMEIMPROVEMENT">Sửa nhà</option>
                    <option value="DEBTCONSOLIDATION">Hợp nhất nợ</option>
                  </select>
                </label>
              </div>

              {/* Hàng 3: Thu nhập năm | Số tiền vay | Tỷ lệ vay / thu nhập */}
              <div className="grid sm:grid-cols-3 gap-3.5">
                <label className="space-y-1">
                  <span className="block text-xs font-medium text-slate-600">
                    Thu nhập năm ({form.currency})
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatDots(form.person_income)}
                    onChange={(e) =>
                      updateField("person_income", parseDots(e.target.value))
                    }
                    className="ios-field"
                  />
                </label>

                <label className="space-y-1">
                  <span className="block text-xs font-medium text-slate-600">
                    Số tiền vay ({form.currency})
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatDots(form.loan_amnt)}
                    onChange={(e) =>
                      updateField("loan_amnt", parseDots(e.target.value))
                    }
                    className="ios-field"
                  />
                </label>

                <label className="space-y-1">
                  <span className="block text-xs font-medium text-slate-600">
                    Tỷ lệ vay / thu nhập
                  </span>
                  <input
                    type="text"
                    readOnly
                    value={`${(loanPercentRatio * 100).toFixed(1)}%`}
                    className="ios-field bg-white/55 text-slate-600 cursor-default"
                  />
                </label>
              </div>

              {/* Hàng 4: Lãi suất | Điểm tín dụng | Lịch sử tín dụng */}
              <div className="grid sm:grid-cols-3 gap-3.5">
                <label className="space-y-1">
                  <span className="block text-xs font-medium text-slate-600">
                    Lãi suất (%)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={20}
                    value={form.loan_int_rate}
                    onChange={(e) =>
                      updateField("loan_int_rate", Number(e.target.value))
                    }
                    className="ios-field"
                  />
                </label>

                <label className="space-y-1">
                  <span className="block text-xs font-medium text-slate-600">
                    Điểm tín dụng
                  </span>
                  <input
                    type="number"
                    min={300}
                    max={850}
                    value={form.credit_score}
                    onChange={(e) =>
                      updateField("credit_score", Number(e.target.value))
                    }
                    className="ios-field"
                  />
                </label>

                <label className="space-y-1">
                  <span className="block text-xs font-medium text-slate-600">
                    Lịch sử tín dụng (năm)
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={form.cb_person_cred_hist_length}
                    onChange={(e) =>
                      updateField(
                        "cb_person_cred_hist_length",
                        Number(e.target.value)
                      )
                    }
                    className="ios-field"
                  />
                </label>
              </div>

              {/* Hàng 5: Lịch sử nợ xấu | Tiền tệ */}
              <div className="grid sm:grid-cols-3 gap-3.5">
                <label className="sm:col-span-2 space-y-1">
                  <span className="block text-xs font-medium text-slate-600">
                    Lịch sử nợ xấu
                  </span>
                  <select
                    value={form.previous_loan_defaults_on_file}
                    onChange={(e) =>
                      updateField(
                        "previous_loan_defaults_on_file",
                        e.target.value
                      )
                    }
                    className="ios-field"
                  >
                    <option value="No">Không có</option>
                    <option value="Yes">Đã từng nợ xấu</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="block text-xs font-medium text-slate-600">
                    Tiền tệ
                  </span>
                  <select
                    value={form.currency}
                    onChange={(e) => updateField("currency", e.target.value)}
                    className="ios-field"
                  >
                    <option value="VND">VNĐ</option>
                    <option value="USD">USD</option>
                  </select>
                </label>
              </div>

              {/* Nút gạt iOS + chọn mô hình đơn */}
              <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
                <IosToggle
                  label="So sánh cả 4 thuật toán"
                  checked={compareMode}
                  onChange={setCompareMode}
                />

                {!compareMode && (
                  <select
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="ios-field sm:w-52 py-2 text-sm"
                  >
                    <option value="best">XGBoost (Best)</option>
                    <option value="random_forest">Random Forest</option>
                    <option value="svm">SVM</option>
                    <option value="logistic_regression">Logistic Regression</option>
                  </select>
                )}
              </div>

              {/* Khẩu vị rủi ro / Ngưỡng quyết định */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-medium text-slate-700">
                    Khẩu vị rủi ro (Ngưỡng duyệt)
                  </span>
                  <span className="text-slate-500">
                    {RISK_PRESETS.find((p) => p.value === threshold)?.hint}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-white/60 border border-white/80 shadow-inner">
                  {RISK_PRESETS.map((preset) => {
                    const active = threshold === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setThreshold(preset.value)}
                        className={`py-2 px-2 rounded-xl text-xs transition-all cursor-pointer ${
                          active
                            ? "bg-white text-slate-900 font-semibold shadow-xs"
                            : "text-slate-600 hover:text-slate-900 font-medium"
                        }`}
                      >
                        {preset.label} ({preset.pct})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nút chính Liquid Glass */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full liquid-pill-btn text-slate-950 font-semibold text-[16px] tracking-tight disabled:opacity-50 cursor-pointer"
              >
                <span className="relative z-10">
                  {loading ? "Đang Phân Tích..." : "Phân Tích Hồ Sơ"}
                </span>
              </button>
            </form>

            {/* Cột Phải: Thẻ 3D + Bảng 4 Mô Hình */}
            <div className="lg:col-span-5">
              <ResultCard3D
                singleResult={singleResult}
                compareResult={compareResult}
                threshold={threshold}
                error={error}
                loading={loading}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
