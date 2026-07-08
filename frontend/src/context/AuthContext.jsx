import React, { createContext, useState, useContext, useEffect } from "react";
import API from "../api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const publicUser = (u) => ({
  id: u._id || u.id,
  username: u.username,
  email: u.email,
  role: u.role,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On load: optimistically restore the cached user, then validate the token
  // against the server (/auth/me). A stale/tampered cache or expired token is
  // rejected (the axios 401 interceptor clears storage), so the UI never trusts
  // a role the backend wouldn't honour.
  useEffect(() => {
    const token = localStorage.getItem("f1_token");
    const savedUser = localStorage.getItem("f1_user");
    if (!token) {
      setLoading(false);
      return;
    }
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("f1_user");
      }
    }
    API.get("/auth/me")
      .then((res) => {
        const u = publicUser(res.data);
        setUser(u);
        localStorage.setItem("f1_user", JSON.stringify(u));
      })
      .catch(() => {
        // 401 → interceptor already cleared storage; drop the user here too.
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await API.post("/auth/login", { email, password });
    localStorage.setItem("f1_token", res.data.token);
    localStorage.setItem("f1_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (username, email, password) => {
    const res = await API.post("/auth/register", { username, email, password });
    localStorage.setItem("f1_token", res.data.token);
    localStorage.setItem("f1_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem("f1_token");
    localStorage.removeItem("f1_user");
    setUser(null);
  };

  const isAdmin = () => user && user.role === "admin";

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, isAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
};
