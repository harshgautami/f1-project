import React, { useMemo, useState } from "react";
import API from "../api";
import { useFetch, invalidate } from "../hooks/useFetch";
import { Loader, EmptyState, Modal, Field } from "./ui";
import { Reveal } from "./motion";
import { HubHero, HubStat, HubCTA, HubBar, HubSelect, SectionHead } from "./hub";
import HubDropdown from "./HubDropdown";
import { IconPlus, IconEdit, IconTrash } from "./Icons";

/* ---------------------------------------------------------------------------
   Generic admin CRUD screen driven by a config object. Every admin page is now
   `<ResourceManager config={...} />`, replacing six ~370-line copy-pasted files.

   config = {
     endpoint, singular, plural, accent?, eyebrow?, subtitle?(rows),
     refs?: { key: "/url" },                       // extra data for selects
     columns: [{ key, label, align?, render?(row, refs) }],
     fields:  [{ key, label, type, required?, half?, placeholder?, hint?,
                 min?, max?, step?, options?(refs), edit?(row), coerce?,
                 itemFields?, itemKey?, newItem?, addLabel? }], // "list" only
     emptyForm, toPayload?(form), fromRow?(row),
     filters?: [{ param, label, all?, options(refs) }],
     invalidates?: ["drivers", "live:"],           // user-side cache prefixes
   }
   ------------------------------------------------------------------------- */

const buildQuery = (filters, values) => {
  const parts = [];
  for (const f of filters || []) {
    const v = values[f.param];
    if (v) parts.push(`${f.param}=${encodeURIComponent(v)}`);
  }
  return parts.length ? `?${parts.join("&")}` : "";
};

/* Repeatable rows are identified by one sub-field (`itemKey`, defaulting to
   the first): an "Add" the operator never filled in carries the other fields'
   defaults, so without this a stray blank row would reach the collection and
   show up on the user-facing page as a nameless entry. */
const listPayload = (field, value) => {
  const idKey = field.itemKey || field.itemFields[0].key;
  return (Array.isArray(value) ? value : [])
    .filter((item) => {
      const id = item[idKey];
      return id !== "" && id !== undefined && id !== null;
    })
    .map((item) => {
      const out = {};
      for (const sf of field.itemFields) {
        let v = item[sf.key];
        if (v === "" || v === undefined || v === null) continue;
        if (sf.type === "number") v = Number(v);
        out[sf.key] = v;
      }
      return out;
    });
};

const defaultPayload = (fields, form) => {
  const out = {};
  for (const f of fields) {
    let v = form[f.key];
    // An emptied list is a real edit ("this season had no wins on record"),
    // so it goes on the wire where a blank text input would be skipped.
    if (f.type === "list") {
      out[f.key] = listPayload(f, v);
      continue;
    }
    if (v === "" || v === undefined || v === null) continue;
    if (f.type === "number") v = Number(v);
    if (typeof f.coerce === "function") v = f.coerce(v, form);
    out[f.key] = v;
  }
  return out;
};

const defaultForm = (fields, emptyForm, row) => {
  if (!row) return { ...emptyForm };
  const out = { ...emptyForm };
  for (const f of fields) {
    if (typeof f.edit === "function") out[f.key] = f.edit(row);
    else if (f.type === "list")
      // Copy the subdocuments so editing the form never mutates the cached
      // row, and drop Mongo's _id — the server rebuilds the array wholesale.
      out[f.key] = (Array.isArray(row[f.key]) ? row[f.key] : []).map((item) =>
        Object.fromEntries(f.itemFields.map((sf) => [sf.key, item[sf.key] ?? ""])),
      );
    else if (f.type === "date" && row[f.key])
      out[f.key] = String(row[f.key]).slice(0, 10);
    else if (row[f.key] !== undefined && row[f.key] !== null)
      out[f.key] = row[f.key];
  }
  return out;
};

/* Repeatable subdocument rows (RaceHistory.teamWins is the one that needs it:
   the user-facing Archive draws its win-share meters straight from that array,
   so an admin who can't edit it can't fix what the Archive shows). */
