import { useState, useEffect, useRef } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  { code: "MER-MKT", label: "Market Study", sections: [1,2,3,5,8], desc: "Market entry & demand analysis" },
  { code: "MER-HBU", label: "HBU Advisory", sections: [1,2,3,5,7,8], desc: "Highest & best use determination" },
  { code: "MER-DEV", label: "Development Feasibility", sections: [1,2,3,4,5,6,7,8], desc: "Full feasibility opinion" },
  { code: "MER-INV", label: "Investment Advisory", sections: [1,2,4,5,6,8], desc: "Investment decision memo" },
  { code: "MER-POS", label: "Asset Repositioning", sections: [1,2,3,5,7,8], desc: "Repositioning strategy" },
  { code: "MER-PORT", label: "Portfolio Advisory", sections: [1,2,4,5,6,8], desc: "Multi-asset portfolio review" },
  { code: "MER-SITE", label: "Site Selection", sections: [1,2,3,5,8], desc: "Site suitability & selection" },
];

const ALL_SECTIONS = [
  { num: 1, name: "Engagement Header", required: true },
  { num: 2, name: "Executive Summary", required: true },
  { num: 3, name: "Market Analysis", required: false },
  { num: 4, name: "Financial Analysis", required: false },
  { num: 5, name: "Findings & Recommendation", required: true },
  { num: 6, name: "Implementation Roadmap", required: false },
  { num: 7, name: "Highest & Best Use", required: false },
  { num: 8, name: "Disclaimers & Sign-Off", required: true },
];

const GUARDRAILS = [
  { code: "G-SCOPE-01", domain: "Scope", severity: "Critical", waivable: false, label: "No certified value language", desc: "Report must not be mistaken for a RICS Red Book or USPAP certified valuation." },
  { code: "G-SCOPE-02", domain: "Scope", severity: "High", waivable: "MD", label: "Scope creep check", desc: "Report scope must match signed Terms of Engagement." },
  { code: "G-SCOPE-03", domain: "Scope", severity: "High", waivable: false, label: "Specialist asset flag", desc: "Data centres, hospitals, heritage buildings require named specialist." },
  { code: "G-EVID-01", domain: "Evidence", severity: "Critical", waivable: false, label: "All claims sourced", desc: "Every quantitative claim attributed to named Tier 1/2 source with date." },
  { code: "G-EVID-02", domain: "Evidence", severity: "High", waivable: "LC", label: "Comparable minimums met", desc: "Residential ≥5, Commercial ≥4, Industrial ≥4, Land ≥3 comparables." },
  { code: "G-EVID-03", domain: "Evidence", severity: "Critical", waivable: false, label: "Forward-looking statements labelled", desc: "All projections carry FLS language with base date and horizon." },
  { code: "G-EVID-04", domain: "Evidence", severity: "High", waivable: false, label: "Site visit documented", desc: "HBU/Roadmap sections require site visit log or desktop-only caveat." },
  { code: "G-EVID-05", domain: "Evidence", severity: "Medium", waivable: "disclosure", label: "Data currency ≤6 months", desc: "Market rents, vacancy, transactions: max 6 months old." },
  { code: "G-AI-01", domain: "AI Use", severity: "Critical", waivable: false, label: "AI disclosure block present", desc: "Section 8 must contain the standard AI disclosure statement." },
  { code: "G-AI-02", domain: "AI Use", severity: "Critical", waivable: false, label: "AI limitation zones reviewed", desc: "Zoning, HBU legal, site condition, political risk reviewed by human." },
  { code: "G-AI-03", domain: "AI Use", severity: "High", waivable: false, label: "No black-box outputs", desc: "Consultant must explain all AI-generated numbers before including them." },
  { code: "G-AI-04", domain: "AI Use", severity: "Medium", waivable: "disclosure", label: "Historical bias alert", desc: "AI training data period reviewed for geographic/asset-class gaps." },
  { code: "G-AI-05", domain: "AI Use", severity: "Critical", waivable: false, label: "No standalone AI value opinion", desc: "Any indicative value must be reviewed and signed off by consultant." },
  { code: "G-DISC-01", domain: "Disclosure", severity: "Critical", waivable: false, label: "Conflict of interest disclosed", desc: "Explicit COI statement required; Meridian interests in subject property." },
  { code: "G-DISC-02", domain: "Disclosure", severity: "High", waivable: "LC", label: "Reliance limitation stated", desc: "Named reliance parties; third-party reliance requires written consent." },
  { code: "G-DISC-03", domain: "Disclosure", severity: "High", waivable: false, label: "Malaysia regulatory compliance", desc: "Act 242, BOVEAP, NLC 1965, JPPH data terms noted where applicable." },
  { code: "G-DISC-04", domain: "Disclosure", severity: "Medium", waivable: false, label: "ESG & climate risk noted", desc: "Flood hazard, GBI/LEED status, green financing eligibility from 2025." },
  { code: "G-PROC-01", domain: "Process", severity: "Critical", waivable: false, label: "Dual sign-off (different persons)", desc: "Lead Consultant and Reviewing Advisor must be two distinct individuals." },
  { code: "G-PROC-02", domain: "Process", severity: "Medium", waivable: false, label: "Version control", desc: "Drafts watermarked DRAFT; finals marked FINAL with date." },
  { code: "G-PROC-03", domain: "Process", severity: "High", waivable: false, label: "7-year retention", desc: "Report + workings + AI prompts/outputs retained in DMS for 7 years." },
  { code: "G-PROC-04", domain: "Process", severity: "Medium", waivable: "LC", label: "Change order for scope changes", desc: "Material instruction changes require documented Change Order." },
  { code: "G-PROC-05", domain: "Process", severity: "High", waivable: false, label: "Escalation triggers checked", desc: "Litigation, PEP, government land, sanctions, adverse conclusions → MD." },
];

const ENGAGEMENTS = [
  { ref: "MER-DEV-2026-014", client: "Ivory Properties Sdn. Bhd.", type: "MER-DEV", property: "Lot 4892, Jalan Hang Tuah, Melaka", status: "review", lead: "Ahmad Rizal Hasan, MRICS", date: "08 Jun 2026", guardrailScore: { pass: 9, warn: 3, fail: 1 } },
  { ref: "MER-INV-2026-011", client: "Maju Capital Partners", type: "MER-INV", property: "Menara Symphony, KL Sentral", status: "draft", lead: "Nurul Ain Zakaria, MRICS", date: "02 Jun 2026", guardrailScore: { pass: 14, warn: 1, fail: 0 } },
  { ref: "MER-MKT-2026-009", client: "Sunway REIT Management", type: "MER-MKT", property: "Penang Waterfront Precinct", status: "draft", lead: "Lee Chuan Wei, MBVAP", date: "28 May 2026", guardrailScore: { pass: 11, warn: 2, fail: 0 } },
  { ref: "MER-HBU-2026-007", client: "Prasarana Malaysia Berhad", type: "MER-HBU", property: "Lot 12, Stesen Bandar Utama", status: "completed", lead: "Ahmad Rizal Hasan, MRICS", date: "15 May 2026", guardrailScore: { pass: 15, warn: 0, fail: 0 } },
];

const RISK_ROWS = [
  { risk: "Heritage rezoning delay", l: 3, i: 4, mitigation: "Pre-engage JKKN; heritage consultant retained" },
  { risk: "Construction cost overrun (>10%)", l: 3, i: 3, mitigation: "Fixed-price D&B contract; 12% contingency" },
  { risk: "Retail take-up below absorption", l: 2, i: 4, mitigation: "Reduce retail GFA; convert to co-working" },
  { risk: "Interest rate increase >100bps", l: 2, i: 3, mitigation: "Rate cap instrument; 70% fixed financing" },
  { risk: "Soil contamination (pre-1990 use)", l: 1, i: 5, mitigation: "Phase I ESA commissioned; Phase II if required" },
];

