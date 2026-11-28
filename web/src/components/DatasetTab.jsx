const FEATURES = [
  { col: "person_age", vi: "Tuổi", prep: "StandardScaler" },
  { col: "person_gender", vi: "Giới tính", prep: "OneHot (2 cột)" },
  { col: "person_education", vi: "Học vấn", prep: "OneHot (5 cột)" },
  { col: "person_income", vi: "Thu nhập năm", prep: "StandardScaler" },
  { col: "person_emp_exp", vi: "Kinh nghiệm", prep: "StandardScaler" },
  { col: "person_home_ownership", vi: "Nhà ở", prep: "OneHot (4 cột)" },
  { col: "loan_amnt", vi: "Số tiền vay", prep: "StandardScaler" },
  { col: "loan_intent", vi: "Mục đích vay", prep: "OneHot (6 cột)" },
  { col: "loan_int_rate", vi: "Lãi suất (%)", prep: "StandardScaler" },
  { col: "loan_percent_income", vi: "Tỷ lệ vay / thu nhập", prep: "StandardScaler" },
  { col: "cb_person_cred_hist_length", vi: "Lịch sử tín dụng", prep: "StandardScaler" },
  { col: "credit_score", vi: "Điểm tín dụng", prep: "StandardScaler" },
  { col: "previous_loan_defaults_on_file", vi: "Lịch sử nợ xấu", prep: "OneHot (2 cột)" },
];

function FlowArrow() {
  return (
    <div className="hidden lg:flex items-center justify-center text-slate-400 shrink-0">
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="4" y1="12" x2="20" y2="12" />
        <polyline points="14 6 20 12 14 18" />
      </svg>
    </div>
  );
}

