import React, { useEffect, useMemo, useState } from "react";
import {
  FiShield,
  FiSearch,
  FiPlus,
  FiCopy,
  FiEye,
  FiEyeOff,
  FiGlobe,
  FiWifi,
  FiServer,
  FiMail,
  FiLock,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";

import clienteAxios from "../config/clienteAxios";
import ModalCredenciales from "../components/credenciales/ModalCredenciales";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ToastMensaje from "../components/ui/ToastMensaje";

const Credenciales = () => {
  const categorias = [
    { id: "m365", label: "Microsoft 365", icon: FiShield },
    { id: "cpanel", label: "cPanel", icon: FiGlobe },
    { id: "redes", label: "Redes", icon: FiWifi },
    { id: "vpn", label: "VPN", icon: FiLock },
    { id: "servidores", label: "Servidores", icon: FiServer },
  ];

  const [tabActiva, setTabActiva] = useState("m365");
  const [busqueda, setBusqueda] = useState("");
  const [visibles, setVisibles] = useState({});

  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoModal, setModoModal] = useState("crear");
  const [credencialEditar, setCredencialEditar] = useState(null);

  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false);
  const [credencialEliminar, setCredencialEliminar] = useState(null);

  const [mensaje, setMensaje] = useState({
    tipo: "",
    texto: "",
  });

  const cargarCredenciales = async () => {
    setCargando(true);

    try {
      const { data } = await clienteAxios.get("/credenciales");
      setRegistros(Array.isArray(data) ? data : []);
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto:
          error.response?.data?.error ||
          "No fue posible cargar las credenciales.",
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCredenciales();
  }, []);

  const datos = useMemo(() => {
    return registros.filter((item) => {
      const coincideCategoria = item.categoria === tabActiva;

      const texto =
        `${item.nombre} ${item.usuario} ${item.portal} ${item.responsable}`
          .toLowerCase()
          .includes(busqueda.toLowerCase());

      return coincideCategoria && texto;
    });
  }, [registros, tabActiva, busqueda]);

  const togglePassword = (id) => {
    setVisibles((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const copiar = async (texto) => {
    try {
      await navigator.clipboard.writeText(texto);

      setMensaje({
        tipo: "success",
        texto: "Contraseña copiada al portapapeles.",
      });
    } catch {
      setMensaje({
        tipo: "error",
        texto: "No fue posible copiar.",
      });
    }
  };

  const abrirCrear = () => {
    setModoModal("crear");
    setCredencialEditar(null);
    setModalAbierto(true);
  };

  const abrirEditar = (item) => {
    setModoModal("editar");
    setCredencialEditar(item);
    setModalAbierto(true);
  };

  const guardarCredencial = async (payload) => {
    setGuardando(true);

    try {
      if (modoModal === "editar" && credencialEditar?.id) {
        const { data } = await clienteAxios.put(
          `/credenciales/${credencialEditar.id}`,
          payload
        );

        setRegistros((prev) =>
          prev.map((item) =>
            item.id === credencialEditar.id ? data : item
          )
        );

        setMensaje({
          tipo: "success",
          texto: "Credencial actualizada correctamente.",
        });
      } else {
        const { data } = await clienteAxios.post(
          "/credenciales",
          payload
        );

        setRegistros((prev) => [data, ...prev]);

        setMensaje({
          tipo: "success",
          texto: "Credencial creada correctamente.",
        });
      }

      return true;
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto:
          error.response?.data?.error ||
          "No fue posible guardar la credencial.",
      });

      return false;
    } finally {
      setGuardando(false);
    }
  };

  const solicitarEliminar = (item) => {
    setCredencialEliminar(item);
    setConfirmacionAbierta(true);
  };

  const confirmarEliminar = async () => {
    if (!credencialEliminar) return;

    setEliminando(true);

    try {
      await clienteAxios.delete(
        `/credenciales/${credencialEliminar.id}`
      );

      setRegistros((prev) =>
        prev.filter((item) => item.id !== credencialEliminar.id)
      );

      setMensaje({
        tipo: "success",
        texto: "Credencial eliminada correctamente.",
      });

      setConfirmacionAbierta(false);
      setCredencialEliminar(null);
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto:
          error.response?.data?.error ||
          "No fue posible eliminar la credencial.",
      });
    } finally {
      setEliminando(false);
    }
  };

  const colorEstado = (estado) => {
    switch (estado) {
      case "Crítica":
        return "border-rose-200 bg-rose-50 text-rose-700";
      case "Compartida":
        return "border-amber-200 bg-amber-50 text-amber-700";
      case "Inactiva":
        return "border-slate-200 bg-slate-100 text-slate-700";
      default:
        return "border-sky-200 bg-sky-50 text-sky-700";
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[linear-gradient(180deg,_#f4f8ff_0%,_#f8fafc_32%,_#ffffff_100%)] px-4 py-4 sm:px-6 sm:py-6 2xl:px-8">
        <div className="mx-auto w-full max-w-[1600px] space-y-5">
          {/* Header */}
          <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Seguridad
                </div>

                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">
                  Credenciales empresariales
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  Administra accesos, usuarios y contraseñas organizadas por
                  plataforma.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Registros
                </p>

                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {registros.length}
                </p>
              </div>
            </div>
          </section>

          {/* Tabla */}
          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)] p-5 sm:p-6 xl:p-7 space-y-5">
              {/* Tabs */}
              <div className="flex flex-wrap gap-3">
                {categorias.map((cat) => {
                  const Icon = cat.icon;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setTabActiva(cat.id)}
                      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        tabActiva === cat.id
                          ? "bg-slate-900 text-white shadow-lg"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Icon size={16} />
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Busqueda */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-96">
                  <FiSearch
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />

                  <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar credencial..."
                    className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                  />
                </div>

                <button
                  onClick={abrirCrear}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#0f172a,_#1e293b,_#334155)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:brightness-110"
                >
                  <FiPlus size={16} />
                  Nueva credencial
                </button>
              </div>
            </div>

            {/* contenido */}
            <div className="p-5 sm:p-6 xl:p-7">
              <div className="overflow-hidden rounded-3xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                      <tr>
                        <th className="px-4 py-4 text-left">Nombre</th>
                        <th className="px-4 py-4 text-left">Usuario</th>
                        <th className="px-4 py-4 text-left">Contraseña</th>
                        <th className="px-4 py-4 text-left">Portal</th>
                        <th className="px-4 py-4 text-left">Estado</th>
                        <th className="px-4 py-4 text-right">Acciones</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                      {cargando ? (
                        <tr>
                          <td
                            colSpan="6"
                            className="px-6 py-12 text-center text-slate-500"
                          >
                            Cargando credenciales...
                          </td>
                        </tr>
                      ) : datos.length === 0 ? (
                        <tr>
                          <td
                            colSpan="6"
                            className="px-6 py-12 text-center text-slate-500"
                          >
                            No encontramos registros.
                          </td>
                        </tr>
                      ) : (
                        datos.map((item) => (
                          <tr
                            key={item.id}
                            className="transition hover:bg-slate-50/80"
                          >
                            <td className="px-4 py-4 font-semibold text-slate-900">
                              {item.nombre}
                            </td>

                            <td className="px-4 py-4 text-slate-700">
                              {item.usuario}
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-700">
                                  {visibles[item.id]
                                    ? item.password
                                    : "••••••••••••"}
                                </span>

                                <button
                                  onClick={() =>
                                    togglePassword(item.id)
                                  }
                                  className="text-slate-500 hover:text-slate-800"
                                >
                                  {visibles[item.id] ? (
                                    <FiEyeOff size={16} />
                                  ) : (
                                    <FiEye size={16} />
                                  )}
                                </button>
                              </div>
                            </td>

                            <td className="px-4 py-4 text-slate-600">
                              {item.portal || "Sin portal"}
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${colorEstado(
                                  item.estado
                                )}`}
                              >
                                {item.estado}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() =>
                                    copiar(item.password)
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                  title="Copiar"
                                >
                                  <FiCopy size={15} />
                                </button>

                                <button
                                  onClick={() =>
                                    abrirEditar(item)
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                  title="Editar"
                                >
                                  <FiEdit2 size={15} />
                                </button>

                                <button
                                  onClick={() =>
                                    solicitarEliminar(item)
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                  title="Eliminar"
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

      <ModalCredenciales
        key={`${modoModal}-${credencialEditar?.id || "nuevo"}-${
          modalAbierto ? "open" : "closed"
        }`}
        abierto={modalAbierto}
        cerrar={() => setModalAbierto(false)}
        onGuardar={guardarCredencial}
        guardando={guardando}
        modo={modoModal}
        credencialInicial={credencialEditar}
      />

      <ConfirmDialog
        abierto={confirmacionAbierta}
        titulo="Eliminar credencial"
        descripcion={
          credencialEliminar
            ? `Se eliminará la credencial ${credencialEliminar.nombre}. Esta acción no se puede deshacer.`
            : ""
        }
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        cargando={eliminando}
        onConfirmar={confirmarEliminar}
        onCancelar={() => {
          if (eliminando) return;
          setConfirmacionAbierta(false);
          setCredencialEliminar(null);
        }}
      />

      <ToastMensaje
        abierto={Boolean(mensaje.texto)}
        tipo={mensaje.tipo || "info"}
        texto={mensaje.texto}
        onClose={() =>
          setMensaje({
            tipo: "",
            texto: "",
          })
        }
      />
    </>
  );
};

export default Credenciales;