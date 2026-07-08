import React, { useState, useEffect } from "react";
import API from "../../api";

const emptyTeam = {
  name: "",
  fullName: "",
  base: "",
  teamPrincipal: "",
  powerUnit: "",
  chassis: "",
  firstEntry: "",
  worldChampionships: 0,
  color: "#ffffff",
};

const AdminTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyTeam });
  const [error, setError] = useState("");

  const fetchTeams = () => {
    API.get("/teams")
      .then((res) => {
        setTeams(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyTeam });
    setError("");
    setShowModal(true);
  };
  const openEdit = (team) => {
    setEditing(team._id);
    setForm({ ...team });
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editing) {
        await API.put(`/teams/${editing}`, form);
      } else {
        await API.post("/teams", form);
      }
      setShowModal(false);
      fetchTeams();
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this team?")) return;
    try {
      await API.delete(`/teams/${id}`);
      fetchTeams();
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.message || err.message));
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
            <span>Manage</span> Teams
          </h1>
          <p className="page-subtitle">{teams.length} teams</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Add Team
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Full Name</th>
              <th>Base</th>
              <th>Principal</th>
              <th>Power Unit</th>
              <th>Championships</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team._id}>
                <td>
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: team.color,
                    }}
                  ></div>
                </td>
                <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  {team.name}
                </td>
                <td style={{ fontSize: "12px" }}>{team.fullName}</td>
                <td>{team.base}</td>
                <td>{team.teamPrincipal}</td>
                <td>{team.powerUnit}</td>
                <td style={{ fontWeight: 700, color: "var(--accent-red)" }}>
                  {team.worldChampionships}
                </td>
                <td>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => openEdit(team)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(team._id)}
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
            <h2>{editing ? "Edit Team" : "Add New Team"}</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Team Name *</label>
                  <input
                    className="form-control"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    className="form-control"
                    value={form.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Base *</label>
                  <input
                    className="form-control"
                    value={form.base}
                    onChange={(e) => handleChange("base", e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Team Principal *</label>
                  <input
                    className="form-control"
                    value={form.teamPrincipal}
                    onChange={(e) =>
                      handleChange("teamPrincipal", e.target.value)
                    }
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Power Unit *</label>
                  <input
                    className="form-control"
                    value={form.powerUnit}
                    onChange={(e) => handleChange("powerUnit", e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Chassis</label>
                  <input
                    className="form-control"
                    value={form.chassis || ""}
                    onChange={(e) => handleChange("chassis", e.target.value)}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>First Entry</label>
                  <input
                    className="form-control"
                    type="number"
                    value={form.firstEntry || ""}
                    onChange={(e) =>
                      handleChange("firstEntry", parseInt(e.target.value))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>World Championships</label>
                  <input
                    className="form-control"
                    type="number"
                    value={form.worldChampionships}
                    onChange={(e) =>
                      handleChange(
                        "worldChampionships",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Team Color</label>
                <div
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => handleChange("color", e.target.value)}
                    style={{
                      width: "50px",
                      height: "36px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  />
                  <input
                    className="form-control"
                    value={form.color}
                    onChange={(e) => handleChange("color", e.target.value)}
                    style={{ width: "120px" }}
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
                  {editing ? "Update Team" : "Create Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTeams;
