import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On every page refresh, check if a PHP session already exists
  useEffect(() => {
    fetch("/backend/Apis/me.php", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.success) setUser(data.user); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login  = (userData) => setUser(userData);
  const logout = async () => {
  try {
    await fetch(
      "/backend/Apis/logout.php",
      {
        method: "POST",
        credentials: "include"
      }
    );
  }
  finally {
    setUser(null);
  }
};

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// use anywhere:  const { user, login, logout } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}