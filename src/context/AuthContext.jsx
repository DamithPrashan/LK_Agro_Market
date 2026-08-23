import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const AUTH_STORAGE_KEYS = ["user", "token", "role", "profile", "avatar", "profile_image"];
const clearFrontendAuth = () => {
  AUTH_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
};

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On every page refresh, check if a PHP session already exists
  useEffect(() => {
    fetch("/backend/Apis/me.php", { credentials: "include" })
      .then(async (response) => ({ response, data: await response.json() }))
      .then(({ response, data }) => {
        if (response.ok && data.success && data.user) setUser(data.user);
        else {
          clearFrontendAuth();
          setUser(null);
        }
      })
      .catch(() => {
        clearFrontendAuth();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login  = (userData) => setUser(userData);
  const logout = async () => {
    setUser(null);
    clearFrontendAuth();
    try {
      await fetch("/backend/Apis/logout.php", {
        method: "POST",
        credentials: "include"
      });
    } finally {
      setUser(null);
      clearFrontendAuth();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// use anywhere:  const { user, login, logout } = useAuth();
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
