import React, { useState } from "react";

const crearPadreInicial = () => ({
  correo: "",
  fechaVencimiento: "",
  contraseña: "",
});

const crearHijaInicial = () => ({
  correo: "",
  fechaVencimiento: "",
  contraseña: "",
});

const mapearCuentaAFormulario = (cuenta) => ({
  correo: cuenta?.email || cuenta?.correo || "",
  fechaVencimiento: cuenta?.vencimiento || cuenta?.fechaVencimiento || "",
  contraseña: cuenta?.password || cuenta?.contraseña || "",
});

const mapearHijasAFormulario = (hijas = []) => {
  if (!Array.isArray(hijas) || hijas.length === 0) return [crearHijaInicial()];

  return hijas.map((hija) => ({
    correo: hija.email || hija.correo || "",
    fechaVencimiento: hija.vencimiento || hija.fechaVencimiento || "",
    contraseña: hija.password || hija.contraseña || "",
  }));
};

const ModalCrearCuenta = ({
  abierto,
  cerrar,
  onCrear,
  creando = false,
  modo = "crear",
  cuentaInicial = null,
}) => {
  const padreInicial =
    modo === "editar" && cuentaInicial
      ? mapearCuentaAFormulario(cuentaInicial)
      : crearPadreInicial();

  const hijasIniciales =
    modo === "editar" && cuentaInicial
      ? mapearHijasAFormulario(cuentaInicial.hijos)
      : [crearHijaInicial()];

  const [padre, setPadre] = useState(padreInicial);
  const [hijas, setHijas] = useState(hijasIniciales);
  const [error, setError] = useState("");

  const handlePadreChange = (e) => {
    setPadre((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleHijaChange = (idx, e) => {
    setHijas((prev) =>
      prev.map((hija, index) =>
        index === idx ? { ...hija, [e.target.name]: e.target.value } : hija
      )
    );
  };

  const agregarHija = () => {
    setHijas((prev) => [...prev, crearHijaInicial()]);
  };

  const eliminarHija = (idx) => {
    setHijas((prev) => prev.filter((_, index) => index !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hijasLimpias = hijas
      .map((hija) => ({
        correo: hija.correo.trim(),
        fechaVencimiento: hija.fechaVencimiento,
        contraseña: hija.contraseña.trim(),
      }))
      .filter((hija) => hija.correo || hija.fechaVencimiento || hija.contraseña);

    const hayHijaIncompleta = hijasLimpias.some(
      (hija) => !hija.correo || !hija.fechaVencimiento || !hija.contraseña
    );

    if (hayHijaIncompleta) {
      setError("Cada cuenta hija debe tener correo, contraseña y fecha de vencimiento.");
      return;
    }

    setError("");

    const creado = await onCrear({
      correo: padre.correo.trim(),
      fechaVencimiento: padre.fechaVencimiento,
      contraseña: padre.contraseña.trim(),
      hijas: hijasLimpias,
    });

    if (creado) cerrar();
  };

  if (!abierto) return null;

  const esEdicion = modo === "editar";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={cerrar} />

      <div className="relative w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.24)]">
        <button
          type="button"
          className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-2xl text-slate-500 transition hover:bg-slate-50 hover:text-rose-500"
          onClick={cerrar}
          aria-label="Cerrar"
        >
          ×
        </button>

        <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.14),_transparent_28%),linear-gradient(135deg,_#f8fafc,_#ffffff)] px-6 py-5 sm:px-8">
          <div className="pr-14">
            <div className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700">
              {esEdicion ? "Editar familia" : "Nueva familia"}
            </div>
            <h2 className="mt-3 text-[1.75rem] font-semibold leading-tight text-slate-900">
              {esEdicion ? "Actualizar cuenta principal y subcuentas" : "Crear cuenta principal con cuentas hijas"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Completa los datos de la cuenta padre y administra sus cuentas hijas en el mismo formulario.
            </p>
          </div>
        </div>

        <section className="max-h-[78vh] overflow-y-auto bg-slate-50 px-6 py-5 sm:px-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                    Cuenta principal
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">
                    Datos base
                  </h3>
                </div>
                <div className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                  Obligatorio
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Correo</span>
                  <input
                    type="email"
                    name="correo"
                    value={padre.correo}
                    onChange={handlePadreChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    placeholder="empresa@outlook.com"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Fecha de vencimiento</span>
                  <input
                    type="date"
                    name="fechaVencimiento"
                    value={padre.fechaVencimiento}
                    onChange={handlePadreChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    required
                  />
                </label>

                <label className="block md:col-span-2 xl:col-span-1">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Contraseña</span>
                  <input
                    type="text"
                    name="contraseña"
                    value={padre.contraseña}
                    onChange={handlePadreChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    placeholder="Contraseña de la cuenta principal"
                    required
                  />
                </label>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                    Cuentas hijas
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">
                    Estructura de familia
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Puedes dejar la lista vacía o registrar todas las subcuentas desde aquí.
                  </p>
                </div>

                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  onClick={agregarHija}
                >
                  + Agregar hija
                </button>
              </div>

              <div className="space-y-4">
                {hijas.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                    Aún no hay cuentas hijas en esta familia.
                  </div>
                ) : (
                  hijas.map((hija, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Cuenta hija {idx + 1}</p>
                          <p className="text-xs text-slate-500">
                            Se asociará automáticamente a la cuenta principal.
                          </p>
                        </div>

                        <button
                          type="button"
                          className="rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                          onClick={() => eliminarHija(idx)}
                        >
                          Eliminar
                        </button>
                      </div>

                      <div className="grid gap-3 lg:grid-cols-3">
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">Correo</span>
                          <input
                            type="email"
                            name="correo"
                            value={hija.correo}
                            onChange={(e) => handleHijaChange(idx, e)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                            placeholder="usuario@outlook.com"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">Fecha de vencimiento</span>
                          <input
                            type="date"
                            name="fechaVencimiento"
                            value={hija.fechaVencimiento}
                            onChange={(e) => handleHijaChange(idx, e)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                          />
                        </label>

                        <label className="block lg:col-span-1">
                          <span className="mb-2 block text-sm font-medium text-slate-700">Contraseña</span>
                          <input
                            type="text"
                            name="contraseña"
                            value={hija.contraseña}
                            onChange={(e) => handleHijaChange(idx, e)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                            placeholder="Contraseña de la cuenta hija"
                          />
                        </label>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/95 pt-4 backdrop-blur sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                onClick={cerrar}
                disabled={creando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-2xl bg-[linear-gradient(135deg,_#1e293b,_#334155,_#475569)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={creando}
              >
                {creando ? (esEdicion ? "Guardando cambios..." : "Guardando familia...") : esEdicion ? "Guardar cambios" : "Guardar cuenta"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ModalCrearCuenta;
