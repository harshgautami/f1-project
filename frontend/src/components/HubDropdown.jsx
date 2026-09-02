import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "./motion";

/* ---------------------------------------------------------------------------
   HubDropdown — the themed replacement for every native <select>.

   The browser's own popup can't be styled, so this renders its own: a trigger
   in the toolbar chrome (label chip · value · chevron) and a floating listbox
   portaled to <body> (so it never clips inside a bar, card or modal), placed
   under the trigger and flipping above it when there's no room.

   Behaves like a real select: click or Space/Enter/↑/↓ opens, arrows move,
   Home/End jump, Enter picks, Esc/Tab/outside-click closes, typing jumps to
   a matching option (and changes the value directly while closed). Exposes
   the combobox/listbox ARIA pattern. Honours reduced-motion.

   `onChange` receives `{ target: { value, name } }` so existing
   `(e) => set(e.target.value)` handlers keep working; the value is the
   option's own (a number stays a number).
   ------------------------------------------------------------------------- */

const MENU_GAP = 6;
const MENU_MAX_HEIGHT = 320;
const MENU_MIN_HEIGHT = 140;
const VIEWPORT_PAD = 12;
const HEAD_HEIGHT = 36;
const TYPEAHEAD_MS = 700;

const isNumeric = (label) => /^\d[\d.,\s–-]*$/.test(String(label));
const same = (a, b) => String(a) === String(b);

const Chevron = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6l4 4 4-4" />
  </svg>
);
const Check = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 8.5l3 3 6-7" />
  </svg>
);

