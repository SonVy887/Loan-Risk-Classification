import { useState } from "react";

const MODEL_ORDER = [
  { key: "xgboost", label: "XGBoost" },
  { key: "random_forest", label: "Random Forest" },
  { key: "svm", label: "SVM" },
  { key: "logistic_regression", label: "Logistic Regression" },
];

export default function ResultCard3D({
  singleResult,
  compareResult,
  error,
  loading,
}) {
  // Góc nghiêng mặc định -12 độ giống hệt thẻ kính bạc 3D trong ảnh mẫu
  const [tilt, setTilt] = useState({ x: 8, y: -12, z: -9 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      x: 8 - py * 18,
      y: -12 + px * 22,
      z: -9 + px * 4,
    });
  };

  const resetTilt = () => setTilt({ x: 8, y: -12, z: -9 });

  // Kết quả chính hiển thị trên mặt thẻ 3D
  const heroResult =
    singleResult ||
    compareResult?.results?.find((r) => r.is_best_model) ||
    compareResult?.results?.[0] ||
    null;

  const isApproved = heroResult ? heroResult.prediction === 1 : true;
  const heroPct = heroResult
    ? (heroResult.probabilities.approved * 100).toFixed(1)
    : "—";

  // Danh sách các dòng hiển thị ở khung dưới
  const rows = compareResult
    ? MODEL_ORDER.map((m) => {
        const found = compareResult.results.find((r) => r.model_used === m.key);
        return {
          key: m.key,
          label: m.label,
          pct: found ? found.probabilities.approved * 100 : 0,
          approved: found ? found.prediction === 1 : false,
        };
      })
    : singleResult
    ? [
        {
          key: singleResult.model_used,
          label:
            MODEL_ORDER.find((m) => m.key === singleResult.model_used)?.label ||
            singleResult.model_used,
          pct: singleResult.probabilities.approved * 100,
          approved: singleResult.prediction === 1,
        },
      ]
    : [];

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* 1. Tác phẩm Thẻ Tín Dụng Kính Bạc 3D + 2 Vòng Thủy Tinh Quấn Quanh */}
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={resetTilt}
        className="relative w-full h-[300px] sm:h-[320px] flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
      >
        {/* Bóng đổ mềm dưới đáy thẻ */}
        <div className="pointer-events-none absolute bottom-5 w-64 h-10 rounded-full bg-slate-900/15 blur-2xl" />

        {/* Nửa SAU của 2 vòng nhẫn thủy tinh 3D */}
        <svg
          viewBox="0 0 460 320"
          className="pointer-events-none absolute inset-0 w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id="ringBack" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
              <stop offset="50%" stopColor="rgba(148,163,184,0.45)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.75)" />
            </linearGradient>
          </defs>
          <ellipse
            cx="235"
            cy="160"
            rx="168"
            ry="96"
            transform="rotate(-32 235 160)"
            fill="none"
            stroke="url(#ringBack)"
            strokeWidth="9"
            opacity="0.65"
          />
          <ellipse
            cx="235"
            cy="160"
            rx="156"
            ry="84"
            transform="rotate(-26 235 160)"
            fill="none"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="3"
            opacity="0.8"
          />
        </svg>

        {/* Thẻ Tín Dụng Kính Bạc Mờ 3D (nghiêng giống hệt ảnh mẫu) */}
        <div
          style={{
            transform: `perspective(1100px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) rotateZ(${tilt.z}deg)`,
            transition: "transform 200ms ease-out",
          }}
          className="relative z-10 w-[310px] sm:w-[340px] h-[196px] sm:h-[212px] rounded-[24px] p-6 flex flex-col justify-between bg-gradient-to-br from-white/80 via-[#e4e7ee]/78 to-[#cfd5df]/82 backdrop-blur-xl border-[1.5px] border-white/95 shadow-[0_26px_50px_rgba(15,23,42,0.16),inset_0_2px_3px_rgba(255,255,255,1),inset_0_-2px_6px_rgba(100,116,139,0.2)]"
        >
          {/* Ánh sáng chéo trên mặt kính thẻ */}
          <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-gradient-to-tr from-transparent via-white/35 to-white/60 opacity-75" />

          {/* Hàng trên: Badge trạng thái nằm góc phải mặt thẻ */}
          <div className="relative z-10 flex justify-end">
            {heroResult ? (
              <span
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-xs border ${
                  isApproved
                    ? "bg-[#d6f5e3]/95 text-[#0f5132] border-[#a8ebc4]"
                    : "bg-rose-100/95 text-rose-800 border-rose-200"
                }`}
              >
                {isApproved ? "ĐƯỢC DUYỆT" : "TỪ CHỐI"} •{" "}
                {(heroResult.confidence * 100).toFixed(1)}%
              </span>
            ) : (
              <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/80 text-slate-600 border border-white">
                {loading ? "ĐANG PHÂN TÍCH..." : `ĐƯỢC DUYỆT • ${heroPct}%`}
              </span>
            )}
          </div>

          {/* Giữa thẻ: Con chip kim loại bạc chạm khắc */}
          <div className="relative z-10 my-auto">
            <div className="w-12 h-9 rounded-lg bg-gradient-to-br from-[#f8fafc] via-[#d8dde6] to-[#b8c0cc] border border-white/90 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_2px_4px_rgba(15,23,42,0.08)] grid grid-cols-3 grid-rows-3 gap-[1px] p-1.5 opacity-90">
              <div className="border-r border-b border-slate-400/40" />
              <div className="border-b border-slate-400/40" />
              <div className="border-l border-b border-slate-400/40" />
              <div className="border-r border-slate-400/40" />
              <div />
              <div className="border-l border-slate-400/40" />
              <div className="border-r border-t border-slate-400/40" />
              <div className="border-t border-slate-400/40" />
              <div className="border-l border-t border-slate-400/40" />
            </div>
          </div>

          {/* Đáy thẻ: Thanh kim loại mờ bên trái + 2 vòng tròn chồng nhau bên phải */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="w-24 h-3 rounded-full bg-gradient-to-r from-slate-400/55 via-slate-300/65 to-white/75 shadow-inner" />
            <div className="flex items-center -space-x-2.5 opacity-80">
              <span className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-400/70 to-slate-300/60 border border-white/70" />
              <span className="w-7 h-7 rounded-full bg-gradient-to-br from-white/80 to-slate-300/70 border border-white/80 backdrop-blur-xs" />
            </div>
          </div>
        </div>

        {/* Nửa TRƯỚC của vòng thủy tinh 3D vắt qua góc dưới-trái & trên-phải thẻ */}
        <svg
          viewBox="0 0 460 320"
          className="pointer-events-none absolute inset-0 z-20 w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id="ringFront" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(148,163,184,0.55)" />
              <stop offset="45%" stopColor="rgba(255,255,255,0.95)" />
              <stop offset="100%" stopColor="rgba(203,213,225,0.55)" />
            </linearGradient>
          </defs>
          {/* Cung trước ôm qua mặt thẻ tạo hiệu ứng vòng kính xuyên không gian 3D */}
          <path
            d="M 92 248 A 168 96 -32 0 0 384 78"
            fill="none"
            stroke="url(#ringFront)"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.82"
          />
          <path
            d="M 92 248 A 168 96 -32 0 0 384 78"
            fill="none"
            stroke="rgba(255,255,255,0.95)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* 2. Thẻ So Sánh 4 Mô Hình Tối Giản (giống hệt góc dưới phải ảnh mẫu) */}
      <div className="glass-panel w-full rounded-[26px] px-7 py-6">
        {error ? (
          <p className="text-xs text-rose-700 bg-rose-50/90 border border-rose-200 rounded-xl p-3">
            {error}
          </p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            {loading ? "Đang tính xác suất 4 mô hình..." : "Bấm Phân Tích Hồ Sơ để xem tỷ lệ duyệt của 4 thuật toán."}
          </p>
        ) : (
          <div className="space-y-4">
            {rows.map((r) => (
              <div
                key={r.key}
                className="grid grid-cols-12 items-center gap-3 text-[15px]"
              >
                <span className="col-span-5 font-medium text-slate-900 truncate">
                  {r.label}
                </span>

                {/* Thanh tiến trình chuyển sắc Xám than -> Xanh bạc hà giống hệt ảnh mẫu */}
                <div className="col-span-5 h-2.5 rounded-full bg-slate-200/90 overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(6, r.pct)}%`,
                      background: r.approved
                        ? "linear-gradient(90deg, #334155 0%, #475569 45%, #86efac 100%)"
                        : "linear-gradient(90deg, #334155 0%, #94a3b8 100%)",
                    }}
                  />
                </div>

                <span className="col-span-2 text-right font-medium text-slate-700 tabular-nums text-sm">
                  {r.pct.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
