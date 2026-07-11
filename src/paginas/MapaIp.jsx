import { useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiCheckCircle,
  FiCpu,
  FiEdit2,
  FiGrid,
  FiHardDrive,
  FiMap,
  FiPlus,
  FiSearch,
  FiServer,
  FiTrash2,
  FiWifi,
  FiX,
} from "react-icons/fi";
import Modal from "react-modal";
import clienteAxios from "../config/clienteAxios.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ToastMensaje from "../components/ui/ToastMensaje";

Modal.setAppElement("#root");

const redInicial = {
  ipMadre: "",
  estado: "activa",
  notas: "",
};

const ipInicial = {
  direccion: "",
  equipo: "",
  tipoEquipo: "pc",
  area: "",
  responsable: "",
  mac: "",
  estado: "disponible",
  notas: "",
};

const estadoIpClase = {
  disponible: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ocupada: "border-sky-200 bg-sky-50 text-sky-700",
  reservada: "border-amber-200 bg-amber-50 text-amber-700",
  bloqueada: "border-rose-200 bg-rose-50 text-rose-700",
};

const estadoIpPunto = {
  disponible: "bg-emerald-500",
  ocupada: "bg-sky-500",
  reservada: "bg-amber-500",
  bloqueada: "bg-rose-500",
};

const tipoEquipoLabel = {
  pc: "PC",
  laptop: "Laptop",
  servidor: "Servidor",
  impresora: "Impresora",
  camara: "Camara",
  router: "Router",
  access_point: "Access point",
  telefono: "Telefono",
  otro: "Otro",
};

const estadoRedClase = {
  activa: "border-emerald-200 bg-emerald-50 text-emerald-700",
  inactiva: "border-slate-200 bg-slate-100 text-slate-700",
};

const ultimoOcteto = (ip) => {
  const partes = String(ip || "").split(".");
  return partes.length === 4 ? partes[3] : ip;
};

const ordenarIps = (ips = []) =>
  [...ips].sort((a, b) => {
    const partesA = String(a.direccion || "").split(".").map(Number);
    const partesB = String(b.direccion || "").split(".").map(Number);

    for (let i = 0; i < 4; i += 1) {
      if ((partesA[i] || 0) !== (partesB[i] || 0)) {
        return (partesA[i] || 0) - (partesB[i] || 0);
      }
    }

    return 0;
  });

const calcularResumenRed = (red) => {
  const ips = red?.ips || [];

  return {
    total: ips.length,
    disponibles: ips.filter((ip) => ip.estado === "disponible").length,
    ocupadas: ips.filter((ip) => ip.estado === "ocupada").length,
    reservadas: ips.filter((ip) => ip.estado === "reservada").length,
    bloqueadas: ips.filter((ip) => ip.estado === "bloqueada").length,
  };
};

