import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle, FiLock, FiShield } from "react-icons/fi";
import clienteAxios from "../config/clienteAxios";

const RestablecerPassword = () => {
  const { token } = useParams();
  const [formulario, setFormulario] = useState({
    password: "",
    confirmarPassword: "",
  });
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleChange = (e) => {
    setFormulario((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");
    setEnviando(true);

    try {
      const { data } = await clienteAxios.post("/auth/password/restablecer", {
        token,
        ...formulario,
      });
      setMensaje(data.mensaje);
      setFormulario({ password: "", confirmarPassword: "" });
    } catch (error) {
      setError(error.response?.data?.error || "No fue posible cambiar la contrasena.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="password-reset-card">
      <div className="password-reset-header">
        <div className="password-reset-header-inner">
          <Link
            to="/"
            className="password-reset-back"
          >
            <FiArrowLeft />
            Volver
          </Link>

          <div className="password-reset-brand">
            <span className="password-reset-brand-icon">
              <FiShield />
            </span>
            TI CONTROL
          </div>
        </div>
      </div>

      <div className="password-reset-body">
        <div>
          <p className="password-reset-eyebrow">
            Cuenta
          </p>
          <h1 className="password-reset-title">
            Nueva contrasena
          </h1>
          <p className="password-reset-copy">
            Crea una nueva contrasena para recuperar el acceso a tu cuenta.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="password-reset-form">
          <label className="block">
            <span className="password-reset-label">
              Nueva contrasena
            </span>
            <div className="password-reset-field">
              <FiLock className="password-reset-field-icon" />
              <input
                type="password"
                name="password"
                value={formulario.password}
                onChange={handleChange}
                className="password-reset-input"
                placeholder="Minimo 8 caracteres"
                required
              />
            </div>
          </label>

          <label className="block">
            <span className="password-reset-label">
              Confirmar contrasena
            </span>
            <div className="password-reset-field">
              <FiLock className="password-reset-field-icon" />
              <input
                type="password"
                name="confirmarPassword"
                value={formulario.confirmarPassword}
                onChange={handleChange}
                className="password-reset-input"
                placeholder="Repite la contrasena"
                required
              />
            </div>
          </label>

          {mensaje ? (
            <div className="password-reset-alert success">
              <FiCheckCircle className="mt-0.5 shrink-0" />
              <span>{mensaje}</span>
            </div>
          ) : null}

          {error ? (
            <div className="password-reset-alert error">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={enviando || Boolean(mensaje)}
            className="password-reset-button"
          >
            {enviando ? "Guardando..." : "Actualizar contrasena"}
          </button>
        </form>

        <p className="password-reset-note">
          Usa al menos 8 caracteres para proteger tu cuenta.
        </p>
      </div>
    </section>
  );
};

export default RestablecerPassword;
