import { Outlet } from 'react-router-dom'

const AuthLayout = () => {
  return (
    <main
      className="min-h-screen bg-[#0b1020] flex items-center justify-center px-4 py-8"
    >
      <Outlet />
    </main>
  )
}

export default AuthLayout
