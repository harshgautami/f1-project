import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion, AnimatedNumber } from "./motion";
import { IconSearch } from "./Icons";

/* ---------------------------------------------------------------------------
   Shared, styled UI building blocks. Pages compose these instead of
   re-implementing headers / modals / stat cards / empty states by hand.
   ------------------------------------------------------------------------- */

/** Sets the local --team-accent custom property so a card can theme itself. */
export const teamAccent = (color) =>
  color ? { "--team-accent": color } : undefined;

export function PageHeader({ eyebrow, accent, title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 style={{ marginTop: eyebrow ? 10 : 0 }}>
          {accent && <span>{accent} </span>}
          {title}
        </h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div style={{ display: "flex", gap: 10 }}>{actions}</div>}
    </div>
  );
}

export function Loader({ label = "Loading" }) {
  return (
    <div className="loading">
      <div className="spinner" />
      {label}…
    </div>
  );
}

export function EmptyState({ icon = "🏁", title = "Nothing here yet", message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, accent, decimals = 0, prefix = "", suffix = "" }) {
  const numeric = typeof value === "number" || /^-?\d+(\.\d+)?$/.test(String(value));
  return (
    <div className="stat-card" style={teamAccent(accent)}>
      <div className="stat-value mono-num">
        {prefix}
        {numeric ? (
          <AnimatedNumber value={Number(value)} decimals={decimals} />
        ) : (
          value
        )}
        {suffix}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export function Badge({ children, className = "" }) {
  return <span className={`badge ${className}`}>{children}</span>;
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={active === t.value}
          className={`tab ${active === t.value ? "active" : ""}`}
          onClick={() => onChange(t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, hint, required, children }) {
  return (
    <div className="form-group">
      {label && (
        <label>
          {label}
          {required && " *"}
        </label>
      )}
      {children}
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}

export function SectionTitle({ children }) {
  return <h2 className="chart-title">{children}</h2>;
}

/** Image with a graceful initials fallback (used until real image URLs exist). */
export function Avatar({ src, name = "", color = "#e10600", size = 44, rounded = "50%" }) {
  const [failed, setFailed] = useState(false);
  const initials =
    name
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "—";

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        style={{
          width: size,
          height: size,
          objectFit: "cover",
          borderRadius: rounded,
          background: "var(--bg-primary)",
          flex: "none",
        }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        display: "inline-grid",
        placeItems: "center",
        background: `${color}22`,
        color,
        fontWeight: 800,
        fontFamily: "var(--font-display)",
        fontSize: Math.round(size * 0.36),
        border: `1px solid ${color}55`,
        flex: "none",
      }}
    >
      {initials}
    </span>
  );
}

/** Styled text search box. */
export function SearchBar({ value, onChange, placeholder = "Search…" }) {
  return (
    <div className="search-bar">
      <IconSearch />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}

/** Animated, accessible modal dialog (ESC to close, click-away, scroll lock). */
export function Modal({ open, title, onClose, children, maxWidth }) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="modal"
            style={maxWidth ? { maxWidth } : undefined}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === "string" ? title : undefined}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            {title && <h2>{title}</h2>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
