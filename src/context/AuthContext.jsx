import { createContext, useContext, useEffect, useMemo, useState } from "react";
import clienteAxios from "../config/clienteAxios";

const AuthContext = createContext(null);
const TOKEN_KEY = "token_sistema_it";

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);

  useEffect(() => {
    const validarSesion = async () => {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        setCargandoAuth(false);
        return;
      }

      try {
        const { data } = await clienteAxios.get("/auth/perfil");
        setUsuario(data.usuario);
      } catch (error) {
        localStorage.removeItem(TOKEN_KEY);
        setUsuario(null);
      } finally {
        setCargandoAuth(false);
      }
    };

    validarSesion();
  }, []);

  const login = async ({ email, password }) => {
    const { data } = await clienteAxios.post("/auth/login", { email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    setUsuario(data.usuario);
    return data.usuario;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUsuario(null);
  };

  const value = useMemo(
    () => ({
      usuario,
      autenticado: Boolean(usuario),
      cargandoAuth,
      login,
      logout,
    }),
    [usuario, cargandoAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