export default function HubDropdown({
  value,
  onChange,
  options = [],
  label,
  placeholder = "Select…",
  variant = "bar", // "bar" (toolbar chip) | "form" (full-width field)
  width,
  className = "",
  name,
  required = false,
  disabled = false,
  id: idProp,
}) {
  const reactId = useId();
  const id = idProp || `hubdd${reactId.replace(/:/g, "")}`;
  const listId = `${id}-list`;
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const listRef = useRef(null);
  const typeRef = useRef({ buffer: "", at: 0 });
  const reduce = useReducedMotion();

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState(null);

  const selectedIndex = useMemo(
    () => options.findIndex((o) => same(o.value, value)),
    [options, value],
  );
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  const show = useCallback(() => {
    if (disabled || !options.length) return;
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }, [disabled, options.length, selectedIndex]);

  const hide = useCallback(() => {
    setOpen(false);
    setPos(null);
  }, []);

  const commit = useCallback(
    (index) => {
      const opt = options[index];
      if (!opt || opt.disabled) return;
      hide();
      if (!same(opt.value, value)) onChange?.({ target: { value: opt.value, name } });
    },
    [options, value, onChange, name, hide],
  );

  /* -- Placement: below the trigger, flipped above when that fits better -- */
  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const below = vh - r.bottom - MENU_GAP - VIEWPORT_PAD;
    const above = r.top - MENU_GAP - VIEWPORT_PAD;
    const flip = below < MENU_MIN_HEIGHT && above > below;
    const room = flip ? above : below;
    const maxHeight = Math.max(MENU_MIN_HEIGHT, Math.min(MENU_MAX_HEIGHT, room));
    const maxWidth = Math.max(200, Math.min(400, vw - r.left - VIEWPORT_PAD));
    setPos({
      left: r.left,
      top: flip ? undefined : r.bottom + MENU_GAP,
      bottom: flip ? vh - r.top + MENU_GAP : undefined,
      minWidth: r.width,
      maxWidth,
      maxHeight,
      flip,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return undefined;
    place();
    window.addEventListener("resize", place);
    document.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      document.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  /* -- Close on outside pointer-down ----------------------------------------- */
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      hide();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, hide]);

  /* -- Keep the highlighted option in view ----------------------------------- */
  useEffect(() => {
    if (!open || active < 0) return;
    const el = listRef.current?.querySelector(`[data-index="${active}"]`);
    el?.scrollIntoView?.({ block: "nearest" });
  }, [open, active]);

  /* -- Keyboard ---------------------------------------------------------------- */
  const findByTypeahead = (key, from) => {
    const now = Date.now();
    const t = typeRef.current;
    t.buffer = (now - t.at < TYPEAHEAD_MS ? t.buffer : "") + key.toLowerCase();
    t.at = now;
    const n = options.length;
    for (let step = 1; step <= n; step++) {
      const i = (from + step) % n;
      if (String(options[i].label).toLowerCase().startsWith(t.buffer)) return i;
    }
    return -1;
  };

  const onKeyDown = (e) => {
    const n = options.length;
    if (!n) return;
    const move = (i) => setActive(((i % n) + n) % n);
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (open) move(active + 1);
        else show();
        break;
      case "ArrowUp":
        e.preventDefault();
        if (open) move(active - 1);
        else show();
        break;
      case "Home":
        if (open) {
          e.preventDefault();
          setActive(0);
        }
        break;
      case "End":
        if (open) {
          e.preventDefault();
          setActive(n - 1);
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (open) commit(active);
        else show();
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          hide();
        }
        break;
      case "Tab":
        if (open) hide();
        break;
      default: {
        if (e.key.length !== 1 || e.altKey || e.ctrlKey || e.metaKey) return;
        const i = findByTypeahead(e.key, open ? active : selectedIndex);
        if (i < 0) return;
        e.preventDefault();
        if (open) setActive(i);
        else commit(i);
      }
    }
  };

  const triggerClass = [
    "hub-select",
    `hub-select-${variant}`,
    open && "open",
    !selected && "placeholder",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const listMaxHeight = pos ? pos.maxHeight - (label ? HEAD_HEIGHT : 0) : undefined;

  const menu = (
    <AnimatePresence>
      {open && pos && (
        <motion.div
          ref={menuRef}
          className={`hub-menu${pos.flip ? " flip" : ""}`}
          style={{
            left: pos.left,
            top: pos.top,
            bottom: pos.bottom,
            minWidth: pos.minWidth,
            maxWidth: pos.maxWidth,
          }}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: pos.flip ? 6 : -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: pos.flip ? 4 : -4, scale: 0.985 }}
          transition={{ duration: reduce ? 0.01 : 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          {label && (
            <div className="hub-menu-head">
              <span>{label}</span>
              <span className="hub-menu-count mono-num">{options.length}</span>
            </div>
          )}
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            aria-labelledby={id}
            className="hub-menu-list"
            style={{ maxHeight: listMaxHeight }}
          >
            {options.map((o, i) => {
              const isSel = i === selectedIndex;
              const cls = [
                "hub-option",
                isSel && "selected",
                i === active && "active",
                o.disabled && "disabled",
                isNumeric(o.label) && "mono-num",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <div
                  key={String(o.value)}
                  id={`${id}-opt-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={isSel}
                  aria-disabled={o.disabled || undefined}
                  className={cls}
                  onPointerDown={(e) => e.preventDefault()} // keep focus on the trigger
                  onPointerMove={() => active !== i && setActive(i)}
                  onClick={() => commit(i)}
                >
                  <span className="hub-option-label">{o.label}</span>
                  {isSel && (
                    <span className="hub-option-check" aria-hidden="true">
                      <Check />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <span className={`hub-select-wrap hub-select-wrap-${variant}`}>
      <button
        type="button"
        ref={triggerRef}
        id={id}
        className={triggerClass}
        style={width ? { width } : undefined}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && active >= 0 ? `${id}-opt-${active}` : undefined}
        aria-label={label ? undefined : placeholder}
        disabled={disabled}
        onClick={() => (open ? hide() : show())}
        onKeyDown={onKeyDown}
      >
        {label && <span className="hub-select-label">{label}</span>}
        <span className={`hub-select-value${selected && isNumeric(selected.label) ? " mono-num" : ""}`}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="hub-select-chevron" aria-hidden="true">
          <Chevron />
        </span>
      </button>
      {/* Form variant: a hidden real <select> keeps native `required`
          validation and plain form submission working. */}
      {variant === "form" && (
          <select
            className="hub-select-native"
            tabIndex={-1}
            aria-hidden="true"
            name={name}
            required={required}
            value={selected ? String(selected.value) : ""}
            onChange={() => {}}
            onFocus={() => triggerRef.current?.focus()}
          >
            <option value="">{placeholder}</option>
            {options.map((o) => (
              <option key={String(o.value)} value={String(o.value)}>
                {o.label}
              </option>
            ))}
          </select>
      )}
      {typeof document !== "undefined" && createPortal(menu, document.body)}
    </span>
  );
}
