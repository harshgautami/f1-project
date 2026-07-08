import React, { useState, useEffect } from "react";
import API from "../../api";

const emptyRace = {
  name: "",
  circuit: "",
  country: "",
  city: "",
  date: "",
  season: 2026,
  round: "",
  laps: "",
  circuitLength: "",
  status: "upcoming",
};

const AdminRaces = () => {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyRace });
  const [error, setError] = useState("");

  const fetchRaces = () => {
    API.get("/races?season=2026")
      .then((res) => {
        setRaces(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchRaces();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyRace });
    setError("");
    setShowModal(true);
  };
  const openEdit = (race) => {
    setEditing(race._id);
    setForm({
      name: race.name,
      circuit: race.circuit,
      country: race.country,
      city: race.city || "",
      date: race.date ? new Date(race.date).toISOString().split("T")[0] : "",
      season: race.season,
      round: race.round,
      laps: race.laps || "",
      circuitLength: race.circuitLength || "",
      status: race.status,
    });
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = {
        ...form,
        round: parseInt(form.round),
        laps: parseInt(form.laps) || undefined,
        season: parseInt(form.season),
      };
      if (editing) {
        await API.put(`/races/${editing}`, data);
      } else {
        await API.post("/races", data);
      }
      setShowModal(false);
      fetchRaces();
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this race?")) return;
    try {
      await API.delete(`/races/${id}`);
      fetchRaces();
    } catch (err) {
      alert("Delete failed");
    }
  };

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));
  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  if (loading)
    return (
      <div className="loading">
        <div className="spinner"></div>Loading...
      </div>
    );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>
            <span>Manage</span> Races
          </h1>
          <p className="page-subtitle">{races.length} races in 2026 season</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Add Race
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Round</th>
              <th>Grand Prix</th>
              <th>Circuit</th>
              <th>Location</th>
              <th>Date</th>
              <th>Laps</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {races.map((race) => (
              <tr key={race._id}>
                <td style={{ fontWeight: 700, color: "var(--accent-red)" }}>
                  R{race.round}
                </td>
                <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  {race.name}
                </td>
                <td style={{ fontSize: "13px" }}>{race.circuit}</td>
                <td>
                  {race.city}, {race.country}
                </td>
                <td style={{ color: "var(--accent-green)" }}>
                  {formatDate(race.date)}
                </td>
                <td>{race.laps}</td>
                <td>
                  <span className={`race-status ${race.status}`}>
                    {race.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => openEdit(race)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(race._id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? "Edit Race" : "Add New Race"}</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Grand Prix Name *</label>
                <input
                  className="form-control"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Circuit *</label>
                <input
                  className="form-control"
                  value={form.circuit}
                  onChange={(e) => handleChange("circuit", e.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Country *</label>
                  <input
                    className="form-control"
                    value={form.country}
                    onChange={(e) => handleChange("country", e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input
                    className="form-control"
                    value={form.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    className="form-control"
                    type="date"
                    value={form.date}
                    onChange={(e) => handleChange("date", e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Round *</label>
                  <input
                    className="form-control"
                    type="number"
                    value={form.round}
                    onChange={(e) => handleChange("round", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Season</label>
                  <input
                    className="form-control"
                    type="number"
                    value={form.season}
                    onChange={(e) => handleChange("season", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Laps</label>
                  <input
                    className="form-control"
                    type="number"
                    value={form.laps}
                    onChange={(e) => handleChange("laps", e.target.value)}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Circuit Length</label>
                  <input
                    className="form-control"
                    value={form.circuitLength}
                    onChange={(e) =>
                      handleChange("circuitLength", e.target.value)
                    }
                    placeholder="e.g. 5.278 km"
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    className="form-control"
                    value={form.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editing ? "Update Race" : "Create Race"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRaces;
