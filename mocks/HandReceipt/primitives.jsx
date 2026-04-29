// Shared design tokens + primitives for HandReceipt
// Khaki / paper field-utility aesthetic

const HR_TOKENS_LIGHT = {
  bg:        "#f5f3ec",   // paper khaki
  surface:   "#fbfaf4",   // raised
  surface2:  "#efece2",   // sunken
  ink:       "#1a1a17",
  ink2:      "#3b3a32",
  ink3:      "#6b6a62",
  ink4:      "#9b9a90",
  rule:      "#d9d5c7",
  rule2:     "#e8e4d6",
  accent:    "#3a4a2a",   // deep olive
  accentInk: "#fbfaf4",
  warn:      "#a86a1a",   // amber
  danger:    "#9a2a1f",   // brick red
  ok:        "#3a5a3a",
};

const HR_TOKENS_DARK = {
  bg:        "#13140f",
  surface:   "#1b1d16",
  surface2:  "#0d0e0a",
  ink:       "#ecebde",
  ink2:      "#c9c7b6",
  ink3:      "#928f7e",
  ink4:      "#6b6859",
  rule:      "#2c2e25",
  rule2:     "#23251c",
  accent:    "#a3b58b",   // muted olive light
  accentInk: "#13140f",
  warn:      "#d4a060",
  danger:    "#d97a6a",
  ok:        "#9bb89b",
};

const HR_FONT_SANS = `"Inter Tight", "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif`;
const HR_FONT_MONO = `"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace`;

// Inject font import once
if (typeof document !== "undefined" && !document.getElementById("hr-fonts")) {
  const link = document.createElement("link");
  link.id = "hr-fonts";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";
  document.head.appendChild(link);
}

if (typeof document !== "undefined" && !document.getElementById("hr-base-css")) {
  const s = document.createElement("style");
  s.id = "hr-base-css";
  s.textContent = `
    .hr-root *, .hr-root *::before, .hr-root *::after { box-sizing: border-box; }
    .hr-root { font-family: ${HR_FONT_SANS}; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
    .hr-mono { font-family: ${HR_FONT_MONO}; font-feature-settings: "tnum" 1; letter-spacing: -0.01em; }
    .hr-tnum { font-feature-settings: "tnum" 1; font-variant-numeric: tabular-nums; }
    .hr-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
    .hr-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 3px; }
    .hr-btn-press:active { transform: translateY(0.5px); }
    .hr-touch { -webkit-tap-highlight-color: transparent; }
  `;
  document.head.appendChild(s);
}

// ─── Status helpers ────────────────────────────────────────────────────
function statusMeta(status, T) {
  switch (status) {
    case "in_storage":  return { label: "In storage",   dot: T.ink3,   bg: T.surface2, ink: T.ink2 };
    case "signed_out":  return { label: "Signed out",   dot: T.warn,   bg: T.surface2, ink: T.ink2 };
    case "in_use":      return { label: "In use",       dot: T.ok,     bg: T.surface2, ink: T.ink2 };
    case "missing":     return { label: "Missing",      dot: T.danger, bg: T.surface2, ink: T.danger };
    case "maintenance": return { label: "Maintenance",  dot: T.warn,   bg: T.surface2, ink: T.ink2 };
    default:            return { label: status,         dot: T.ink3,   bg: T.surface2, ink: T.ink2 };
  }
}

function fmtUSD(n) {
  return "$" + n.toLocaleString("en-US");
}

