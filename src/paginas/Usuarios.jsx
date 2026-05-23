import { useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiLock, FiMail, FiPlus, FiShield, FiUser, FiUserPlus } from "react-icons/fi";
import clienteAxios from "../config/clienteAxios.jsx";
import { useAuth } from "../context/AuthContext";
import ToastMensaje from "../components/ui/ToastMensaje";

const estadoInicial = {
  nombre: "",
  email: "",
  password: "",
  rol: "usuario",
};

const Usuarios = () => {
  const { usuario } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [formulario, setFormulario] = useState(estadoInicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  const esAdmin = usuario?.rol === "admin";

  const cargarUsuarios = async () => {
    if (!esAdmin) {
      setCargando(false);
      return;
    }

    setCargando(true);

    try {
      const { data } = await clienteAxios.get("/usuarios");
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible cargar los usuarios.",
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, [esAdmin]);

  const resumen = useMemo(
    () => ({
      total: usuarios.length,
      admins: usuarios.filter((item) => item.rol === "admin").length,
      activos: usuarios.filter((item) => item.activo).length,
    }),
    [usuarios]
  );

  const handleChange = (e) => {
    setFormulario((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const crearUsuario = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      const { data } = await clienteAxios.post("/usuarios", formulario);
      setUsuarios((prev) => [data, ...prev]);
      setFormulario(estadoInicial);
      setMensaje({ tipo: "success", texto: "Usuario creado correctamente." });
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible crear el usuario.",
      });
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (item) => {
    try {
      const { data } = await clienteAxios.patch(`/usuarios/${item.id}/estado`);
      setUsuarios((prev) => prev.map((usuario) => (usuario.id === item.id ? data : usuario)));
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible actualizar el usuario.",
      });
    }
  };

  if (!esAdmin) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,_#f4f8ff_0%,_#f8fafc_32%,_#ffffff_100%)] px-4 py-4 sm:px-6 sm:py-6 2xl:px-8">
        <div className="mx-auto w-full max-w-3xl rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <div className="flex items-start gap-4">
            <FiShield className="mt-1 shrink-0" size={22} />
            <div>
              <h1 className="text-lg font-semibold">Acceso restringido</h1>
              <p className="mt-2 text-sm leading-6">
                Solo un usuario administrador puede crear y administrar usuarios.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[linear-gradient(180deg,_#f4f8ff_0%,_#f8fafc_32%,_#ffffff_100%)] px-4 py-4 sm:px-6 sm:py-6 2xl:px-8">
        <div className="mx-auto w-full max-w-[1600px] space-y-5">
          <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Administracion
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">
                  Usuarios del sistema
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Crea usuarios nuevos y controla quien puede acceder a TI CONTROL.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Usuarios
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{resumen.total}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Admins
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{resumen.admins}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Activos
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{resumen.activos}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[0.35fr_0.65fr]">
            <form onSubmit={crearUsuario} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <FiUserPlus />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">Nuevo usuario</p>
                  <p className="text-sm text-slate-500">Define sus credenciales y rol.</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Nombre
                  </span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3 focus-within:border-slate-500 focus-within:ring-4 focus-within:ring-slate-200">
                    <FiUser className="text-slate-400" />
                    <input
                      name="nombre"
                      value={formulario.nombre}
                      onChange={handleChange}
                      required
                      className="w-full bg-transparent text-sm text-slate-700 outline-none"
                      placeholder="Nombre completo"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Correo
                  </span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3 focus-within:border-slate-500 focus-within:ring-4 focus-within:ring-slate-200">
                    <FiMail className="text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formulario.email}
                      onChange={handleChange}
                      required
                      className="w-full bg-transparent text-sm text-slate-700 outline-none"
                      placeholder="usuario@empresa.com"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Contrasena temporal
                  </span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3 focus-within:border-slate-500 focus-within:ring-4 focus-within:ring-slate-200">
                    <FiLock className="text-slate-400" />
                    <input
                      type="password"
                      name="password"
                      value={formulario.password}
                      onChange={handleChange}
                      minLength={8}
                      required
                      className="w-full bg-transparent text-sm text-slate-700 outline-none"
                      placeholder="Minimo 8 caracteres"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Rol
                  </span>
                  <select
                    name="rol"
                    value={formulario.rol}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                  >
                    <option value="usuario">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </label>

                <button
                  disabled={guardando}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#0f172a,_#1e293b,_#334155)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <FiPlus />
                  {guardando ? "Creando..." : "Crear usuario"}
                </button>
              </div>
            </form>

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)] p-5 sm:p-6">
                <p className="text-base font-semibold text-slate-900">Usuarios registrados</p>
                <p className="mt-1 text-sm text-slate-500">
                  Puedes activar o desactivar accesos sin eliminar historial.
                </p>
              </div>

              <div className="p-5 sm:p-6">
                <div className="overflow-hidden rounded-3xl border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                        <tr>
                          <th className="px-4 py-4 text-left">Usuario</th>
                          <th className="px-4 py-4 text-left">Rol</th>
                          <th className="px-4 py-4 text-left">Estado</th>
                          <th className="px-4 py-4 text-right">Accion</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {cargando ? (
                          <tr>
                            <td colSpan="4" className="px-6 py-12 text-center text-sm text-slate-500">
                              Cargando usuarios...
                            </td>
                          </tr>
                        ) : usuarios.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-6 py-12 text-center text-sm text-slate-500">
                              No hay usuarios registrados.
                            </td>
                          </tr>
                        ) : (
                          usuarios.map((item) => (
                            <tr key={item.id} className="transition hover:bg-slate-50/80">
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-700">
                                    {item.nombre?.charAt(0)?.toUpperCase() || "U"}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-900">{item.nombre}</p>
                                    <p className="mt-1 text-xs text-slate-500">{item.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                                  {item.rol}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <span
                                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                                    item.activo
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : "border-slate-200 bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  <FiCheckCircle size={14} />
                                  {item.activo ? "Activo" : "Inactivo"}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <button
                                  disabled={item.id === usuario?.id}
                                  onClick={() => cambiarEstado(item)}
                                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {item.activo ? "Desactivar" : "Activar"}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <ToastMensaje
        abierto={Boolean(mensaje.texto)}
        tipo={mensaje.tipo || "info"}
        texto={mensaje.texto}
        onClose={() => setMensaje({ tipo: "", texto: "" })}
      />
    </>
  );
};

export default Usuarios;
