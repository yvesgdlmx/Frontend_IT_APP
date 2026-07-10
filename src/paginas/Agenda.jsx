import { useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiEdit2,
  FiFilter,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import Modal from "react-modal";
import clienteAxios from "../config/clienteAxios.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ToastMensaje from "../components/ui/ToastMensaje";

Modal.setAppElement("#root");

const estadoInicial = {
  titulo: "",
  descripcion: "",
  fecha: "",
  hora: "",
  tipo: "tarea",
  prioridad: "media",
  estado: "pendiente",
  responsable: "",
  entidadTipo: "ninguna",
  entidadId: "",
  entidadNombre: "",
};

const tipos = [
  { id: "todos", label: "Todos" },
  { id: "tarea", label: "Tareas" },
  { id: "mantenimiento", label: "Mantenimientos" },
  { id: "renovacion", label: "Renovaciones" },
  { id: "reunion", label: "Reuniones" },
  { id: "recordatorio", label: "Recordatorios" },
];

const tipoLabel = {
  tarea: "Tarea",
  mantenimiento: "Mantenimiento",
  renovacion: "Renovacion",
  reunion: "Reunion",
  recordatorio: "Recordatorio",
  vencimiento: "Vencimiento",
};

const tipoClase = {
  tarea: "border-sky-200 bg-sky-50 text-sky-700",
  mantenimiento: "border-violet-200 bg-violet-50 text-violet-700",
  renovacion: "border-amber-200 bg-amber-50 text-amber-700",
  reunion: "border-indigo-200 bg-indigo-50 text-indigo-700",
  recordatorio: "border-emerald-200 bg-emerald-50 text-emerald-700",
  vencimiento: "border-rose-200 bg-rose-50 text-rose-700",
};

const prioridadClase = {
  baja: "border-emerald-200 bg-emerald-50 text-emerald-700",
  media: "border-amber-200 bg-amber-50 text-amber-700",
  alta: "border-rose-200 bg-rose-50 text-rose-700",
};

const estadoClase = {
  pendiente: "border-slate-200 bg-slate-50 text-slate-700",
  completada: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelada: "border-rose-200 bg-rose-50 text-rose-700",
};

const nombresMes = [
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

const diasSemana = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

const hoyISO = () => {
  const fecha = new Date();
  fecha.setHours(0, 0, 0, 0);
  return fecha.toISOString().slice(0, 10);
};

const fechaISO = (fecha) => {
  const copia = new Date(fecha);
  copia.setHours(0, 0, 0, 0);
  return copia.toISOString().slice(0, 10);
};

const normalizarFecha = (valor) => {
  if (!valor) return null;
  const fecha = new Date(`${valor.slice(0, 10)}T00:00:00`);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

const calcularDias = (valor) => {
  const fecha = normalizarFecha(valor);
  if (!fecha) return null;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
};

const formatearFechaLarga = (valor) => {
  const fecha = normalizarFecha(valor);
  if (!fecha) return "Sin fecha";

  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(fecha);
};

const formatearRestante = (fecha) => {
  const dias = calcularDias(fecha);

  if (dias === null) return "Sin fecha";
  if (dias < 0) return `Hace ${Math.abs(dias)} dias`;
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Manana";
  return `${dias} dias`;
};

const obtenerDiasMes = (fecha) => {
  const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
  const fin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
  const dias = [];

  for (let i = 0; i < inicio.getDay(); i += 1) {
    dias.push(null);
  }

  for (let dia = 1; dia <= fin.getDate(); dia += 1) {
    dias.push(new Date(fecha.getFullYear(), fecha.getMonth(), dia));
  }

  while (dias.length % 7 !== 0) {
    dias.push(null);
  }

  return dias;
};

const transformarCuenta = (cuenta) => {
  const padre = {
    id: cuenta.id,
    nombre: cuenta.correo,
    tipoCuenta: "Cuenta padre",
    fecha: cuenta.fechaVencimiento?.slice(0, 10) || "",
  };

  const hijas = Array.isArray(cuenta.hijas)
    ? cuenta.hijas.map((hija) => ({
        id: hija.id,
        nombre: hija.correo,
        tipoCuenta: "Cuenta hija",
        fecha: hija.fechaVencimiento?.slice(0, 10) || "",
      }))
    : [];

  return [padre, ...hijas];
};

const crearEventosAutomaticos = (licencias, cuentas) => {
  const eventosLicencias = licencias
    .filter((licencia) => licencia.fechaVencimiento)
    .map((licencia) => ({
      id: `licencia-${licencia.id}`,
      origen: "automatico",
      titulo: `Renovar ${licencia.nombre}`,
      descripcion: licencia.proveedor ? `Licencia de ${licencia.proveedor}` : "Vencimiento de licencia",
      fecha: licencia.fechaVencimiento,
      hora: "",
      tipo: "vencimiento",
      prioridad: calcularDias(licencia.fechaVencimiento) <= 7 ? "alta" : "media",
      estado: "pendiente",
      responsable: licencia.responsable || "",
      entidadTipo: "licencia",
      entidadNombre: licencia.nombre,
    }));

  const eventosCuentas = cuentas
    .flatMap(transformarCuenta)
    .filter((cuenta) => cuenta.fecha)
    .map((cuenta) => ({
      id: `cuenta-${cuenta.id}`,
      origen: "automatico",
      titulo: `Revisar ${cuenta.nombre}`,
      descripcion: `${cuenta.tipoCuenta} por vencer`,
      fecha: cuenta.fecha,
      hora: "",
      tipo: "vencimiento",
      prioridad: calcularDias(cuenta.fecha) <= 7 ? "alta" : "media",
      estado: "pendiente",
      responsable: "",
      entidadTipo: "cuenta",
      entidadNombre: cuenta.nombre,
    }));

  return [...eventosLicencias, ...eventosCuentas];
};

const ordenarEventos = (eventos) =>
  [...eventos].sort((a, b) => {
    const fechaA = `${a.fecha || ""} ${a.hora || ""}`;
    const fechaB = `${b.fecha || ""} ${b.hora || ""}`;
    return fechaA.localeCompare(fechaB);
  });

const Agenda = () => {
  const [actividades, setActividades] = useState([]);
  const [automaticos, setAutomaticos] = useState([]);
  const [formulario, setFormulario] = useState({ ...estadoInicial, fecha: hoyISO() });
  const [mesVisible, setMesVisible] = useState(new Date());
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoyISO());
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [actividadEditar, setActividadEditar] = useState(null);
  const [actividadEliminar, setActividadEliminar] = useState(null);
  const [modalDiaAbierto, setModalDiaAbierto] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  const cargarAgenda = async () => {
    setCargando(true);

    try {
      const [agendaRes, licenciasRes, cuentasRes] = await Promise.allSettled([
        clienteAxios.get("/agenda"),
        clienteAxios.get("/licencias"),
        clienteAxios.get("/cuentas/padre"),
      ]);

      if (agendaRes.status === "fulfilled") {
        setActividades(Array.isArray(agendaRes.value.data) ? agendaRes.value.data : []);
      }

      const licencias = licenciasRes.status === "fulfilled" && Array.isArray(licenciasRes.value.data)
        ? licenciasRes.value.data
        : [];
      const cuentas = cuentasRes.status === "fulfilled" && Array.isArray(cuentasRes.value.data)
        ? cuentasRes.value.data
        : [];

      setAutomaticos(crearEventosAutomaticos(licencias, cuentas));

      if (agendaRes.status === "rejected") {
        setMensaje({
          tipo: "error",
          texto: agendaRes.reason?.response?.data?.error || "No fue posible cargar la agenda.",
        });
      }
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible cargar la agenda.",
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarAgenda();
  }, []);

  const eventos = useMemo(() => ordenarEventos([...actividades, ...automaticos]), [actividades, automaticos]);

  const eventosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return eventos.filter((evento) => {
      const coincideTipo =
        filtroTipo === "todos" ||
        evento.tipo === filtroTipo ||
        (filtroTipo === "renovacion" && evento.tipo === "vencimiento");

      if (!coincideTipo) return false;
      if (!termino) return true;

      return [
        evento.titulo,
        evento.descripcion,
        evento.responsable,
        evento.entidadNombre,
        tipoLabel[evento.tipo],
      ]
        .filter(Boolean)
        .some((valor) => valor.toLowerCase().includes(termino));
    });
  }, [eventos, filtroTipo, busqueda]);

  const eventosPorFecha = useMemo(() => {
    const agrupados = {};

    eventosFiltrados.forEach((evento) => {
      if (!agrupados[evento.fecha]) agrupados[evento.fecha] = [];
      agrupados[evento.fecha].push(evento);
    });

    return agrupados;
  }, [eventosFiltrados]);

  const eventosDelDia = eventosPorFecha[fechaSeleccionada] || [];

  const resumen = useMemo(
    () => ({
      total: eventos.length,
      hoy: eventos.filter((evento) => evento.fecha === hoyISO()).length,
      pendientes: actividades.filter((item) => item.estado === "pendiente").length,
      automaticos: automaticos.length,
    }),
    [actividades, automaticos, eventos]
  );

  const diasMes = useMemo(() => obtenerDiasMes(mesVisible), [mesVisible]);

  const handleChange = (e) => {
    setFormulario((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const limpiarFormulario = () => {
    setFormulario({ ...estadoInicial, fecha: fechaSeleccionada || hoyISO() });
    setActividadEditar(null);
  };

  const guardarActividad = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      if (actividadEditar) {
        const { data } = await clienteAxios.put(`/agenda/${actividadEditar.id}`, formulario);
        setActividades((prev) => prev.map((item) => (item.id === data.id ? data : item)));
        setMensaje({ tipo: "success", texto: "Actividad actualizada correctamente." });
      } else {
        const { data } = await clienteAxios.post("/agenda", formulario);
        setActividades((prev) => [...prev, data]);
        setMensaje({ tipo: "success", texto: "Actividad creada correctamente." });
      }

      limpiarFormulario();
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible guardar la actividad.",
      });
    } finally {
      setGuardando(false);
    }
  };

  const abrirEditar = (actividad) => {
    if (actividad.origen === "automatico") return;

    setModalDiaAbierto(false);
    setActividadEditar(actividad);
    setFormulario({
      titulo: actividad.titulo || "",
      descripcion: actividad.descripcion || "",
      fecha: actividad.fecha || hoyISO(),
      hora: actividad.hora?.slice(0, 5) || "",
      tipo: actividad.tipo || "tarea",
      prioridad: actividad.prioridad || "media",
      estado: actividad.estado || "pendiente",
      responsable: actividad.responsable || "",
      entidadTipo: actividad.entidadTipo || "ninguna",
      entidadId: actividad.entidadId || "",
      entidadNombre: actividad.entidadNombre || "",
    });
  };

  const marcarCompletada = async (actividad) => {
    if (actividad.origen === "automatico") return;

    const estado = actividad.estado === "completada" ? "pendiente" : "completada";

    try {
      const { data } = await clienteAxios.patch(`/agenda/${actividad.id}/estado`, { estado });
      setActividades((prev) => prev.map((item) => (item.id === data.id ? data : item)));
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible actualizar la actividad.",
      });
    }
  };

  const confirmarEliminar = async () => {
    if (!actividadEliminar) return;

    setEliminando(true);

    try {
      await clienteAxios.delete(`/agenda/${actividadEliminar.id}`);
      setActividades((prev) => prev.filter((item) => item.id !== actividadEliminar.id));
      if (actividadEditar?.id === actividadEliminar.id) limpiarFormulario();
      setActividadEliminar(null);
      setMensaje({ tipo: "success", texto: "Actividad eliminada correctamente." });
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible eliminar la actividad.",
      });
    } finally {
      setEliminando(false);
    }
  };

  const moverMes = (cantidad) => {
    setMesVisible((prev) => new Date(prev.getFullYear(), prev.getMonth() + cantidad, 1));
  };

  const seleccionarFecha = (fecha, abrirModal = false) => {
    const iso = fechaISO(fecha);
    setFechaSeleccionada(iso);

    if (!actividadEditar) {
      setFormulario((prev) => ({ ...prev, fecha: iso }));
    }

    if (abrirModal) {
      setModalDiaAbierto(true);
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
                  Planificacion operativa
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">
                  Agenda TI
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Organiza actividades y revisa vencimientos importantes desde un calendario operativo.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Eventos</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{resumen.total}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Hoy</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{resumen.hoy}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Pendientes</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{resumen.pendientes}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Automaticos</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{resumen.automaticos}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid items-start gap-5 xl:grid-cols-[0.32fr_0.68fr]">
            <form onSubmit={guardarActividad} className="self-start rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <FiCalendar />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    {actividadEditar ? "Editar actividad" : "Nueva actividad"}
                  </p>
                  <p className="text-sm text-slate-500">Agenda tareas, mantenimientos y recordatorios.</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Titulo
                  </span>
                  <input
                    name="titulo"
                    value={formulario.titulo}
                    onChange={handleChange}
                    required
                    placeholder="Ej. Renovar licencia antivirus"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Descripcion
                  </span>
                  <textarea
                    name="descripcion"
                    value={formulario.descripcion}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Contexto, pasos o datos importantes."
                    className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Fecha
                    </span>
                    <input
                      type="date"
                      name="fecha"
                      value={formulario.fecha}
                      onChange={handleChange}
                      required
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Hora
                    </span>
                    <input
                      type="time"
                      name="hora"
                      value={formulario.hora}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                    />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Tipo
                    </span>
                    <select
                      name="tipo"
                      value={formulario.tipo}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                    >
                      <option value="tarea">Tarea</option>
                      <option value="mantenimiento">Mantenimiento</option>
                      <option value="renovacion">Renovacion</option>
                      <option value="reunion">Reunion</option>
                      <option value="recordatorio">Recordatorio</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Prioridad
                    </span>
                    <select
                      name="prioridad"
                      value={formulario.prioridad}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                    >
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Estado
                    </span>
                    <select
                      name="estado"
                      value={formulario.estado}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="completada">Completada</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Responsable
                    </span>
                    <input
                      name="responsable"
                      value={formulario.responsable}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                    />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Relacion
                    </span>
                    <select
                      name="entidadTipo"
                      value={formulario.entidadTipo}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                    >
                      <option value="ninguna">Ninguna</option>
                      <option value="licencia">Licencia</option>
                      <option value="cuenta">Cuenta</option>
                      <option value="dispositivo">Dispositivo</option>
                      <option value="credencial">Credencial</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Nombre relacionado
                    </span>
                    <input
                      name="entidadNombre"
                      value={formulario.entidadNombre}
                      onChange={handleChange}
                      placeholder="Opcional"
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    disabled={guardando}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#0f172a,_#1e293b,_#334155)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {actividadEditar ? <FiCheck size={16} /> : <FiPlus size={16} />}
                    {guardando ? "Guardando..." : actividadEditar ? "Guardar cambios" : "Crear actividad"}
                  </button>
                  {actividadEditar ? (
                    <button
                      type="button"
                      onClick={limpiarFormulario}
                      className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                  ) : null}
                </div>
              </div>
            </form>

            <div className="space-y-5">
              <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)] p-5 sm:p-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                          <button
                            type="button"
                            onClick={() => moverMes(-1)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                            title="Mes anterior"
                            aria-label="Mes anterior"
                          >
                            <FiChevronLeft size={18} />
                          </button>
                          <div className="min-w-44 px-3 text-center">
                            <p className="text-base font-semibold text-slate-900">
                              {nombresMes[mesVisible.getMonth()]} {mesVisible.getFullYear()}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => moverMes(1)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                            title="Mes siguiente"
                            aria-label="Mes siguiente"
                          >
                            <FiChevronRight size={18} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const hoy = new Date();
                            setMesVisible(hoy);
                            seleccionarFecha(hoy);
                          }}
                          className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                        >
                          Hoy
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatearFechaLarga(fechaSeleccionada)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 lg:flex-row">
                      <div className="relative">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          value={busqueda}
                          onChange={(e) => setBusqueda(e.target.value)}
                          placeholder="Buscar evento"
                          className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200 lg:w-72"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={cargarAgenda}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <FiRefreshCw size={16} />
                        Actualizar
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <div className="flex flex-wrap gap-2">
                      {tipos.map((tipo) => (
                        <button
                          key={tipo.id}
                          type="button"
                          onClick={() => setFiltroTipo(tipo.id)}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                            filtroTipo === tipo.id
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {tipo.id === "todos" ? <FiFilter size={14} /> : null}
                          {tipo.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-7 gap-2">
                    {diasSemana.map((dia) => (
                      <div key={dia} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        {dia}
                      </div>
                    ))}

                    {diasMes.map((dia, index) => {
                      if (!dia) {
                        return <div key={`vacio-${index}`} className="min-h-[7.5rem] rounded-2xl border border-dashed border-slate-100 bg-slate-50/50" />;
                      }

                      const iso = fechaISO(dia);
                      const activo = fechaSeleccionada === iso;
                      const esHoy = hoyISO() === iso;
                      const eventosDia = eventosPorFecha[iso] || [];

                      return (
                        <button
                          key={iso}
                          type="button"
                          onClick={() => seleccionarFecha(dia, true)}
                          className={`min-h-[7.5rem] rounded-2xl border p-3 text-left transition ${
                            activo
                              ? "border-sky-300 bg-sky-50 text-slate-900 shadow-sm ring-1 ring-sky-100"
                              : esHoy
                                ? "border-sky-200 bg-white text-slate-800 ring-2 ring-sky-100 hover:bg-slate-50"
                                : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm font-semibold ${
                              esHoy
                                ? "bg-sky-100 text-sky-700"
                                : activo
                                  ? "bg-white text-slate-800"
                                  : "bg-slate-100 text-slate-700"
                            }`}>
                              {dia.getDate()}
                            </span>
                            {eventosDia.length ? (
                              <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                                activo ? "bg-white text-sky-700" : "bg-slate-100 text-slate-600"
                              }`}>
                                {eventosDia.length}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-3 space-y-1.5">
                            {eventosDia.slice(0, 3).map((evento) => (
                              <div
                                key={evento.id}
                                className={`truncate rounded-lg px-2 py-1 text-[11px] font-semibold ${
                                  activo
                                    ? "bg-white text-slate-700"
                                    : tipoClase[evento.tipo] || tipoClase.tarea
                                }`}
                              >
                                {evento.hora ? `${evento.hora.slice(0, 5)} ` : ""}
                                {evento.titulo}
                              </div>
                            ))}
                            {eventosDia.length > 3 ? (
                              <p className={`text-[11px] font-semibold ${activo ? "text-sky-700" : "text-slate-400"}`}>
                                +{eventosDia.length - 3} mas
                              </p>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

            </div>
          </section>
        </div>
      </div>

      <Modal
        isOpen={modalDiaAbierto}
        onRequestClose={() => setModalDiaAbierto(false)}
        overlayClassName="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
        className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[28px] border border-slate-200 bg-white outline-none shadow-[0_28px_80px_rgba(15,23,42,0.24)]"
      >
        <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-slate-900">Eventos del dia</p>
              <p className="mt-1 text-sm text-slate-500">
                {formatearFechaLarga(fechaSeleccionada)} · {eventosDelDia.length} registros
              </p>
            </div>

            <button
              type="button"
              onClick={() => setModalDiaAbierto(false)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              title="Cerrar"
              aria-label="Cerrar eventos del dia"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        <div className="max-h-[68vh] space-y-3 overflow-y-auto p-5 sm:p-6">
          {cargando ? (
            <div className="rounded-3xl border border-slate-200 px-6 py-12 text-center text-sm text-slate-500">
              Cargando agenda...
            </div>
          ) : eventosDelDia.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <FiCalendar size={20} />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-900">Dia libre</p>
              <p className="mt-1 text-sm text-slate-500">
                La fecha ya quedo seleccionada en el formulario para crear una actividad.
              </p>
            </div>
          ) : (
            eventosDelDia.map((evento) => {
              const automatico = evento.origen === "automatico";
              const completada = evento.estado === "completada";

              return (
                <article
                  key={evento.id}
                  className={`rounded-3xl border p-4 transition hover:bg-slate-50/80 ${
                    completada ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tipoClase[evento.tipo] || tipoClase.tarea}`}>
                          {tipoLabel[evento.tipo] || "Tarea"}
                        </span>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${prioridadClase[evento.prioridad] || prioridadClase.media}`}>
                          {evento.prioridad}
                        </span>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${estadoClase[evento.estado] || estadoClase.pendiente}`}>
                          {automatico ? "automatico" : evento.estado}
                        </span>
                      </div>

                      <h3 className={`mt-3 font-semibold ${completada ? "text-slate-500 line-through" : "text-slate-900"}`}>
                        {evento.titulo}
                      </h3>

                      {evento.descripcion ? (
                        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                          {evento.descripcion}
                        </p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                          <FiClock size={13} />
                          {evento.hora ? evento.hora.slice(0, 5) : "Sin hora"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">{formatearRestante(evento.fecha)}</span>
                        {evento.responsable ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">{evento.responsable}</span>
                        ) : null}
                        {evento.entidadNombre ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">{evento.entidadNombre}</span>
                        ) : null}
                      </div>
                    </div>

                    {!automatico ? (
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => marcarCompletada(evento)}
                          className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                            completada
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                          title="Completar"
                          aria-label={`Completar ${evento.titulo}`}
                        >
                          <FiCheck size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => abrirEditar(evento)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                          title="Editar"
                          aria-label={`Editar ${evento.titulo}`}
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActividadEliminar(evento)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                          title="Eliminar"
                          aria-label={`Eliminar ${evento.titulo}`}
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </Modal>

      <ConfirmDialog
        abierto={Boolean(actividadEliminar)}
        titulo="Eliminar actividad"
        descripcion={
          actividadEliminar
            ? `Se eliminara "${actividadEliminar.titulo}". Esta accion no se puede deshacer.`
            : ""
        }
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        cargando={eliminando}
        onConfirmar={confirmarEliminar}
        onCancelar={() => {
          if (eliminando) return;
          setActividadEliminar(null);
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

export default Agenda;