function daysFromToday(iso) {
  const today = new Date("2026-04-27T00:00:00");
  const d = new Date(iso + "T00:00:00");
  const ms = d - today;
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function dueLabel(iso) {
  const d = daysFromToday(iso);
  if (d < 0) return `${Math.abs(d)}d overdue`;
  if (d === 0) return `Due today`;
  if (d === 1) return `Due tomorrow`;
  if (d < 7) return `Due in ${d}d`;
  return `Due ${iso.slice(5)}`;
}

function reqIcon(kind) {
  // Tiny monogram, not emoji
  switch (kind) {
    case "sensitive": return "SI";
    case "service":   return "SV";
    case "pmcs":      return "PM";
    case "calibration": return "CA";
    default: return "··";
  }
}

// ─── Primitive components ──────────────────────────────────────────────

function StatusDot({ color, size = 7 }) {
  return (
    <span style={{
      display: "inline-block",
      width: size, height: size, borderRadius: "50%",
      background: color, flex: "0 0 auto",
    }} />
  );
}

function Tag({ children, T, tone = "default", style }) {
  const tones = {
    default: { bg: T.surface2,  ink: T.ink2,    bd: T.rule },
    olive:   { bg: T.accent,    ink: T.accentInk, bd: T.accent },
    warn:    { bg: "transparent", ink: T.warn,   bd: T.warn },
    danger:  { bg: "transparent", ink: T.danger, bd: T.danger },
    ghost:   { bg: "transparent", ink: T.ink3,   bd: T.rule },
  };
  const t = tones[tone] || tones.default;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      height: 18, padding: "0 6px",
      fontSize: 10.5, fontWeight: 600, letterSpacing: "0.02em",
      textTransform: "uppercase",
      background: t.bg, color: t.ink,
      border: `1px solid ${t.bd}`,
      borderRadius: 3,
      ...style,
    }}>{children}</span>
  );
}

function Btn({ children, T, kind = "default", size = "md", icon, onClick, style, fullWidth }) {
  const kinds = {
    default: { bg: T.surface, ink: T.ink, bd: T.rule, hover: T.surface2 },
    primary: { bg: T.accent, ink: T.accentInk, bd: T.accent, hover: T.accent },
    ghost:   { bg: "transparent", ink: T.ink2, bd: "transparent", hover: T.surface2 },
    danger:  { bg: "transparent", ink: T.danger, bd: T.danger, hover: T.surface2 },
  };
  const k = kinds[kind] || kinds.default;
  const sizes = {
    sm: { h: 28, px: 10, fs: 12 },
    md: { h: 36, px: 14, fs: 13 },
    lg: { h: 44, px: 18, fs: 14 },
  };
  const sz = sizes[size];
  return (
    <button
      onClick={onClick}
      className="hr-btn-press hr-touch"
      style={{
        height: sz.h, padding: `0 ${sz.px}px`,
        background: k.bg, color: k.ink, border: `1px solid ${k.bd}`,
        fontSize: sz.fs, fontWeight: 600, letterSpacing: "-0.005em",
        fontFamily: HR_FONT_SANS,
        borderRadius: 4, cursor: "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        width: fullWidth ? "100%" : undefined,
        transition: "background .12s",
        ...style,
      }}
    >
      {icon && <span style={{ display: "inline-flex" }}>{icon}</span>}
      {children}
    </button>
  );
}

// Simple line icons (24px viewBox, currentColor)
const Icon = {
  search: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
    </svg>
  ),
  plus: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
  ),
  check: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m4 12 5 5 11-12"/></svg>
  ),
  chev: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"/></svg>
  ),
  back: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
  ),
  upload: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v12M6 10l6-6 6 6M4 20h16"/></svg>
  ),
  doc: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 13h6M9 17h6"/></svg>
  ),
  pkg: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/></svg>
  ),
  grid: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
  ),
  more: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/></svg>
  ),
  bell: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2H4.5z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>
  ),
  filter: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h18l-7 9v6l-4-2v-4z"/></svg>
  ),
  qr: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3M14 18h7M21 14v7M17 18v3"/></svg>
  ),
  loc: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s7-7 7-13a7 7 0 1 0-14 0c0 6 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></svg>
  ),
  user: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>
  ),
  menu: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
  ),
  x: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 5l14 14M19 5L5 19"/></svg>
  ),
  camera: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h4l2-3h6l2 3h4v12H3z"/><circle cx="12" cy="13" r="4"/></svg>
  ),
  history: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></svg>
  ),
};

Object.assign(window, {
  HR_TOKENS_LIGHT, HR_TOKENS_DARK, HR_FONT_SANS, HR_FONT_MONO,
  statusMeta, fmtUSD, daysFromToday, dueLabel, reqIcon,
  StatusDot, Tag, Btn, Icon,
});
