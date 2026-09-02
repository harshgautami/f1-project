import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatedNumber, StaggerItem } from "./motion";
import { IconChevronRight } from "./Icons";
import F1Car from "./F1Car";
import HubDropdown from "./HubDropdown";

/* ---------------------------------------------------------------------------
   "HUB" — the F1.com-style design language, shared by every page.

   One hero shape (status chip → kinetic title with a ghost token → letterspaced
   circuit line → art → glass side panel), one ranked-row shape, one editorial
   card shape. Pages supply data; the look lives here and in the `hub-*` block
   of index.css, so consistency is structural rather than copy-pasted.
   ------------------------------------------------------------------------- */

// One formatter, memoised per timestamp: toLocaleDateString builds a fresh
// Intl formatter on every call, which showed up as ~100ms on list-heavy pages.
const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const dateMemo = new Map();
export const fmtDate = (d) => {
  const t = new Date(d).getTime();
  let s = dateMemo.get(t);
  if (s === undefined) {
    s = Number.isNaN(t) ? "" : DATE_FMT.format(t);
    if (dateMemo.size > 500) dateMemo.clear();
    dateMemo.set(t, s);
  }
  return s;
};

export const splitName = (full = "") => {
  const parts = String(full).trim().split(/\s+/);
  return {
    first: parts.slice(0, -1).join(" "),
    last: parts[parts.length - 1] || "",
  };
};

/** Three-letter driver code, F1-style (VER, HAM, LEC). */
export const driverCode = (full = "") =>
  splitName(full).last.slice(0, 3).toUpperCase();

/* Deterministic per-round "track temp" so the readout is stable per GP. */
export const trackTemp = (round = 3) => (21 + ((round * 53) % 90) / 10).toFixed(1);

/* ---- Circuit artwork ----------------------------------------------------- */

/* The circuit library is ~350KB, so it stays out of every page's chunk: load it
   on demand and let the outline draw itself in whenever it arrives (the draw-in
   animation makes the late paint feel intentional). Fetched at most once. */
