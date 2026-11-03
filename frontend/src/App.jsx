import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AdminRoute } from './components/AdminRoute'
import { Navbar } from './components/Navbar'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { CheckoutProvider } from './contexts/CheckoutContext'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminFilmes } from './pages/admin/AdminFilmes'
import { AdminProdutos } from './pages/admin/AdminProdutos'
import { AdminSalas } from './pages/admin/AdminSalas'
import { AdminSessoes } from './pages/admin/AdminSessoes'
import { Cadastro } from './pages/public/Cadastro'
import { Checkout } from './pages/public/Checkout'
import { CheckoutIngressos } from './pages/public/CheckoutIngressos'
import { CheckoutProdutos } from './pages/public/CheckoutProdutos'
import { FilmeDetalhe } from './pages/public/FilmeDetalhe'
import { Home } from './pages/public/Home'
import { Login } from './pages/public/Login'
import { Pedidos } from './pages/public/Pedidos'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CheckoutProvider>
          <div className="app-shell">
            <Navbar />

            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/filmes/:id" element={<FilmeDetalhe />} />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout/:sessaoId/ingressos"
              element={
                <ProtectedRoute>
                  <CheckoutIngressos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout/:sessaoId/produtos"
              element={
                <ProtectedRoute>
                  <CheckoutProdutos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout/:sessaoId/resumo"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pedidos"
              element={
                <ProtectedRoute>
                  <Pedidos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/filmes"
              element={
                <AdminRoute>
                  <AdminFilmes />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/salas"
              element={
                <AdminRoute>
                  <AdminSalas />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/sessoes"
              element={
                <AdminRoute>
                  <AdminSessoes />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/produtos"
              element={
                <AdminRoute>
                  <AdminProdutos />
                </AdminRoute>
              }
            />
            </Routes>
          </div>
        </CheckoutProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
