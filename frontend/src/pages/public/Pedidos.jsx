import { useEffect, useMemo, useState } from 'react'
import { listarFilmes } from '../../api/filmes'
import { cancelarPedido, listarPedidos, pagarPedido } from '../../api/pedidos'
import { useAuth } from '../../contexts/AuthContext'

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value ?? 0))
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date))
}

function getStatusLabel(status) {
  const labels = {
    ABERTO: 'Aberto',
    PAGO: 'Pago',
    CANCELADO: 'Cancelado',
  }

  return labels[status] ?? status
}

function getPaymentLabel(method) {
  const labels = {
    PIX: 'PIX',
    CARTAO_CREDITO: 'Cartão de crédito',
    CARTAO_DEBITO: 'Cartão de débito',
    DINHEIRO: 'Dinheiro',
  }

  return labels[method] ?? 'Não informado'
}

export function Pedidos() {
  const { isAdmin } = useAuth()
  const [pedidos, setPedidos] = useState([])
  const [filmes, setFilmes] = useState([])
  const [filmeId, setFilmeId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [payingPedidoId, setPayingPedidoId] = useState(null)
  const [cancelingPedidoId, setCancelingPedidoId] = useState(null)
  const [error, setError] = useState('')

  async function loadPedidos() {
    setIsLoading(true)
    setError('')

    try {
      const data = await listarPedidos(filmeId)
      setPedidos(data)
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível carregar os pedidos.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handlePayPedido(id) {
    setError('')
    setPayingPedidoId(id)

    try {
      await pagarPedido(id)
      await loadPedidos()
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível finalizar o pagamento.')
    } finally {
      setPayingPedidoId(null)
    }
  }

  async function handleCancelPedido(id) {
    const shouldCancel = window.confirm(
      'Tem certeza que deseja cancelar este pedido? As poltronas serão liberadas.',
    )

    if (!shouldCancel) return

    setError('')
    setCancelingPedidoId(id)

    try {
      await cancelarPedido(id)
      await loadPedidos()
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível cancelar o pedido.')
    } finally {
      setCancelingPedidoId(null)
    }
  }

  useEffect(() => {
    async function loadFilmes() {
      if (!isAdmin) return

      try {
        const data = await listarFilmes()
        setFilmes(data)
      } catch {
        setFilmes([])
      }
    }

    loadFilmes()
  }, [isAdmin])

  useEffect(() => {
    loadPedidos()
  }, [filmeId])

  const title = isAdmin ? 'Pedidos' : 'Meus pedidos'

  const totalVendido = useMemo(
    () => pedidos.reduce((sum, pedido) => sum + Number(pedido.valorTotal), 0),
    [pedidos],
  )

  return (
    <main className="orders-page">
      <section className="orders-header">
        <div>
          <p className="eyebrow">{isAdmin ? 'Administração' : 'Cliente'}</p>
          <h1>{title}</h1>
          <p>
            {isAdmin
              ? 'Acompanhe todos os pedidos registrados na plataforma.'
              : 'Acompanhe suas compras realizadas na plataforma.'}
          </p>
        </div>

        <div className="orders-total-card">
          <span>Total listado</span>
          <strong>{formatCurrency(totalVendido)}</strong>
        </div>
      </section>

      {isAdmin && (
        <section className="orders-filter">
          <label>
            Filtrar por filme
            <select value={filmeId} onChange={(event) => setFilmeId(event.target.value)}>
              <option value="">Todos os filmes</option>
              {filmes.map((filme) => (
                <option key={filme.id} value={filme.id}>
                  {filme.titulo}
                </option>
              ))}
            </select>
          </label>
        </section>
      )}

      <section className="orders-list" aria-label="Lista de pedidos">
        {isLoading ? (
          <p className="empty-state">Carregando pedidos...</p>
        ) : error ? (
          <p className="form-error">{error}</p>
        ) : pedidos.length === 0 ? (
          <p className="empty-state">Nenhum pedido encontrado.</p>
        ) : (
          pedidos.map((pedido) => {
            const firstTicket = pedido.ingressos?.[0]
            const filme = firstTicket?.sessao?.filme
            const sessao = firstTicket?.sessao

            return (
              <article key={pedido.id} className="order-card">
                <div className="order-card-header">
                  <div>
                    <span className={`order-status ${pedido.status.toLowerCase()}`}>
                      {getStatusLabel(pedido.status)}
                    </span>
                    <h2>Pedido #{pedido.id}</h2>
                    <p>
                      {filme?.titulo ?? 'Filme'} • Sala {sessao?.sala?.numero ?? '-'} •{' '}
                      {sessao ? formatDateTime(sessao.horarioExibicao) : 'Sessão'}
                    </p>
                  </div>
                  <div className="order-card-actions">
                    <strong>{formatCurrency(pedido.valorTotal)}</strong>
                    {pedido.status === 'ABERTO' && (
                      <div className="order-action-buttons">
                        <button
                          type="button"
                          className="primary-action compact-action"
                          disabled={payingPedidoId === pedido.id || cancelingPedidoId === pedido.id}
                          onClick={() => handlePayPedido(pedido.id)}
                        >
                          {payingPedidoId === pedido.id ? 'Finalizando...' : 'Finalizar pagamento'}
                        </button>
                        <button
                          type="button"
                          className="danger-button compact-action"
                          disabled={payingPedidoId === pedido.id || cancelingPedidoId === pedido.id}
                          onClick={() => handleCancelPedido(pedido.id)}
                        >
                          {cancelingPedidoId === pedido.id ? 'Cancelando...' : 'Cancelar pedido'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="order-details-grid">
                  <div>
                    <h3>Ingressos</h3>
                    {pedido.ingressos.map((ingresso) => (
                      <p key={ingresso.id}>
                        Poltrona {ingresso.poltrona.codigo} • {ingresso.tipo === 'MEIA' ? 'Meia' : 'Inteira'} •{' '}
                        {formatCurrency(ingresso.valor)}
                      </p>
                    ))}
                  </div>

                  <div>
                    <h3>Produtos</h3>
                    {pedido.produtos.length === 0 ? (
                      <p>Nenhum produto.</p>
                    ) : (
                      pedido.produtos.map((item) => (
                        <p key={item.id}>
                          {item.quantidade}x {item.produto.nome} • {formatCurrency(item.subtotal)}
                        </p>
                      ))
                    )}
                  </div>

                  <div>
                    <h3>Pagamento</h3>
                    <p>{getPaymentLabel(pedido.metodoPagamento)}</p>
                    <p>Criado em {formatDateTime(pedido.createdAt)}</p>
                  </div>
                </div>
              </article>
            )
          })
        )}
      </section>
    </main>
  )
}
