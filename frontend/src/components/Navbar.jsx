import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth()
  const userInitial = user?.name?.[0] ?? user?.email?.[0] ?? 'U'

  return (
    <header className="topbar">
      <Link className="brand" to="/" aria-label="Ir para o início">
        <svg fill="#d71920" height="40px" width="40px" version="1.1" id="Icons" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" xml:space="preserve" stroke="#d71920"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M3,16c-0.1,0-0.3,0-0.4-0.1c-0.2-0.1-0.4-0.3-0.5-0.6l-1.4-3.8C0.4,10.8,0.5,10,0.8,9.3C1.1,8.6,1.7,8,2.5,7.7l20.7-7.5 l0,0c0.8-0.3,1.6-0.2,2.3,0.1C26.2,0.6,26.7,1.2,27,2l1.4,3.8c0.1,0.2,0.1,0.5,0,0.8C28.2,6.8,28,6.9,27.8,7L3.3,15.9 C3.2,16,3.1,16,3,16z"></path> </g> <g> <path d="M30,20v-4c0-0.6-0.4-1-1-1H3c-0.6,0-1,0.4-1,1v4H30z"></path> <path d="M2,22v7c0,1.7,1.3,3,3,3h22c1.7,0,3-1.3,3-3v-7H2z"></path> </g> </g></svg>
        <span>Cinéfilos</span>
      </Link>

      <nav className="main-nav" aria-label="Navegação principal">
        <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Filmes
        </NavLink>
        {isAuthenticated && (
          <NavLink to="/pedidos" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Meus pedidos
          </NavLink>
        )}
        {isAdmin && (
          <NavLink to="/admin" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Admin
          </NavLink>
        )}
      </nav>

      {isAuthenticated ? (
        <div className="user-menu">
          <div className="user-identity" aria-label={`Usuário logado: ${user.name ?? user.email}`}>
            <span className="user-avatar">{userInitial.toUpperCase()}</span>
            <span className="user-name">{user.name ?? user.email}</span>
          </div>
          <button type="button" className="logout-button" onClick={logout}>
            Sair
          </button>
        </div>
      ) : (
        <Link className="login-button" to="/login">
          Entrar
        </Link>
      )}
    </header>
  )
}
