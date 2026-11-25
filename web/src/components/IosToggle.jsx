export default function IosToggle({ checked, onChange, label }) {
  return (
    <label className="inline-flex items-center gap-3.5 cursor-pointer select-none">
      {/* Nút gạt nằm bên trái chữ giống hệt ảnh mẫu */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-[52px] h-[30px] rounded-full transition-colors duration-200 shrink-0 cursor-pointer shadow-inner ${
          checked ? "bg-[#34C759]" : "bg-slate-300"
        }`}
      >
        <span
          className={`block w-[24px] h-[24px] bg-white rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.22)] transform transition-transform duration-200 ${
            checked ? "translate-x-[25px]" : "translate-x-[3px]"
          }`}
        />
      </button>

      <span className="text-[15px] font-medium text-slate-800">{label}</span>
    </label>
  );
}
