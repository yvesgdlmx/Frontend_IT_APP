import React from "react";
import Modal from "react-modal";
import { FiAlertTriangle } from "react-icons/fi";

Modal.setAppElement("#root");

const ConfirmDialog = ({
  abierto,
  titulo = "Confirmar acción",
  descripcion = "",
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  onConfirmar,
  onCancelar,
  cargando = false,
}) => {
  return (
    <Modal
      isOpen={abierto}
      onRequestClose={onCancelar}
      overlayClassName="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
      className="w-full max-w-md rounded-[26px] border border-slate-200 bg-white outline-none shadow-[0_28px_80px_rgba(15,23,42,0.24)]"
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <FiAlertTriangle size={22} />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">{titulo}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{descripcion}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={onCancelar}
            disabled={cargando}
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            className="rounded-2xl bg-[linear-gradient(135deg,_#be123c,_#e11d48,_#fb7185)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            onClick={onConfirmar}
            disabled={cargando}
          >
            {cargando ? "Procesando..." : textoConfirmar}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