// ─── UTILITY ─────────────────────────────────────────────────────────────────

const riskScore = (l, i) => l * i;
const riskColor = (score) => {
  if (score >= 10) return { bg: "#fde8e8", color: "#991b1b" };
  if (score >= 6)  return { bg: "#fef3c7", color: "#92400e" };
  return { bg: "#d1fae5", color: "#065f46" };
};

function generateRef(typeCode) {
  const yr = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 900) + 100).padStart(3, "0");
  return `${typeCode}-${yr}-${seq}`;
}

function useCountUp(target, duration = 1000) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf, start;
    const tick = (t) => {
      if (start === undefined) start = t;
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function TopNav({ activeUser = "YA" }) {
  return (
    <header style={{
      background: "linear-gradient(180deg, #15120d 0%, #0a0908 100%)",
      height: 52,
      display: "flex",
      alignItems: "center",
      padding: "0 24px",
      gap: 16,
      borderBottom: "1px solid rgba(184,150,46,0.28)",
      boxShadow: "0 1px 0 rgba(184,150,46,0.12), 0 4px 18px rgba(0,0,0,0.16)",
      flexShrink: 0,
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 28, height: 28,
          border: "1.5px solid #B8962E",
          display: "flex", alignItems: "center", justifyContent: "center",
          transform: "rotate(45deg)",
        }}>
          <div style={{ width: 10, height: 10, background: "#B8962E" }} />
        </div>
        <div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 600, color: "#E8E0D0", letterSpacing: "0.06em" }}>Meridian</div>
          <div style={{ fontSize: 9, color: "#B8962E", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: -1 }}>RE Advisory Platform</div>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{
        background: "rgba(184,150,46,0.1)",
        border: "1px solid rgba(184,150,46,0.25)",
        color: "#D4B96A",
        fontSize: 11,
        padding: "3px 12px",
        borderRadius: 20,
        letterSpacing: "0.06em",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
        MAS-GUARD-001 · Active
      </div>
      <div className="mer-avatar" style={{
        width: 32, height: 32, borderRadius: "50%",
        background: "rgba(184,150,46,0.15)",
        border: "1px solid #B8962E",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 600, color: "#B8962E",
        marginLeft: 8, cursor: "pointer",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {activeUser}
      </div>
    </header>
  );
}

function Sidebar({ active, onNav }) {
  const navItems = [
    { id: "dashboard",   icon: "⬡", label: "Dashboard" },
    { id: "builder",     icon: "◈", label: "Report Builder" },
    { id: "engagements", icon: "◉", label: "Engagements", badge: 4 },
    { id: "guardrails",  icon: "◆", label: "Guardrail Library", badge: 22 },
    { id: "skill",       icon: "◎", label: "Skill Config" },
  ];
  const dividerItems = [
    { id: "datasources", icon: "◫", label: "Data Sources" },
    { id: "team",        icon: "○", label: "Team" },
  ];

  const Item = ({ item }) => {
    const isActive = active === item.id;
    return (
      <div
        onClick={() => onNav(item.id)}
        className="mer-navitem"
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 12px",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 13,
          color: isActive ? "#92701A" : "#6b7280",
          background: isActive ? "rgba(184,150,46,0.08)" : "transparent",
          borderLeft: isActive ? "2px solid #B8962E" : "2px solid transparent",
          marginBottom: 2,
          transition: "all 0.15s",
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: isActive ? 500 : 400,
        }}
      >
        <span style={{ fontSize: 12, width: 16, textAlign: "center", opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
        <span style={{ flex: 1 }}>{item.label}</span>
        {item.badge && (
          <span style={{
            fontSize: 10, padding: "1px 7px",
            borderRadius: 10, background: "#f3f4f6",
            color: "#6b7280", border: "0.5px solid #e5e7eb",
          }}>{item.badge}</span>
        )}
      </div>
    );
  };

  return (
    <nav style={{
      width: 220,
      background: "#fff",
      borderRight: "0.5px solid #e5e7eb",
      display: "flex", flexDirection: "column",
      flexShrink: 0, overflowY: "auto",
      padding: "16px 12px",
    }}>
      <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9ca3af", fontWeight: 500, marginBottom: 8, padding: "0 4px", fontFamily: "'DM Sans', sans-serif" }}>Workspace</div>
      {navItems.map(i => <Item key={i.id} item={i} />)}
      <div style={{ height: 0.5, background: "#e5e7eb", margin: "12px 4px" }} />
      <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9ca3af", fontWeight: 500, marginBottom: 8, padding: "0 4px", fontFamily: "'DM Sans', sans-serif" }}>Admin</div>
      {dividerItems.map(i => <Item key={i.id} item={i} />)}
      <div style={{ flex: 1 }} />
      <div style={{
        padding: "10px 12px", borderRadius: 8,
        background: "rgba(184,150,46,0.06)",
        border: "0.5px solid rgba(184,150,46,0.2)",
        marginTop: 16,
      }}>
        <div style={{ fontSize: 11, color: "#B8962E", fontWeight: 500, marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>v1.0 · MAS-GUARD-001</div>
        <div style={{ fontSize: 11, color: "#9ca3af", fontFamily: "'DM Sans', sans-serif" }}>22 guardrails active · Malaysia jurisdiction</div>
      </div>
    </nav>
  );
}

function Card({ children, style = {}, interactive = false, className = "" }) {
  return (
    <div className={`mer-card${interactive ? " mer-interactive" : ""}${className ? " " + className : ""}`} style={{
      background: "#fff",
      border: "0.5px solid #e5e7eb",
      borderRadius: 12,
      overflow: "hidden",
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle, action, icon }) {
  return (
    <div style={{
      padding: "14px 20px",
      borderBottom: "0.5px solid #f3f4f6",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {icon && <span style={{ fontSize: 15, color: "#B8962E" }}>{icon}</span>}
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: "#111827" }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1, fontFamily: "'DM Sans', sans-serif" }}>{subtitle}</div>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function Badge({ text, variant = "neutral" }) {
  const variants = {
    neutral:  { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" },
    gold:     { bg: "rgba(184,150,46,0.1)", color: "#92701A", border: "rgba(184,150,46,0.3)" },
    success:  { bg: "#d1fae5", color: "#065f46", border: "#a7f3d0" },
    warn:     { bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
    danger:   { bg: "#fde8e8", color: "#991b1b", border: "#fca5a5" },
    info:     { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" },
  };
  const v = variants[variant] || variants.neutral;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      fontSize: 10, fontWeight: 500,
      padding: "2px 9px", borderRadius: 20,
      background: v.bg, color: v.color,
      border: `0.5px solid ${v.border}`,
      letterSpacing: "0.04em",
      fontFamily: "'DM Sans', sans-serif",
    }}>{text}</span>
  );
}

function StatusDot({ status }) {
  const map = {
    draft:     { color: "#f59e0b", label: "Draft" },
    review:    { color: "#3b82f6", label: "In Review" },
    completed: { color: "#10b981", label: "Completed" },
  };
  const s = map[status] || map.draft;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: s.color, fontFamily: "'DM Sans', sans-serif" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, display: "inline-block" }} />
      {s.label}
    </span>
  );
}

function Btn({ children, onClick, variant = "default", style = {}, disabled = false }) {
  const variants = {
    default: { bg: "#fff", color: "#374151", border: "#d1d5db", hoverBg: "#f9fafb" },
    gold:    { bg: "#B8962E", color: "#fff",    border: "#B8962E", hoverBg: "#9E7F28" },
    ghost:   { bg: "transparent", color: "#6b7280", border: "transparent", hoverBg: "#f9fafb" },
    danger:  { bg: "#fff", color: "#dc2626", border: "#fca5a5", hoverBg: "#fef2f2" },
  };
  const v = variants[variant];
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "7px 14px", borderRadius: 8,
        fontSize: 13, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer",
        border: `0.5px solid ${v.border}`,
        background: hovered && !disabled ? v.hoverBg : v.bg,
        color: disabled ? "#9ca3af" : v.color,
        fontFamily: "'DM Sans', sans-serif",
        transition: "all 0.12s",
        outline: "none",
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function FormField({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 5, fontFamily: "'DM Sans', sans-serif" }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3, fontFamily: "'DM Sans', sans-serif" }}>{hint}</div>}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  border: "0.5px solid #d1d5db",
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "'DM Sans', sans-serif",
  color: "#111827",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};

function Input({ value, onChange, placeholder, type = "text", readOnly }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange && onChange(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{ ...inputStyle, borderColor: focused ? "#B8962E" : "#d1d5db", cursor: readOnly ? "default" : "text" }}
    />
  );
}

function Select({ value, onChange, options, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{ ...inputStyle, borderColor: focused ? "#B8962E" : "#d1d5db", cursor: "pointer" }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{ ...inputStyle, resize: "vertical", borderColor: focused ? "#B8962E" : "#d1d5db", minHeight: 80, lineHeight: 1.6 }}
    />
  );
}

