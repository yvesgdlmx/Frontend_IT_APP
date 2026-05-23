import { useEffect, useMemo, useState } from "react";
import {
  FiCheck,
  FiCheckCircle,
  FiFileText,
  FiImage,
  FiList,
  FiPlus,
  FiStar,
  FiTrash2,
  FiUploadCloud,
} from "react-icons/fi";
import clienteAxios from "../config/clienteAxios.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ToastMensaje from "../components/ui/ToastMensaje";

const tabs = [
  {
    id: "actividad",
    label: "Actividades",
    descripcion: "Pendientes personales y seguimiento diario",
    icon: FiList,
  },
  {
    id: "nota",
    label: "Notas",
    descripcion: "Ideas rapidas, observaciones y recordatorios",
    icon: FiFileText,
  },
  {
    id: "apunte",
    label: "Apuntes importantes",
    descripcion: "Procedimientos con fotos o videos de referencia",
    icon: FiStar,
  },
];

const estadoInicial = {
  titulo: "",
  contenido: "",
  prioridad: "media",
  fechaLimite: "",
  archivos: [],
};

const prioridadClase = {
  baja: "border-emerald-200 bg-emerald-50 text-emerald-700",
  media: "border-sky-200 bg-sky-50 text-sky-700",
  alta: "border-rose-200 bg-rose-50 text-rose-700",
};

const crearFormData = (formulario, tipo) => {
  const formData = new FormData();
  formData.append("tipo", tipo);
  formData.append("titulo", formulario.titulo);
  formData.append("contenido", formulario.contenido);
  formData.append("prioridad", formulario.prioridad);
  formData.append("fechaLimite", formulario.fechaLimite);

  Array.from(formulario.archivos || []).forEach((archivo) => {
    formData.append("archivos", archivo);
  });

  return formData;
};

