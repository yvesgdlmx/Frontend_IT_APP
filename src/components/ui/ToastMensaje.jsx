import React, { useEffect } from "react";
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";

const estilos = {
  success: {
    contenedor: "border-emerald-200 bg-white text-slate-800",
    icono: "bg-emerald-50 text-emerald-600",
    barra: "bg-emerald-500",
  },
  error: {
    contenedor: "border-rose-200 bg-white text-slate-800",
    icono: "bg-rose-50 text-rose-600",
    barra: "bg-rose-500",
  },
  info: {
    contenedor: "border-sky-200 bg-white text-slate-800",
    icono: "bg-sky-50 text-sky-600",
    barra: "bg-sky-500",
  },
};

const ToastMensaje = ({ abierto, tipo = "info", texto, onClose }) => {
  useEffect(() => {
    if (!abierto || !texto) return undefined;

    const timeout = setTimeout(() => {
      onClose?.();
    }, 3500);

    return () => clearTimeout(timeout);
  }, [abierto, texto, onClose]);

  if (!abierto || !texto) return null;

  const estilo = estilos[tipo] || estilos.info;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[70] w-full max-w-sm sm:right-6 sm:top-6">
      <div
        className={`pointer-events-auto relative overflow-hidden rounded-2xl border shadow-[0_20px_60px_rgba(15,23,42,0.16)] ${estilo.contenedor}`}
      >
        <div className={`absolute inset-x-0 top-0 h-1 ${estilo.barra}`} />

        <div className="flex items-start gap-3 px-4 py-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${estilo.icono}`}>
            {tipo === "success" ? (
              <FiCheckCircle size={18} />
            ) : tipo === "error" ? (
              <FiAlertCircle size={18} />
            ) : (
              <FiInfo size={18} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">
              {tipo === "success" ? "Operación exitosa" : tipo === "error" ? "Ocurrió un problema" : "Información"}
            </p>
            <p className="mt-1 text-sm text-slate-500">{texto}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar notificación"
          >
            <FiX size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToastMensaje;
