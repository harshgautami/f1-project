import React, { useState, useEffect } from "react";
import API from "../../api";

const emptyDriver = {
  firstName: "",
  lastName: "",
  number: "",
  nationality: "",
  dateOfBirth: "",
  team: "",
  worldChampionships: 0,
  totalRaceWins: 0,
  totalPodiums: 0,
  totalPoints: 0,
  seasonsActive: "",
  biography: "",
};

const AdminDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyDriver });
  const [error, setError] = useState("");

  const fetchData = () => {
    Promise.all([API.get("/drivers"), API.get("/teams")])
      .then(([d, t]) => {
        setDrivers(d.data);
        setTeams(t.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyDriver });
    setError("");
    setShowModal(true);
  };
  const openEdit = (driver) => {
    setEditing(driver._id);
    setForm({
      firstName: driver.firstName,
      lastName: driver.lastName,
      number: driver.number,
      nationality: driver.nationality,
      dateOfBirth: driver.dateOfBirth,
      team: driver.team?._id || "",
      worldChampionships: driver.worldChampionships,
      totalRaceWins: driver.totalRaceWins,
      totalPodiums: driver.totalPodiums,
      totalPoints: driver.totalPoints,
      seasonsActive: driver.seasonsActive || "",
      biography: driver.biography || "",
    });
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = { ...form, number: parseInt(form.number) };
      if (editing) {
        await API.put(`/drivers/${editing}`, data);
      } else {
        await API.post("/drivers", data);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this driver?")) return;
    try {
      await API.delete(`/drivers/${id}`);
      fetchData();
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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>
            <span>Manage</span> Drivers
          </h1>
          <p className="page-subtitle">{drivers.length} drivers</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Add Driver
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Team</th>
              <th>Nationality</th>
              <th>Titles</th>
              <th>Wins</th>
              <th>Points</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d._id}>
                <td style={{ fontWeight: 700 }}>{d.number}</td>
                <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  {d.firstName} {d.lastName}
                </td>
                <td>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: d.team?.color,
                      }}
                    ></span>
                    {d.team?.name}
                  </span>
                </td>
                <td>{d.nationality}</td>
                <td
                  style={{
                    fontWeight: 700,
                    color: d.worldChampionships > 0 ? "var(--accent-red)" : "",
                  }}
                >
                  {d.worldChampionships}
                </td>
                <td>{d.totalRaceWins}</td>
                <td style={{ fontWeight: 600 }}>{d.totalPoints}</td>
                <td>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => openEdit(d)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(d._id)}
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
            <h2>{editing ? "Edit Driver" : "Add New Driver"}</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    className="form-control"
                    value={form.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    className="form-control"
                    value={form.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Number *</label>
                  <input
                    className="form-control"
                    type="number"
                    value={form.number}
                    onChange={(e) => handleChange("number", e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nationality *</label>
                  <input
                    className="form-control"
                    value={form.nationality}
                    onChange={(e) =>
                      handleChange("nationality", e.target.value)
                    }
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date of Birth *</label>
                  <input
                    className="form-control"
                    value={form.dateOfBirth}
                    onChange={(e) =>
                      handleChange("dateOfBirth", e.target.value)
                    }
                    placeholder="YYYY-MM-DD"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Team *</label>
                  <select
                    className="form-control"
                    value={form.team}
                    onChange={(e) => handleChange("team", e.target.value)}
                    required
                  >
                    <option value="">Select Team</option>
                    {teams.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>World Championships</label>
                  <input
                    className="form-control"
                    type="number"
                    value={form.worldChampionships}
                    onChange={(e) =>
                      handleChange(
                        "worldChampionships",
                        parseInt(e.target.value) || 0,
                      )
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Total Wins</label>
                  <input
                    className="form-control"
                    type="number"
                    value={form.totalRaceWins}
                    onChange={(e) =>
                      handleChange(
                        "totalRaceWins",
                        parseInt(e.target.value) || 0,
                      )
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Total Podiums</label>
                  <input
                    className="form-control"
                    type="number"
                    value={form.totalPodiums}
                    onChange={(e) =>
                      handleChange(
                        "totalPodiums",
                        parseInt(e.target.value) || 0,
                      )
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Total Points</label>
                  <input
                    className="form-control"
                    type="number"
                    value={form.totalPoints}
                    onChange={(e) =>
                      handleChange("totalPoints", parseInt(e.target.value) || 0)
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Seasons Active</label>
                <input
                  className="form-control"
                  value={form.seasonsActive}
                  onChange={(e) =>
                    handleChange("seasonsActive", e.target.value)
                  }
                  placeholder="e.g. 2015-present"
                />
              </div>
              <div className="form-group">
                <label>Biography</label>
                <textarea
                  className="form-control"
                  value={form.biography}
                  onChange={(e) => handleChange("biography", e.target.value)}
                  rows="3"
                />
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
                  {editing ? "Update Driver" : "Create Driver"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDrivers;