const MapaIp = () => {
  const [redes, setRedes] = useState([]);
  const [redSeleccionadaId, setRedSeleccionadaId] = useState("");
  const [busquedaRed, setBusquedaRed] = useState("");
  const [busquedaIp, setBusquedaIp] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [modalRedAbierto, setModalRedAbierto] = useState(false);
  const [modalIpAbierto, setModalIpAbierto] = useState(false);
  const [redFormulario, setRedFormulario] = useState(redInicial);
  const [ipFormulario, setIpFormulario] = useState(ipInicial);
  const [redEditar, setRedEditar] = useState(null);
  const [ipEditar, setIpEditar] = useState(null);
  const [eliminarPendiente, setEliminarPendiente] = useState(null);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  const cargarRedes = async () => {
    setCargando(true);

    try {
      const { data } = await clienteAxios.get("/mapa-ip");
      const redesRecibidas = Array.isArray(data) ? data : [];
      setRedes(redesRecibidas);

      if (!redSeleccionadaId && redesRecibidas.length > 0) {
        setRedSeleccionadaId(redesRecibidas[0].id);
      }
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible cargar el mapa IP.",
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarRedes();
  }, []);

  const redSeleccionada = useMemo(
    () => redes.find((red) => red.id === redSeleccionadaId) || redes[0] || null,
    [redes, redSeleccionadaId]
  );

  const resumenGeneral = useMemo(() => {
    const ips = redes.flatMap((red) => red.ips || []);

    return {
      redes: redes.length,
      ocupadas: ips.filter((ip) => ip.estado === "ocupada").length,
      disponibles: ips.filter((ip) => ip.estado === "disponible").length,
      reservadas: ips.filter((ip) => ip.estado === "reservada").length,
    };
  }, [redes]);

  const resumenRed = useMemo(() => calcularResumenRed(redSeleccionada), [redSeleccionada]);

  const redesFiltradas = redes.filter((red) => {
    const termino = busquedaRed.trim().toLowerCase();
    if (!termino) return true;

    return [red.ipMadre, red.estado, red.notas]
      .filter(Boolean)
      .some((valor) => valor.toLowerCase().includes(termino));
  });

  const ipsFiltradas = useMemo(() => {
    const termino = busquedaIp.trim().toLowerCase();
    const ips = ordenarIps(redSeleccionada?.ips || []);

    return ips.filter((ip) => {
      const coincideEstado = filtroEstado === "todos" || ip.estado === filtroEstado;
      if (!coincideEstado) return false;
      if (!termino) return true;

      return [
        ip.direccion,
        ip.equipo,
        tipoEquipoLabel[ip.tipoEquipo],
        ip.area,
        ip.responsable,
        ip.mac,
        ip.estado,
      ]
        .filter(Boolean)
        .some((valor) => valor.toLowerCase().includes(termino));
    });
  }, [redSeleccionada, filtroEstado, busquedaIp]);

  const actualizarRedLocal = (red) => {
    setRedes((prev) => prev.map((item) => (item.id === red.id ? red : item)));
  };

  const abrirCrearRed = () => {
    setRedEditar(null);
    setRedFormulario(redInicial);
    setModalRedAbierto(true);
  };

  const abrirEditarRed = (red) => {
    setRedEditar(red);
    setRedFormulario({
      ipMadre: red.ipMadre || "",
      estado: red.estado || "activa",
      notas: red.notas || "",
    });
    setModalRedAbierto(true);
  };

  const abrirCrearIp = () => {
    if (!redSeleccionada) {
      setMensaje({ tipo: "info", texto: "Primero registra una IP madre." });
      return;
    }

    setIpEditar(null);
    setIpFormulario(ipInicial);
    setModalIpAbierto(true);
  };

  const abrirEditarIp = (ip) => {
    setIpEditar(ip);
    setIpFormulario({
      direccion: ip.direccion || "",
      equipo: ip.equipo || "",
      tipoEquipo: ip.tipoEquipo || "otro",
      area: ip.area || "",
      responsable: ip.responsable || "",
      mac: ip.mac || "",
      estado: ip.estado || "disponible",
      notas: ip.notas || "",
    });
    setModalIpAbierto(true);
  };

  const guardarRed = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      if (redEditar) {
        const { data } = await clienteAxios.put(`/mapa-ip/${redEditar.id}`, redFormulario);
        actualizarRedLocal(data);
        setMensaje({ tipo: "success", texto: "Red IP actualizada correctamente." });
      } else {
        const { data } = await clienteAxios.post("/mapa-ip", redFormulario);
        setRedes((prev) => [data, ...prev]);
        setRedSeleccionadaId(data.id);
        setMensaje({ tipo: "success", texto: "Red IP registrada correctamente." });
      }

      setModalRedAbierto(false);
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible guardar la red IP.",
      });
    } finally {
      setGuardando(false);
    }
  };

  const guardarIp = async (e) => {
    e.preventDefault();
    if (!redSeleccionada) return;

    setGuardando(true);

    try {
      if (ipEditar) {
        const { data } = await clienteAxios.put(
          `/mapa-ip/${redSeleccionada.id}/ips/${ipEditar.id}`,
          ipFormulario
        );

        setRedes((prev) =>
          prev.map((red) =>
            red.id === redSeleccionada.id
              ? {
                  ...red,
                  ips: (red.ips || []).map((ip) => (ip.id === data.id ? data : ip)),
                }
              : red
          )
        );
        setMensaje({ tipo: "success", texto: "Direccion IP actualizada correctamente." });
      } else {
        const { data } = await clienteAxios.post(`/mapa-ip/${redSeleccionada.id}/ips`, ipFormulario);

        setRedes((prev) =>
          prev.map((red) =>
            red.id === redSeleccionada.id
              ? {
                  ...red,
                  ips: [...(red.ips || []), data],
                }
              : red
          )
        );
        setMensaje({ tipo: "success", texto: "Direccion IP registrada correctamente." });
      }

      setModalIpAbierto(false);
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible guardar la direccion IP.",
      });
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!eliminarPendiente) return;

    setEliminando(true);

    try {
      if (eliminarPendiente.tipo === "red") {
        await clienteAxios.delete(`/mapa-ip/${eliminarPendiente.item.id}`);
        setRedes((prev) => prev.filter((red) => red.id !== eliminarPendiente.item.id));

        if (redSeleccionadaId === eliminarPendiente.item.id) {
          setRedSeleccionadaId("");
        }

        setModalRedAbierto(false);
        setMensaje({ tipo: "success", texto: "Red IP eliminada correctamente." });
      } else if (redSeleccionada) {
        await clienteAxios.delete(`/mapa-ip/${redSeleccionada.id}/ips/${eliminarPendiente.item.id}`);
        setRedes((prev) =>
          prev.map((red) =>
            red.id === redSeleccionada.id
              ? {
                  ...red,
                  ips: (red.ips || []).filter((ip) => ip.id !== eliminarPendiente.item.id),
                }
              : red
          )
        );
        setMensaje({ tipo: "success", texto: "Direccion IP eliminada correctamente." });
      }

      setEliminarPendiente(null);
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible eliminar el registro.",
      });
    } finally {
      setEliminando(false);
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
                  Infraestructura
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">
                  Mapa IP
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Administra IPs madre, direcciones asignadas, equipos vinculados y areas de uso.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">IPs madre</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{resumenGeneral.redes}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Ocupadas</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{resumenGeneral.ocupadas}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Disponibles</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{resumenGeneral.disponibles}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Reservadas</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{resumenGeneral.reservadas}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid items-start gap-5 xl:grid-cols-[0.32fr_0.68fr]">
            <aside className="self-start overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">IPs madre</p>
                    <p className="mt-1 text-sm text-slate-500">Principales registradas.</p>
                  </div>
                  <button
                    type="button"
                    onClick={abrirCrearRed}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white transition hover:brightness-110"
                    title="Nueva IP madre"
                    aria-label="Nueva IP madre"
                  >
                    <FiPlus size={17} />
                  </button>
                </div>

                <div className="relative mt-4">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={busquedaRed}
                    onChange={(e) => setBusquedaRed(e.target.value)}
                    placeholder="Buscar IP madre"
                    className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                  />
                </div>
              </div>

              <div className="max-h-[42rem] space-y-3 overflow-y-auto p-5">
                {cargando ? (
                  <div className="rounded-3xl border border-slate-200 px-5 py-10 text-center text-sm text-slate-500">
                    Cargando redes...
                  </div>
                ) : redesFiltradas.length === 0 ? (
                  <div className="rounded-3xl border border-slate-200 px-5 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                      <FiWifi size={20} />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-slate-900">Sin redes</p>
                    <p className="mt-1 text-sm text-slate-500">Registra una IP madre para iniciar.</p>
                  </div>
                ) : (
                  redesFiltradas.map((red) => {
                    const activa = redSeleccionada?.id === red.id;
                    const resumen = calcularResumenRed(red);

                    return (
                      <button
                        key={red.id}
                        type="button"
                        onClick={() => setRedSeleccionadaId(red.id)}
                        className={`w-full rounded-3xl border p-4 text-left transition ${
                          activa
                            ? "border-sky-300 bg-sky-50 shadow-sm ring-1 ring-sky-100"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{red.ipMadre}</p>
                            <p className="mt-1 text-xs font-medium text-slate-500">IP madre</p>
                          </div>
                          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${estadoRedClase[red.estado] || estadoRedClase.activa}`}>
                            {red.estado}
                          </span>
                        </div>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,_#0ea5e9,_#2563eb)]"
                            style={{ width: `${resumen.total ? Math.round((resumen.ocupadas / resumen.total) * 100) : 0}%` }}
                          />
                        </div>
                        <p className="mt-2 text-xs font-medium text-slate-500">
                          {resumen.ocupadas} ocupadas de {resumen.total} registradas
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            <section className="space-y-5">
              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)] p-5 sm:p-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                          <FiMap size={19} />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-slate-900">
                            {redSeleccionada ? redSeleccionada.ipMadre : "Selecciona una IP madre"}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {redSeleccionada
                              ? "Direcciones vinculadas a esta IP madre"
                              : "Crea una IP madre para administrar sus direcciones."}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => redSeleccionada && abrirEditarRed(redSeleccionada)}
                        disabled={!redSeleccionada}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FiEdit2 size={16} />
                        Editar red
                      </button>
                      <button
                        type="button"
                        onClick={abrirCrearIp}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#0f172a,_#1e293b,_#334155)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:brightness-110"
                      >
                        <FiPlus size={16} />
                        Nueva IP
                      </button>
                    </div>
                  </div>

                  {redSeleccionada ? (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Total</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{resumenRed.total}</p>
                      </div>
                      <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-600">Ocupadas</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{resumenRed.ocupadas}</p>
                      </div>
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600">Disponibles</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{resumenRed.disponibles}</p>
                      </div>
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-600">Reservadas</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{resumenRed.reservadas}</p>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="p-5 sm:p-6">
                  {redSeleccionada ? (
                    <>
                      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap gap-2">
                          {["todos", "ocupada", "disponible", "reservada", "bloqueada"].map((estado) => (
                            <button
                              key={estado}
                              type="button"
                              onClick={() => setFiltroEstado(estado)}
                              className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                                filtroEstado === estado
                                  ? "border-slate-900 bg-slate-900 text-white"
                                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              {estado}
                            </button>
                          ))}
                        </div>

                        <div className="relative">
                          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            value={busquedaIp}
                            onChange={(e) => setBusquedaIp(e.target.value)}
                            placeholder="Buscar IP, equipo o area"
                            className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200 lg:w-80"
                          />
                        </div>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <FiGrid size={16} className="text-slate-400" />
                          Vista rapida
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10">
                          {ipsFiltradas.length === 0 ? (
                            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
                              No hay IPs con ese criterio.
                            </div>
                          ) : (
                            ipsFiltradas.map((ip) => (
                              <button
                                key={ip.id}
                                type="button"
                                onClick={() => abrirEditarIp(ip)}
                                className="min-h-24 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-lg font-semibold text-slate-900">{ultimoOcteto(ip.direccion)}</span>
                                  <span className={`h-2.5 w-2.5 rounded-full ${estadoIpPunto[ip.estado] || estadoIpPunto.disponible}`} />
                                </div>
                                <p className="mt-2 truncate text-xs font-semibold text-slate-700">{ip.direccion}</p>
                                <p className="mt-1 truncate text-xs text-slate-500">{ip.equipo || "Sin equipo"}</p>
                              </button>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                              <tr>
                                <th className="px-4 py-4 text-left">Direccion</th>
                                <th className="px-4 py-4 text-left">Equipo</th>
                                <th className="px-4 py-4 text-left">Area</th>
                                <th className="px-4 py-4 text-left">Responsable</th>
                                <th className="px-4 py-4 text-left">Estado</th>
                                <th className="px-4 py-4 text-right">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {ipsFiltradas.length === 0 ? (
                                <tr>
                                  <td colSpan="6" className="px-6 py-12 text-center text-sm text-slate-500">
                                    No encontramos direcciones IP.
                                  </td>
                                </tr>
                              ) : (
                                ipsFiltradas.map((ip) => (
                                  <tr key={ip.id} className="transition hover:bg-slate-50/80">
                                    <td className="px-4 py-4">
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                                          <FiActivity size={18} />
                                        </div>
                                        <div>
                                          <p className="font-semibold text-slate-900">{ip.direccion}</p>
                                          <p className="mt-1 text-xs text-slate-500">{ip.mac || "Sin MAC"}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-4">
                                      <p className="font-medium text-slate-800">{ip.equipo || "Sin equipo"}</p>
                                      <p className="mt-1 text-xs text-slate-500">{tipoEquipoLabel[ip.tipoEquipo] || "Otro"}</p>
                                    </td>
                                    <td className="px-4 py-4 text-slate-600">{ip.area || "Sin area"}</td>
                                    <td className="px-4 py-4 text-slate-600">{ip.responsable || "Sin responsable"}</td>
                                    <td className="px-4 py-4">
                                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${estadoIpClase[ip.estado] || estadoIpClase.disponible}`}>
                                        {ip.estado}
                                      </span>
                                    </td>
                                    <td className="px-4 py-4">
                                      <div className="flex justify-end gap-2">
                                        <button
                                          type="button"
                                          onClick={() => abrirEditarIp(ip)}
                                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                                          title="Editar IP"
                                          aria-label={`Editar ${ip.direccion}`}
                                        >
                                          <FiEdit2 size={15} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEliminarPendiente({ tipo: "ip", item: ip })}
                                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                                          title="Eliminar IP"
                                          aria-label={`Eliminar ${ip.direccion}`}
                                        >
                                          <FiTrash2 size={15} />
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
                    </>
                  ) : (
                    <div className="rounded-3xl border border-slate-200 px-6 py-16 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                        <FiServer size={22} />
                      </div>
                      <p className="mt-4 text-sm font-semibold text-slate-900">No hay red seleccionada</p>
                      <p className="mt-1 text-sm text-slate-500">Crea una IP madre para comenzar a mapear direcciones.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </section>
        </div>
      </div>

      <Modal
        isOpen={modalRedAbierto}
        onRequestClose={() => setModalRedAbierto(false)}
        overlayClassName="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
        className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-[28px] border border-slate-200 bg-white outline-none shadow-[0_28px_80px_rgba(15,23,42,0.24)]"
      >
        <form onSubmit={guardarRed}>
          <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-slate-900">{redEditar ? "Editar IP madre" : "Nueva IP madre"}</p>
                <p className="mt-1 text-sm text-slate-500">Registra la IP principal para agrupar sus direcciones.</p>
              </div>
              <button
                type="button"
                onClick={() => setModalRedAbierto(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                aria-label="Cerrar"
              >
                <FiX size={18} />
              </button>
            </div>
          </div>

          <div className="max-h-[65vh] space-y-4 overflow-y-auto p-5 sm:p-6">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">IP madre</span>
              <input
                value={redFormulario.ipMadre}
                onChange={(e) => setRedFormulario((prev) => ({ ...prev, ipMadre: e.target.value }))}
                required
                placeholder="192.168.252.254"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
              />
            </label>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-200 p-5 sm:flex-row sm:justify-end sm:p-6">
            {redEditar ? (
              <button
                type="button"
                onClick={() => setEliminarPendiente({ tipo: "red", item: redEditar })}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                <FiTrash2 size={16} />
                Eliminar
              </button>
            ) : null}
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#0f172a,_#1e293b,_#334155)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:brightness-110 disabled:opacity-70"
            >
              <FiCheckCircle size={16} />
              {guardando ? "Guardando..." : "Guardar IP madre"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={modalIpAbierto}
        onRequestClose={() => setModalIpAbierto(false)}
        overlayClassName="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
        className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-[28px] border border-slate-200 bg-white outline-none shadow-[0_28px_80px_rgba(15,23,42,0.24)]"
      >
        <form onSubmit={guardarIp}>
          <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-slate-900">{ipEditar ? "Editar IP" : "Nueva direccion IP"}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {redSeleccionada ? `IP madre ${redSeleccionada.ipMadre}` : "Direccion vinculada a IP madre."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalIpAbierto(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                aria-label="Cerrar"
              >
                <FiX size={18} />
              </button>
            </div>
          </div>

          <div className="max-h-[65vh] space-y-4 overflow-y-auto p-5 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Direccion IP</span>
                <input
                  value={ipFormulario.direccion}
                  onChange={(e) => setIpFormulario((prev) => ({ ...prev, direccion: e.target.value }))}
                  required
                  placeholder="192.168.1.20"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Estado</span>
                <select
                  value={ipFormulario.estado}
                  onChange={(e) => setIpFormulario((prev) => ({ ...prev, estado: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                >
                  <option value="disponible">Disponible</option>
                  <option value="ocupada">Ocupada</option>
                  <option value="reservada">Reservada</option>
                  <option value="bloqueada">Bloqueada</option>
                </select>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Equipo</span>
                <input
                  value={ipFormulario.equipo}
                  onChange={(e) => setIpFormulario((prev) => ({ ...prev, equipo: e.target.value }))}
                  placeholder="Servidor admin, Impresora recepcion..."
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Tipo equipo</span>
                <select
                  value={ipFormulario.tipoEquipo}
                  onChange={(e) => setIpFormulario((prev) => ({ ...prev, tipoEquipo: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                >
                  {Object.entries(tipoEquipoLabel).map(([valor, label]) => (
                    <option key={valor} value={valor}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Area</span>
                <input
                  value={ipFormulario.area}
                  onChange={(e) => setIpFormulario((prev) => ({ ...prev, area: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Responsable</span>
                <input
                  value={ipFormulario.responsable}
                  onChange={(e) => setIpFormulario((prev) => ({ ...prev, responsable: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">MAC address</span>
              <input
                value={ipFormulario.mac}
                onChange={(e) => setIpFormulario((prev) => ({ ...prev, mac: e.target.value }))}
                placeholder="AA:BB:CC:DD:EE:FF"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Notas</span>
              <textarea
                value={ipFormulario.notas}
                onChange={(e) => setIpFormulario((prev) => ({ ...prev, notas: e.target.value }))}
                rows={3}
                className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
              />
            </label>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-200 p-5 sm:flex-row sm:justify-end sm:p-6">
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#0f172a,_#1e293b,_#334155)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:brightness-110 disabled:opacity-70"
            >
              <FiHardDrive size={16} />
              {guardando ? "Guardando..." : "Guardar IP"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        abierto={Boolean(eliminarPendiente)}
        titulo={eliminarPendiente?.tipo === "red" ? "Eliminar red IP" : "Eliminar direccion IP"}
        descripcion={
          eliminarPendiente
            ? eliminarPendiente.tipo === "red"
              ? `Se eliminara la IP madre ${eliminarPendiente.item.ipMadre} y sus IPs. Esta accion no se puede deshacer.`
              : `Se eliminara la direccion ${eliminarPendiente.item.direccion}. Esta accion no se puede deshacer.`
            : ""
        }
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        cargando={eliminando}
        onConfirmar={confirmarEliminar}
        onCancelar={() => {
          if (eliminando) return;
          setEliminarPendiente(null);
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

export default MapaIp;
