import React, { useEffect, useMemo, useState } from "react";
import {
  FiEye,
  FiEyeOff,
  FiRefreshCw,
  FiCopy,
  FiShield,
} from "react-icons/fi";

const crearFormularioInicial = () => ({
  categoria: "m365",
  nombre: "",
  usuario: "",
  password: "",
  portal: "",
  estado: "Activa",
  mfa: "si",
  fechaCambio: "",
  responsable: "",
  notas: "",
});

const generarPassword = () => {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let pass = "";

  for (let i = 0; i < 14; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return pass;
};

const ModalCredencial = ({
  abierto,
  cerrar,
  onGuardar,
  guardando = false,
  modo = "crear",
  credencialInicial = null,
}) => {
  const [formulario, setFormulario] = useState(crearFormularioInicial());
  const [mostrarPass, setMostrarPass] = useState(false);
  const [error, setError] = useState("");

  const esEdicion = modo === "editar";

  useEffect(() => {
    if (!abierto) return;

    if (esEdicion && credencialInicial) {
      setFormulario({
        categoria: credencialInicial.categoria || "m365",
        nombre: credencialInicial.nombre || "",
        usuario: credencialInicial.usuario || "",
        password: credencialInicial.password || "",
        portal: credencialInicial.portal || "",
        estado: credencialInicial.estado || "Activa",
        mfa: credencialInicial.mfa || "si",
        fechaCambio: credencialInicial.fechaCambio || "",
        responsable: credencialInicial.responsable || "",
        notas: credencialInicial.notas || "",
      });
    } else {
      setFormulario(crearFormularioInicial());
    }

    setError("");
    setMostrarPass(false);
  }, [abierto, esEdicion, credencialInicial]);

  const fuerzaPassword = useMemo(() => {
    const pass = formulario.password;

    if (pass.length < 8) return "Débil";

    if (
      /[A-Z]/.test(pass) &&
      /[0-9]/.test(pass) &&
      /[^A-Za-z0-9]/.test(pass)
    ) {
      return "Fuerte";
    }

    return "Media";
  }, [formulario.password]);

  if (!abierto) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formulario.nombre.trim() ||
      !formulario.usuario.trim() ||
      !formulario.password.trim()
    ) {
      setError("Completa nombre, usuario y contraseña.");
      return;
    }

    setError("");

    const ok = await onGuardar({
      ...formulario,
      nombre: formulario.nombre.trim(),
      usuario: formulario.usuario.trim(),
      portal: formulario.portal.trim(),
      responsable: formulario.responsable.trim(),
      notas: formulario.notas.trim(),
    });

    if (ok) cerrar();
  };

  const copiarPassword = async () => {
    await navigator.clipboard.writeText(formulario.password);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
      <div
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
        onClick={cerrar}
      />

      <div className="relative w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.24)]">
        <button
          type="button"
          onClick={cerrar}
          className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-2xl text-slate-500 transition hover:bg-slate-50 hover:text-rose-500"
        >
          ×
        </button>

        <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.14),_transparent_28%),linear-gradient(135deg,_#f8fafc,_#ffffff)] px-6 py-5 sm:px-8">
          <div className="pr-14">
            <div className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700">
              {esEdicion ? "Editar credencial" : "Nueva credencial"}
            </div>

            <h2 className="mt-3 text-[1.75rem] font-semibold text-slate-900">
              {esEdicion
                ? "Actualizar acceso empresarial"
                : "Registrar nueva credencial"}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Guarda accesos de forma organizada por categoría y responsable.
            </p>
          </div>
        </div>

        <section className="max-h-[78vh] overflow-y-auto bg-slate-50 px-6 py-5 sm:px-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <label>
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Categoría
                  </span>

                  <select
                    name="categoria"
                    value={formulario.categoria}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <option value="m365">Microsoft 365</option>
                    <option value="cpanel">cPanel</option>
                    <option value="correo">Correos</option>
                    <option value="redes">Redes</option>
                    <option value="vpn">VPN</option>
                    <option value="servidores">Servidores</option>
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Nombre
                  </span>

                  <input
                    name="nombre"
                    value={formulario.nombre}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Usuario
                  </span>

                  <input
                    name="usuario"
                    value={formulario.usuario}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  />
                </label>

                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Portal / URL
                  </span>

                  <input
                    name="portal"
                    value={formulario.portal}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Estado
                  </span>

                  <select
                    name="estado"
                    value={formulario.estado}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <option>Activa</option>
                    <option>Compartida</option>
                    <option>Crítica</option>
                    <option>Inactiva</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Contraseña
                  </span>

                  <div className="flex gap-2">
                    <input
                      type={mostrarPass ? "text" : "password"}
                      name="password"
                      value={formulario.password}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                    />

                    <button
                      type="button"
                      onClick={() => setMostrarPass(!mostrarPass)}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200"
                    >
                      {mostrarPass ? <FiEyeOff /> : <FiEye />}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFormulario((prev) => ({
                          ...prev,
                          password: generarPassword(),
                        }))
                      }
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200"
                    >
                      <FiRefreshCw />
                    </button>

                    <button
                      type="button"
                      onClick={copiarPassword}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200"
                    >
                      <FiCopy />
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Seguridad: {fuerzaPassword}
                  </p>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    MFA
                  </span>

                  <select
                    name="mfa"
                    value={formulario.mfa}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Fecha cambio
                  </span>

                  <input
                    type="date"
                    name="fechaCambio"
                    value={formulario.fechaCambio}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Responsable
                  </span>

                  <input
                    name="responsable"
                    value={formulario.responsable}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Notas
                  </span>

                  <input
                    name="notas"
                    value={formulario.notas}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  />
                </label>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/95 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cerrar}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={guardando}
                className="rounded-2xl bg-[linear-gradient(135deg,_#1e293b,_#334155,_#475569)] px-6 py-3 text-sm font-semibold text-white"
              >
                {guardando
                  ? "Guardando..."
                  : esEdicion
                  ? "Guardar cambios"
                  : "Guardar credencial"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ModalCredencial;