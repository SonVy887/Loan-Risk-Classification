import { useEffect, useState } from "react";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

const MODEL_LABELS = {
  logistic_regression: "Logistic Regression",
  svm: "SVM",
  random_forest: "Random Forest",
  xgboost: "XGBoost",
};

const TOP_FEATURES_XGB = [
  { key: "previous_loan_defaults_on_file_No", label: "Chưa từng vỡ nợ (Không nợ xấu)", importance: 0.85083 },
  { key: "person_home_ownership_RENT", label: "Nhà ở: Đang thuê (RENT)", importance: 0.023926 },
  { key: "person_home_ownership_OWN", label: "Nhà ở: Sở hữu riêng (OWN)", importance: 0.018018 },
  { key: "loan_percent_income", label: "Tỷ lệ khoản vay / Thu nhập", importance: 0.017891 },
  { key: "loan_intent_VENTURE", label: "Mục đích: Khởi nghiệp / Đầu tư", importance: 0.011337 },
  { key: "loan_int_rate", label: "Lãi suất vay (%)", importance: 0.009389 },
  { key: "loan_intent_HOMEIMPROVEMENT", label: "Mục đích: Sửa chữa nhà", importance: 0.008558 },
  { key: "loan_intent_DEBTCONSOLIDATION", label: "Mục đích: Gộp / Trả nợ cũ", importance: 0.007422 },
  { key: "loan_intent_MEDICAL", label: "Mục đích: Y tế", importance: 0.006956 },
  { key: "person_income", label: "Thu nhập hàng năm", importance: 0.006718 },
];

