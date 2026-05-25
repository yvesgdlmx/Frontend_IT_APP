import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle, FiMail, FiShield } from "react-icons/fi";
import clienteAxios from "../config/clienteAxios";

const OlvidePassword = () => {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");
    setEnviando(true);

    try {
      const { data } = await clienteAxios.post("/auth/password/solicitar", {
        email: email.trim(),
      });
      setMensaje(data.mensaje);
      setEmail("");
    } catch (error) {
      setError(error.response?.data?.error || "No fue posible enviar el correo.");
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
            Recuperacion
          </p>
          <h1 className="password-reset-title">
            Recuperar contrasena
          </h1>
          <p className="password-reset-copy">
            Ingresa tu correo y enviaremos un enlace seguro para cambiar tu contrasena.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="password-reset-form">
          <label className="block">
            <span className="password-reset-label">
              Correo electronico
            </span>
            <div className="password-reset-field">
              <FiMail className="password-reset-field-icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="password-reset-input"
                placeholder="correo electronico"
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
            disabled={enviando}
            className="password-reset-button"
          >
            {enviando ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>

        <p className="password-reset-note">
          El enlace de recuperacion vence en 1 hora.
        </p>
      </div>
    </section>
  );
};

export default OlvidePassword;
