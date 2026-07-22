import { useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiCpu,
  FiDollarSign,
  FiEdit2,
  FiKey,
  FiMonitor,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import clienteAxios from "../config/clienteAxios.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ToastMensaje from "../components/ui/ToastMensaje";

const estadoInicial = {
  nombre: "",
  proveedor: "",
  categoria: "software",
  plan: "",
  cantidadTotal: 1,
  cantidadUsada: 0,
  costo: "",
  moneda: "MXN",
  fechaCompra: "",
  fechaVencimiento: "",
  renovacion: "anual",
  responsable: "",
  estado: "activa",
  notas: "",
};

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

const estadoClase = {
  activa: "border-emerald-200 bg-emerald-50 text-emerald-700",
  por_vencer: "border-amber-200 bg-amber-50 text-amber-700",
  vencida: "border-rose-200 bg-rose-50 text-rose-700",
  inactiva: "border-slate-200 bg-slate-100 text-slate-700",
};

const estadoLabel = {
  activa: "Activa",
  por_vencer: "Por vencer",
  vencida: "Vencida",
  inactiva: "Inactiva",
};

const calcularDias = (fecha) => {
  if (!fecha) return null;
  const vencimiento = new Date(`${fecha}T00:00:00`);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
};

const formatoDinero = (valor, moneda) => {
  if (valor === null || valor === undefined || valor === "") return "Sin costo";

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: moneda || "MXN",
  }).format(Number(valor));
};