export default function DatasetTab() {
  return (
    <div className="space-y-6">
      {/* 1. 4 Thẻ chỉ số tổng quan + Phân phối nhãn */}
      <div className="grid lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 grid grid-cols-2 gap-4">
          <div className="glass-panel rounded-[24px] p-5 flex flex-col justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Bản ghi gốc
            </span>
            <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
              45.000
            </p>
            <p className="text-xs text-slate-500 mt-1">0 thiếu • 0 trùng lặp</p>
          </div>

          <div className="glass-panel rounded-[24px] p-5 flex flex-col justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Sau lọc Outlier
            </span>
            <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
              44.993
            </p>
            <p className="text-xs text-slate-500 mt-1">Loại 7 dòng tuổi &gt; 100</p>
          </div>

          <div className="glass-panel rounded-[24px] p-5 flex flex-col justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Chia tập 80 / 20
            </span>
            <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
              35.994 / 8.999
            </p>
            <p className="text-xs text-slate-500 mt-1">Stratified + 5-Fold CV</p>
          </div>

          <div className="glass-panel rounded-[24px] p-5 flex flex-col justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Chiều đặc trưng
            </span>
            <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
              13 → 27
            </p>
            <p className="text-xs text-slate-500 mt-1">8 số + 19 One-Hot</p>
          </div>
        </div>

        {/* Phân phối nhãn loan_status */}
        <div className="lg:col-span-5 glass-panel rounded-[26px] p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Phân Phối Nhãn <code>loan_status</code>
            </h2>
            <span className="text-xs text-slate-500">Tỷ lệ ~3,5 : 1</span>
          </div>

          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-slate-700">Từ chối (0)</span>
                <strong className="text-slate-900 tabular-nums">77,78%</strong>
              </div>
              <div className="h-2.5 rounded-full bg-slate-200/90 overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full bg-slate-700"
                  style={{ width: "77.78%" }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-slate-700">Được duyệt (1)</span>
                <strong className="text-slate-900 tabular-nums">22,22%</strong>
              </div>
              <div className="h-2.5 rounded-full bg-slate-200/90 overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: "22.22%",
                    background: "linear-gradient(90deg, #334155 0%, #86efac 100%)",
                  }}
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Phân tầng <code>stratify=y</code>, chọn mô hình theo F1 &amp; ROC-AUC.
          </p>
        </div>
      </div>

      {/* 2. Sơ đồ Luồng Pipeline Tiền Xử Lý Rõ Ràng Từng Bước (1 -> 2 -> 3 -> 4 -> 5) */}
      <div className="glass-panel rounded-[28px] p-6 sm:p-7 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900">
            Luồng Tiền Xử Lý &amp; Đóng Gói Pipeline
          </h2>
          <span className="px-3 py-1 rounded-full bg-white/80 border border-white text-xs font-medium text-slate-600">
            Chống rò rỉ dữ liệu (No Data Leakage)
          </span>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch gap-3 text-xs">
          {/* Bước 1 */}
          <div className="flex-1 p-4 rounded-2xl bg-white/80 border border-white flex flex-col justify-between space-y-2">
            <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] flex items-center justify-center">
                1
              </span>
              Làm sạch Outlier
            </span>
            <p className="text-slate-600 leading-relaxed">
              Lọc bỏ 7 dòng <code>tuổi &gt; 100</code> từ tập gốc 45.000 dòng.
            </p>
            <span className="text-[11px] font-semibold text-slate-800 pt-1 border-t border-slate-200/70">
              Còn 44.993 dòng sạch
            </span>
          </div>

          <FlowArrow />

          {/* Bước 2 */}
          <div className="flex-1 p-4 rounded-2xl bg-white/80 border border-white flex flex-col justify-between space-y-2">
            <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] flex items-center justify-center">
                2
              </span>
              Chia Train / Test
            </span>
            <p className="text-slate-600 leading-relaxed">
              Chia <strong>trước khi chuẩn hóa</strong> với <code>stratify=y</code>.
            </p>
            <span className="text-[11px] font-semibold text-slate-800 pt-1 border-t border-slate-200/70">
              80% Train • 20% Test
            </span>
          </div>

          <FlowArrow />

          {/* Bước 3: 2 nhánh song song */}
          <div className="flex-[1.35] p-4 rounded-2xl bg-white/85 border border-white flex flex-col justify-between space-y-2.5">
            <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] flex items-center justify-center">
                3
              </span>
              ColumnTransformer (2 nhánh)
            </span>

            <div className="space-y-1.5">
              <div className="px-3 py-2 rounded-xl bg-slate-100/90 border border-slate-200/70 flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-800">8 cột số</span>
                <span className="text-slate-600">Median → StandardScaler</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-slate-100/90 border border-slate-200/70 flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-800">5 cột chữ</span>
                <span className="text-slate-600">Mode → OneHot (19 cột)</span>
              </div>
            </div>
          </div>

          <FlowArrow />

          {/* Bước 4 */}
          <div className="flex-1 p-4 rounded-2xl bg-white/80 border border-white flex flex-col justify-between space-y-2">
            <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] flex items-center justify-center">
                4
              </span>
              Quy tắc Fit / Transform
            </span>
            <div className="space-y-1 text-slate-600">
              <p>• Train: <code>fit_transform</code></p>
              <p>• Test &amp; API: chỉ <code>transform</code></p>
            </div>
            <span className="text-[11px] font-semibold text-slate-800 pt-1 border-t border-slate-200/70">
              Đầu ra: 27 đặc trưng
            </span>
          </div>

          <FlowArrow />

          {/* Bước 5 */}
          <div className="flex-1 p-4 rounded-2xl bg-slate-900 text-white flex flex-col justify-between space-y-2">
            <span className="inline-flex items-center gap-1.5 font-bold">
              <span className="w-5 h-5 rounded-full bg-white text-slate-900 text-[11px] flex items-center justify-center">
                5
              </span>
              Huấn luyện &amp; Xuất
            </span>
            <p className="text-slate-300 leading-relaxed">
              5-Fold CV &amp; Tuning → Train lại trên 100% Train, chấm Test &amp; đóng gói Pipeline.
            </p>
            <span className="text-[11px] font-semibold text-[#86efac] pt-1 border-t border-white/15">
              4 file .joblib → FastAPI
            </span>
          </div>
        </div>
      </div>

      {/* 3. Lưới 13 đặc trưng đầu vào */}
      <div className="glass-panel rounded-[28px] p-6 sm:p-7 space-y-4">
        <h2 className="text-base font-bold text-slate-900">13 Đặc Trưng Đầu Vào</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
          {FEATURES.map((f) => (
            <div
              key={f.col}
              className="px-4 py-3 rounded-2xl bg-white/75 border border-white flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{f.vi}</p>
                <p className="font-mono text-[11px] text-slate-500 truncate">{f.col}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-200/75 text-slate-700 text-[11px] font-medium shrink-0">
                {f.prep}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
