import React, { useEffect, useMemo, useState } from "react";
import {
  FiCpu,
  FiEdit2,
  FiEye,
  FiMonitor,
  FiPlus,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import ModalDispositivo from "../components/dispositivos/ModalDispositivo";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ToastMensaje from "../components/ui/ToastMensaje";
import clienteAxios from "../config/clienteAxios.jsx";

const transformarDispositivo = (dispositivo) => ({
  id: dispositivo.id,
  marca: dispositivo.marca,
  tipoEquipo: dispositivo.tipoEquipo,
  nombreSistema: dispositivo.nombreSistema,
  area: dispositivo.area || "",
  usuarioActual: dispositivo.usuarioActual,
  cuentaPadreId: dispositivo.cuentaPadreId,
  cuentaHijaId: dispositivo.cuentaHijaId,
  cuentaPadreCorreo: dispositivo.cuentaPadre?.correo || "",
  cuentaHijaCorreo: dispositivo.cuentaHija?.correo || "",
  asignacionTipo: dispositivo.cuentaHijaId ? "Hija" : "Padre",
  asignacionNombre: dispositivo.cuentaHija?.correo || dispositivo.cuentaPadre?.correo || "Sin asignar",
});

const Dispositivos = () => {
  const [dispositivos, setDispositivos] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoModal, setModoModal] = useState("crear");
  const [dispositivoEnEdicion, setDispositivoEnEdicion] = useState(null);
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false);
  const [dispositivoPendienteEliminar, setDispositivoPendienteEliminar] = useState(null);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [respuestaDispositivos, respuestaCuentas] = await Promise.all([
        clienteAxios.get("/dispositivos"),
        clienteAxios.get("/cuentas/padre"),
      ]);

      setDispositivos(
        Array.isArray(respuestaDispositivos.data)
          ? respuestaDispositivos.data.map(transformarDispositivo)
          : []
      );

      setCuentas(Array.isArray(respuestaCuentas.data) ? respuestaCuentas.data : []);
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible cargar los dispositivos.",
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cuentasPadre = useMemo(
    () =>
      cuentas.map((cuenta) => ({
        id: cuenta.id,
        label: cuenta.correo,
      })),
    [cuentas]
  );

  const cuentasHija = useMemo(
    () =>
      cuentas.flatMap((cuenta) =>
        (cuenta.hijas || []).map((hija) => ({
          id: hija.id,
          label: `${hija.correo} · ${cuenta.correo}`,
        }))
      ),
    [cuentas]
  );

  const dispositivosFiltrados = dispositivos.filter((dispositivo) => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return true;

    return [
      dispositivo.marca,
      dispositivo.tipoEquipo,
      dispositivo.nombreSistema,
      dispositivo.area,
      dispositivo.usuarioActual,
      dispositivo.asignacionNombre,
    ]
      .filter(Boolean)
      .some((valor) => valor.toLowerCase().includes(termino));
  });

  const abrirCrear = () => {
    setModoModal("crear");
    setDispositivoEnEdicion(null);
    setModalAbierto(true);
  };

  const abrirEditar = (dispositivo) => {
    setModoModal("editar");
    setDispositivoEnEdicion(dispositivo);
    setModalAbierto(true);
  };

  const guardarDispositivo = async (payload) => {
    setGuardando(true);
    try {
      if (modoModal === "editar" && dispositivoEnEdicion?.id) {
        const { data } = await clienteAxios.put(
          `/dispositivos/${dispositivoEnEdicion.id}`,
          payload
        );
        const transformado = transformarDispositivo(data);

        setDispositivos((prev) =>
          prev.map((item) => (item.id === dispositivoEnEdicion.id ? transformado : item))
        );

        setMensaje({
          tipo: "success",
          texto: "El dispositivo se actualizó correctamente.",
        });
      } else {
        const { data } = await clienteAxios.post("/dispositivos", payload);
        setDispositivos((prev) => [transformarDispositivo(data), ...prev]);
        setMensaje({
          tipo: "success",
          texto: "El dispositivo se registró correctamente.",
        });
      }

      return true;
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible guardar el dispositivo.",
      });
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const solicitarEliminar = (dispositivo) => {
    setDispositivoPendienteEliminar(dispositivo);
    setConfirmacionAbierta(true);
  };

  const confirmarEliminar = async () => {
    if (!dispositivoPendienteEliminar) return;

    setEliminando(true);
    try {
      await clienteAxios.delete(`/dispositivos/${dispositivoPendienteEliminar.id}`);
      setDispositivos((prev) =>
        prev.filter((item) => item.id !== dispositivoPendienteEliminar.id)
      );
      setMensaje({
        tipo: "success",
        texto: "El dispositivo fue eliminado correctamente.",
      });
      setConfirmacionAbierta(false);
      setDispositivoPendienteEliminar(null);
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible eliminar el dispositivo.",
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
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Inventario
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">
                  Dispositivos asignados
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Administra equipos y relaciónalos con tus paquetes asignados microsoft family
                </p>
              </div>

              <div className="">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Dispositivos
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{dispositivos.length}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)] p-5 sm:p-6 xl:p-7">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    Gestión
                  </div>
                  <p className="mt-3 text-base font-semibold text-slate-900">Equipos registrados</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Consulta información del equipo, su usuario y la cuenta asignada.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por equipo, usuario o cuenta"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200 sm:w-80"
                  />

                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#0f172a,_#1e293b,_#334155)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:brightness-110"
                    onClick={abrirCrear}
                  >
                    <FiPlus size={16} />
                    Nuevo dispositivo
                  </button>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 xl:p-7">
              <div className="overflow-hidden rounded-3xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                      <tr>
                        <th className="px-4 py-4 text-left">Equipo</th>
                        <th className="px-4 py-4 text-left">Marca</th>
                        <th className="px-4 py-4 text-left">Área</th>
                        <th className="px-4 py-4 text-left">Usuario</th>
                        <th className="px-4 py-4 text-left">Paquete office</th>
                        <th className="px-4 py-4 text-right">Acciones</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                      {cargando ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-sm text-slate-500">
                            Cargando dispositivos...
                          </td>
                        </tr>
                      ) : dispositivosFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-sm text-slate-500">
                            No encontramos dispositivos con ese criterio.
                          </td>
                        </tr>
                      ) : (
                        dispositivosFiltrados.map((dispositivo) => (
                          <tr key={dispositivo.id} className="transition hover:bg-slate-50/80">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                                  <FiMonitor size={18} />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">{dispositivo.nombreSistema}</p>
                                  <p className="mt-1 text-xs text-slate-500">{dispositivo.tipoEquipo}</p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2 text-slate-700">
                                <FiCpu size={15} className="text-slate-400" />
                                {dispositivo.marca}
                              </div>
                            </td>

                            <td className="px-4 py-4 text-slate-600">
                              {dispositivo.area || "Sin área"}
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2 text-slate-700">
                                <FiUser size={15} className="text-slate-400" />
                                {dispositivo.usuarioActual}
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div>
                                <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                                  {dispositivo.asignacionTipo}
                                </span>
                                <p className="mt-2 text-sm text-slate-700">{dispositivo.asignacionNombre}</p>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex flex-wrap justify-end gap-2">
                                <button
                                  onClick={() =>
                                    setMensaje({
                                      tipo: "info",
                                      texto: `${dispositivo.nombreSistema} está asignado a ${dispositivo.asignacionNombre}.`,
                                    })
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700 transition hover:bg-sky-100"
                                  title="Ver detalle"
                                  aria-label={`Ver detalle de ${dispositivo.nombreSistema}`}
                                >
                                  <FiEye size={15} />
                                </button>
                                <button
                                  onClick={() => abrirEditar(dispositivo)}
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                                  title="Editar dispositivo"
                                  aria-label={`Editar ${dispositivo.nombreSistema}`}
                                >
                                  <FiEdit2 size={15} />
                                </button>
                                <button
                                  onClick={() => solicitarEliminar(dispositivo)}
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                                  title="Eliminar dispositivo"
                                  aria-label={`Eliminar ${dispositivo.nombreSistema}`}
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
            </div>
          </section>
        </div>
      </div>

      <ModalDispositivo
        key={`${modoModal}-${dispositivoEnEdicion?.id || "nuevo"}-${modalAbierto ? "open" : "closed"}`}
        abierto={modalAbierto}
        cerrar={() => setModalAbierto(false)}
        onGuardar={guardarDispositivo}
        guardando={guardando}
        modo={modoModal}
        dispositivoInicial={dispositivoEnEdicion}
        cuentasPadre={cuentasPadre}
        cuentasHija={cuentasHija}
      />

      <ConfirmDialog
        abierto={confirmacionAbierta}
        titulo="Eliminar dispositivo"
        descripcion={
          dispositivoPendienteEliminar
            ? `Se eliminará el dispositivo ${dispositivoPendienteEliminar.nombreSistema}. Esta acción no se puede deshacer.`
            : ""
        }
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        onConfirmar={confirmarEliminar}
        onCancelar={() => {
          if (eliminando) return;
          setConfirmacionAbierta(false);
          setDispositivoPendienteEliminar(null);
        }}
        cargando={eliminando}
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

export default Dispositivos;