export default function ModelsTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/models`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Chưa tải được dữ liệu mô hình.");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="glass-panel rounded-3xl p-6 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-panel rounded-3xl p-8 text-center text-sm text-slate-500 animate-pulse">
        Đang tải dữ liệu...
      </div>
    );
  }

  const sortedModels = Object.entries(data.models).sort(
    (a, b) => b[1].f1 - a[1].f1
  );

  return (
    <div className="space-y-6">
      {/* 1. Bảng xếp hạng 4 mô hình (đã bỏ cột thời gian Train) */}
      <div className="glass-panel rounded-[28px] p-6 sm:p-7 space-y-4 overflow-x-auto">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">
            Hiệu Năng 4 Mô Hình (8.999 Mẫu Test)
          </h2>
          <span className="px-3.5 py-1 rounded-full bg-white/85 border border-white text-slate-800 text-xs font-semibold shadow-2xs">
            Best: {MODEL_LABELS[data.best_model] || data.best_model}
          </span>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
            <tr>
              <th className="py-3 pr-4">Mô hình</th>
              <th className="py-3 px-3">Accuracy</th>
              <th className="py-3 px-3">Precision</th>
              <th className="py-3 px-3">Recall</th>
              <th className="py-3 px-3">F1-score</th>
              <th className="py-3 pl-3 text-right">ROC-AUC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60">
            {sortedModels.map(([key, m]) => (
              <tr key={key} className="hover:bg-white/45 transition-colors">
                <td className="py-3.5 pr-4 font-semibold text-slate-900">
                  {MODEL_LABELS[key] || key}
                  {key === data.best_model && (
                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-[#d6f5e3] text-[#0f5132]">
                      Best
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-3 text-slate-700 tabular-nums">
                  {(m.accuracy * 100).toFixed(2)}%
                </td>
                <td className="py-3.5 px-3 text-slate-700 tabular-nums">
                  {(m.precision * 100).toFixed(2)}%
                </td>
                <td className="py-3.5 px-3 text-slate-700 tabular-nums">
                  {(m.recall * 100).toFixed(2)}%
                </td>
                <td className="py-3.5 px-3 font-bold text-slate-900 tabular-nums">
                  {(m.f1 * 100).toFixed(2)}%
                </td>
                <td className="py-3.5 pl-3 text-right font-semibold text-slate-800 tabular-nums">
                  {(m.roc_auc * 100).toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 2. Ma trận nhầm lẫn lưới 2x2 rộng rãi, có tiêu đề Hàng (Thực tế) & Cột (Dự đoán) rõ ràng */}
      <div className="grid lg:grid-cols-2 gap-5">
        {sortedModels.map(([key, m]) => {
          const [[tn, fp], [fn, tp]] = m.confusion_matrix;
          const totalCorrect = tn + tp;
          const totalSamples = tn + fp + fn + tp;

          return (
            <div key={key} className="glass-panel rounded-[28px] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {MODEL_LABELS[key] || key}
                  </h3>
                  {key === data.best_model && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d6f5e3] text-[#0f5132] font-semibold">
                      Best
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500 tabular-nums">
                  Đoán đúng:{" "}
                  <strong className="text-slate-800">
                    {totalCorrect.toLocaleString("vi-VN")}/{totalSamples.toLocaleString("vi-VN")}
                  </strong>
                </span>
              </div>

              {/* Bảng ma trận có nhãn Hàng & Cột tiếng Việt dễ đọc ngay lập tức */}
              <div className="grid grid-cols-12 gap-2.5 items-center text-xs">
                {/* Góc trống + Nhãn 2 cột Dự đoán */}
                <div className="col-span-4" />
                <div className="col-span-4 text-center font-semibold text-slate-500 pb-1">
                  Máy đoán: Từ chối
                </div>
                <div className="col-span-4 text-center font-semibold text-slate-500 pb-1">
                  Máy đoán: Duyệt
                </div>

                {/* Hàng 1: Thực tế Từ chối (0) */}
                <div className="col-span-4 pr-2 text-right font-semibold text-slate-700 leading-snug">
                  Thực tế:
                  <span className="block text-slate-500 font-normal">
                    Hồ sơ rủi ro (0)
                  </span>
                </div>
                <div className="col-span-4 p-3.5 rounded-2xl bg-white/85 border border-white text-center shadow-2xs">
                  <strong className="block text-lg text-slate-900 tabular-nums">
                    {tn.toLocaleString("vi-VN")}
                  </strong>
                  <span className="text-[11px] text-slate-600">Từ chối đúng</span>
                </div>
                <div className="col-span-4 p-3.5 rounded-2xl bg-rose-50/85 border border-rose-100 text-center">
                  <strong className="block text-lg text-rose-700 tabular-nums">
                    {fp.toLocaleString("vi-VN")}
                  </strong>
                  <span className="text-[11px] text-rose-600 font-medium">
                    Cho vay nhầm
                  </span>
                </div>

                {/* Hàng 2: Thực tế Được duyệt (1) */}
                <div className="col-span-4 pr-2 text-right font-semibold text-slate-700 leading-snug">
                  Thực tế:
                  <span className="block text-slate-500 font-normal">
                    Hồ sơ tốt (1)
                  </span>
                </div>
                <div className="col-span-4 p-3.5 rounded-2xl bg-amber-50/75 border border-amber-100 text-center">
                  <strong className="block text-lg text-amber-800 tabular-nums">
                    {fn.toLocaleString("vi-VN")}
                  </strong>
                  <span className="text-[11px] text-amber-700 font-medium">
                    Từ chối nhầm
                  </span>
                </div>
                <div className="col-span-4 p-3.5 rounded-2xl bg-[#d6f5e3]/80 border border-[#b7efd0] text-center">
                  <strong className="block text-lg text-[#0f5132] tabular-nums">
                    {tp.toLocaleString("vi-VN")}
                  </strong>
                  <span className="text-[11px] text-[#0f5132] font-medium">
                    Cho vay đúng
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Top 10 Feature Importance của XGBoost */}
      <div className="glass-panel rounded-[28px] p-6 sm:p-7 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Top 10 Yếu Tố Ảnh Hưởng Mạnh Nhất (XGBoost)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Mức độ đóng góp của từng đặc trưng khi mô hình ra quyết định duyệt hoặc từ chối hồ sơ.
            </p>
          </div>
          <span className="px-3.5 py-1 rounded-full bg-white/85 border border-white text-slate-700 text-xs font-semibold shadow-2xs">
            Feature Importance
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {TOP_FEATURES_XGB.map((item, idx) => {
            const pct = item.importance * 100;
            const barWidth = Math.max(3, (item.importance / TOP_FEATURES_XGB[0].importance) * 100);
            return (
              <div key={item.key} className="grid grid-cols-12 items-center gap-3 text-sm">
                <div className="col-span-12 sm:col-span-5 flex items-baseline gap-2 min-w-0">
                  <span className="text-xs font-semibold text-slate-400 w-5 shrink-0 tabular-nums">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <span className="font-medium text-slate-800 block truncate">
                      {item.label}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 block truncate">
                      {item.key}
                    </span>
                  </div>
                </div>

                <div className="col-span-9 sm:col-span-5 h-2.5 rounded-full bg-slate-200/85 overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${barWidth}%`,
                      background:
                        idx === 0
                          ? "linear-gradient(90deg, #334155 0%, #475569 45%, #86efac 100%)"
                          : "linear-gradient(90deg, #475569 0%, #94a3b8 100%)",
                    }}
                  />
                </div>

                <span className="col-span-3 sm:col-span-2 text-right font-semibold text-slate-700 tabular-nums text-xs sm:text-sm">
                  {pct.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl bg-white/65 border border-white/80 px-4 py-3 text-xs text-slate-600 leading-relaxed">
          <strong className="text-slate-800">Nhận xét:</strong> Yếu tố{" "}
          <span className="font-mono text-slate-800">previous_loan_defaults_on_file_No</span>{" "}
          chiếm tới <strong>85.08%</strong> trọng số quyết định — cho thấy lịch sử từng vỡ nợ là rào cản lớn nhất, tiếp theo mới đến tình trạng nhà ở, tỷ lệ vay/thu nhập và lãi suất.
        </div>
      </div>
    </div>
  );
}
