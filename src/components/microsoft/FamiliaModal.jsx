import React from "react";
import Modal from "react-modal";
import {
  HiOutlineComputerDesktop,
  HiOutlineKey,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import { FaMicrosoft } from "react-icons/fa";

Modal.setAppElement("#root");

const FamiliaModal = ({
  abierto,
  cerrarModal,
  cuenta,
  onEditar,
  onEliminar,
}) => {
  if (!cuenta) return null;

  const cuentas = [
    { ...cuenta, esPrincipal: true },
    ...(cuenta.hijos || []).map((hija) => ({ ...hija, esPrincipal: false })),
  ];

  const getColorBar = (n) => {
    if (n >= 5) return "bg-rose-500";
    if (n >= 4) return "bg-amber-500";
    return "bg-sky-500";
  };

  return (
    <Modal
      isOpen={abierto}
      onRequestClose={cerrarModal}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      className="w-full max-w-[920px] max-h-[90vh] overflow-y-auto rounded-3xl bg-white outline-none shadow-[0_25px_60px_rgba(0,0,0,0.15)]"
    >
      <div className="space-y-6 p-6 sm:p-7">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <FaMicrosoft className="text-[16px] text-slate-700" />
              </div>

              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                Microsoft 365
              </span>
            </div>

            <h2 className="mt-3 text-xl font-semibold text-slate-800">Familia de cuenta</h2>
            <p className="mt-1 text-sm text-slate-500">
              Revisa la cuenta principal, sus subcuentas y los dispositivos vinculados.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEditar?.(cuenta)}
              className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
            >
              Editar
            </button>
            <button
              onClick={() => onEliminar?.(cuenta)}
              className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              Eliminar
            </button>
            <button
              onClick={cerrarModal}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
            >
              ×
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {cuentas.map((c, i) => (
            <div
              key={i}
              className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <HiOutlineUserCircle className="text-xl" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-slate-800">{c.email}</p>
                      {c.esPrincipal ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                          Principal
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-1 flex items-center gap-1 text-xs font-mono text-slate-400">
                      <HiOutlineKey className="text-[12px]" />
                      {c.password}
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      Vence: {c.vencimiento || "Sin fecha"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-400">Dispositivos</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {(c.dispositivos || []).length}/5
                  </p>
                </div>
              </div>

              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-1.5 rounded-full transition-all ${getColorBar(
                    (c.dispositivos || []).length
                  )}`}
                  style={{
                    width: `${Math.min(((c.dispositivos || []).length / 5) * 100, 100)}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(c.dispositivos || []).length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-xs text-slate-400 sm:col-span-2">
                    No hay dispositivos registrados para esta cuenta.
                  </div>
                ) : (
                  (c.dispositivos || []).map((d, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <HiOutlineComputerDesktop className="text-sm text-slate-400" />
                        <span className="text-slate-700">
                          {d.nombre || d.nombreSistema || "Dispositivo"}
                        </span>
                      </div>

                      <span className="text-slate-400">
                        {d.fecha || d.createdAt?.slice(0, 10) || ""}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={cerrarModal}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-5 font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default FamiliaModal;
