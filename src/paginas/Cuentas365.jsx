import React, { useEffect, useState } from "react";
import { FiEdit2, FiEye, FiTrash2 } from "react-icons/fi";
import FamiliaModal from "../components/microsoft/FamiliaModal";
import ModalCrearCuenta from "../components/microsoft/ModalCrearCuenta";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ToastMensaje from "../components/ui/ToastMensaje";
import clienteAxios from "../config/clienteAxios";

const TOTAL_GLOBAL = 30;

const transformarDispositivo = (dispositivo) => ({
  id: dispositivo.id,
  nombre: dispositivo.nombreSistema || dispositivo.nombre || "Dispositivo",
  fecha: dispositivo.createdAt?.slice(0, 10) || "",
});

const transformarCuenta = (cuenta) => ({
  id: cuenta.id,
  email: cuenta.correo,
  tipo: "Principal",
  vencimiento: cuenta.fechaVencimiento?.slice(0, 10) || "",
  password: cuenta.contraseña,
  dispositivos: Array.isArray(cuenta.dispositivos)
    ? cuenta.dispositivos.map(transformarDispositivo)
    : [],
  hijos: Array.isArray(cuenta.hijas)
    ? cuenta.hijas.map((hija) => ({
        id: hija.id,
        email: hija.correo,
        password: hija.contraseña,
        vencimiento: hija.fechaVencimiento?.slice(0, 10) || "",
        dispositivos: Array.isArray(hija.dispositivos)
          ? hija.dispositivos.map(transformarDispositivo)
          : [],
      }))
    : [],
});

