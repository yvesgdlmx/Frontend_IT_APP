import { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCheck,
  FiClock,
  FiEdit2,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import clienteAxios from "../config/clienteAxios.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ToastMensaje from "../components/ui/ToastMensaje";

const meses = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const estadoInicial = {
  titulo: "",
  tipo: "software",
  categoria: "acceso",
  usuarioAfectado: "",
  area: "",
  descripcion: "",
  prioridad: "media",
  estado: "abierta",
  fechaIncidencia: "",
  fechaResolucion: "",
};

const estadoClase = {
  abierta: "border-sky-200 bg-sky-50 text-sky-700",
  en_proceso: "border-amber-200 bg-amber-50 text-amber-700",
  resuelta: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelada: "border-rose-200 bg-rose-50 text-rose-700",
};

const prioridadClase = {
  baja: "border-emerald-200 bg-emerald-50 text-emerald-700",
  media: "border-slate-200 bg-slate-50 text-slate-700",
  alta: "border-amber-200 bg-amber-50 text-amber-700",
  critica: "border-rose-200 bg-rose-50 text-rose-700",
};

const etiqueta = (valor) => String(valor || "").replace(/_/g, " ");

const fechaLocalInput = () => {
  const fecha = new Date();
  const offset = fecha.getTimezoneOffset() * 60000;
  return new Date(fecha - offset).toISOString().slice(0, 16);
};

const formatearFecha = (valor) => {
  if (!valor) return "-";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "-";

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha);
};

const prepararFechaInput = (valor) => {
  if (!valor) return "";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "";
  const offset = fecha.getTimezoneOffset() * 60000;
  return new Date(fecha - offset).toISOString().slice(0, 16);
};

