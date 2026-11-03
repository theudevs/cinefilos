import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { buscarSessao, listarPoltronasSessao } from '../../api/sessoes'
import { useCheckout } from '../../contexts/CheckoutContext'

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

function groupSeats(poltronas) {
  return poltronas.reduce((rows, poltrona) => {
    const row = poltrona.codigo.match(/^[A-Z]+/)?.[0] ?? 'A'

    if (!rows[row]) {
      rows[row] = []
    }

    rows[row].push(poltrona)
    return rows
  }, {})
}

function getSeatGridStyle(poltronas) {
  const rows = groupSeats(poltronas)
  const maxColumns = Math.max(...Object.values(rows).map((row) => row.length), 1)

  return {
    '--seat-columns': maxColumns,
  }
}

function sortSeats(a, b) {
  const numberA = Number(a.codigo.match(/\d+$/)?.[0] ?? 0)
  const numberB = Number(b.codigo.match(/\d+$/)?.[0] ?? 0)
  return numberA - numberB
}

export function CheckoutIngressos() {
  const { sessaoId } = useParams()
  const navigate = useNavigate()
  const { checkout, startCheckout, addIngresso, removeIngresso } = useCheckout()
  const [sessao, setSessao] = useState(null)
  const [poltronas, setPoltronas] = useState([])
  const [selectedSeat, setSelectedSeat] = useState(null)
  const [tipo, setTipo] = useState('INTEIRA')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadCheckout() {
      setIsLoading(true)
      setError('')

      try {
        const [sessaoData, poltronasData] = await Promise.all([
          buscarSessao(sessaoId),
          listarPoltronasSessao(sessaoId),
        ])

        setSessao(sessaoData)
        setPoltronas(poltronasData)
        startCheckout(sessaoData)
      } catch {
        setError('Não foi possível carregar a sessão e as poltronas.')
      } finally {
        setIsLoading(false)
      }
    }

    loadCheckout()
  }, [sessaoId])

  const selectedSeatIds = useMemo(
    () => new Set(checkout.ingressos.map((ingresso) => ingresso.poltronaId)),
    [checkout.ingressos],
  )

  const rows = useMemo(() => {
    const grouped = groupSeats(poltronas)

    return Object.keys(grouped)
      .sort()
      .map((row) => ({
        row,
        seats: grouped[row].sort(sortSeats),
      }))
  }, [poltronas])

  const ticketValue = tipo === 'MEIA' ? sessao?.valorMeia : sessao?.valorInteira

  function handleAddIngresso() {
    if (!selectedSeat || !sessao) return

    addIngresso({
      sessaoId: sessao.id,
      poltronaId: selectedSeat.id,
      codigo: selectedSeat.codigo,
      tipo,
      valor: Number(ticketValue),
    })
    setSelectedSeat(null)
  }

  if (isLoading) {
    return (
      <main className="checkout-page">
        <p className="eyebrow">Checkout</p>
        <h1>Carregando sessão...</h1>
      </main>
    )
  }

  if (error || !sessao) {
    return (
      <main className="checkout-page">
        <p className="eyebrow">Checkout</p>
        <h1>Não foi possível iniciar a compra</h1>
        <p>{error}</p>
        <Link className="auth-link" to="/">
          Voltar para filmes
        </Link>
      </main>
    )
  }

  return (
    <main className="checkout-page">
      <section className="checkout-header">
        <div>
          <p className="eyebrow">Ingressos</p>
          <h1>{sessao.filme?.titulo}</h1>
          <p>
            Sala {sessao.sala?.numero} • {formatDateTime(sessao.horarioExibicao)}
          </p>
        </div>
        <div className="checkout-steps">
          <span className="active">Ingressos</span>
          <span>Produtos</span>
          <span>Resumo</span>
        </div>
      </section>

      <section className="checkout-layout">
        <div className="seat-picker-panel">
          <div className="cinema-screen">
            <span>Tela</span>
          </div>

          <div className="checkout-seat-map" style={getSeatGridStyle(poltronas)} aria-label="Mapa de poltronas">
            {rows.map(({ row, seats }) => (
              <div key={row} className="checkout-seat-row">
                {seats.map((poltrona) => {
                  const isSelected = selectedSeat?.id === poltrona.id
                  const isInCart = selectedSeatIds.has(poltrona.id)
                  const isDisabled = !poltrona.disponivel || isInCart

                  return (
                    <button
                      key={poltrona.id}
                      type="button"
                      className={[
                        'checkout-seat',
                        !poltrona.disponivel ? 'occupied' : '',
                        isInCart ? 'in-cart' : '',
                        isSelected ? 'selected' : '',
                      ].join(' ')}
                      disabled={isDisabled}
                      onClick={() => setSelectedSeat(poltrona)}
                    >
                      {poltrona.codigo}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          <div className="seat-legend">
            <span><i className="legend-free" /> Livre</span>
            <span><i className="legend-selected" /> Selecionada</span>
            <span><i className="legend-cart" /> No pedido</span>
            <span><i className="legend-occupied" /> Ocupada</span>
          </div>
        </div>

        <aside className="checkout-side-panel">
          <h2>Adicionar ingresso</h2>

          <div className="selected-seat-box">
            <span>Poltrona</span>
            <strong>{selectedSeat?.codigo ?? 'Selecione no mapa'}</strong>
          </div>

          <label>
            Tipo de ingresso
            <select value={tipo} onChange={(event) => setTipo(event.target.value)}>
              <option value="INTEIRA">Inteira - {formatCurrency(sessao.valorInteira)}</option>
              <option value="MEIA">Meia - {formatCurrency(sessao.valorMeia)}</option>
            </select>
          </label>

          <button
            type="button"
            className="primary-action"
            disabled={!selectedSeat}
            onClick={handleAddIngresso}
          >
            Adicionar ingresso
          </button>

          <div className="cart-ticket-list">
            <h3>Ingressos escolhidos</h3>
            {checkout.ingressos.length === 0 ? (
              <p>Nenhum ingresso adicionado.</p>
            ) : (
              checkout.ingressos.map((ingresso) => (
                <div key={ingresso.poltronaId} className="cart-ticket-row">
                  <div>
                    <strong>Poltrona {ingresso.codigo}</strong>
                    <span>{ingresso.tipo === 'MEIA' ? 'Meia' : 'Inteira'}</span>
                  </div>
                  <button type="button" onClick={() => removeIngresso(ingresso.poltronaId)}>
                    Remover
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="checkout-actions">
            <Link className="secondary-dark-action" to={`/filmes/${sessao.filmeId}`}>
              Voltar
            </Link>
            <button
              type="button"
              className="primary-action"
              disabled={checkout.ingressos.length === 0}
              onClick={() => navigate(`/checkout/${sessao.id}/produtos`)}
            >
              Avançar para produtos
            </button>
          </div>
        </aside>
      </section>
    </main>
  )
}