const Cuentas365 = () => {
  const [selected, setSelected] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [data, setData] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [creando, setCreando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const [modoModal, setModoModal] = useState("crear");
  const [cuentaEnEdicion, setCuentaEnEdicion] = useState(null);
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false);
  const [cuentaPendienteEliminar, setCuentaPendienteEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const cargarCuentas = async () => {
    setCargando(true);
    try {
      const { data: cuentas } = await clienteAxios.get("/cuentas/padre");
      setData(Array.isArray(cuentas) ? cuentas.map(transformarCuenta) : []);
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible cargar las cuentas.",
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCuentas();
  }, []);

  const cuentasFiltradas = data.filter((row) => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return true;

    return (
      row.email.toLowerCase().includes(termino) ||
      row.hijos.some((hijo) => hijo.email.toLowerCase().includes(termino))
    );
  });

  const totalCuentasHijas = data.reduce((acc, cuenta) => acc + cuenta.hijos.length, 0);

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getEstado = (porcentaje) => {
    if (porcentaje >= 100) {
      return { label: "Saturado", color: "bg-rose-100 text-rose-700 border-rose-200" };
    }

    if (porcentaje >= 80) {
      return { label: "Alta ocupacion", color: "bg-amber-100 text-amber-700 border-amber-200" };
    }

    return { label: "Disponible", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  };

  const getVencimientoEstado = (fecha) => {
    const hoy = new Date();
    const vencimiento = new Date(fecha);
    const diff = (vencimiento - hoy) / (1000 * 60 * 60 * 24);

    if (diff < 0) return { label: "Vencido", color: "text-rose-600" };
    if (diff < 7) return { label: "Pronto", color: "text-amber-600" };
    return { label: "Activo", color: "text-emerald-600" };
  };

  const abrirModalCrear = () => {
    setModoModal("crear");
    setCuentaEnEdicion(null);
    setModalCrearAbierto(true);
  };

  const abrirModalEditar = (cuenta) => {
    setModoModal("editar");
    setCuentaEnEdicion(cuenta);
    setModalAbierto(false);
    setModalCrearAbierto(true);
  };

  const handleGuardarCuenta = async (payload) => {
    setCreando(true);
    setMensaje({ tipo: "", texto: "" });

    try {
      if (modoModal === "editar" && cuentaEnEdicion?.id) {
        const { data: cuentaActualizada } = await clienteAxios.put(
          `/cuentas/padre/${cuentaEnEdicion.id}`,
          payload
        );

        const cuentaTransformada = transformarCuenta(cuentaActualizada);
        setData((prev) =>
          prev.map((cuenta) =>
            cuenta.id === cuentaEnEdicion.id ? cuentaTransformada : cuenta
          )
        );

        if (cuentaSeleccionada?.id === cuentaEnEdicion.id) {
          setCuentaSeleccionada(cuentaTransformada);
        }

        setMensaje({
          tipo: "success",
          texto: "La familia se actualizó correctamente.",
        });
      } else {
        const { data: cuentaCreada } = await clienteAxios.post("/cuentas/padre", payload);
        const cuentaTransformada = transformarCuenta(cuentaCreada);

        setData((prev) => [cuentaTransformada, ...prev]);
        setMensaje({
          tipo: "success",
          texto: "La cuenta principal y sus cuentas hijas se registraron correctamente.",
        });
      }

      return true;
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible guardar la cuenta.",
      });
      return false;
    } finally {
      setCreando(false);
    }
  };

  const solicitarEliminarCuenta = (cuenta) => {
    setCuentaPendienteEliminar(cuenta);
    setConfirmacionAbierta(true);
  };

  const confirmarEliminarCuenta = async () => {
    if (!cuentaPendienteEliminar) return;

    setEliminando(true);
    try {
      await clienteAxios.delete(`/cuentas/padre/${cuentaPendienteEliminar.id}`);

      setData((prev) => prev.filter((item) => item.id !== cuentaPendienteEliminar.id));
      setSelected((prev) => prev.filter((id) => id !== cuentaPendienteEliminar.id));
      if (cuentaSeleccionada?.id === cuentaPendienteEliminar.id) {
        setModalAbierto(false);
        setCuentaSeleccionada(null);
      }

      setMensaje({
        tipo: "success",
        texto: "La cuenta fue eliminada correctamente.",
      });
      setConfirmacionAbierta(false);
      setCuentaPendienteEliminar(null);
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible eliminar la cuenta.",
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
                  Microsoft 365
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">
                  Cuentas y familias
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Administra cuentas principales, subcuentas y su estado general de forma clara.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Cuentas padre
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{data.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Cuentas hijas
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{totalCuentasHijas}</p>
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
                  <p className="mt-3 text-base font-semibold text-slate-900">Familias registradas</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Vista general de cuentas, vencimientos y uso de dispositivos.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por correo principal o hija"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200 sm:w-80"
                  />

                  <button
                    className="rounded-2xl bg-[linear-gradient(135deg,_#0f172a,_#1e293b,_#334155)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:brightness-110"
                    onClick={abrirModalCrear}
                  >
                    + Nueva familia
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
                        <th className="px-4 py-4 text-left"></th>
                        <th className="px-4 py-4 text-left">Cuenta</th>
                        <th className="px-4 py-4 text-left">Familia</th>
                        <th className="px-4 py-4 text-left">Uso general</th>
                        <th className="px-4 py-4 text-left">Vencimiento</th>
                        <th className="px-4 py-4 text-left">Estado</th>
                        <th className="px-4 py-4 text-right">Acciones</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                      {cargando ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center text-sm text-slate-500">
                            Cargando cuentas...
                          </td>
                        </tr>
                      ) : cuentasFiltradas.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center text-sm text-slate-500">
                            No encontramos cuentas con ese criterio de búsqueda.
                          </td>
                        </tr>
                      ) : (
                        cuentasFiltradas.map((row) => {
                          const usadosPadre = row.dispositivos.length;
                          const usadosHijos = row.hijos.reduce(
                            (acc, hijo) => acc + hijo.dispositivos.length,
                            0
                          );
                          const totalUsados = usadosPadre + usadosHijos;
                          const porcentaje = (totalUsados / TOTAL_GLOBAL) * 100;
                          const estado = getEstado(porcentaje);
                          const venc = getVencimientoEstado(row.vencimiento);

                          return (
                            <tr key={row.id} className="transition hover:bg-slate-50/80">
                              <td className="px-4 py-4">
                                <input
                                  type="checkbox"
                                  checked={selected.includes(row.id)}
                                  onChange={() => toggle(row.id)}
                                  className="h-4 w-4 rounded accent-sky-600"
                                />
                              </td>

                              <td className="px-4 py-4">
                                <div>
                                  <p className="font-semibold text-slate-900">{row.email}</p>
                                  <p className="mt-1 text-xs text-slate-500">{row.tipo}</p>
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <div className="space-y-1">
                                  <p className="text-sm font-medium text-slate-700">
                                    {row.hijos.length} cuentas hijas
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {row.dispositivos.length} dispositivos en la principal
                                  </p>
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex min-w-[180px] items-center gap-3">
                                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                    <div
                                      className="h-full rounded-full bg-[linear-gradient(90deg,_#0ea5e9,_#2563eb)] transition-all"
                                      style={{ width: `${Math.min(porcentaje, 100)}%` }}
                                    />
                                  </div>
                                  <span className="whitespace-nowrap text-xs font-medium text-slate-500">
                                    {totalUsados}/{TOTAL_GLOBAL}
                                  </span>
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-slate-700">
                                    {row.vencimiento}
                                  </span>
                                  <span className={`text-xs font-medium ${venc.color}`}>
                                    {venc.label}
                                  </span>
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <span
                                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${estado.color}`}
                                >
                                  {estado.label}
                                </span>
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex flex-wrap justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setCuentaSeleccionada(row);
                                      setModalAbierto(true);
                                    }}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700 transition hover:bg-sky-100"
                                    title="Ver familia"
                                    aria-label={`Ver familia de ${row.email}`}
                                  >
                                    <FiEye size={15} />
                                  </button>
                                  <button
                                    onClick={() => abrirModalEditar(row)}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                                    title="Editar cuenta"
                                    aria-label={`Editar ${row.email}`}
                                  >
                                    <FiEdit2 size={15} />
                                  </button>
                                  <button
                                    onClick={() => solicitarEliminarCuenta(row)}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                                    title="Eliminar cuenta"
                                    aria-label={`Eliminar ${row.email}`}
                                  >
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
          </section>
        </div>
      </div>

      <FamiliaModal
        abierto={modalAbierto}
        cerrarModal={() => setModalAbierto(false)}
        cuenta={cuentaSeleccionada}
        onEditar={abrirModalEditar}
        onEliminar={solicitarEliminarCuenta}
      />

      <ModalCrearCuenta
        key={`${modoModal}-${cuentaEnEdicion?.id || "nueva"}-${modalCrearAbierto ? "open" : "closed"}`}
        abierto={modalCrearAbierto}
        cerrar={() => setModalCrearAbierto(false)}
        onCrear={handleGuardarCuenta}
        creando={creando}
        modo={modoModal}
        cuentaInicial={cuentaEnEdicion}
      />

      <ConfirmDialog
        abierto={confirmacionAbierta}
        titulo="Eliminar familia de cuentas"
        descripcion={
          cuentaPendienteEliminar
            ? `Se eliminará la cuenta ${cuentaPendienteEliminar.email} y sus cuentas hijas asociadas. Esta acción no se puede deshacer.`
            : ""
        }
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        onConfirmar={confirmarEliminarCuenta}
        onCancelar={() => {
          if (eliminando) return;
          setConfirmacionAbierta(false);
          setCuentaPendienteEliminar(null);
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

export default Cuentas365;
