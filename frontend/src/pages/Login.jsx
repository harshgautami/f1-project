import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PageTransition } from "../components/motion";
import { AuthShell, HubCTA } from "../components/hub";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <AuthShell
        stage={false}
        heading="Sign in"
        sub="Enter the paddock to follow the season."
        foot={
          <>
            Don&apos;t have an account? <Link to="/register">Create one</Link>
          </>
        }
      >
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
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
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          <HubCTA type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </HubCTA>
        </form>
      </AuthShell>
    </PageTransition>
  );
}
