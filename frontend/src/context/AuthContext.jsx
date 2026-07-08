import React, { createContext, useState, useContext, useEffect } from "react";
import API from "../api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("f1_token");
    const savedUser = localStorage.getItem("f1_user");
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
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
