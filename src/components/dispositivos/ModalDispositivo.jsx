import React, { useMemo, useState } from "react";
import { tiposEquipo } from "../../utils/equipos.js";

const areasDispositivos = [
  "Contabilidad",
  "Comercio Exterior",
  "Pagos y Compras",
  "Recursos Humanos",
  "Capacitacion",
  "Oficina de valores",
  "Mantenimiento",
  "Produccion Linea automatica",
  "Produccion Biselado",
  "Produccion Armado",
  "Produccion AR",
  "Almacen",
  "Direccion",
];

const crearFormularioInicial = () => ({
  marca: "",
  modelo: "",
  serie: "",
  tipoEquipo: "",
  nombreSistema: "",
  area: "",
  usuarioActual: "",
  estadoInventario: "operacion",
  observaciones: "",
  tipoAsignacion: "padre",
  cuentaRelacionadaId: "",
});

const mapearDispositivoAFormulario = (dispositivo) => ({
  marca: dispositivo?.marca || "",
  modelo: dispositivo?.modelo || "",
  serie: dispositivo?.serie || "",
  tipoEquipo: dispositivo?.tipoEquipo || "",
  nombreSistema: dispositivo?.nombreSistema || "",
  area: dispositivo?.area || "",
  usuarioActual: dispositivo?.usuarioActual || "",
  estadoInventario: dispositivo?.estadoInventario || "operacion",
  observaciones: dispositivo?.observaciones || "",
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
  const [mostrarOffice, setMostrarOffice] = useState(Boolean(inicial.cuentaRelacionadaId));

  const opcionesRelacionadas = useMemo(
    () => (formulario.tipoAsignacion === "hija" ? cuentasHija : cuentasPadre),
    [formulario.tipoAsignacion, cuentasHija, cuentasPadre]
  );

  const opcionesAreas = useMemo(() => {
    const areaActual = formulario.area?.trim();

    if (!areaActual || areasDispositivos.includes(areaActual)) {
      return areasDispositivos;
    }

    return [areaActual, ...areasDispositivos];
  }, [formulario.area]);

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

    // ❌ YA NO ES OBLIGATORIO

    setError("");

    const payload = {
      marca: formulario.marca.trim(),
      modelo: formulario.modelo.trim(),
      serie: formulario.serie.trim(),
      tipoEquipo: formulario.tipoEquipo.trim(),
      nombreSistema: formulario.nombreSistema.trim(),
      area: formulario.area.trim(),
      usuarioActual: formulario.usuarioActual.trim(),
      estadoInventario: formulario.estadoInventario,
      observaciones: formulario.observaciones.trim(),

      // ✅ SOLO SI EXISTE CUENTA
      cuentaPadreId:
        formulario.tipoAsignacion === "padre" && formulario.cuentaRelacionadaId
          ? formulario.cuentaRelacionadaId
          : null,

      cuentaHijaId:
        formulario.tipoAsignacion === "hija" && formulario.cuentaRelacionadaId
          ? formulario.cuentaRelacionadaId
          : null,
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
              {esEdicion ? "Editar equipo" : "Nuevo equipo"}
            </div>
            <h2 className="mt-3 text-[1.75rem] font-semibold leading-tight text-slate-900">
              {esEdicion ? "Actualizar equipo" : "Registrar equipo"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Registra computadoras, periféricos y otros equipos. La cuenta Office es opcional; las licencias se vinculan desde Licencias.
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
                  <span className="mb-2 block text-sm font-medium text-slate-700">Modelo</span>
                  <input
                    name="modelo"
                    value={formulario.modelo}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    placeholder="Modelo"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Serie</span>
                  <input
                    name="serie"
                    value={formulario.serie}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    placeholder="Numero de serie"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Tipo de equipo</span>
                  <select
                    name="tipoEquipo"
                    value={formulario.tipoEquipo}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    required
                  >
                    <option value="">Selecciona tipo</option>
                    {formulario.tipoEquipo && !tiposEquipo.some((tipo) => tipo.valor === formulario.tipoEquipo) ? (
                      <option value={formulario.tipoEquipo}>{formulario.tipoEquipo}</option>
                    ) : null}
                    {tiposEquipo.map((tipo) => <option key={tipo.valor} value={tipo.valor}>{tipo.label}</option>)}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Nombre o identificador del equipo</span>
                  <input
                    name="nombreSistema"
                    value={formulario.nombreSistema}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    placeholder="PC-VENTAS-01, TECLADO-001..."
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Área</span>
                  <select
                    name="area"
                    value={formulario.area}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  >
                    <option value="">Sin area asignada</option>
                    {opcionesAreas.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Usuario o responsable</span>
                  <input
                    name="usuarioActual"
                    value={formulario.usuarioActual}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    placeholder="Nombre del usuario o responsable"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Estado inventario</span>
                  <select
                    name="estadoInventario"
                    value={formulario.estadoInventario}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  >
                    <option value="operacion">En operacion</option>
                    <option value="resguardo">Resguardo</option>
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="baja">Baja</option>
                  </select>
                </label>

                <label className="block md:col-span-2 xl:col-span-3">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Observaciones</span>
                  <textarea
                    name="observaciones"
                    value={formulario.observaciones}
                    onChange={handleChange}
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    placeholder="Ubicacion, condicion o detalle de inventario"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <button
                type="button"
                onClick={() => setMostrarOffice((prev) => !prev)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Office 365 opcional
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">
                    {mostrarOffice ? "Ocultar cuenta Office" : "Asignar cuenta Office"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Usa esto solo si el equipo debe quedar relacionado con una cuenta 365.
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                  {mostrarOffice ? "Ocultar" : "Mostrar"}
                </span>
              </button>

              {mostrarOffice ? (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
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
                    >
                      <option value="">Sin asignar</option>
                      {opcionesRelacionadas.map((cuenta) => (
                        <option key={cuenta.id} value={cuenta.id}>
                          {cuenta.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}
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
