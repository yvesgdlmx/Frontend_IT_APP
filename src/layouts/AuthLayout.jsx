import { Outlet } from 'react-router-dom'

const AuthLayout = () => {
  return (
    <main
      className="min-h-screen bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 flex items-center justify-center px-4"
    >
      <Outlet />
    </main>
  )
}

export default AuthLayout