// ─── VIEWS ────────────────────────────────────────────────────────────────────

function StatCard({ s, index }) {
  const value = useCountUp(s.value, 1100);
  return (
    <div className="mer-card mer-stat" style={{
      background: "#fff",
      border: "0.5px solid #e5e7eb",
      borderRadius: 12,
      overflow: "hidden",
      padding: "16px 18px",
      animationDelay: `${index * 80}ms`,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: "#6b7280", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{s.label}</div>
        <span style={{
          width: 30, height: 30, borderRadius: 8,
          background: "rgba(184,150,46,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, color: "#B8962E", flexShrink: 0,
        }}>{s.icon}</span>
      </div>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, fontWeight: 500, color: "#111827", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6, fontFamily: "'DM Sans', sans-serif" }}>{s.sub}</div>
    </div>
  );
}

function DashboardView({ onNav }) {
  const stats = [
    { label: "Active Engagements", value: 4, sub: "2 in draft · 1 in review", icon: "◈" },
    { label: "Guardrails Checked", value: 284, sub: "This month", icon: "◆" },
    { label: "Reports Completed", value: 17, sub: "YTD 2026", icon: "✓" },
    { label: "AI Flags Raised", value: 12, sub: "Human review required", icon: "⚑" },
  ];

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 500, color: "#111827", margin: 0 }}>Good morning, Ahmad</h1>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>Tuesday, 9 June 2026 · Meridian RE Advisory Platform</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {stats.map((s, i) => <StatCard key={i} s={s} index={i} />)}
      </div>

      {/* Recent Engagements */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
        <Card>
          <CardHeader title="Recent engagements" icon="◈" action={<Btn onClick={() => onNav("builder")}>New Report +</Btn>} />
          <div>
            {ENGAGEMENTS.map((e, i) => (
              <div key={i} className="mer-row" style={{
                padding: "14px 20px",
                borderBottom: i < ENGAGEMENTS.length - 1 ? "0.5px solid #f3f4f6" : "none",
                display: "flex", alignItems: "center", gap: 16,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: "rgba(184,150,46,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, color: "#B8962E", fontWeight: 600,
                  flexShrink: 0, fontFamily: "'DM Sans', sans-serif",
                }}>
                  {e.type.split("-")[1]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#111827", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.client}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1, fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.property}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <StatusDot status={e.status} />
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 3, fontFamily: "'DM Sans', sans-serif" }}>{e.ref}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <CardHeader title="Guardrail summary" icon="◆" />
            <div style={{ padding: "16px 20px" }}>
              {[["Pass", 9, "#10b981"], ["Warning", 3, "#f59e0b"], ["Fail", 1, "#ef4444"]].map(([label, count, color]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <div style={{ fontSize: 13, color: "#374151", flex: 1, fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
                  <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 500, color: "#111827" }}>{count}</div>
                </div>
              ))}
              <div style={{ height: 6, borderRadius: 3, background: "#f3f4f6", overflow: "hidden", marginTop: 12, display: "flex" }}>
                <div style={{ height: "100%", background: "#10b981", width: `${(9/13)*100}%`, transition: "width 0.6s" }} />
                <div style={{ height: "100%", background: "#f59e0b", width: `${(3/13)*100}%`, transition: "width 0.6s" }} />
                <div style={{ height: "100%", background: "#ef4444", width: `${(1/13)*100}%`, transition: "width 0.6s" }} />
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8, fontFamily: "'DM Sans', sans-serif" }}>MER-DEV-2026-014 · Last check 08 Jun 2026</div>
            </div>
          </Card>

          <Card style={{ background: "rgba(184,150,46,0.03)", border: "0.5px solid rgba(184,150,46,0.2)" }}>
            <div style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: 11, color: "#B8962E", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>AI Role Boundary</div>
              {["Zoning & regulatory interpretation", "Physical site condition", "HBU legal permissibility (S7.1)", "Stakeholder / political risk"].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 12, color: "#6b7280", fontFamily: "'DM Sans', sans-serif" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
                  {item}
                </div>
              ))}
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>These zones require human consultant review before report release. G-AI-02 enforced.</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function BuilderView() {
  const [activeTab, setActiveTab] = useState("configure");
  const [form, setForm] = useState({
    client: "", type: "", ref: "", property: "",
    lead: "", reviewer: "", purpose: "", context: "", special: "",
  });
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genStep, setGenStep] = useState("");
  const [generated, setGenerated] = useState(false);

  const selectedType = REPORT_TYPES.find(t => t.code === form.type);

  const updateForm = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleTypeChange = (val) => {
    updateForm("type", val);
    updateForm("ref", val ? generateRef(val) : "");
  };

  const GUARD_STATUS = (() => {
    const filled = form.client && form.type && form.lead && form.reviewer;
    const dualOk = form.lead && form.reviewer && form.lead.toLowerCase() !== form.reviewer.toLowerCase();
    if (!filled) return "incomplete";
    if (!dualOk) return "error";
    return "ready";
  })();

  const GEN_STEPS = [
    "Validating engagement header…",
    "Running guardrail pre-checks…",
    "Aggregating market data (JPPH, CBRE)…",
    "Populating comparable transaction set…",
    "Building financial model…",
    "Running scenario analysis (Bear/Base/Bull)…",
    "Drafting narrative sections…",
    "Applying AI limitation flags…",
    "Embedding disclaimer block (G-AI-01)…",
    "Finalising report structure…",
  ];

  const handleGenerate = () => {
    if (GUARD_STATUS !== "ready") return;
    setGenerating(true);
    setGenProgress(0);
    let step = 0;
    const iv = setInterval(() => {
      step++;
      const pct = Math.min(step * 10, 100);
      setGenProgress(pct);
      setGenStep(GEN_STEPS[step - 1] || "Complete!");
      if (pct >= 100) {
        clearInterval(iv);
        setTimeout(() => {
          setGenerating(false);
          setGenerated(true);
          setActiveTab("preview");
        }, 500);
      }
    }, 400);
  };

  const activeSections = selectedType ? ALL_SECTIONS.filter(s => selectedType.sections.includes(s.num)) : ALL_SECTIONS;

  const tabs = ["configure", "preview", "guardrails"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Page Header */}
      <div style={{ background: "#fff", borderBottom: "0.5px solid #e5e7eb", padding: "20px 32px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 500, color: "#111827", margin: 0 }}>Report Builder</h2>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 3, fontFamily: "'DM Sans', sans-serif", margin: "4px 0 0" }}>Create structured consultancy reports with embedded MAS-GUARD-001 compliance</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={() => {}}>↓ Export Draft</Btn>
            <Btn variant="gold" onClick={handleGenerate} disabled={GUARD_STATUS !== "ready" || generating}>
              {generating ? `${genProgress}%  Generating…` : "Generate Report ↗"}
            </Btn>
          </div>
        </div>
        <div style={{ display: "flex", gap: 0 }}>
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                padding: "10px 18px", fontSize: 13,
                cursor: "pointer",
                color: activeTab === t ? "#92701A" : "#6b7280",
                fontWeight: activeTab === t ? 500 : 400,
                borderBottom: activeTab === t ? "2px solid #B8962E" : "2px solid transparent",
                background: "none", border: "none",
                fontFamily: "'DM Sans', sans-serif",
                transition: "color 0.12s",
                textTransform: "capitalize",
              }}
            >{t}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* CONFIGURE TAB */}
        {activeTab === "configure" && (
          <div style={{ padding: "24px 32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>

              {/* Left column */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Card>
                  <CardHeader title="Engagement details" icon="◈" />
                  <div style={{ padding: "20px" }}>
                    <FormField label="Client name">
                      <Input value={form.client} onChange={v => updateForm("client", v)} placeholder="e.g. Ivory Properties Sdn. Bhd." />
                    </FormField>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <FormField label="Report type">
                        <Select
                          value={form.type}
                          onChange={handleTypeChange}
                          placeholder="Select type…"
                          options={REPORT_TYPES.map(t => ({ value: t.code, label: `${t.code} — ${t.label}` }))}
                        />
                      </FormField>
                      <FormField label="Engagement ref" hint="Auto-generated on type select">
                        <Input value={form.ref} onChange={v => updateForm("ref", v)} placeholder="Auto-generated" readOnly={!!form.type} />
                      </FormField>
                    </div>
                    <FormField label="Property / subject asset">
                      <Input value={form.property} onChange={v => updateForm("property", v)} placeholder="e.g. Lot 4892, Jalan Hang Tuah, 75300 Melaka" />
                    </FormField>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <FormField label="Lead consultant" hint="MRICS, MBVAP, MAI credential required">
                        <Input value={form.lead} onChange={v => updateForm("lead", v)} placeholder="Name, MRICS / MBVAP" />
                      </FormField>
                      <FormField label="Reviewing advisor" hint="Must differ from Lead — G-PROC-01">
                        <Input value={form.reviewer} onChange={v => updateForm("reviewer", v)} placeholder="Different person required" />
                      </FormField>
                    </div>
                    {form.lead && form.reviewer && form.lead.toLowerCase() === form.reviewer.toLowerCase() && (
                      <div style={{ padding: "10px 14px", background: "#fef2f2", border: "0.5px solid #fca5a5", borderRadius: 8, fontSize: 12, color: "#991b1b", display: "flex", gap: 8, alignItems: "flex-start", fontFamily: "'DM Sans', sans-serif" }}>
                        ⚠ G-PROC-01 violation: Lead Consultant and Reviewing Advisor cannot be the same person.
                      </div>
                    )}
                  </div>
                </Card>

                <Card>
                  <CardHeader title="Scope & instructions" icon="◎" />
                  <div style={{ padding: "20px" }}>
                    <FormField label="Engagement purpose">
                      <Textarea value={form.purpose} onChange={v => updateForm("purpose", v)} placeholder="Describe what the client needs this report for — investment decision, board approval, lender submission, planning application…" rows={3} />
                    </FormField>
                    <FormField label="Key market context & data points" hint="Paste verified data here — AI will use these as primary inputs, not substitute them">
                      <Textarea value={form.context} onChange={v => updateForm("context", v)} placeholder="Market rents, absorption rates, comparable transactions, site details, financial parameters…" rows={4} />
                    </FormField>
                    <FormField label="Special instructions">
                      <Textarea value={form.special} onChange={v => updateForm("special", v)} placeholder="e.g. Exclude retail from scope; client existing loan at 4.5% p.a.; focus on tourism-driven demand…" rows={2} />
                    </FormField>
                  </div>
                </Card>

                <Card>
                  <CardHeader title="Sections to include" subtitle={selectedType ? `${selectedType.code} — ${selectedType.label}` : "Select report type above"} icon="▤" />
                  <div style={{ padding: "16px 20px" }}>
                    {activeSections.map((s) => (
                      <div key={s.num} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "8px 10px", borderRadius: 8, marginBottom: 4,
                        background: "rgba(184,150,46,0.04)",
                        border: "0.5px solid rgba(184,150,46,0.15)",
                      }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: "50%",
                          background: "#B8962E", color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 600, flexShrink: 0,
                          fontFamily: "'DM Sans', sans-serif",
                        }}>{s.num}</div>
                        <span style={{ flex: 1, fontSize: 13, color: "#374151", fontFamily: "'DM Sans', sans-serif" }}>{s.name}</span>
                        <Badge text={s.required ? "required" : "conditional"} variant={s.required ? "gold" : "neutral"} />
                      </div>
                    ))}
                    {!selectedType && <p style={{ fontSize: 13, color: "#9ca3af", fontFamily: "'DM Sans', sans-serif" }}>All sections shown — select a report type to filter.</p>}
                  </div>
                </Card>
              </div>

              {/* Right sidebar */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Guardrail status */}
                <Card>
                  <CardHeader title="Guardrail status" icon="◆" />
                  <div style={{ padding: "14px" }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px", borderRadius: 8,
                      marginBottom: 14,
                      background: GUARD_STATUS === "ready" ? "#d1fae5" : GUARD_STATUS === "error" ? "#fde8e8" : "#fef3c7",
                      border: `0.5px solid ${GUARD_STATUS === "ready" ? "#a7f3d0" : GUARD_STATUS === "error" ? "#fca5a5" : "#fde68a"}`,
                    }}>
                      <span style={{ fontSize: 14 }}>{GUARD_STATUS === "ready" ? "✓" : "⚠"}</span>
                      <span style={{ fontSize: 12, color: GUARD_STATUS === "ready" ? "#065f46" : GUARD_STATUS === "error" ? "#991b1b" : "#92400e", fontFamily: "'DM Sans', sans-serif" }}>
                        {GUARD_STATUS === "ready" ? "Ready to generate — critical guardrails met" : GUARD_STATUS === "error" ? "G-PROC-01: Dual sign-off violation" : "Fill required fields to validate guardrails"}
                      </span>
                    </div>
                    {[
                      { code: "G-SCOPE-01", label: "No certified value language", ok: true },
                      { code: "G-PROC-01", label: "Dual sign-off", ok: form.lead && form.reviewer && form.lead.toLowerCase() !== form.reviewer.toLowerCase() },
                      { code: "G-AI-01", label: "AI disclosure in S8", ok: !!form.type },
                      { code: "G-EVID-01", label: "All claims will be sourced", ok: !!form.context },
                      { code: "G-DISC-01", label: "COI disclosure present", ok: !!form.type },
                      { code: "G-EVID-03", label: "FLS labels applied", ok: !!form.type },
                    ].map((g, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        padding: "9px 12px", borderRadius: 8, marginBottom: 5,
                        background: "#f9fafb", border: "0.5px solid #f3f4f6",
                      }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: "50%",
                          background: g.ok ? "#d1fae5" : "#f3f4f6",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, color: g.ok ? "#065f46" : "#9ca3af",
                          flexShrink: 0,
                        }}>{g.ok ? "✓" : "·"}</div>
                        <div>
                          <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 500, letterSpacing: "0.06em", fontFamily: "'DM Sans', sans-serif" }}>{g.code}</div>
                          <div style={{ fontSize: 12, color: "#374151", fontFamily: "'DM Sans', sans-serif" }}>{g.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Generate progress */}
                {generating && (
                  <Card>
                    <div style={{ padding: "16px 18px" }}>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, color: "#111827", fontFamily: "'DM Sans', sans-serif" }}>Generating report…</div>
                      <div style={{ height: 6, background: "#f3f4f6", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
                        <div style={{ height: "100%", width: `${genProgress}%`, background: "#B8962E", borderRadius: 3, transition: "width 0.4s" }} />
                      </div>
                      <div style={{ fontSize: 11, color: "#9ca3af", fontFamily: "'DM Sans', sans-serif" }}>{genStep}</div>
                    </div>
                  </Card>
                )}

                {/* AI boundary card */}
                <Card style={{ border: "0.5px solid rgba(184,150,46,0.2)", background: "rgba(184,150,46,0.02)" }}>
                  <CardHeader title="AI role boundaries" icon="⚑" />
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>Human review mandatory before release (G-AI-02):</div>
                    {["Zoning & regulatory interpretation", "Physical site condition assessment", "HBU legal permissibility (S7.1)", "Stakeholder / political risk", "Risk Register final scoring"].map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 12, color: "#6b7280", fontFamily: "'DM Sans', sans-serif" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
                        {item}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* PREVIEW TAB */}
        {activeTab === "preview" && (
          <div style={{ padding: "24px 32px" }}>
            <div style={{ maxWidth: 780, margin: "0 auto" }}>
              <Card>
                <div style={{ padding: "28px 32px" }}>
                  {/* Report badge + ref */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                    <Badge text="MER-DEV — Development Feasibility Opinion" variant="gold" />
                    <Badge text="DRAFT — NOT FOR RELIANCE" variant="warn" />
                  </div>

                  {/* Header block */}
                  <div style={{ borderLeft: "3px solid #B8962E", paddingLeft: 20, marginBottom: 28, background: "rgba(184,150,46,0.03)", padding: "16px 20px", borderRadius: "0 10px 10px 0" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "5px 12px", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
                      {[
                        ["Client", form.client || "Ivory Properties Sdn. Bhd."],
                        ["Engagement ref", form.ref || "MER-DEV-2026-014"],
                        ["Subject", form.property || "Lot 4892, Jalan Hang Tuah, 75300 Melaka"],
                        ["Report date", "9 June 2026"],
                        ["Lead consultant", form.lead || "Ahmad Rizal Hasan, MRICS, MBVAP"],
                        ["Reviewed by", form.reviewer || "Dr. Nurul Ain Zakaria, MRICS"],
                        ["Classification", "CONFIDENTIAL — Client Use Only"],
                      ].map(([k, v]) => (
                        <>
                          <span key={k} style={{ color: "#9ca3af" }}>{k}</span>
                          <span key={v} style={{ color: "#111827", fontWeight: 500 }}>{v}</span>
                        </>
                      ))}
                    </div>
                  </div>

                  {/* S2 Executive Summary */}
                  <div style={{ borderBottom: "0.5px solid #f3f4f6", paddingBottom: 6, marginBottom: 14 }}>
                    <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 500, color: "#111827", margin: 0 }}>S2 — Executive summary</h3>
                  </div>
                  <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.75, marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>
                    This report provides a development feasibility opinion for a proposed mixed-use residential and retail development on Lot 4892, Jalan Hang Tuah, Melaka. The subject site extends approximately 2.1 acres and is currently vacant, with approved commercial and residential zoning under the Melaka Structure Plan 2035.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                    {[
                      "Residential demand in the Jonker Street corridor remains resilient at approximately 92% occupancy among completed projects within a 1km radius (JPPH Q1 2026).",
                      "Base-case IRR of 14.2% and equity multiple of 1.87× over a 4-year development horizon are within the client's stated return threshold of ≥12% IRR.",
                      "Tourism-dependent retail demand is the primary downside risk; the bear-case scenario yields IRR of 9.8%, which remains above the estimated WACC of 8.5%.",
                    ].map((f, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: "#374151", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
                        <span style={{ color: "#B8962E", marginTop: 3, flexShrink: 0, fontWeight: 700 }}>◆</span>
                        {f}
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "12px 16px", background: "rgba(184,150,46,0.06)", borderLeft: "2px solid #B8962E", borderRadius: "0 8px 8px 0", fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#111827" }}>
                    <strong style={{ color: "#92701A" }}>Primary recommendation:</strong> Proceed — <em>Conditional Go</em> subject to satisfactory Heritage Impact Assessment and lender confirmation of construction finance at ≤5.5% p.a.
                  </div>

                  {/* S4 Financial Summary */}
                  <div style={{ borderBottom: "0.5px solid #f3f4f6", paddingBottom: 6, marginBottom: 14, marginTop: 28 }}>
                    <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 500, color: "#111827", margin: 0 }}>S4 — Financial analysis (summary)</h3>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
                    {[
                      { label: "Base-case IRR", value: "14.2%", sub: "4-year horizon" },
                      { label: "Equity multiple", value: "1.87×", sub: "Base case" },
                      { label: "Total dev. cost", value: "MYR 42M", sub: "Hard + soft + finance" },
                      { label: "GDV (est.)", value: "MYR 67M", sub: "Indicative — not certified" },
                      { label: "Bear-case IRR", value: "9.8%", sub: "Tourism demand shock" },
                      { label: "Development margin", value: "23.4%", sub: "On cost basis" },
                    ].map((s, i) => (
                      <div key={i} style={{ padding: "12px 14px", background: "#f9fafb", borderRadius: 8, border: "0.5px solid #f3f4f6" }}>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>{s.label}</div>
                        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 500, color: "#111827" }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>{s.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "10px 14px", background: "#fffbeb", border: "0.5px solid #fde68a", borderRadius: 8, fontSize: 11, color: "#92400e", fontFamily: "'DM Sans', sans-serif", marginBottom: 20 }}>
                    ⚑ Forward-looking statement: The figures above are projections based on assumptions in the Key Assumptions Register (S4.5). Actual outcomes may differ materially. This is not a certified valuation (G-EVID-03, G-SCOPE-01 compliant).
                  </div>

                  {/* S5 Risk Register */}
                  <div style={{ borderBottom: "0.5px solid #f3f4f6", paddingBottom: 6, marginBottom: 14 }}>
                    <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 500, color: "#111827", margin: 0 }}>S5.2 — Risk register</h3>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 24, fontFamily: "'DM Sans', sans-serif" }}>
                    <thead>
                      <tr style={{ background: "#f9fafb" }}>
                        {["Risk", "L", "I", "Score", "Mitigation"].map(h => (
                          <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#6b7280", fontWeight: 500, borderBottom: "0.5px solid #e5e7eb", fontSize: 11, letterSpacing: "0.04em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {RISK_ROWS.map((r, i) => {
                        const score = riskScore(r.l, r.i);
                        const sc = riskColor(score);
                        return (
                          <tr key={i} style={{ borderBottom: "0.5px solid #f3f4f6" }}>
                            <td style={{ padding: "9px 12px", color: "#374151" }}>{r.risk}</td>
                            <td style={{ padding: "9px 12px" }}><span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 20, borderRadius: 4, background: "#f3f4f6", color: "#374151", fontWeight: 500, fontSize: 11 }}>{r.l}</span></td>
                            <td style={{ padding: "9px 12px" }}><span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 20, borderRadius: 4, background: "#f3f4f6", color: "#374151", fontWeight: 500, fontSize: 11 }}>{r.i}</span></td>
                            <td style={{ padding: "9px 12px" }}><span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 20, borderRadius: 4, background: sc.bg, color: sc.color, fontWeight: 600, fontSize: 11 }}>{score}</span></td>
                            <td style={{ padding: "9px 12px", color: "#6b7280", maxWidth: 220 }}>{r.mitigation}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* S8 AI Disclosure */}
                  <div style={{ borderBottom: "0.5px solid #f3f4f6", paddingBottom: 6, marginBottom: 14 }}>
                    <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 500, color: "#111827", margin: 0 }}>S8 — Disclaimer & AI disclosure</h3>
                  </div>
                  <div style={{ padding: "14px 18px", background: "rgba(184,150,46,0.04)", border: "0.5px solid rgba(184,150,46,0.2)", borderRadius: 10, marginBottom: 14 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 16, color: "#B8962E", flexShrink: 0, marginTop: 1 }}>⊕</span>
                      <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>
                        This report has been prepared by Meridian RE Advisory solely for the use of {form.client || "Ivory Properties Sdn. Bhd."} in connection with {form.ref || "MER-DEV-2026-014"}. It is provided as a <strong>consultancy opinion</strong> and does not constitute a certified valuation under RICS Red Book Global Standards (January 2025) or USPAP, nor does it constitute legal, tax, or financial advice.
                        <br /><br />
                        <strong>AI disclosure (G-AI-01):</strong> AI-assisted tools were used for data aggregation, scenario modelling, and draft narrative production. All outputs have been reviewed, validated, and accepted by the named consultant. The professional opinions expressed are those of <strong>{form.lead || "Ahmad Rizal Hasan, MRICS, MBVAP"}</strong> and not of any AI system.
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ padding: "12px 16px", background: "#f9fafb", borderRadius: 8, border: "0.5px solid #e5e7eb", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
                      <div style={{ color: "#9ca3af", marginBottom: 4 }}>Lead consultant</div>
                      <div style={{ color: "#111827", fontWeight: 500 }}>{form.lead || "Ahmad Rizal Hasan, MRICS, MBVAP"}</div>
                    </div>
                    <div style={{ padding: "12px 16px", background: "#f9fafb", borderRadius: 8, border: "0.5px solid #e5e7eb", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
                      <div style={{ color: "#9ca3af", marginBottom: 4 }}>Reviewing advisor</div>
                      <div style={{ color: "#111827", fontWeight: 500 }}>{form.reviewer || "Dr. Nurul Ain Zakaria, MRICS"}</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* GUARDRAILS TAB */}
        {activeTab === "guardrails" && (
          <div style={{ padding: "24px 32px" }}>
            <div style={{ maxWidth: 820 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: 13, color: "#6b7280", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>MAS-GUARD-001 · 22 guardrails · 5 domains · Malaysia jurisdiction</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <Badge text="9 Pass" variant="success" />
                  <Badge text="3 Warning" variant="warn" />
                  <Badge text="1 Fail" variant="danger" />
                </div>
              </div>

              {["Scope", "Evidence", "AI Use", "Disclosure", "Process"].map(domain => {
                const items = GUARDRAILS.filter(g => g.domain === domain);
                const statusMap = {
                  "G-SCOPE-01": "pass", "G-SCOPE-02": "warn", "G-SCOPE-03": "pass",
                  "G-EVID-01": "pass", "G-EVID-02": "fail", "G-EVID-03": "pass", "G-EVID-04": "warn", "G-EVID-05": "pass",
                  "G-AI-01": "pass", "G-AI-02": "pass", "G-AI-03": "pass", "G-AI-04": "pass", "G-AI-05": "pass",
                  "G-DISC-01": "pass", "G-DISC-02": "pass", "G-DISC-03": "pass", "G-DISC-04": "warn",
                  "G-PROC-01": "pass", "G-PROC-02": "pass", "G-PROC-03": "pass", "G-PROC-04": "pass", "G-PROC-05": "pass",
                };
                const statusStyle = {
                  pass:  { icon: "✓", bg: "#d1fae5", color: "#065f46", borderBg: "#f0fdf4", borderColor: "#bbf7d0" },
                  warn:  { icon: "▲", bg: "#fef3c7", color: "#92400e", borderBg: "#fffbeb", borderColor: "#fde68a" },
                  fail:  { icon: "✕", bg: "#fde8e8", color: "#991b1b", borderBg: "#fef2f2", borderColor: "#fca5a5" },
                  idle:  { icon: "·", bg: "#f3f4f6", color: "#9ca3af", borderBg: "#f9fafb", borderColor: "#e5e7eb" },
                };
                return (
                  <div key={domain} style={{ marginBottom: 24 }}>
                    <div style={{
                      fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
                      color: "#9ca3af", fontWeight: 500, marginBottom: 10,
                      paddingBottom: 8, borderBottom: "0.5px solid #e5e7eb",
                      fontFamily: "'DM Sans', sans-serif",
                    }}>Domain {["Scope","Evidence","AI Use","Disclosure","Process"].indexOf(domain) + 1} — {domain}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {items.map(g => {
                        const st = statusStyle[statusMap[g.code] || "idle"];
                        return (
                          <div key={g.code} style={{
                            display: "flex", alignItems: "flex-start", gap: 12,
                            padding: "12px 14px", borderRadius: 10,
                            background: st.borderBg, border: `0.5px solid ${st.borderColor}`,
                          }}>
                            <div style={{
                              width: 24, height: 24, borderRadius: "50%",
                              background: st.bg, color: st.color,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 11, fontWeight: 700, flexShrink: 0,
                            }}>{st.icon}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                                <span style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.08em", fontFamily: "'DM Sans', sans-serif" }}>{g.code}</span>
                                <Badge text={g.severity} variant={g.severity === "Critical" ? "danger" : g.severity === "High" ? "warn" : "neutral"} />
                                <Badge text={g.waivable === false ? "Non-waivable" : `Waivable (${g.waivable})`} variant={g.waivable === false ? "info" : "neutral"} />
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 500, color: "#111827", marginBottom: 2, fontFamily: "'DM Sans', sans-serif" }}>{g.label}</div>
                              <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>{g.desc}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "14px 18px", background: "#f9fafb",
                border: "0.5px solid #e5e7eb", borderRadius: 10,
                flexWrap: "wrap",
              }}>
                {[["Pass", 9, "#10b981"], ["Warning", 3, "#f59e0b"], ["Fail — resolve before release", 1, "#ef4444"]].map(([label, count, color]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#374151", fontFamily: "'DM Sans', sans-serif" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                    {label}: <strong style={{ color }}>{count}</strong>
                  </div>
                ))}
                <div style={{ flex: 1 }} />
                <div style={{ fontSize: 11, color: "#9ca3af", fontFamily: "'DM Sans', sans-serif" }}>Next review: Jun 2027 or upon RICS/BOVEAP change</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EngagementsView({ onNav }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? ENGAGEMENTS : ENGAGEMENTS.filter(e => e.status === filter);

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 500, color: "#111827", margin: 0 }}>Engagements</h2>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4, fontFamily: "'DM Sans', sans-serif", margin: "4px 0 0" }}>{ENGAGEMENTS.length} total · 2 in progress</p>
        </div>
        <Btn variant="gold" onClick={() => onNav("builder")}>+ New Report</Btn>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["all", "draft", "review", "completed"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 16px", borderRadius: 20, fontSize: 12, cursor: "pointer",
              background: filter === f ? "#111827" : "#f3f4f6",
              color: filter === f ? "#fff" : "#6b7280",
              border: "none", fontFamily: "'DM Sans', sans-serif",
              textTransform: "capitalize", transition: "all 0.12s",
            }}
          >{f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map((e, i) => (
          <Card key={i} interactive style={{ cursor: "pointer" }}>
            <div style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: "rgba(184,150,46,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Playfair Display', serif", fontSize: 13, fontWeight: 600, color: "#B8962E",
                flexShrink: 0,
              }}>{e.type.split("-")[1]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#111827", fontFamily: "'DM Sans', sans-serif" }}>{e.client}</span>
                  <Badge text={e.type} variant="gold" />
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", fontFamily: "'DM Sans', sans-serif" }}>{e.property}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3, fontFamily: "'DM Sans', sans-serif" }}>{e.ref} · {e.lead} · {e.date}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <StatusDot status={e.status} />
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: "#10b981", fontFamily: "'DM Sans', sans-serif" }}>✓ {e.guardrailScore.pass}</span>
                  {e.guardrailScore.warn > 0 && <span style={{ fontSize: 11, color: "#f59e0b", fontFamily: "'DM Sans', sans-serif" }}>▲ {e.guardrailScore.warn}</span>}
                  {e.guardrailScore.fail > 0 && <span style={{ fontSize: 11, color: "#ef4444", fontFamily: "'DM Sans', sans-serif" }}>✕ {e.guardrailScore.fail}</span>}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SkillConfigView() {
  const [activeSection, setActiveSection] = useState("overview");
  const sections = [
    { id: "overview", label: "Overview" },
    { id: "types", label: "Report types" },
    { id: "ai-boundaries", label: "AI boundaries" },
    { id: "guardrail-matrix", label: "Guardrail matrix" },
    { id: "disclaimer", label: "Disclaimer template" },
  ];

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 500, color: "#111827", margin: 0 }}>Skill Configuration</h2>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4, fontFamily: "'DM Sans', sans-serif", margin: "4px 0 0" }}>re-consultancy-report · MAS-GUARD-001 · v1.0 · Effective June 2026</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
              padding: "8px 12px", textAlign: "left", borderRadius: 8,
              fontSize: 13, cursor: "pointer",
              background: activeSection === s.id ? "rgba(184,150,46,0.08)" : "transparent",
              color: activeSection === s.id ? "#92701A" : "#6b7280",
              border: "none", borderLeft: activeSection === s.id ? "2px solid #B8962E" : "2px solid transparent",
              fontFamily: "'DM Sans', sans-serif", fontWeight: activeSection === s.id ? 500 : 400,
              transition: "all 0.12s",
            }}>{s.label}</button>
          ))}
        </div>

        <Card>
          <div style={{ padding: "24px" }}>
            {activeSection === "overview" && (
              <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <div style={{ marginBottom: 20, padding: "14px 18px", background: "rgba(184,150,46,0.04)", border: "0.5px solid rgba(184,150,46,0.2)", borderRadius: 10, fontSize: 13, color: "#374151", lineHeight: 1.7 }}>
                  This skill governs production of professional real estate consultancy reports on the Meridian RE Advisory Platform. It ensures every output is analytically rigorous, compliant with MAS-GUARD-001, clearly scoped as a <strong>consultancy opinion</strong> (not a certified RICS/USPAP valuation), appropriately caveated, and professionally signed off.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { key: "Skill name", val: "re-consultancy-report" },
                    { key: "Guardrail doc", val: "MAS-GUARD-001 v1.0" },
                    { key: "Jurisdiction", val: "Malaysia (primary) · Global" },
                    { key: "Regulatory basis", val: "RICS Red Book 2025, Act 242, BOVEAP" },
                    { key: "AI use", val: "Anthropic Claude Sonnet 4 (decision-support only)" },
                    { key: "Effective date", val: "June 2026" },
                    { key: "Review cycle", val: "Annual or on regulatory change" },
                    { key: "Report types", val: "7 (MER-MKT through MER-SITE)" },
                  ].map(({ key, val }) => (
                    <div key={key} style={{ padding: "10px 14px", background: "#f9fafb", borderRadius: 8, border: "0.5px solid #e5e7eb" }}>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>{key}</div>
                      <div style={{ fontSize: 13, color: "#111827", fontWeight: 500 }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "types" && (
              <div>
                {REPORT_TYPES.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 0", borderBottom: i < REPORT_TYPES.length - 1 ? "0.5px solid #f3f4f6" : "none" }}>
                    <div style={{ width: 60, height: 32, borderRadius: 6, background: "rgba(184,150,46,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#92701A", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.04em" }}>{t.code.split("-")[1]}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#111827", fontFamily: "'DM Sans', sans-serif" }}>{t.code} — {t.label}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>{t.desc}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                        {t.sections.map(s => {
                          const sec = ALL_SECTIONS.find(x => x.num === s);
                          return <Badge key={s} text={`S${s} ${sec?.name}`} variant="neutral" />;
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === "ai-boundaries" && (
              <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <div style={{ fontSize: 13, color: "#374151", marginBottom: 20, lineHeight: 1.7 }}>
                  AI may lead on data aggregation, comparable search, financial model population, scenario analysis, and draft narrative. The following zones require human consultant action before report release.
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#f9fafb" }}>
                      {["Task", "AI may lead", "Human must review", "Human must lead"].map(h => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#6b7280", fontWeight: 500, borderBottom: "0.5px solid #e5e7eb", fontSize: 11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Market data aggregation", "✓", "✓", ""],
                      ["Comparable transaction search", "✓", "✓", ""],
                      ["Financial model population", "✓", "✓", ""],
                      ["Sensitivity analysis", "✓", "✓", ""],
                      ["Draft narrative", "✓", "✓", ""],
                      ["Regulatory & zoning interpretation", "", "", "✓"],
                      ["Site visit & physical condition", "", "", "✓"],
                      ["Stakeholder interviews", "", "", "✓"],
                      ["HBU legal permissibility", "", "", "✓"],
                      ["Risk Register final scores", "", "✓", ""],
                      ["Final sign-off", "", "", "✓"],
                    ].map((row, i) => (
                      <tr key={i} style={{ borderBottom: "0.5px solid #f3f4f6" }}>
                        {row.map((cell, j) => (
                          <td key={j} style={{
                            padding: "8px 12px",
                            color: j === 0 ? "#374151" : cell === "✓" ? (j === 1 ? "#065f46" : j === 2 ? "#92400e" : "#991b1b") : "#e5e7eb",
                            fontWeight: cell === "✓" ? 600 : 400,
                          }}>{cell || "—"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeSection === "guardrail-matrix" && (
              <div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
                  <thead>
                    <tr style={{ background: "#f9fafb" }}>
                      {["Code", "Domain", "Severity", "Waivable?"].map(h => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#6b7280", fontWeight: 500, borderBottom: "0.5px solid #e5e7eb", fontSize: 11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {GUARDRAILS.map((g, i) => (
                      <tr key={i} style={{ borderBottom: "0.5px solid #f3f4f6" }}>
                        <td style={{ padding: "7px 12px", color: "#374151", fontWeight: 500 }}>{g.code}</td>
                        <td style={{ padding: "7px 12px", color: "#6b7280" }}>{g.domain}</td>
                        <td style={{ padding: "7px 12px" }}>
                          <Badge text={g.severity} variant={g.severity === "Critical" ? "danger" : g.severity === "High" ? "warn" : "neutral"} />
                        </td>
                        <td style={{ padding: "7px 12px" }}>
                          <Badge text={g.waivable === false ? "No" : `Yes (${g.waivable})`} variant={g.waivable === false ? "info" : "success"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeSection === "disclaimer" && (
              <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <div style={{ marginBottom: 12, fontSize: 13, color: "#6b7280" }}>Standard Section 8 disclaimer template. Required by G-AI-01 and G-DISC-01. Non-waivable.</div>
                <div style={{ background: "#f9fafb", border: "0.5px solid #e5e7eb", borderRadius: 10, padding: "20px 22px", fontSize: 12, color: "#374151", lineHeight: 1.8, fontFamily: "monospace" }}>
                  <p>This report has been prepared by Meridian RE Advisory ("Meridian") solely for the use of <strong>[Client Name]</strong> ("the Client") in connection with <strong>[Engagement Reference]</strong>. It is provided as a consultancy opinion and does not constitute a certified valuation under RICS Valuation – Global Standards (Red Book, January 2025) or USPAP, nor does it constitute legal, tax, or financial advice.</p>
                  <br />
                  <p>Meridian has relied on information provided by the Client, publicly available data, and proprietary data sources believed to be reliable. No independent verification of third-party data has been undertaken unless explicitly stated.</p>
                  <br />
                  <p><strong>AI disclosure (G-AI-01):</strong> AI-assisted tools were used in the preparation of this report for data aggregation, scenario modelling, and draft narrative production. All AI-assisted outputs have been reviewed, validated, and accepted by the named consultant(s) below. The professional opinions expressed are those of the named consultants and not of any AI system.</p>
                  <br />
                  <p><strong>Lead Consultant:</strong> [Name], [Credentials]<br /><strong>Reviewing Advisor:</strong> [Name], [Credentials]<br /><strong>Date of Sign-Off:</strong> [DD Month YYYY]<br /><strong>Meridian File Reference:</strong> [MER-TYPE-YYYY-SEQ]</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function GuardrailLibraryView() {
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("All");
  const domains = ["All", "Scope", "Evidence", "AI Use", "Disclosure", "Process"];
  const filtered = GUARDRAILS.filter(g =>
    (domainFilter === "All" || g.domain === domainFilter) &&
    (search === "" || g.code.toLowerCase().includes(search.toLowerCase()) || g.label.toLowerCase().includes(search.toLowerCase()) || g.desc.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 500, color: "#111827", margin: 0 }}>Guardrail Library</h2>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4, fontFamily: "'DM Sans', sans-serif", margin: "4px 0 0" }}>MAS-GUARD-001 · 22 rules · Document owner: Standards & Quality Committee</p>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <input
          placeholder="Search guardrails…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, maxWidth: 280, borderColor: "#d1d5db" }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {domains.map(d => (
            <button key={d} onClick={() => setDomainFilter(d)} style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer",
              background: domainFilter === d ? "#111827" : "#f3f4f6",
              color: domainFilter === d ? "#fff" : "#6b7280",
              border: "none", fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.12s",
            }}>{d}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: "#9ca3af", fontFamily: "'DM Sans', sans-serif" }}>{filtered.length} results</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map((g, i) => (
          <Card key={i}>
            <div style={{ padding: "14px 18px", display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{
                width: 52, flexShrink: 0,
                fontSize: 10, fontWeight: 700, color: "#B8962E",
                letterSpacing: "0.04em", fontFamily: "'DM Sans', sans-serif",
                marginTop: 2,
              }}>{g.code}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#111827", fontFamily: "'DM Sans', sans-serif" }}>{g.label}</span>
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>{g.desc}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", flexShrink: 0 }}>
                <Badge text={g.severity} variant={g.severity === "Critical" ? "danger" : g.severity === "High" ? "warn" : "neutral"} />
                <Badge text={g.domain} variant="neutral" />
                <Badge text={g.waivable === false ? "Non-waivable" : `Waivable (${g.waivable})`} variant={g.waivable === false ? "info" : "success"} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────

const APP_CSS = `
*::selection { background: rgba(184,150,46,0.22); color: #4a3a0e; }
::-webkit-scrollbar { width: 11px; height: 11px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #e4dccb; border-radius: 8px; border: 3px solid transparent; background-clip: content-box; }
::-webkit-scrollbar-thumb:hover { background: #d2c19a; background-clip: content-box; }

@keyframes merFadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@keyframes merFadeIn { from { opacity: 0; } to { opacity: 1; } }

.mer-view { height: 100%; overflow-y: auto; animation: merFadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both; }

.mer-card { box-shadow: 0 1px 2px rgba(28,23,10,0.04), 0 1px 3px rgba(28,23,10,0.03); transition: box-shadow 0.28s ease, transform 0.28s ease, border-color 0.28s ease; }
.mer-interactive { cursor: pointer; }
.mer-interactive:hover { box-shadow: 0 10px 30px rgba(28,23,10,0.10), 0 3px 8px rgba(28,23,10,0.05); transform: translateY(-3px); border-color: rgba(184,150,46,0.45) !important; }

.mer-stat { animation: merFadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both; }
.mer-stat:hover { box-shadow: 0 10px 28px rgba(28,23,10,0.10); transform: translateY(-3px); border-color: rgba(184,150,46,0.4) !important; }

.mer-navitem:hover { background: rgba(184,150,46,0.08) !important; color: #6b5a1f !important; }
.mer-navitem:hover > span:first-child { opacity: 1 !important; }

.mer-row { transition: background 0.16s ease; }
.mer-row:hover { background: rgba(184,150,46,0.05); }

.mer-avatar { transition: transform 0.2s ease, box-shadow 0.2s ease; }
.mer-avatar:hover { transform: translateY(-1px); box-shadow: 0 5px 14px rgba(184,150,46,0.35); }

input::placeholder, textarea::placeholder { color: #b6bcc6; }
`;

export default function App() {
  const [activeNav, setActiveNav] = useState("dashboard");

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  const renderView = () => {
    switch (activeNav) {
      case "dashboard":    return <DashboardView onNav={setActiveNav} />;
      case "builder":      return <BuilderView />;
      case "engagements":  return <EngagementsView onNav={setActiveNav} />;
      case "guardrails":   return <GuardrailLibraryView />;
      case "skill":        return <SkillConfigView />;
      default:             return <DashboardView onNav={setActiveNav} />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "radial-gradient(900px 440px at 88% -10%, rgba(184,150,46,0.07), rgba(184,150,46,0) 70%), #FAF9F5", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{APP_CSS}</style>
      <TopNav />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar active={activeNav} onNav={setActiveNav} />
        <main style={{ flex: 1, overflow: "hidden" }}>
          <div className="mer-view" key={activeNav}>
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}