const EspacioTrabajo = () => {
  const [tabActiva, setTabActiva] = useState("actividad");
  const [items, setItems] = useState([]);
  const [formulario, setFormulario] = useState(estadoInicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [itemEliminar, setItemEliminar] = useState(null);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  const tabActual = tabs.find((tab) => tab.id === tabActiva);
  const EmptyIcon = tabActual?.icon || FiFileText;

  const cargarItems = async () => {
    setCargando(true);

    try {
      const { data } = await clienteAxios.get("/trabajo");
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible cargar tu espacio.",
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarItems();
  }, []);

  const resumen = useMemo(
    () => ({
      actividades: items.filter((item) => item.tipo === "actividad").length,
      pendientes: items.filter(
        (item) => item.tipo === "actividad" && item.estado !== "completada"
      ).length,
      notas: items.filter((item) => item.tipo === "nota").length,
      apuntes: items.filter((item) => item.tipo === "apunte").length,
    }),
    [items]
  );

  const itemsFiltrados = items.filter((item) => item.tipo === tabActiva);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setFormulario((prev) => ({
      ...prev,
      [name]: files ? files : value,
    }));
  };

  const limpiarFormulario = () => {
    setFormulario(estadoInicial);
  };

  const guardarItem = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      const { data } = await clienteAxios.post(
        "/trabajo",
        crearFormData(formulario, tabActiva),
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setItems((prev) => [data, ...prev]);
      limpiarFormulario();
      setMensaje({
        tipo: "success",
        texto: "Registro creado correctamente.",
      });
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible guardar el registro.",
      });
    } finally {
      setGuardando(false);
    }
  };

  const completarActividad = async (item) => {
    try {
      const { data } = await clienteAxios.patch(`/trabajo/${item.id}/completar`);
      setItems((prev) => prev.map((actual) => (actual.id === item.id ? data : actual)));
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible actualizar la actividad.",
      });
    }
  };

  const confirmarEliminar = async () => {
    if (!itemEliminar) return;

    setEliminando(true);

    try {
      await clienteAxios.delete(`/trabajo/${itemEliminar.id}`);
      setItems((prev) => prev.filter((item) => item.id !== itemEliminar.id));
      setItemEliminar(null);
      setMensaje({
        tipo: "success",
        texto: "Registro eliminado correctamente.",
      });
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible eliminar el registro.",
      });
    } finally {
      setEliminando(false);
    }
  };

  const nombreAccion =
    tabActiva === "actividad"
      ? "Crear actividad"
      : tabActiva === "nota"
        ? "Crear nota"
        : "Crear apunte";

  return (
    <>
      <div className="min-h-screen bg-[linear-gradient(180deg,_#f4f8ff_0%,_#f8fafc_32%,_#ffffff_100%)] px-4 py-4 sm:px-6 sm:py-6 2xl:px-8">
        <div className="mx-auto w-full max-w-[1600px] space-y-5">
          <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Espacio personal
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">
                  Actividades, notas y apuntes
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Organiza pendientes, notas rapidas y referencias tecnicas visibles solo para tu usuario.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Actividades
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{resumen.actividades}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Pendientes
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{resumen.pendientes}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Notas
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{resumen.notas}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Apuntes
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{resumen.apuntes}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)] p-5 sm:p-6 xl:p-7">
              <div className="grid gap-3 md:grid-cols-3">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const activo = tabActiva === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setTabActiva(tab.id);
                        limpiarFormulario();
                      }}
                      className={`rounded-2xl border p-4 text-left transition ${
                        activo
                          ? "border-slate-300 bg-slate-100 text-slate-900 shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                            activo ? "bg-white text-slate-700" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{tab.label}</p>
                          <p className={`mt-1 text-xs ${activo ? "text-slate-500" : "text-slate-500"}`}>
                            {tab.descripcion}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-0 xl:grid-cols-[0.35fr_0.65fr]">
              <form onSubmit={guardarItem} className="border-b border-slate-200 p-5 sm:p-6 xl:border-b-0 xl:border-r xl:p-7">
                <div className="mb-5">
                  <p className="text-base font-semibold text-slate-900">{nombreAccion}</p>
                  <p className="mt-1 text-sm text-slate-500">{tabActual?.descripcion}</p>
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
                      placeholder="Ej. Revisar configuracion del router"
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Descripcion
                    </span>
                    <textarea
                      name="contenido"
                      value={formulario.contenido}
                      onChange={handleChange}
                      rows={6}
                      placeholder="Agrega el contexto, pasos o informacion importante."
                      className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                    />
                  </label>

                  {tabActiva === "actividad" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
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

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Fecha limite
                        </span>
                        <input
                          type="date"
                          name="fechaLimite"
                          value={formulario.fechaLimite}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                        />
                      </label>
                    </div>
                  ) : null}

                  {tabActiva === "apunte" ? (
                    <label className="block rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <FiUploadCloud size={17} />
                        Fotos o videos de referencia
                      </span>
                      <input
                        type="file"
                        name="archivos"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleChange}
                        className="mt-3 block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        Puedes adjuntar hasta 5 archivos por registro.
                      </p>
                    </label>
                  ) : null}

                  <button
                    disabled={guardando}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#0f172a,_#1e293b,_#334155)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <FiPlus size={16} />
                    {guardando ? "Guardando..." : nombreAccion}
                  </button>
                </div>
              </form>

              <div className="p-5 sm:p-6 xl:p-7">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{tabActual?.label}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {itemsFiltrados.length} registros en esta seccion.
                    </p>
                  </div>
                </div>

                {cargando ? (
                  <div className="rounded-3xl border border-slate-200 px-6 py-12 text-center text-sm text-slate-500">
                    Cargando tu espacio...
                  </div>
                ) : itemsFiltrados.length === 0 ? (
                  <div className="rounded-3xl border border-slate-200 px-6 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                      <EmptyIcon size={20} />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-slate-900">Sin registros todavia</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Crea el primer elemento desde el formulario lateral.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {itemsFiltrados.map((item) => {
                      const completada = item.estado === "completada";

                      return (
                        <article
                          key={item.id}
                          className={`rounded-3xl border p-4 transition hover:bg-slate-50/80 ${
                            completada ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className={`font-semibold ${completada ? "text-slate-500 line-through" : "text-slate-900"}`}>
                                  {item.titulo}
                                </h3>
                                {item.tipo === "actividad" ? (
                                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${prioridadClase[item.prioridad] || prioridadClase.media}`}>
                                    {item.prioridad}
                                  </span>
                                ) : null}
                                {item.tipo === "actividad" && item.fechaLimite ? (
                                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                    {item.fechaLimite}
                                  </span>
                                ) : null}
                              </div>

                              {item.contenido ? (
                                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                                  {item.contenido}
                                </p>
                              ) : null}

                              {item.archivos?.length ? (
                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                  {item.archivos.map((archivo) => (
                                    <a
                                      key={archivo.url}
                                      href={`${import.meta.env.VITE_BACKEND_URL}${archivo.url}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-white"
                                    >
                                      <FiImage className="text-slate-400" />
                                      <span className="truncate">{archivo.nombre}</span>
                                    </a>
                                  ))}
                                </div>
                              ) : null}
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                              {item.tipo === "actividad" ? (
                                <button
                                  onClick={() => completarActividad(item)}
                                  className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition ${
                                    completada
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  {completada ? <FiCheckCircle size={15} /> : <FiCheck size={15} />}
                                  {completada ? "Completada" : "Completar"}
                                </button>
                              ) : null}

                              <button
                                onClick={() => setItemEliminar(item)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                                title="Eliminar"
                                aria-label={`Eliminar ${item.titulo}`}
                              >
                                <FiTrash2 size={15} />
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        abierto={Boolean(itemEliminar)}
        titulo="Eliminar registro"
        descripcion={
          itemEliminar
            ? `Se eliminara "${itemEliminar.titulo}". Esta accion no se puede deshacer.`
            : ""
        }
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        cargando={eliminando}
        onConfirmar={confirmarEliminar}
        onCancelar={() => {
          if (eliminando) return;
          setItemEliminar(null);
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

export default EspacioTrabajo;
