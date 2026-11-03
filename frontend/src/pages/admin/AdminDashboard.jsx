import { Link } from 'react-router-dom'

const modules = [
  {
    title: 'Filmes',
    description: 'Cadastre cartaz, sinopse, elenco, duração, gênero e período de exibição.',
    href: '/admin/filmes',
    action: 'Gerenciar filmes',
  },
  {
    title: 'Salas',
    description: 'Configure número, linhas, colunas e a matriz de poltronas de cada sala.',
    href: '/admin/salas',
    action: 'Gerenciar salas',
  },
  {
    title: 'Sessões',
    description: 'Agende horários, valores de ingresso e evite conflito de sala.',
    href: '/admin/sessoes',
    action: 'Gerenciar sessões',
  },
  {
    title: 'Produtos',
    description: 'Mantenha alimentos, bebidas e combos disponíveis para compra.',
    href: '/admin/produtos',
    action: 'Gerenciar produtos',
  },
  {
    title: 'Pedidos',
    description: 'Acompanhe compras, status de pagamento, ingressos e itens vendidos.',
    href: '/pedidos',
    action: 'Ver pedidos',
  },
]

export function AdminDashboard() {
  return (
    <main className="admin-page">
      <section className="admin-header">
        <div>
          <p className="eyebrow">Administração</p>
          <h1>Dashboard</h1>
        </div>
        <p>Escolha um módulo para gerenciar a operação do cinema.</p>
      </section>

      <section className="module-grid" aria-label="Módulos administrativos">
        {modules.map((module) => (
          <Link key={module.href} className="module-card" to={module.href}>
            <span>{module.title}</span>
            <p>{module.description}</p>
            <strong>{module.action}</strong>
          </Link>
        ))}
      </section>
    </main>
  )
}
