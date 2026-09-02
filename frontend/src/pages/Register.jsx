import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PageTransition } from "../components/motion";
import { AuthShell, HubCTA } from "../components/hub";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await register(username, email, password);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          "Registration failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <AuthShell
        stage={false}
        heading="Create account"
        sub="Set up your paddock pass in seconds."
        foot={
          <>
            Already have an account? <Link to="/login">Sign in</Link>
          </>
        }
      >
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              minLength={3}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                minLength={6}
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm</label>
              <input
                type="password"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                required
              />
            </div>
          </div>
          <HubCTA type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </HubCTA>
        </form>
      </AuthShell>
    </PageTransition>
  );
}
