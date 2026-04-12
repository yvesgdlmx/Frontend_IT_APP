import React, { useMemo, useState } from "react";

const crearFormularioInicial = () => ({
  marca: "",
  tipoEquipo: "",
  nombreSistema: "",
  area: "",
  usuarioActual: "",
  tipoAsignacion: "padre",
  cuentaRelacionadaId: "",
});

const mapearDispositivoAFormulario = (dispositivo) => ({
  marca: dispositivo?.marca || "",
  tipoEquipo: dispositivo?.tipoEquipo || "",
  nombreSistema: dispositivo?.nombreSistema || "",
  area: dispositivo?.area || "",
  usuarioActual: dispositivo?.usuarioActual || "",
  tipoAsignacion: dispositivo?.cuentaHijaId ? "hija" : "padre",
  cuentaRelacionadaId: dispositivo?.cuentaHijaId || dispositivo?.cuentaPadreId || "",
});

const ModalDispositivo = ({
  abierto,
  cerrar,
  onGuardar,
  guardando = false,
  modo = "crear",
  dispositivoInicial = null,
  cuentasPadre = [],
  cuentasHija = [],
}) => {
  const inicial = modo === "editar" && dispositivoInicial
    ? mapearDispositivoAFormulario(dispositivoInicial)
    : crearFormularioInicial();

  const [formulario, setFormulario] = useState(inicial);
  const [error, setError] = useState("");

  const opcionesRelacionadas = useMemo(
    () => (formulario.tipoAsignacion === "hija" ? cuentasHija : cuentasPadre),
    [formulario.tipoAsignacion, cuentasHija, cuentasPadre]
  );

  if (!abierto) return null;

  const esEdicion = modo === "editar";

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormulario((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "tipoAsignacion" ? { cuentaRelacionadaId: "" } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formulario.cuentaRelacionadaId) {
      setError("Debes seleccionar una cuenta para asignar el dispositivo.");
      return;
    }

    setError("");

    const payload = {
      marca: formulario.marca.trim(),
      tipoEquipo: formulario.tipoEquipo.trim(),
      nombreSistema: formulario.nombreSistema.trim(),
      area: formulario.area.trim(),
      usuarioActual: formulario.usuarioActual.trim(),
      cuentaPadreId:
        formulario.tipoAsignacion === "padre" ? formulario.cuentaRelacionadaId : null,
      cuentaHijaId:
        formulario.tipoAsignacion === "hija" ? formulario.cuentaRelacionadaId : null,
    };

    const ok = await onGuardar(payload);
    if (ok) cerrar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={cerrar} />

      <div className="relative w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.24)]">
        <button
          type="button"
          className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-2xl text-slate-500 transition hover:bg-slate-50 hover:text-rose-500"
          onClick={cerrar}
          aria-label="Cerrar"
        >
          ×
        </button>

        <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.14),_transparent_28%),linear-gradient(135deg,_#f8fafc,_#ffffff)] px-6 py-5 sm:px-8">
          <div className="pr-14">
            <div className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700">
              {esEdicion ? "Editar dispositivo" : "Nuevo dispositivo"}
            </div>
            <h2 className="mt-3 text-[1.75rem] font-semibold leading-tight text-slate-900">
              {esEdicion ? "Actualizar dispositivo" : "Registrar y asignar dispositivo"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Completa los datos del equipo y asígnalo a una cuenta padre o hija de microsoft office.
            </p>
          </div>
        </div>

        <section className="max-h-[78vh] overflow-y-auto bg-slate-50 px-6 py-5 sm:px-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                  Datos del equipo
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  Información principal
                </h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Marca</span>
                  <input
                    name="marca"
                    value={formulario.marca}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    placeholder="Dell, HP, Lenovo..."
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Tipo de equipo</span>
                  <input
                    name="tipoEquipo"
                    value={formulario.tipoEquipo}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    placeholder="Laptop, Desktop, Mini PC..."
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Nombre del sistema</span>
                  <input
                    name="nombreSistema"
                    value={formulario.nombreSistema}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    placeholder="PC-VENTAS-01"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Área</span>
                  <input
                    name="area"
                    value={formulario.area}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    placeholder="Ventas, TI, Dirección..."
                  />
                </label>

                <label className="block md:col-span-2 xl:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Usuario actual</span>
                  <input
                    name="usuarioActual"
                    value={formulario.usuarioActual}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    placeholder="Nombre del usuario o responsable"
                    required
                  />
                </label>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  Paquete office
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  Cuenta relacionada
                </h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Tipo de cuenta</span>
                  <select
                    name="tipoAsignacion"
                    value={formulario.tipoAsignacion}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  >
                    <option value="padre">Cuenta padre</option>
                    <option value="hija">Cuenta hija</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Cuenta</span>
                  <select
                    name="cuentaRelacionadaId"
                    value={formulario.cuentaRelacionadaId}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    required
                  >
                    <option value="">Selecciona una cuenta</option>
                    {opcionesRelacionadas.map((cuenta) => (
                      <option key={cuenta.id} value={cuenta.id}>
                        {cuenta.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/95 pt-4 backdrop-blur sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                onClick={cerrar}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-2xl bg-[linear-gradient(135deg,_#1e293b,_#334155,_#475569)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={guardando}
              >
                {guardando ? (esEdicion ? "Guardando cambios..." : "Guardando dispositivo...") : esEdicion ? "Guardar cambios" : "Guardar dispositivo"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ModalDispositivo;