export function useCircuitPath(race) {
  const [d, setD] = useState(null);
  useEffect(() => {
    if (!race) return undefined;
    let alive = true;
    import("../data/circuits")
      .then((m) => {
        if (!alive) return;
        const c = m.getCircuit(race.circuit, race.city, race.country);
        setD(c?.d || null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [race]);
  return d;
}

/** Same loader, but hands back `getCircuit` so a list can resolve many outlines
    from one dynamic import instead of one per card. */
export function useCircuitLib() {
  const [get, setGet] = useState(null);
  useEffect(() => {
    let alive = true;
    import("../data/circuits")
      .then((m) => alive && setGet(() => m.getCircuit))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return get;
}

/* Animated circuit outline: asphalt base, draw-in racing line, and a red
   "comet" endlessly lapping the track. pathLength=100 normalises every
   circuit so the dash keyframes work for any outline. */
export function CircuitOutline({ d, className = "", comet = true }) {
  if (!d) return null;
  return (
    <svg viewBox="0 0 1000 600" className={`hub-track-svg ${className}`}>
      <path d={d} className="hub-track-asphalt" pathLength="100" />
      <path d={d} className="hub-track-line" pathLength="100" />
      {comet && <path d={d} className="hub-track-comet" pathLength="100" />}
    </svg>
  );
}

/* ---- Type --------------------------------------------------------------- */

/** Per-letter rise-in title. `ghost` renders as outlined type, like the year
    in the reference; `chevron` adds the "›" that slides on hover. */
export function KineticTitle({ text, ghost, chevron = false, as: Tag = "h1" }) {
  let i = 0;
  const words = String(text).toUpperCase().split(" ").filter(Boolean);
  // A single long word can't wrap, so titles like CONSTRUCTORS or VERSTAPPEN
  // step down a size rather than run out of the hero column.
  const longest = words.reduce((m, w) => Math.max(m, w.length), 0);
  return (
    <Tag className={`hub-title${longest > 9 ? " long" : ""}`}>
      {words
        .map((word, w) => (
          <span key={w} className="hub-title-word">
            {word.split("").map((ch) => (
              <span key={i} className="hub-title-letter" style={{ "--i": i++ }}>
                {ch}
              </span>
            ))}{" "}
          </span>
        ))}
      {ghost != null && ghost !== "" && (
        <span className="hub-title-season hub-title-letter" style={{ "--i": i + 1 }}>
          {ghost}
        </span>
      )}
      {chevron && (
        <span className="hub-title-chev" aria-hidden="true">
          ›
        </span>
      )}
    </Tag>
  );
}

/** Skewed status chip. tone: live (red) · next (lime) · muted (outline). */
export function HubChip({ tone = "live", dot = true, children }) {
  return (
    <span className={`hub-live-chip${tone === "live" ? "" : ` ${tone}`}`}>
      {dot && <span className="hub-live-dot" />}
      <span>{children}</span>
    </span>
  );
}

/** Pill readout that sits beside the chip (track temp, counts, dates). */
export function HubMeta({ children, className = "" }) {
  return <span className={`hub-temp mono-num ${className}`}>{children}</span>;
}

/* ---- Hero --------------------------------------------------------------- */

/**
 * The one hero every page uses.
 *
 * chip/chipTone/meta → status row · title/ghost/to → kinetic headline
 * subtitle → letterspaced strapline · art → node under the strapline
 * panel → glass side panel (omit for a full-width hero)
 */
export function HubHero({
  chip,
  chipTone = "live",
  chipDot = true,
  meta,
  title,
  ghost,
  to,
  subtitle,
  art,
  panel,
  accent,
  car = true,
  className = "",
}) {
  const headline = <KineticTitle text={title} ghost={ghost} chevron={!!to} />;

  return (
    <section
      className={`hub-hero${panel ? "" : " solo"} ${className}`}
      style={accent ? { "--team-accent": accent } : undefined}
    >
      {car && (
        <div className="hub-hero-car" aria-hidden="true">
          <F1Car />
        </div>
      )}

      <div className="hub-hero-main">
        {(chip || meta) && (
          <div className="hub-status">
            {chip && (
              <HubChip tone={chipTone} dot={chipDot}>
                {chip}
              </HubChip>
            )}
            {meta && <HubMeta>{meta}</HubMeta>}
          </div>
        )}

        {to ? (
          <Link to={to} className="hub-title-link">
            {headline}
          </Link>
        ) : (
          headline
        )}

        {subtitle && <div className="hub-circuit">{subtitle}</div>}
        {art && <div className="hub-track">{art}</div>}
      </div>

      {panel && <aside className="hub-session">{panel}</aside>}
    </section>
  );
}

/** Big tagged readout for the top of a hero panel — "LAP 61/66". */
export function HubStat({ tag, value, total, animate = true, duration = 2.4 }) {
  return (
    <div className="hub-lap">
      <span className="hub-lap-tag">{tag}</span>
      <div className="hub-lap-count mono-num">
        {animate && Number.isFinite(Number(value)) ? (
          <AnimatedNumber value={Number(value)} duration={duration} />
        ) : (
          value
        )}
        {total != null && <span className="hub-lap-total">/{total}</span>}
      </div>
    </div>
  );
}

/** Countdown row of value/label blocks, used by "lights out in" panels. */
export function HubCountdown({ tag = "Lights out in", blocks = [] }) {
  return (
    <div className="hub-lap">
      <span className="hub-lap-tag">{tag}</span>
      <div className="hub-countdown mono-num">
        {blocks.map(([value, label]) => (
          <span key={label} className="hub-count-block">
            <span className="hub-count-num">
              <AnimatedNumber value={Number(value) || 0} duration={1.6} />
            </span>
            <span className="hub-count-label">{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * The signature ranked row: position · team colour bar · first-name-light /
 * last-name-bold · right-hand gap pill. Used in hero panels, standings, the
 * live classification and driver line-ups.
 */
export function RankRow({ pos, color, name, right, index = 0, to, lead = false }) {
  const { first, last } = splitName(name);
  const body = (
    <>
      <span className="hub-top3-pos mono-num">{pos}</span>
      <span className="hub-top3-bar" />
      <span className="hub-top3-name">
        {first} <b>{last}</b>
      </span>
      {right != null && <span className="hub-top3-gap mono-num">{right}</span>}
    </>
  );
  const style = { "--team-accent": color || "var(--accent-red)", "--i": index };
  const cls = `hub-top3-row${lead ? " lead" : ""}`;

  return to ? (
    <Link to={to} className={cls} style={style}>
      {body}
    </Link>
  ) : (
    <div className={cls} style={style}>
      {body}
    </div>
  );
}

export function RankList({ children, className = "" }) {
  return <div className={`hub-top3 ${className}`}>{children}</div>;
}

/** Full-width red call to action with a shine sweep. */
export function HubCTA({
  to,
  href,
  onClick,
  children,
  tone = "",
  type = "button",
  disabled = false,
}) {
  const cls = `hub-cta${tone ? ` ${tone}` : ""}`;
  if (to) return <Link to={to} className={cls}>{children}</Link>;
  if (href) return <a href={href} className={cls}>{children}</a>;
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function HubPanelFoot({ children }) {
  return <div className="hub-session-foot">{children}</div>;
}

/* ---- Sections and cards -------------------------------------------------- */

/** "FEATURED" style section head with an optional right-hand link. */
export function SectionHead({ label, to, action, children }) {
  return (
    <div className="hub-featured-head">
      <span className="eyebrow">{label}</span>
      {children}
      {to && (
        <Link to={to} className="hub-more">
          {action || "View all"} <IconChevronRight />
        </Link>
      )}
    </div>
  );
}

/** Editorial card: generated art on top, headline and meta below. */
export function EditorialCard({ to, tag, headline, meta, accent, children }) {
  return (
    <StaggerItem className="hub-featured-item">
      <Link to={to} className="hub-featured-card">
        <div className="hub-featured-media" style={{ "--team-accent": accent }}>
          <div className="hub-media-art">{children}</div>
          {tag && <span className="hub-featured-tag">{tag}</span>}
        </div>
        <h3 className="hub-featured-headline">{headline}</h3>
        <div className="hub-featured-meta">
          {meta} <IconChevronRight />
        </div>
      </Link>
    </StaggerItem>
  );
}

/**
 * Horizontal strip of outlined ghost numbers with letterspaced labels — the
 * page-level replacement for the old stat tiles.
 */
export function HubStrip({ items = [] }) {
  return (
    <div className="hub-strip">
      {items.map((it, i) => (
        <div
          key={it.label}
          className="hub-strip-item"
          style={{ "--team-accent": it.accent || "var(--accent-red)", "--i": i }}
        >
          <span className="hub-strip-value mono-num">
            {typeof it.value === "number" ? (
              <AnimatedNumber value={it.value} decimals={it.decimals || 0} />
            ) : (
              it.value
            )}
          </span>
          <span className="hub-strip-label">{it.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Filter/toolbar row: search boxes, selects and counts on one carbon rail. */
export function HubBar({ children, className = "" }) {
  return <div className={`hub-bar ${className}`}>{children}</div>;
}

/** Toolbar select in the hub chrome — a themed dropdown, not the browser's. */
export function HubSelect(props) {
  return <HubDropdown variant="bar" {...props} />;
}

/** Segmented control (drivers / constructors, seasons / insights). */
export function HubTabs({ tabs, active, onChange }) {
  return (
    <div className="hub-tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={active === t.value}
          className={`hub-tab${active === t.value ? " active" : ""}`}
          onClick={() => onChange(t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Carbon panel with an uppercase display heading — the generic content block. */
export function HubCard({ title, action, to, children, accent, className = "" }) {
  return (
    <div
      className={`hub-card ${className}`}
      style={accent ? { "--team-accent": accent } : undefined}
    >
      {(title || to || action) && (
        <div className="hub-card-head">
          {title && <h3>{title}</h3>}
          {action}
          {to && (
            <Link to={to} className="hub-more">
              View all <IconChevronRight />
            </Link>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * Auth screens share the hero's grammar: kinetic title and ghost car on the
 * left, a glass form panel on the right. Pass `stage={false}` to drop the
 * left-hand stage and centre the panel on its own.
 */
export function AuthShell({
  chip,
  title,
  ghost,
  blurb,
  facts = [],
  heading,
  sub,
  children,
  foot,
  stage = true,
}) {
  const panel = (
    <div className="auth-panel">
      <div className="auth-panel-head">
        <h2>{heading}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {children}
      {foot && <div className="auth-foot">{foot}</div>}
    </div>
  );

  if (!stage) return <div className="auth-split auth-solo">{panel}</div>;

  return (
    <div className="auth-split">
      <div className="auth-stage">
        <div className="auth-brand" aria-hidden="true">
          <span className="mast-mark">
            <span className="mast-mark-word">F1</span>
            <span className="mast-mark-bars">
              <i />
              <i />
              <i />
            </span>
          </span>
          <span className="auth-brand-word">Management</span>
        </div>

        <div className="hub-status">
          <HubChip tone="live">{chip}</HubChip>
        </div>

        <KineticTitle text={title} ghost={ghost} />
        {blurb && <div className="hub-circuit">{blurb}</div>}

        {facts.length > 0 && (
          <div className="auth-facts">
            {facts.map(([value, label]) => (
              <span key={label}>
                <b className="mono-num">{value}</b>
                <em>{label}</em>
              </span>
            ))}
          </div>
        )}

        <div className="auth-car" aria-hidden="true">
          <F1Car />
        </div>
      </div>

      {panel}
    </div>
  );
}

/** Chequered strip used as a rule between zones. */
export function Chequer({ className = "" }) {
  return <span className={`hub-chequer ${className}`} aria-hidden="true" />;
}