const Incidencias = () => {
  const [incidencias, setIncidencias] = useState([]);
  const [formulario, setFormulario] = useState({ ...estadoInicial, fechaIncidencia: fechaLocalInput() });
  const [incidenciaEditar, setIncidenciaEditar] = useState(null);
  const [incidenciaEliminar, setIncidenciaEliminar] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const [periodoCierre, setPeriodoCierre] = useState({
    anio: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
  });
  const [previewCierre, setPreviewCierre] = useState(null);
  const [cierres, setCierres] = useState([]);
  const [cargandoPreview, setCargandoPreview] = useState(false);
  const [guardandoCierre, setGuardandoCierre] = useState(false);

  const cargarIncidencias = async () => {
    setCargando(true);

    try {
      const { data } = await clienteAxios.get("/incidencias");
      setIncidencias(Array.isArray(data) ? data : []);
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible cargar las incidencias.",
      });
    } finally {
      setCargando(false);
    }
  };

  const cargarCierres = async (anio = periodoCierre.anio) => {
    try {
      const { data } = await clienteAxios.get(`/incidencias/cierres?anio=${anio}`);
      setCierres(Array.isArray(data) ? data : []);
    } catch (error) {
      setCierres([]);
    }
  };

  useEffect(() => {
    cargarIncidencias();
  }, []);

  useEffect(() => {
    cargarCierres(periodoCierre.anio);
  }, [periodoCierre.anio]);

  const resumen = useMemo(
    () => ({
      total: incidencias.length,
      abiertas: incidencias.filter((item) => item.estado === "abierta").length,
      proceso: incidencias.filter((item) => item.estado === "en_proceso").length,
      resueltas: incidencias.filter((item) => item.estado === "resuelta").length,
    }),
    [incidencias]
  );

  const incidenciasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return incidencias.filter((item) => {
      const fecha = new Date(item.fechaIncidencia);
      const coincidePeriodo =
        !Number.isNaN(fecha.getTime()) &&
        fecha.getFullYear() === periodoCierre.anio &&
        fecha.getMonth() + 1 === periodoCierre.mes;

      if (!coincidePeriodo) return false;
      if (filtroEstado !== "todos" && item.estado !== filtroEstado) return false;
      if (!termino) return true;

      return [item.folio, item.titulo, item.tipo, item.categoria, item.usuarioAfectado, item.area]
        .filter(Boolean)
        .some((valor) => valor.toLowerCase().includes(termino));
    });
  }, [incidencias, busqueda, filtroEstado, periodoCierre]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormulario((prev) => {
      const siguiente = { ...prev, [name]: value };

      if (name === "estado" && value === "resuelta" && !siguiente.fechaResolucion) {
        siguiente.fechaResolucion = fechaLocalInput();
      }

      if (name === "estado" && value !== "resuelta") {
        siguiente.fechaResolucion = "";
      }

      return siguiente;
    });
  };

  const limpiarFormulario = () => {
    setFormulario({ ...estadoInicial, fechaIncidencia: fechaLocalInput() });
    setIncidenciaEditar(null);
  };

  const guardarIncidencia = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      if (incidenciaEditar) {
        const { data } = await clienteAxios.put(`/incidencias/${incidenciaEditar.id}`, formulario);
        setIncidencias((prev) => prev.map((item) => (item.id === data.id ? data : item)));
        setMensaje({ tipo: "success", texto: "Incidencia actualizada correctamente." });
      } else {
        const { data } = await clienteAxios.post("/incidencias", formulario);
        setIncidencias((prev) => [data, ...prev]);
        setMensaje({ tipo: "success", texto: "Incidencia creada correctamente." });
      }

      limpiarFormulario();
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible guardar la incidencia.",
      });
    } finally {
      setGuardando(false);
    }
  };

  const editarIncidencia = (incidencia) => {
    setIncidenciaEditar(incidencia);
    setFormulario({
      titulo: incidencia.titulo || "",
      tipo: incidencia.tipo || "software",
      categoria: incidencia.categoria || "acceso",
      usuarioAfectado: incidencia.usuarioAfectado || "",
      area: incidencia.area || "",
      descripcion: incidencia.descripcion || "",
      prioridad: incidencia.prioridad || "media",
      estado: incidencia.estado || "abierta",
      fechaIncidencia: prepararFechaInput(incidencia.fechaIncidencia),
      fechaResolucion: prepararFechaInput(incidencia.fechaResolucion),
    });
  };

  const resolverIncidencia = async (incidencia) => {
    try {
      const { data } = await clienteAxios.patch(`/incidencias/${incidencia.id}/estado`, {
        estado: incidencia.estado === "resuelta" ? "abierta" : "resuelta",
        fechaResolucion: incidencia.estado === "resuelta" ? null : new Date().toISOString(),
      });
      setIncidencias((prev) => prev.map((item) => (item.id === data.id ? data : item)));
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible cambiar el estado.",
      });
    }
  };

  const confirmarEliminar = async () => {
    if (!incidenciaEliminar) return;

    setEliminando(true);

    try {
      await clienteAxios.delete(`/incidencias/${incidenciaEliminar.id}`);
      setIncidencias((prev) => prev.filter((item) => item.id !== incidenciaEliminar.id));
      setIncidenciaEliminar(null);
      if (incidenciaEditar?.id === incidenciaEliminar.id) limpiarFormulario();
      setMensaje({ tipo: "success", texto: "Incidencia eliminada correctamente." });
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible eliminar la incidencia.",
      });
    } finally {
      setEliminando(false);
    }
  };

  const cambiarPeriodoCierre = (campo, valor) => {
    setPeriodoCierre((prev) => ({ ...prev, [campo]: Number(valor) }));
    setPreviewCierre(null);
  };

  const generarPreviewCierre = async () => {
    setCargandoPreview(true);

    try {
      const { data } = await clienteAxios.get(
        `/incidencias/cierres/preview?anio=${periodoCierre.anio}&mes=${periodoCierre.mes}`
      );
      setPreviewCierre(data);
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible calcular el cierre.",
      });
    } finally {
      setCargandoPreview(false);
    }
  };

  const guardarCierre = async () => {
    setGuardandoCierre(true);

    try {
      const { data } = await clienteAxios.post("/incidencias/cierres", {
        ...periodoCierre,
      });
      setCierres((prev) => {
        const sinActual = prev.filter((item) => !(item.anio === data.anio && item.mes === data.mes));
        return [...sinActual, data].sort((a, b) => a.mes - b.mes);
      });
      setPreviewCierre(data);
      setMensaje({ tipo: "success", texto: "Cierre mensual de incidencias guardado correctamente." });
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible guardar el cierre.",
      });
    } finally {
      setGuardandoCierre(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[linear-gradient(180deg,_#f4f8ff_0%,_#f8fafc_32%,_#ffffff_100%)] px-4 py-4 sm:px-6 sm:py-6 2xl:px-8">
        <div className="mx-auto w-full max-w-[1600px] space-y-5">
          <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Control operativo
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">
                  Incidencias
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Registra incidencias de software, hardware y accesos para alimentar los KPIs mensuales.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  ["Total", resumen.total],
                  ["Abiertas", resumen.abiertas],
                  ["En proceso", resumen.proceso],
                  ["Resueltas", resumen.resueltas],
                ].map(([label, valor]) => (
                  <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{valor}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid items-start gap-5 xl:grid-cols-[0.34fr_0.66fr]">
            <form onSubmit={guardarIncidencia} className="self-start rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <FiAlertCircle />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    {incidenciaEditar ? "Editar incidencia" : "Nueva incidencia"}
                  </p>
                  <p className="text-sm text-slate-500">Datos base para seguimiento y cierre mensual.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-[0.35fr_0.65fr]">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Folio</span>
                    <input
                      value={incidenciaEditar?.folio || "Automatico"}
                      readOnly
                      className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-500 outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Titulo</span>
                    <input name="titulo" value={formulario.titulo} onChange={handleChange} required placeholder="Ej. Usuario sin acceso a ERP" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Tipo</span>
                    <select name="tipo" value={formulario.tipo} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200">
                      <option value="software">Software</option>
                      <option value="hardware">Hardware</option>
                      <option value="acceso">Acceso</option>
                      <option value="sistema">Sistema</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Categoria</span>
                    <select name="categoria" value={formulario.categoria} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200">
                      <option value="acceso">Acceso</option>
                      <option value="contrasena">Contrasena</option>
                      <option value="permisos">Permisos</option>
                      <option value="caida">Caida</option>
                      <option value="equipo">Equipo</option>
                      <option value="licencia">Licencia</option>
                      <option value="otro">Otro</option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Estado</span>
                    <select name="estado" value={formulario.estado} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200">
                      <option value="abierta">Abierta</option>
                      <option value="en_proceso">En proceso</option>
                      <option value="resuelta">Resuelta</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Prioridad</span>
                    <select name="prioridad" value={formulario.prioridad} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200">
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                      <option value="critica">Critica</option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Usuario afectado</span>
                    <input name="usuarioAfectado" value={formulario.usuarioAfectado} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Area</span>
                    <input name="area" value={formulario.area} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Fecha incidencia</span>
                    <input type="datetime-local" name="fechaIncidencia" value={formulario.fechaIncidencia} onChange={handleChange} required className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Fecha resolucion</span>
                    <input type="datetime-local" name="fechaResolucion" value={formulario.fechaResolucion} onChange={handleChange} disabled={formulario.estado !== "resuelta"} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-400" />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Descripcion</span>
                  <textarea name="descripcion" value={formulario.descripcion} onChange={handleChange} rows={3} className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" />
                </label>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button disabled={guardando} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#0f172a,_#1e293b,_#334155)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70">
                    {incidenciaEditar ? <FiCheck size={16} /> : <FiPlus size={16} />}
                    {guardando ? "Guardando..." : incidenciaEditar ? "Guardar cambios" : "Crear incidencia"}
                  </button>
                  {incidenciaEditar ? (
                    <button type="button" onClick={limpiarFormulario} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                      <FiX size={16} />
                      Cancelar
                    </button>
                  ) : null}
                </div>
              </div>
            </form>

            <div className="space-y-5">
              <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)] p-5 sm:p-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <p className="text-base font-semibold text-slate-900">Cierre mensual de incidencias</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Alimenta dos KPIs: total de incidencias y tiempo promedio de resolucion.
                      </p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[110px_160px_auto]">
                      <input type="number" min="2000" max="2100" value={periodoCierre.anio} onChange={(e) => cambiarPeriodoCierre("anio", e.target.value)} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" />
                      <select value={periodoCierre.mes} onChange={(e) => cambiarPeriodoCierre("mes", e.target.value)} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200">
                        {meses.map((mes, index) => (
                          <option key={mes} value={index + 1}>{mes}</option>
                        ))}
                      </select>
                      <button type="button" onClick={generarPreviewCierre} disabled={cargandoPreview} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
                        <FiRefreshCw size={16} />
                        {cargandoPreview ? "Calculando..." : "Calcular"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 p-5 sm:p-6 2xl:grid-cols-[0.58fr_0.42fr]">
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-4">
                      {[
                        ["Total", previewCierre?.totalIncidencias ?? 0],
                        ["Resueltas", previewCierre?.resueltas ?? 0],
                        ["Criticas", previewCierre?.criticas ?? 0],
                        ["Promedio", `${Number(previewCierre?.promedioResolucionHoras || 0).toFixed(2)} h`],
                      ].map(([label, valor]) => (
                        <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
                          <p className="mt-2 text-xl font-semibold text-slate-900">{valor}</p>
                        </div>
                      ))}
                    </div>

                    <button type="button" onClick={guardarCierre} disabled={!previewCierre || guardandoCierre} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#0f172a,_#1e293b,_#334155)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
                      <FiCheck size={16} />
                      {guardandoCierre ? "Guardando..." : "Guardar cierre mensual"}
                    </button>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">Historial del año</p>
                    </div>
                    <div className="max-h-44 overflow-auto">
                      {cierres.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-slate-500">Sin cierres guardados.</p>
                      ) : (
                        cierres.map((cierre) => (
                          <div key={cierre.id} className="grid grid-cols-[1fr_auto] gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{meses[cierre.mes - 1]} {cierre.anio}</p>
                              <p className="mt-1 text-xs text-slate-500">{cierre.totalIncidencias} incidencias · {Number(cierre.promedioResolucionHoras || 0).toFixed(2)} h promedio</p>
                            </div>
                            <p className="text-sm font-semibold text-slate-900">{cierre.resueltas} resueltas</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)] p-5 sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-base font-semibold text-slate-900">Registro de incidencias</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {incidenciasFiltradas.length} registros de {meses[periodoCierre.mes - 1]} {periodoCierre.anio}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <div className="relative">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar incidencia" className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200 sm:w-72" />
                      </div>
                      <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200">
                        <option value="todos">Todos</option>
                        <option value="abierta">Abiertas</option>
                        <option value="en_proceso">En proceso</option>
                        <option value="resuelta">Resueltas</option>
                        <option value="cancelada">Canceladas</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="overflow-hidden rounded-3xl border border-slate-200">
                    <div className="max-h-[285px] overflow-auto">
                      <table className="min-w-full text-sm">
                        <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500 shadow-[0_1px_0_rgba(226,232,240,1)]">
                          <tr>
                            <th className="px-4 py-4 text-left">Incidencia</th>
                            <th className="px-4 py-4 text-left">Tipo</th>
                            <th className="px-4 py-4 text-left">Estado</th>
                            <th className="px-4 py-4 text-left">Prioridad</th>
                            <th className="px-4 py-4 text-left">Fecha</th>
                            <th className="px-4 py-4 text-left">Resolucion</th>
                            <th className="px-4 py-4 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {cargando ? (
                            <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">Cargando incidencias...</td></tr>
                          ) : incidenciasFiltradas.length === 0 ? (
                            <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">Sin incidencias registradas.</td></tr>
                          ) : (
                            incidenciasFiltradas.map((incidencia) => (
                              <tr key={incidencia.id} className="transition hover:bg-slate-50/80">
                                <td className="px-4 py-4">
                                  <p className="font-semibold text-slate-900">{incidencia.titulo}</p>
                                  <p className="mt-1 text-xs text-slate-500">{incidencia.folio || "Sin folio"} · {incidencia.usuarioAfectado || "Sin usuario"}</p>
                                </td>
                                <td className="px-4 py-4 text-slate-700">
                                  <p className="capitalize">{etiqueta(incidencia.tipo)}</p>
                                  <p className="mt-1 text-xs capitalize text-slate-500">{etiqueta(incidencia.categoria)}</p>
                                </td>
                                <td className="px-4 py-4">
                                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${estadoClase[incidencia.estado] || estadoClase.abierta}`}>
                                    {etiqueta(incidencia.estado)}
                                  </span>
                                </td>
                                <td className="px-4 py-4">
                                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${prioridadClase[incidencia.prioridad] || prioridadClase.media}`}>
                                    {incidencia.prioridad}
                                  </span>
                                </td>
                                <td className="px-4 py-4 text-slate-600">{formatearFecha(incidencia.fechaIncidencia)}</td>
                                <td className="px-4 py-4 text-slate-600">
                                  {incidencia.estado === "resuelta" ? `${Number(incidencia.tiempoResolucionHoras || 0).toFixed(2)} h` : "-"}
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => resolverIncidencia(incidencia)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50" title="Resolver">
                                      {incidencia.estado === "resuelta" ? <FiClock size={16} /> : <FiCheck size={16} />}
                                    </button>
                                    <button type="button" onClick={() => editarIncidencia(incidencia)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50" title="Editar">
                                      <FiEdit2 size={16} />
                                    </button>
                                    <button type="button" onClick={() => setIncidenciaEliminar(incidencia)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100" title="Eliminar">
                                      <FiTrash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        abierto={Boolean(incidenciaEliminar)}
        titulo="Eliminar incidencia"
        descripcion={
          incidenciaEliminar
            ? `Se eliminara "${incidenciaEliminar.titulo}". Esta accion no se puede deshacer.`
            : ""
        }
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        cargando={eliminando}
        onConfirmar={confirmarEliminar}
        onCancelar={() => {
          if (eliminando) return;
          setIncidenciaEliminar(null);
        }}
      />

      <ToastMensaje
        abierto={Boolean(mensaje.texto)}
        tipo={mensaje.tipo || "info"}
        texto={mensaje.texto}
        onClose={() => setMensaje({ tipo: "", texto: "" })}
      />
    </>
  );
};

export default Incidencias;
