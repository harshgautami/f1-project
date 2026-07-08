import React, { useState, useEffect } from "react";
import API from "../../api";

const emptyStanding = {
  season: 2024,
  type: "driver",
  position: "",
  name: "",
  team: "",
  nationality: "",
  points: 0,
  wins: 0,
};

const AdminStandings = () => {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyStanding });
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("driver");

  const fetchStandings = () => {
    API.get("/standings?season=2024")
      .then((res) => {
        setStandings(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchStandings();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyStanding, type: activeTab });
    setError("");
    setShowModal(true);
  };
  const openEdit = (s) => {
    setEditing(s._id);
    setForm({
      season: s.season,
      type: s.type,
      position: s.position,
      name: s.name,
      team: s.team || "",
      nationality: s.nationality || "",
      points: s.points,
      wins: s.wins,
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
        position: parseInt(form.position),
        points: parseInt(form.points),
        wins: parseInt(form.wins),
        season: parseInt(form.season),
      };
      if (editing) {
        await API.put(`/standings/${editing}`, data);
      } else {
        await API.post("/standings", data);
      }
      setShowModal(false);
      fetchStandings();
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this standing entry?")) return;
    try {
      await API.delete(`/standings/${id}`);
      fetchStandings();
    } catch (err) {
      alert("Delete failed");
    }
  };

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  if (loading)
    return (
      <div className="loading">
        <div className="spinner"></div>Loading...
      </div>
    );

  const filtered = standings.filter((s) => s.type === activeTab);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>
            <span>Manage</span> Standings
          </h1>
          <p className="page-subtitle">2024 Championship standings</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Add Entry
        </button>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === "driver" ? "active" : ""}`}
          onClick={() => setActiveTab("driver")}
        >
          Drivers
        </button>
        <button
          className={`tab ${activeTab === "constructor" ? "active" : ""}`}
          onClick={() => setActiveTab("constructor")}
        >
          Constructors
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Pos</th>
              <th>Name</th>
              {activeTab === "driver" && <th>Team</th>}
              <th>Nationality</th>
              <th>Wins</th>
              <th>Points</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s._id}>
                <td style={{ fontWeight: 700 }}>{s.position}</td>
                <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  {s.name}
                </td>
                {activeTab === "driver" && <td>{s.team}</td>}
                <td>{s.nationality}</td>
                <td>{s.wins}</td>
                <td style={{ fontWeight: 700, color: "var(--accent-red)" }}>
                  {s.points}
                </td>
                <td>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => openEdit(s)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(s._id)}
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
            <h2>{editing ? "Edit Standing" : "Add Standing Entry"}</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Season</label>
                  <input
                    className="form-control"
                    type="number"
                    value={form.season}
                    onChange={(e) => handleChange("season", e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select
                    className="form-control"
                    value={form.type}
                    onChange={(e) => handleChange("type", e.target.value)}
                  >
                    <option value="driver">Driver</option>
                    <option value="constructor">Constructor</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Position *</label>
                  <input
                    className="form-control"
                    type="number"
                    value={form.position}
                    onChange={(e) => handleChange("position", e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    className="form-control"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Team</label>
                  <input
                    className="form-control"
                    value={form.team}
                    onChange={(e) => handleChange("team", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Nationality</label>
                  <input
                    className="form-control"
                    value={form.nationality}
                    onChange={(e) =>
                      handleChange("nationality", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Wins</label>
                  <input
                    className="form-control"
                    type="number"
                    value={form.wins}
                    onChange={(e) => handleChange("wins", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Points *</label>
                  <input
                    className="form-control"
                    type="number"
                    value={form.points}
                    onChange={(e) => handleChange("points", e.target.value)}
                    required
                  />
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
                  {editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStandings;
