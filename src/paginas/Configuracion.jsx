import { useState } from "react";
import { FiKey, FiSave, FiShield } from "react-icons/fi";
import clienteAxios from "../config/clienteAxios";
import { useAuth } from "../context/AuthContext";

const Configuracion = () => {
  const { usuario } = useAuth();
  const [formulario, setFormulario] = useState({
    passwordAdmin: "",
    nuevoCodigo: "",
    confirmarCodigo: "",
  });
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const [guardando, setGuardando] = useState(false);

  const esAdmin = usuario?.rol === "admin";

  const handleChange = (e) => {
    setFormulario((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: "", texto: "" });
    setGuardando(true);

    try {
      const { data } = await clienteAxios.put("/auth/codigo-365", formulario);
      setMensaje({ tipo: "success", texto: data.mensaje });
      setFormulario({
        passwordAdmin: "",
        nuevoCodigo: "",
        confirmarCodigo: "",
      });
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible actualizar el codigo.",
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-full bg-[linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)] px-4 py-4 sm:px-6 sm:py-6 2xl:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <FiShield />
            </div>
            <div>
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                Seguridad
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">
                Configuracion del sistema
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Administra el codigo que autoriza ver contrasenas de cuentas Microsoft 365.
              </p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700">
                <FiKey />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Codigo de visualizacion 365
                </h2>
                <p className="text-sm text-slate-500">
                  Se almacena hasheado en la base de datos.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {!esAdmin ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Solo un usuario administrador puede cambiar este codigo.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Contrasena del administrador
                  </span>
                  <input
                    type="password"
                    name="passwordAdmin"
                    value={formulario.passwordAdmin}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Nuevo codigo
                  </span>
                  <input
                    type="password"
                    name="nuevoCodigo"
                    value={formulario.nuevoCodigo}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    minLength={6}
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Confirmar codigo
                  </span>
                  <input
                    type="password"
                    name="confirmarCodigo"
                    value={formulario.confirmarCodigo}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    minLength={6}
                    required
                  />
                </label>

                {mensaje.texto ? (
                  <div
                    className={`rounded-2xl border px-4 py-3 text-sm md:col-span-2 ${
                      mensaje.tipo === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {mensaje.texto}
                  </div>
                ) : null}

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={guardando}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 disabled:opacity-70"
                  >
                    <FiSave />
                    {guardando ? "Guardando..." : "Guardar codigo"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Configuracion;