const Licencias = () => {
  const [licencias, setLicencias] = useState([]);
  const [dispositivos, setDispositivos] = useState([]);
  const [cierres, setCierres] = useState([]);
  const [previewCierre, setPreviewCierre] = useState(null);
  const [periodoCierre, setPeriodoCierre] = useState({
    anio: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
  });
  const [comentarioCierre, setComentarioCierre] = useState("");
  const [formulario, setFormulario] = useState(estadoInicial);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardandoCierre, setGuardandoCierre] = useState(false);
  const [cargandoPreview, setCargandoPreview] = useState(false);
  const [asignando, setAsignando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [liberandoId, setLiberandoId] = useState("");
  const [licenciaEditar, setLicenciaEditar] = useState(null);
  const [licenciaEliminar, setLicenciaEliminar] = useState(null);
  const [licenciaSeleccionada, setLicenciaSeleccionada] = useState(null);
  const [dispositivoAsignar, setDispositivoAsignar] = useState("");
  const [notasAsignacion, setNotasAsignacion] = useState("");
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  const cargarLicencias = async () => {
    setCargando(true);

    try {
      const [respuestaLicencias, respuestaDispositivos] = await Promise.all([
        clienteAxios.get("/licencias"),
        clienteAxios.get("/dispositivos"),
      ]);

      setLicencias(Array.isArray(respuestaLicencias.data) ? respuestaLicencias.data : []);
      setDispositivos(Array.isArray(respuestaDispositivos.data) ? respuestaDispositivos.data : []);
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible cargar las licencias.",
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarLicencias();
  }, []);

  const cargarCierres = async () => {
    try {
      const { data } = await clienteAxios.get(`/licencias/cierres?anio=${periodoCierre.anio}`);
      setCierres(Array.isArray(data) ? data : []);
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible cargar los cierres mensuales.",
      });
    }
  };

  useEffect(() => {
    cargarCierres();
  }, [periodoCierre.anio]);

  useEffect(() => {
    if (!licenciaSeleccionada) return;

    const actualizada = licencias.find((item) => item.id === licenciaSeleccionada.id);
    setLicenciaSeleccionada(actualizada || null);
  }, [licencias, licenciaSeleccionada]);

  const resumen = useMemo(
    () => ({
      total: licencias.length,
      activas: licencias.filter((item) => item.estado === "activa").length,
      porVencer: licencias.filter((item) => item.estado === "por_vencer").length,
      asientos: licencias.reduce((acc, item) => acc + Number(item.cantidadTotal || 0), 0),
    }),
    [licencias]
  );

  const dispositivosDisponibles = useMemo(() => {
    if (!licenciaSeleccionada) return [];

    const asignados = new Set(
      (licenciaSeleccionada.asignaciones || [])
        .map((asignacion) => asignacion.dispositivo?.id)
        .filter(Boolean)
    );

    return dispositivos.filter((dispositivo) => !asignados.has(dispositivo.id));
  }, [dispositivos, licenciaSeleccionada]);

  const licenciasFiltradas = licencias.filter((item) => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return true;

    return [
      item.nombre,
      item.proveedor,
      item.categoria,
      item.plan,
      item.responsable,
      estadoLabel[item.estado],
    ]
      .filter(Boolean)
      .some((valor) => valor.toLowerCase().includes(termino));
  });

  const handleChange = (e) => {
    setFormulario((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePeriodoCierre = (e) => {
    setPeriodoCierre((prev) => ({
      ...prev,
      [e.target.name]: Number(e.target.value),
    }));
    setPreviewCierre(null);
  };

  const limpiarFormulario = () => {
    setFormulario(estadoInicial);
    setLicenciaEditar(null);
  };

  const seleccionarLicencia = (licencia) => {
    setLicenciaSeleccionada(licencia);
    setDispositivoAsignar("");
    setNotasAsignacion("");
  };

  const guardarLicencia = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      if (licenciaEditar) {
        const { data } = await clienteAxios.put(`/licencias/${licenciaEditar.id}`, formulario);
        setLicencias((prev) => prev.map((item) => (item.id === data.id ? data : item)));
        setMensaje({ tipo: "success", texto: "Licencia actualizada correctamente." });
      } else {
        const { data } = await clienteAxios.post("/licencias", formulario);
        setLicencias((prev) => [data, ...prev]);
        setMensaje({ tipo: "success", texto: "Licencia registrada correctamente." });
      }

      limpiarFormulario();
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible guardar la licencia.",
      });
    } finally {
      setGuardando(false);
    }
  };

  const abrirEditar = (licencia) => {
    setLicenciaEditar(licencia);
    setFormulario({
      nombre: licencia.nombre || "",
      proveedor: licencia.proveedor || "",
      categoria: licencia.categoria || "software",
      plan: licencia.plan || "",
      cantidadTotal: licencia.cantidadTotal || 1,
      cantidadUsada: licencia.cantidadUsada || 0,
      costo: licencia.costo || "",
      moneda: licencia.moneda || "MXN",
      fechaCompra: licencia.fechaCompra || "",
      fechaVencimiento: licencia.fechaVencimiento || "",
      renovacion: licencia.renovacion || "anual",
      responsable: licencia.responsable || "",
      estado: licencia.estado || "activa",
      notas: licencia.notas || "",
    });
  };

  const confirmarEliminar = async () => {
    if (!licenciaEliminar) return;

    setEliminando(true);

    try {
      await clienteAxios.delete(`/licencias/${licenciaEliminar.id}`);
      setLicencias((prev) => prev.filter((item) => item.id !== licenciaEliminar.id));
      setLicenciaEliminar(null);
      setMensaje({ tipo: "success", texto: "Licencia eliminada correctamente." });
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible eliminar la licencia.",
      });
    } finally {
      setEliminando(false);
    }
  };

  const asignarDispositivo = async (e) => {
    e.preventDefault();

    if (!licenciaSeleccionada || !dispositivoAsignar) {
      setMensaje({ tipo: "error", texto: "Selecciona una licencia y un dispositivo." });
      return;
    }

    setAsignando(true);

    try {
      const { data } = await clienteAxios.post(`/licencias/${licenciaSeleccionada.id}/dispositivos`, {
        dispositivoId: dispositivoAsignar,
        notas: notasAsignacion,
      });

      setLicencias((prev) => prev.map((item) => (item.id === data.id ? data : item)));
      setLicenciaSeleccionada(data);
      setDispositivoAsignar("");
      setNotasAsignacion("");
      setMensaje({ tipo: "success", texto: "Dispositivo asignado a la licencia." });
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible asignar el dispositivo.",
      });
    } finally {
      setAsignando(false);
    }
  };

  const liberarAsignacion = async (asignacion) => {
    setLiberandoId(asignacion.id);

    try {
      const { data } = await clienteAxios.patch(`/licencias/asignaciones/${asignacion.id}/liberar`);
      setLicencias((prev) => prev.map((item) => (item.id === data.id ? data : item)));
      setLicenciaSeleccionada(data);
      setMensaje({ tipo: "success", texto: "Licencia liberada del dispositivo." });
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible liberar la licencia.",
      });
    } finally {
      setLiberandoId("");
    }
  };

  const generarPreviewCierre = async () => {
    setCargandoPreview(true);

    try {
      const { data } = await clienteAxios.get(
        `/licencias/cierres/preview?anio=${periodoCierre.anio}&mes=${periodoCierre.mes}`
      );
      setPreviewCierre(data);
      setComentarioCierre(data.comentario || "");
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible generar el cierre.",
      });
    } finally {
      setCargandoPreview(false);
    }
  };

  const guardarCierre = async () => {
    if (!previewCierre) {
      setMensaje({ tipo: "error", texto: "Genera una vista previa antes de guardar el cierre." });
      return;
    }

    setGuardandoCierre(true);

    try {
      const { data } = await clienteAxios.post("/licencias/cierres", {
        ...previewCierre,
        comentario: comentarioCierre,
        manual: true,
      });

      setCierres((prev) => {
        const existe = prev.some((item) => item.id === data.id);
        if (existe) return prev.map((item) => (item.id === data.id ? data : item));
        return [data, ...prev].sort((a, b) => b.mes - a.mes);
      });
      setMensaje({ tipo: "success", texto: "Cierre mensual guardado correctamente." });
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
              <div className="max-w-2xl">
                <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Inventario de software
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">
                  Licencias
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Administra licencias, suscripciones, renovaciones y capacidad contratada.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Total</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{resumen.total}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Activas</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{resumen.activas}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Por vencer</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{resumen.porVencer}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Asientos</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{resumen.asientos}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[0.36fr_0.64fr]">
            <form onSubmit={guardarLicencia} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <FiKey />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    {licenciaEditar ? "Editar licencia" : "Nueva licencia"}
                  </p>
                  <p className="text-sm text-slate-500">Registra software, servicios o suscripciones.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Nombre</span>
                    <input name="nombre" value={formulario.nombre} onChange={handleChange} required className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" placeholder="Adobe, antivirus..." />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Proveedor</span>
                    <input name="proveedor" value={formulario.proveedor} onChange={handleChange} required className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" placeholder="Microsoft, Google..." />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Categoria</span>
                    <input name="categoria" value={formulario.categoria} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" placeholder="software" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Plan</span>
                    <input name="plan" value={formulario.plan} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" placeholder="Business, Pro..." />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Total</span>
                    <input type="number" min="1" name="cantidadTotal" value={formulario.cantidadTotal} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" />
                  </label>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Uso automatico</span>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      Se calcula con dispositivos asignados
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Costo</span>
                    <input type="number" step="0.01" name="costo" value={formulario.costo} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Moneda</span>
                    <input name="moneda" value={formulario.moneda} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Vencimiento</span>
                    <input type="date" name="fechaVencimiento" value={formulario.fechaVencimiento} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Renovacion</span>
                    <select name="renovacion" value={formulario.renovacion} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200">
                      <option value="mensual">Mensual</option>
                      <option value="anual">Anual</option>
                      <option value="unica">Unica</option>
                      <option value="otro">Otro</option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Estado</span>
                    <select name="estado" value={formulario.estado} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200">
                      <option value="activa">Activa</option>
                      <option value="por_vencer">Por vencer</option>
                      <option value="vencida">Vencida</option>
                      <option value="inactiva">Inactiva</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Responsable</span>
                    <input name="responsable" value={formulario.responsable} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Notas</span>
                  <textarea name="notas" value={formulario.notas} onChange={handleChange} rows={3} className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" />
                </label>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button disabled={guardando} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#0f172a,_#1e293b,_#334155)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:brightness-110 disabled:opacity-70">
                    <FiPlus />
                    {guardando ? "Guardando..." : licenciaEditar ? "Guardar cambios" : "Crear licencia"}
                  </button>
                  {licenciaEditar ? (
                    <button type="button" onClick={limpiarFormulario} className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                      Cancelar
                    </button>
                  ) : null}
                </div>
              </div>
            </form>

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)] p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-base font-semibold text-slate-900">Licencias registradas</p>
                    <p className="mt-1 text-sm text-slate-500">Consulta uso, costos y renovaciones.</p>
                  </div>
                  <div className="relative">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar licencia" className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200 sm:w-80" />
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="overflow-hidden rounded-3xl border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                        <tr>
                          <th className="px-4 py-4 text-left">Licencia</th>
                          <th className="px-4 py-4 text-left">Uso</th>
                          <th className="px-4 py-4 text-left">Costo</th>
                          <th className="px-4 py-4 text-left">Vencimiento</th>
                          <th className="px-4 py-4 text-left">Estado</th>
                          <th className="px-4 py-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {cargando ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-slate-500">Cargando licencias...</td>
                          </tr>
                        ) : licenciasFiltradas.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-slate-500">No encontramos licencias.</td>
                          </tr>
                        ) : (
                          licenciasFiltradas.map((item) => {
                            const porcentaje = (Number(item.cantidadUsada || 0) / Number(item.cantidadTotal || 1)) * 100;
                            const dias = calcularDias(item.fechaVencimiento);

                            return (
                              <tr key={item.id} className="transition hover:bg-slate-50/80">
                                <td className="px-4 py-4">
                                  <p className="font-semibold text-slate-900">{item.nombre}</p>
                                  <p className="mt-1 text-xs text-slate-500">{item.proveedor} · {item.plan || item.categoria}</p>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex min-w-[160px] items-center gap-3">
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                      <div className="h-full rounded-full bg-[linear-gradient(90deg,_#0ea5e9,_#2563eb)]" style={{ width: `${Math.min(porcentaje, 100)}%` }} />
                                    </div>
                                    <span className="whitespace-nowrap text-xs font-medium text-slate-500">
                                      {item.cantidadUsada}/{item.cantidadTotal}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-2 text-slate-700">
                                    <FiDollarSign className="text-slate-400" />
                                    {formatoDinero(item.costo, item.moneda)}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-2 text-slate-700">
                                    <FiCalendar className="text-slate-400" />
                                    <span>{item.fechaVencimiento || "Sin fecha"}</span>
                                  </div>
                                  {dias !== null ? (
                                    <p className="mt-1 text-xs text-slate-500">
                                      {dias < 0 ? `Vencio hace ${Math.abs(dias)} dias` : `${dias} dias restantes`}
                                    </p>
                                  ) : null}
                                </td>
                                <td className="px-4 py-4">
                                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${estadoClase[item.estado] || estadoClase.activa}`}>
                                    {estadoLabel[item.estado] || "Activa"}
                                  </span>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex justify-end gap-2">
                                    <button onClick={() => seleccionarLicencia(item)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700 transition hover:bg-sky-100" title="Asignar dispositivos">
                                      <FiMonitor size={15} />
                                    </button>
                                    <button onClick={() => abrirEditar(item)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50" title="Editar">
                                      <FiEdit2 size={15} />
                                    </button>
                                    <button onClick={() => setLicenciaEliminar(item)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100" title="Eliminar">
                                      <FiTrash2 size={15} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  KPI mensual
                </div>
                <h2 className="mt-3 text-lg font-semibold text-slate-900">
                  Cierre mensual de licencias
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Guarda la foto mensual para reportar licencias utilizadas / contratadas.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-[120px_180px_auto]">
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  name="anio"
                  value={periodoCierre.anio}
                  onChange={handlePeriodoCierre}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                />
                <select
                  name="mes"
                  value={periodoCierre.mes}
                  onChange={handlePeriodoCierre}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                >
                  {meses.map((mes, index) => (
                    <option key={mes} value={index + 1}>
                      {mes}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={generarPreviewCierre}
                  disabled={cargandoPreview}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#0f172a,_#1e293b,_#334155)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cargandoPreview ? "Calculando..." : "Generar cierre"}
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[0.42fr_0.58fr]">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {previewCierre ? `${meses[previewCierre.mes - 1]} ${previewCierre.anio}` : "Vista previa"}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    ["Contratadas", previewCierre?.totalContratadas ?? "-"],
                    ["Utilizadas", previewCierre?.totalUtilizadas ?? "-"],
                    ["Disponibles", previewCierre?.totalDisponibles ?? "-"],
                    ["KPI", previewCierre ? `${Number(previewCierre.porcentajeUso || 0).toFixed(2)}%` : "-"],
                  ].map(([label, valor]) => (
                    <div key={label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{valor}</p>
                    </div>
                  ))}
                </div>

                <label className="mt-4 block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Comentario</span>
                  <textarea
                    value={comentarioCierre}
                    onChange={(e) => setComentarioCierre(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                    placeholder="Notas para el asesor, ajustes o contexto del mes..."
                  />
                </label>

                <button
                  type="button"
                  onClick={guardarCierre}
                  disabled={guardandoCierre || !previewCierre}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {guardandoCierre ? "Guardando..." : "Guardar cierre mensual"}
                </button>
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">Historial de cierres</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Registros guardados para {periodoCierre.anio}.
                  </p>
                </div>

                <div className="max-h-[360px] overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Mes</th>
                        <th className="px-4 py-3 text-left">Contratadas</th>
                        <th className="px-4 py-3 text-left">Usadas</th>
                        <th className="px-4 py-3 text-left">KPI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {cierres.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-4 py-10 text-center text-slate-500">
                            Sin cierres guardados.
                          </td>
                        </tr>
                      ) : (
                        cierres.map((cierre) => (
                          <tr key={cierre.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {meses[cierre.mes - 1]}
                            </td>
                            <td className="px-4 py-3 text-slate-700">{cierre.totalContratadas}</td>
                            <td className="px-4 py-3 text-slate-700">{cierre.totalUtilizadas}</td>
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {Number(cierre.porcentajeUso || 0).toFixed(2)}%
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

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Asignaciones
                </div>
                <h2 className="mt-3 text-lg font-semibold text-slate-900">
                  Dispositivos que usan la licencia
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  El porcentaje de uso se calcula con estas asignaciones activas.
                </p>
              </div>

              {licenciaSeleccionada ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {licenciaSeleccionada.nombre}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {licenciaSeleccionada.cantidadUsada}/{licenciaSeleccionada.cantidadTotal}
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    {Number(licenciaSeleccionada.porcentajeUso || 0).toFixed(1)}% de uso
                  </p>
                </div>
              ) : null}
            </div>

            {!licenciaSeleccionada ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
                <FiMonitor className="mx-auto text-slate-400" size={28} />
                <p className="mt-3 text-sm font-semibold text-slate-900">Selecciona una licencia</p>
                <p className="mt-1 text-sm text-slate-500">
                  Usa el icono de monitor en la tabla para administrar sus dispositivos.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-5 xl:grid-cols-[0.36fr_0.64fr]">
                <form onSubmit={asignarDispositivo} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Asignar dispositivo</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Se usara el usuario actual del dispositivo como evidencia de quien utiliza la licencia.
                  </p>

                  <div className="mt-4 space-y-3">
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Dispositivo</span>
                      <select
                        value={dispositivoAsignar}
                        onChange={(e) => setDispositivoAsignar(e.target.value)}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                      >
                        <option value="">Seleccionar dispositivo</option>
                        {dispositivosDisponibles.map((dispositivo) => (
                          <option key={dispositivo.id} value={dispositivo.id}>
                            {dispositivo.nombreSistema} - {dispositivo.usuarioActual}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Notas</span>
                      <textarea
                        value={notasAsignacion}
                        onChange={(e) => setNotasAsignacion(e.target.value)}
                        rows={3}
                        className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                        placeholder="Motivo, folio, comentario..."
                      />
                    </label>

                    <button
                      disabled={
                        asignando ||
                        !dispositivoAsignar ||
                        Number(licenciaSeleccionada.cantidadUsada || 0) >= Number(licenciaSeleccionada.cantidadTotal || 0)
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#0f172a,_#1e293b,_#334155)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FiPlus />
                      {asignando ? "Asignando..." : "Asignar licencia"}
                    </button>
                  </div>
                </form>

                <div className="overflow-hidden rounded-3xl border border-slate-200">
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">Asignaciones activas</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {licenciaSeleccionada.cantidadDisponible} disponibles de {licenciaSeleccionada.cantidadTotal} contratadas.
                    </p>
                  </div>

                  <div className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">
                    {(licenciaSeleccionada.asignaciones || []).length === 0 ? (
                      <p className="px-4 py-10 text-center text-sm text-slate-500">
                        Esta licencia aun no tiene dispositivos asignados.
                      </p>
                    ) : (
                      licenciaSeleccionada.asignaciones.map((asignacion) => {
                        const dispositivo = asignacion.dispositivo;

                        return (
                          <div key={asignacion.id} className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                                  <FiCpu size={17} />
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-slate-900">
                                    {dispositivo?.nombreSistema || "Dispositivo no disponible"}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {dispositivo?.marca || "Sin marca"} · {dispositivo?.tipoEquipo || "Sin tipo"}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1">
                                  <FiUser size={13} />
                                  {dispositivo?.usuarioActual || "Sin usuario"}
                                </span>
                                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                                  {dispositivo?.area || "Sin area"}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => liberarAsignacion(asignacion)}
                              disabled={liberandoId === asignacion.id}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <FiTrash2 size={15} />
                              {liberandoId === asignacion.id ? "Liberando..." : "Liberar"}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        abierto={Boolean(licenciaEliminar)}
        titulo="Eliminar licencia"
        descripcion={licenciaEliminar ? `Se eliminara ${licenciaEliminar.nombre}. Esta accion no se puede deshacer.` : ""}
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        cargando={eliminando}
        onConfirmar={confirmarEliminar}
        onCancelar={() => {
          if (eliminando) return;
          setLicenciaEliminar(null);
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

export default Licencias;
