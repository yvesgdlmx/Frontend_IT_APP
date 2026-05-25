import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  FiLock,
  FiMail,
  FiShield,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login, autenticado, cargandoAuth } = useAuth();
  const navigate = useNavigate();
  const [formulario, setFormulario] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (!cargandoAuth && autenticado) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    setFormulario((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);

    try {
      await login({
        email: formulario.email.trim(),
        password: formulario.password,
      });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setError(error.response?.data?.error || "No fue posible iniciar sesion.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="relative w-full max-w-[1080px] overflow-hidden rounded-[20px] border border-slate-500/40 bg-[linear-gradient(135deg,_#111827_0%,_#0f172a_48%,_#1e293b_100%)] p-3 shadow-[0_30px_110px_rgba(2,6,23,0.65)]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(100,116,139,0.32),_transparent_38%),radial-gradient(ellipse_at_bottom_right,_rgba(14,165,233,0.16),_transparent_42%)]" />

      <div className="relative grid min-h-[700px] overflow-hidden rounded-[16px] border border-white/10 bg-slate-950/55 p-4 backdrop-blur-xl lg:grid-cols-[0.92fr_1.08fr] lg:p-5">
        <div className="flex min-h-[600px] flex-col justify-between rounded-[14px] px-5 py-5 text-white sm:px-8 lg:px-10">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-300/30 bg-sky-400/10">
              <FiShield className="text-sky-300" />
            </div>
            <span className="text-sm font-semibold tracking-normal text-slate-100">
              TI CONTROL
            </span>
          </div>

          <div className="mx-auto w-full max-w-[330px]">
            <div className="mb-9 text-center">
              <h1 className="text-2xl font-semibold tracking-normal text-white">
                Bienvenido
              </h1>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Entra para administrar cuentas, dispositivos y credenciales.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-medium text-slate-300">
                  Correo electronico
                </span>
                <div className="flex h-11 items-center gap-3 rounded-md border border-white/10 bg-slate-900/70 px-3 transition focus-within:border-sky-400/70 focus-within:ring-4 focus-within:ring-sky-500/10">
                  <FiMail className="text-slate-500" />
                  <input
                    type="email"
                    name="email"
                    value={formulario.email}
                    onChange={handleChange}
                    className="h-full w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
                    placeholder="correo electronico"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-medium text-slate-300">
                  Contrasena
                </span>
                <div className="flex h-11 items-center gap-3 rounded-md border border-white/10 bg-slate-900/70 px-3 transition focus-within:border-sky-400/70 focus-within:ring-4 focus-within:ring-sky-500/10">
                  <FiLock className="text-slate-500" />
                  <input
                    type="password"
                    name="password"
                    value={formulario.password}
                    onChange={handleChange}
                    className="h-full w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </label>

              {error ? (
                <div className="rounded-md border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={enviando}
                className="h-11 w-full rounded-md bg-[linear-gradient(135deg,_#0ea5e9,_#334155)] px-5 text-sm font-semibold text-white shadow-lg shadow-sky-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {enviando ? "Validando..." : "Login"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <Link
                to="/recuperar-password"
                className="text-xs font-semibold text-sky-200 transition hover:text-white"
              >
                Olvide mi contrasena
              </Link>
            </div>

            <p className="mt-6 text-center text-xs text-slate-500">
              Acceso seguro para usuarios autorizados
            </p>
          </div>

          <div className="text-center text-xs text-slate-600">
            © 2026 TI CONTROL
          </div>
        </div>

        <div className="hidden min-h-[640px] rounded-[18px] border border-slate-400/20 bg-[linear-gradient(150deg,_rgba(15,23,42,0.98),_rgba(17,24,39,0.94)_48%,_rgba(8,47,73,0.78))] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_70px_rgba(2,6,23,0.45)] lg:block">
          <div className="relative h-full overflow-hidden">
            <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,0.72)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.72)_1px,transparent_1px)] [background-size:42px_42px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(14,165,233,0.13),_transparent_36%),linear-gradient(180deg,_transparent_55%,_rgba(2,6,23,0.38))]" />

            <div className="absolute inset-0 flex items-center justify-center px-10 text-center">
              <div className="flex flex-col items-center">
                <p className="text-xs font-semibold uppercase tracking-[0.38em] text-sky-200/80">
                  Sistema de administracion
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-md border border-sky-200/30 bg-white/[0.04] text-lg font-semibold text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                    TI
                  </span>
                  <span className="text-5xl font-semibold uppercase tracking-[0.18em] text-white drop-shadow-[0_12px_32px_rgba(14,165,233,0.22)]">
                    Control
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
