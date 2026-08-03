import React, { useMemo, useState } from "react";
import API from "../api";
import { useFetch } from "../hooks/useFetch";
import { Loader, EmptyState, Modal, Field } from "./ui";
import { Reveal } from "./motion";
import { HubHero, HubStat, HubCTA, HubBar, HubSelect, SectionHead } from "./hub";
import { IconPlus, IconEdit, IconTrash } from "./Icons";

/* ---------------------------------------------------------------------------
   Generic admin CRUD screen driven by a config object. Every admin page is now
   `<ResourceManager config={...} />`, replacing six ~370-line copy-pasted files.

   config = {
     endpoint, singular, plural, accent?, eyebrow?, subtitle?(rows),
     refs?: { key: "/url" },                       // extra data for selects
     columns: [{ key, label, align?, render?(row, refs) }],
     fields:  [{ key, label, type, required?, half?, placeholder?, hint?,
                 min?, max?, step?, options?(refs), edit?(row), coerce? }],
     emptyForm, toPayload?(form), fromRow?(row),
     filters?: [{ param, label, all?, options(refs) }],
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

const defaultPayload = (fields, form) => {
  const out = {};
  for (const f of fields) {
    let v = form[f.key];
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
    else if (f.type === "date" && row[f.key])
      out[f.key] = String(row[f.key]).slice(0, 10);
    else if (row[f.key] !== undefined && row[f.key] !== null)
      out[f.key] = row[f.key];
  }
  return out;
};

function FormField({ field, value, onChange, refs }) {
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
      <select {...common}>
        <option value="">{field.placeholder || "Select…"}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
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
  }, []);
  const refs = refsFetch.data || {};

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(config.emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const rows = list.data || [];
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

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

  if (list.loading || refsFetch.loading) return <Loader label={`Loading ${config.plural.toLowerCase()}`} />;

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