function ListEditor({ field, value, onChange }) {
  const items = Array.isArray(value) ? value : [];
  const write = (next) => onChange(field.key, next);
  const patch = (i, key, v) =>
    write(items.map((item, n) => (n === i ? { ...item, [key]: v } : item)));

  return (
    <div className="form-list">
      {items.length === 0 && (
        <p className="form-list-empty">Nothing added yet.</p>
      )}
      {items.map((item, i) => (
        <div className="form-list-row" key={i}>
          {field.itemFields.map((sf) => (
            <label className="form-list-cell" key={sf.key} data-kind={sf.type}>
              <span>{sf.label}</span>
              <input
                className="form-control"
                type={sf.type === "number" ? "number" : sf.type === "color" ? "color" : "text"}
                min={sf.min}
                max={sf.max}
                placeholder={sf.placeholder}
                value={item[sf.key] ?? (sf.type === "color" ? "#e10600" : "")}
                onChange={(e) => patch(i, sf.key, e.target.value)}
              />
            </label>
          ))}
          <button
            type="button"
            className="btn btn-sm btn-danger form-list-del"
            onClick={() => write(items.filter((_, n) => n !== i))}
            aria-label={`Remove row ${i + 1}`}
          >
            <IconTrash />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-sm btn-secondary form-list-add"
        onClick={() => write([...items, { ...(field.newItem || {}) }])}
      >
        <IconPlus /> {field.addLabel || "Add row"}
      </button>
    </div>
  );
}

function FormField({ field, value, onChange, refs }) {
  if (field.type === "list") {
    return (
      <Field label={field.label} hint={field.hint} required={field.required}>
        <ListEditor field={field} value={value} onChange={onChange} />
      </Field>
    );
  }

  const common = {
    className: "form-control",
    value: value ?? "",
    required: field.required,
    placeholder: field.placeholder,
    onChange: (e) => onChange(field.key, e.target.value),
  };

  let control;
  if (field.type === "textarea") {
    control = <textarea {...common} rows={field.rows || 3} />;
  } else if (field.type === "select") {
    const options =
      typeof field.options === "function" ? field.options(refs) : field.options || [];
    control = (
      <HubDropdown
        variant="form"
        name={field.key}
        value={common.value}
        required={field.required}
        placeholder={field.placeholder || "Select…"}
        options={options}
        onChange={common.onChange}
      />
    );
  } else if (field.type === "color") {
    control = (
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          type="color"
          value={value || "#e10600"}
          onChange={(e) => onChange(field.key, e.target.value)}
          style={{
            width: 46,
            height: 40,
            padding: 0,
            border: "1px solid var(--border-color)",
            borderRadius: 8,
            background: "none",
            cursor: "pointer",
          }}
        />
        <input {...common} placeholder="#e10600" />
      </div>
    );
  } else {
    control = (
      <input
        {...common}
        type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
        min={field.min}
        max={field.max}
        step={field.step}
      />
    );
  }

  return (
    <Field label={field.label} hint={field.hint} required={field.required}>
      {control}
    </Field>
  );
}

export default function ResourceManager({ config }) {
  const [filterValues, setFilterValues] = useState({});
  const query = buildQuery(config.filters, filterValues);

  // List (re-fetches when filters change).
  const list = useFetch(
    () => API.get(config.endpoint + query).then((r) => r.data),
    [query],
    { key: `admin:${config.endpoint}${query}` },
  );

  // Reference data for selects (teams, etc.) — fetched once.
  const refsFetch = useFetch(async () => {
    if (!config.refs) return {};
    const entries = await Promise.all(
      Object.entries(config.refs).map(async ([key, url]) => [
        key,
        (await API.get(url)).data,
      ]),
    );
    return Object.fromEntries(entries);
  }, [], { key: `admin:refs:${config.endpoint}` });
  const refs = refsFetch.data || {};

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(config.emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const rows = list.data || [];
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  /* A write here changes what the *user-facing* pages show, but those pages
     read their own stale-while-revalidate entries (`drivers`, `standings:2026`,
     …) — and the admin's other screens read `admin:…` ones. Nothing linked the
     two, so an edit stayed invisible until a full reload. Dropping both sets
     means the next mount of any affected page refetches. */
  const syncCaches = () => {
    invalidate("admin:"); // sibling admin lists, the dashboard counts, refs
    for (const prefix of config.invalidates || []) invalidate(prefix);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm(config.fields, config.emptyForm, null));
    setError("");
    setModalOpen(true);
  };
  const openEdit = (row) => {
    setEditing(row._id);
    setForm(
      config.fromRow
        ? { ...config.emptyForm, ...config.fromRow(row) }
        : defaultForm(config.fields, config.emptyForm, row),
    );
    setError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = config.toPayload
        ? config.toPayload(form)
        : defaultPayload(config.fields, form);
      if (editing) await API.put(`${config.endpoint}/${editing}`, payload);
      else await API.post(config.endpoint, payload);
      setModalOpen(false);
      syncCaches();
      list.refetch();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          "Operation failed",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete ${config.singular.toLowerCase()} "${config.rowLabel ? config.rowLabel(row) : row.name || row._id}"?`))
      return;
    try {
      await API.delete(`${config.endpoint}/${row._id}`);
      syncCaches();
      list.refetch();
    } catch {
      window.alert("Delete failed");
    }
  };

  const subtitle = useMemo(
    () =>
      typeof config.subtitle === "function"
        ? config.subtitle(rows)
        : `${rows.length} ${config.plural.toLowerCase()}`,
    [rows, config],
  );

  // Only the *first* load gets a spinner. A post-save refetch (whose cache
  // entry syncCaches just dropped) keeps the table on screen and updates in
  // place, rather than flashing the whole page back to a loader.
  if ((list.loading && !list.data) || (refsFetch.loading && !refsFetch.data))
    return <Loader label={`Loading ${config.plural.toLowerCase()}`} />;

  return (
    <div>
      <HubHero
        chip={config.eyebrow || "Admin"}
        chipTone="muted"
        chipDot={false}
        meta={`${rows.length} rows`}
        title={config.plural}
        ghost={config.accent || "Admin"}
        subtitle={subtitle}
        panel={
          <>
            <HubStat tag={`${config.plural} on file`} value={rows.length} duration={1.4} />
            <HubCTA onClick={openCreate}>Add {config.singular}</HubCTA>
          </>
        }
      />

      {config.filters && (
        <HubBar>
          {config.filters.map((f) => (
            <HubSelect
              key={f.param}
              label={f.label}
              value={filterValues[f.param] || ""}
              onChange={(e) =>
                setFilterValues((prev) => ({ ...prev, [f.param]: e.target.value }))
              }
              options={[
                { value: "", label: f.all || `All ${f.label}` },
                ...(typeof f.options === "function" ? f.options(refs) : f.options),
              ]}
            />
          ))}
        </HubBar>
      )}

      {list.error ? (
        <EmptyState icon="⚠️" title="Couldn't load data" message={list.error} />
      ) : rows.length === 0 ? (
        <EmptyState
          title={`No ${config.plural.toLowerCase()} yet`}
          message={`Add your first ${config.singular.toLowerCase()} to get started.`}
          action={
            <button className="btn btn-primary" onClick={openCreate}>
              <IconPlus /> Add {config.singular}
            </button>
          }
        />
      ) : (
        <>
        <SectionHead label={`All ${config.plural.toLowerCase()}`} />
        <Reveal className="hub-table-wrap">
          <table className="hub-table">
            <thead>
              <tr>
                {config.columns.map((c) => (
                  <th key={c.key} style={c.align ? { textAlign: c.align } : undefined}>
                    {c.label}
                  </th>
                ))}
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id}>
                  {config.columns.map((c) => (
                    <td
                      key={c.key}
                      style={c.align ? { textAlign: c.align } : undefined}
                    >
                      {c.render ? c.render(row, refs) : row[c.key]}
                    </td>
                  ))}
                  <td>
                    <div className="hub-row-actions">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => openEdit(row)}
                      >
                        <IconEdit /> Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(row)}
                        aria-label={`Delete ${config.singular.toLowerCase()}`}
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
        </>
      )}

      <Modal
        open={modalOpen}
        title={`${editing ? "Edit" : "Add"} ${config.singular}`}
        onClose={() => setModalOpen(false)}
      >
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          {chunkFields(config.fields).map((rowFields, i) => (
            <div
              key={i}
              className={rowFields.length > 1 ? "form-row" : undefined}
            >
              {rowFields.map((field) => (
                <FormField
                  key={field.key}
                  field={field}
                  value={form[field.key]}
                  onChange={setField}
                  refs={refs}
                />
              ))}
            </div>
          ))}
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : editing ? `Update ${config.singular}` : `Create ${config.singular}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Groups consecutive `half: true` fields into two-column rows; everything else
// gets its own full-width row.
function chunkFields(fields) {
  const rows = [];
  let pending = null;
  for (const f of fields) {
    if (f.half) {
      if (pending) {
        rows.push([pending, f]);
        pending = null;
      } else {
        pending = f;
      }
    } else {
      if (pending) {
        rows.push([pending]);
        pending = null;
      }
      rows.push([f]);
    }
  }
  if (pending) rows.push([pending]);
  return rows;
}
