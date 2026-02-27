import React, { useState, useEffect } from "react";
import API from "../../api";

const emptyStaff = {
  name: "",
  role: "",
  department: "mechanical",
  team: "",
  teamName: "",
  experience: "",
  nationality: "",
};

const AdminStaff = () => {
  const [staff, setStaff] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyStaff });
  const [error, setError] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [filterDept, setFilterDept] = useState("");

  const departments = [
    "mechanical",
    "physical",
    "pitstop",
    "strategy",
    "management",
    "aerodynamics",
  ];

  const fetchData = () => {
    Promise.all([API.get("/team-staff"), API.get("/teams")])
      .then(([s, t]) => {
        setStaff(s.data);
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
    setForm({ ...emptyStaff });
    setError("");
    setShowModal(true);
  };
  const openEdit = (s) => {
    setEditing(s._id);
    setForm({
      name: s.name,
      role: s.role,
      department: s.department,
      team: s.team?._id || "",
      teamName: s.teamName || "",
      experience: s.experience || "",
      nationality: s.nationality || "",
    });
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const selectedTeam = teams.find((t) => t._id === form.team);
      const data = { ...form, teamName: selectedTeam?.name || form.teamName };
      if (editing) {
        await API.put(`/team-staff/${editing}`, data);
      } else {
        await API.post("/team-staff", data);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this staff member?")) return;
    try {
      await API.delete(`/team-staff/${id}`);
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

  const filtered = staff.filter((s) => {
    if (filterTeam && s.team?._id !== filterTeam) return false;
    if (filterDept && s.department !== filterDept) return false;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>
            <span>Manage</span> Team Staff
          </h1>
          <p className="page-subtitle">{staff.length} staff members</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Add Staff
        </button>
      </div>

      <div className="filter-bar">
        <select
          className="form-control"
          style={{ width: "auto" }}
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
        >
          <option value="">All Teams</option>
          {teams.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          className="form-control"
          style={{ width: "auto" }}
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Department</th>
              <th>Team</th>
              <th>Experience</th>
              <th>Nationality</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s._id}>
                <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  {s.name}
                </td>
                <td>{s.role}</td>
                <td>
                  <span
                    className={`badge badge-department badge-${s.department}`}
                  >
                    {s.department}
                  </span>
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
                        background: s.team?.color,
                      }}
                    ></span>
                    {s.team?.name || s.teamName}
                  </span>
                </td>
                <td>{s.experience}</td>
                <td>{s.nationality}</td>
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
            <h2>{editing ? "Edit Staff" : "Add New Staff Member"}</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    className="form-control"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Role *</label>
                  <input
                    className="form-control"
                    value={form.role}
                    onChange={(e) => handleChange("role", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Department *</label>
                  <select
                    className="form-control"
                    value={form.department}
                    onChange={(e) => handleChange("department", e.target.value)}
                    required
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </option>
                    ))}
                  </select>
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
                  <label>Experience</label>
                  <input
                    className="form-control"
                    value={form.experience}
                    onChange={(e) => handleChange("experience", e.target.value)}
                    placeholder="e.g. 15 years"
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
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editing ? "Update Staff" : "Create Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStaff;
