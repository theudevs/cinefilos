import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { criarPedido, finalizarPedido } from '../../api/pedidos'
import { useCheckout } from '../../contexts/CheckoutContext'

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value ?? 0))
}

function formatDateTime(date) {
  if (!date) return 'Sessão não carregada'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date))
}

const PAYMENT_METHODS = [
  {
    value: 'PIX',
    label: 'PIX',
    className: 'pix',
  },
  {
    value: 'CARTAO_CREDITO',
    label: 'Crédito',
    className: 'credit',
  },
  {
    value: 'CARTAO_DEBITO',
    label: 'Débito',
    className: 'debit',
  },
  {
    value: 'DINHEIRO',
    label: 'Dinheiro',
    className: 'cash',
  },
]

function PaymentIcon({ type }) {
  if (type === 'PIX') {
    return (
      <svg className="payment-svg pix-svg" fill="#3cdfe2" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M11.917 11.71a2.046 2.046 0 0 1-1.454-.602l-2.1-2.1a.4.4 0 0 0-.551 0l-2.108 2.108a2.044 2.044 0 0 1-1.454.602h-.414l2.66 2.66c.83.83 2.177.83 3.007 0l2.667-2.668h-.253zM4.25 4.282c.55 0 1.066.214 1.454.602l2.108 2.108a.39.39 0 0 0 .552 0l2.1-2.1a2.044 2.044 0 0 1 1.453-.602h.253L9.503 1.623a2.127 2.127 0 0 0-3.007 0l-2.66 2.66h.414z" />
        <path d="m14.377 6.496-1.612-1.612a.307.307 0 0 1-.114.023h-.733c-.379 0-.75.154-1.017.422l-2.1 2.1a1.005 1.005 0 0 1-1.425 0L5.268 5.32a1.448 1.448 0 0 0-1.018-.422h-.9a.306.306 0 0 1-.109-.021L1.623 6.496c-.83.83-.83 2.177 0 3.008l1.618 1.618a.305.305 0 0 1 .108-.022h.901c.38 0 .75-.153 1.018-.421L7.375 8.57a1.034 1.034 0 0 1 1.426 0l2.1 2.1c.267.268.638.421 1.017.421h.733c.04 0 .079.01.114.024l1.612-1.612c.83-.83.83-2.178 0-3.008z" />
      </svg>
    )
  }

  if (type === 'DINHEIRO') {
    return (
      <svg
        className="payment-svg cash-svg"
        viewBox="0 0 512 296.937"
        aria-hidden="true"
      >
        <path fill="#427D2A" d="M55.708 0H512v253.196l-32.271.146 2.253-185.798.085-2.218c.02-16.412-13.278-29.735-29.69-29.754l-396.669-.156V0z" />
        <path fill="#427D2A" d="M0 60.064h456.298v236.873H0z" />
        <path fill="#87CC71" d="M380.858 96.615c-.242 17.619 15.287 33.557 33.564 33.777v93.72c-19.253-.242-35.188 15.287-35.407 36.278H75.44c.242-19.253-15.29-35.191-33.564-35.411v-93.72c19.326.219 35.274-15.299 35.493-34.644h303.489z" />
        <path fill="#427D2A" d="M196.981 106.352h62.342c39.683 0 72.15 32.467 72.15 72.154 0 39.684-32.47 72.147-72.15 72.147h-62.342c-39.681 0-72.15-32.463-72.15-72.147 0-39.687 32.466-72.154 72.15-72.154z" />
        <path fill="#fff" d="M195.616 144.559c5.69 0 10.425.744 14.23 2.235 3.789 1.488 6.624 3.708 8.539 6.688 1.904 2.979 2.854 6.687 2.854 11.154 0 2.695-.412 5.151-1.204 7.401a19.107 19.107 0 01-3.535 6.069c-1.551 1.79-3.436 3.392-5.657 4.787l16.987 29.552h-19.314l-12.487-25.1h-3.392v25.1h-17.222v-67.886h20.201zm56.04 67.058-.806-.048a79.55 79.55 0 01-5.531-.534 118.781 118.781 0 01-5.215-.81 67.02 67.02 0 01-4.853-1.065v-13.75c2.021.18 4.212.328 6.558.446 2.346.121 4.732.209 7.141.268 2.408.056 4.647.089 6.728.089.139-.004.29.004.43.004 1.503 0 3.005-.155 4.478-.45a5.953 5.953 0 002.935-1.447c.63-.667.983-1.55.983-2.471 0-.066 0-.133-.003-.195v-1.046c.003-.07.003-.143.003-.214a3.365 3.365 0 00-1.388-2.728 5.476 5.476 0 00-3.123-.98h-4.857c-6.901 0-12.134-1.517-15.698-4.552-3.561-3.037-5.336-8.119-5.325-15.252v-2.943c0-6.54 1.959-11.43 5.884-14.674 2.917-2.423 6.802-3.937 11.659-4.548v-7h9.633v6.809c1.212.062 2.423.162 3.525.283 2.426.265 4.787.597 6.952.976 2.169.379 4.128.81 5.848 1.204v13.747a242.771 242.771 0 00-9.232-.582 191.328 191.328 0 00-9.328-.217h-.268c-1.403 0-2.803.121-4.184.357a5.504 5.504 0 00-3.03 1.421 4.232 4.232 0 00-1.083 2.825c0 .099.003.199.014.294v.899c-.007.096-.014.191-.014.287 0 1.19.515 2.317 1.414 3.097a6.914 6.914 0 003.848 1.175c.177 0 .354-.011.527-.022h5.884c.24-.004.49-.011.73-.011 3.365 0 6.683.814 9.662 2.371a15.504 15.504 0 016.242 6.47 19.84 19.84 0 012.095 8.864V191.271c0 5.649-.983 9.961-2.946 12.94a14.445 14.445 0 01-8.384 6.014 41.733 41.733 0 01-8.297 1.403v7.655h-9.608v-7.666zm-56.279-53.367h-2.74v15.956h2.6c2.596 0 4.658-.681 6.146-2.043 1.506-1.363 2.25-3.595 2.25-6.703 0-2.36-.663-4.15-1.996-5.372-1.329-1.219-3.406-1.838-6.26-1.838z" />
      </svg>
    )
  }

  if (type === 'CARTAO_CREDITO') {
    return (
      <span className="payment-brand card-brand credit-brand" aria-hidden="true">
        <span className="visa-logo">VISA</span>
        <span className="master-logo">
          <span />
          <span />
        </span>
      </span>
    )
  }

  return (
    <span className="payment-brand card-brand debit-brand" aria-hidden="true">
      <span className="card-chip" />
      <span className="elo-logo">
        <span />
        elo
      </span>
    </span>
  )
}

export function Checkout() {
  const { sessaoId } = useParams()
  const navigate = useNavigate()
  const { checkout, total, clearCheckout } = useCheckout()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [hasConflict, setHasConflict] = useState(false)
  const [createdPedido, setCreatedPedido] = useState(null)
  const [metodoPagamento, setMetodoPagamento] = useState('PIX')

  const sessao = checkout.sessao
  const currentSessaoId = sessaoId ?? checkout.sessaoId

  function buildPedidoPayload() {
    return {
      metodoPagamento,
      ingressos: checkout.ingressos.map((ingresso) => ({
        sessaoId: ingresso.sessaoId,
        poltronaId: ingresso.poltronaId,
        tipo: ingresso.tipo,
      })),
      produtos: checkout.produtos.map((produto) => ({
        produtoId: produto.produtoId,
        quantidade: produto.quantidade,
      })),
    }
  }

  async function handleFinalize() {
    setError('')
    setHasConflict(false)
    setIsSubmitting(true)

    try {
      const pedidoPago = await finalizarPedido(buildPedidoPayload())

      setCreatedPedido(pedidoPago)
      clearCheckout()
    } catch (requestError) {
      setHasConflict(requestError.status === 409)
      setError(requestError.message || 'Não foi possível finalizar o pedido.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSaveOpen() {
    setError('')
    setHasConflict(false)
    setIsSubmitting(true)

    try {
      const pedido = await criarPedido(buildPedidoPayload())

      setCreatedPedido(pedido)
      clearCheckout()
    } catch (requestError) {
      setHasConflict(requestError.status === 409)
      setError(requestError.message || 'Não foi possível salvar o pedido.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (createdPedido) {
    return (
      <main className="checkout-page">
        <section className="checkout-success">
          <p className="eyebrow">Pedido confirmado</p>
          <h1>Compra registrada</h1>
          <p>
            Pedido #{createdPedido.id}{' '}
            {createdPedido.status === 'PAGO' ? 'finalizado com pagamento.' : 'salvo em aberto.'}
          </p>
          <strong>{formatCurrency(createdPedido.valorTotal)}</strong>
          <Link className="primary-action" to="/pedidos">
            Ver meus pedidos
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="checkout-page">
      <section className="checkout-header">
        <div>
          <p className="eyebrow">Resumo</p>
          <h1>Revise seu pedido</h1>
          <p>
            {sessao?.filme?.titulo ?? 'Filme'} • Sala {sessao?.sala?.numero ?? '-'} •{' '}
            {formatDateTime(sessao?.horarioExibicao)}
          </p>
        </div>
        <div className="checkout-steps">
          <span>Ingressos</span>
          <span>Produtos</span>
          <span className="active">Resumo</span>
        </div>
      </section>

      <section className="checkout-layout">
        <div className="checkout-summary-panel">
          <div className="summary-section">
            <div className="summary-heading">
              <h2>Ingressos</h2>
              <Link to={`/checkout/${currentSessaoId}/ingressos`}>Adicionar ou alterar</Link>
            </div>

            {checkout.ingressos.length === 0 ? (
              <p className="empty-state">Nenhum ingresso selecionado.</p>
            ) : (
              <div className="summary-list">
                {checkout.ingressos.map((ingresso) => (
                  <div key={ingresso.poltronaId} className="summary-row">
                    <div>
                      <strong>Poltrona {ingresso.codigo}</strong>
                      <span>{ingresso.tipo === 'MEIA' ? 'Meia' : 'Inteira'}</span>
                    </div>
                    <strong>{formatCurrency(ingresso.valor)}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="summary-section">
            <div className="summary-heading">
              <h2>Produtos</h2>
              <Link to={`/checkout/${currentSessaoId}/produtos`}>Adicionar ou alterar</Link>
            </div>

            {checkout.produtos.length === 0 ? (
              <p className="empty-state">Nenhum produto adicionado.</p>
            ) : (
              <div className="summary-list">
                {checkout.produtos.map((produto) => (
                  <div key={produto.produtoId} className="summary-row">
                    <div>
                      <strong>{produto.nome}</strong>
                      <span>
                        {produto.quantidade} x {formatCurrency(produto.valorUnitario)}
                      </span>
                    </div>
                    <strong>{formatCurrency(produto.valorUnitario * produto.quantidade)}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="checkout-side-panel" aria-busy={isSubmitting}>
          <h2>Pagamento</h2>

          <div className="payment-method-field">
            <span>Método de pagamento</span>
            <div className="payment-method-grid" role="radiogroup" aria-label="Método de pagamento">
              {PAYMENT_METHODS.map((method) => {
                const isSelected = metodoPagamento === method.value

                return (
                  <button
                    key={method.value}
                    type="button"
                    className={`payment-method-button ${method.className} ${
                      isSelected ? 'selected' : ''
                    }`}
                    role="radio"
                    aria-checked={isSelected}
                    disabled={isSubmitting}
                    onClick={() => setMetodoPagamento(method.value)}
                  >
                    <span className="payment-method-icon">
                      <PaymentIcon type={method.value} />
                    </span>
                    <span>{method.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="checkout-total-box">
            <span>Total</span>
            <strong>{formatCurrency(total)}</strong>
          </div>

          {error && (
            <div
              className={hasConflict ? 'checkout-conflict' : 'form-error'}
              role="alert"
              aria-live="assertive"
            >
              <span>{error}</span>
              {hasConflict && (
                <button
                  type="button"
                  className="secondary-dark-action"
                  onClick={() => navigate(`/checkout/${currentSessaoId}/ingressos`)}
                >
                  Revisar poltronas
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            className="primary-action"
            disabled={checkout.ingressos.length === 0 || isSubmitting}
            onClick={handleFinalize}
          >
            {isSubmitting ? 'Finalizando...' : 'Finalizar pedido'}
          </button>

          <button
            type="button"
            className="secondary-dark-action"
            disabled={checkout.ingressos.length === 0 || isSubmitting}
            onClick={handleSaveOpen}
          >
            Salvar em aberto
          </button>

          <button
            type="button"
            className="secondary-dark-action"
            onClick={() => navigate(`/checkout/${currentSessaoId}/produtos`)}
          >
            Voltar para produtos
          </button>
        </aside>
      </section>
    </main>
  )
}
