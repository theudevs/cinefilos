import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { buscarFilme } from '../../api/filmes'
import { listarSessoesPorFilme } from '../../api/sessoes'

function formatGenre(genre) {
  const labels = {
    ACAO: 'Ação',
    COMEDIA: 'Comédia',
    DRAMA: 'Drama',
    TERROR: 'Terror',
    ANIMACAO: 'Animação',
    SUSPENSE: 'Suspense',
    ROMANCE: 'Romance',
    DOCUMENTARIO: 'Documentário',
  }

  return labels[genre] ?? genre
}

function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(date))
}

function formatTime(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value ?? 0))
}

function groupSessionsByDay(sessoes) {
  return sessoes.reduce((groups, sessao) => {
    const key = new Date(sessao.horarioExibicao).toISOString().slice(0, 10)

    if (!groups[key]) {
      groups[key] = []
    }

    groups[key].push(sessao)
    return groups
  }, {})
}

function Poster({ filme }) {
  const [hasError, setHasError] = useState(false)

  if (!filme.cartazUrl || hasError) {
    return <div className="detail-poster-fallback">{filme.titulo.slice(0, 2).toUpperCase()}</div>
  }

  return <img src={filme.cartazUrl} alt={`Cartaz de ${filme.titulo}`} onError={() => setHasError(true)} />
}

export function FilmeDetalhe() {
  const { id } = useParams()
  const [filme, setFilme] = useState(null)
  const [sessoes, setSessoes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadFilmeDetalhe() {
      setIsLoading(true)
      setError('')

      try {
        const [filmeData, sessoesData] = await Promise.all([
          buscarFilme(id),
          listarSessoesPorFilme(id),
        ])

        setFilme(filmeData)
        setSessoes(sessoesData)
      } catch {
        setError('Não foi possível carregar os detalhes do filme.')
      } finally {
        setIsLoading(false)
      }
    }

    loadFilmeDetalhe()
  }, [id])

  const sessoesPorDia = useMemo(() => groupSessionsByDay(sessoes), [sessoes])
  const dias = Object.keys(sessoesPorDia).sort()

  if (isLoading) {
    return (
      <main className="placeholder-page">
        <p className="eyebrow">Filme</p>
        <h1>Carregando...</h1>
      </main>
    )
  }

  if (error || !filme) {
    return (
      <main className="placeholder-page">
        <p className="eyebrow">Filme</p>
        <h1>Não encontramos esse filme</h1>
        <p>{error || 'Filme indisponível.'}</p>
        <Link className="auth-link" to="/">
          Voltar para a página inicial
        </Link>
      </main>
    )
  }

  return (
    <main className="movie-detail-page">
      <section className="movie-detail-hero">
        <div className="detail-poster">
          <Poster filme={filme} />
        </div>

        <div className="detail-copy">
          <p className="eyebrow">Em cartaz</p>
          <h1>{filme.titulo}</h1>
          <div className="detail-meta">
            <span>{formatGenre(filme.genero)}</span>
            <span>{filme.duracao} min</span>
            <span>{filme.classificacao}</span>
          </div>
          <p>{filme.sinopse}</p>
          <small>Elenco: {filme.elenco}</small>
        </div>
      </section>

      <section className="content-band" aria-labelledby="sessoes-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Sessões</p>
            <h2 id="sessoes-title">Escolha o dia e horário</h2>
          </div>
          <p>Depois vamos ligar essa escolha ao mapa de poltronas e ao pedido.</p>
        </div>

        {dias.length === 0 ? (
          <p className="empty-state">Nenhuma sessão disponível para este filme.</p>
        ) : (
          <div className="session-day-list">
            {dias.map((dia) => (
              <article key={dia} className="session-day-card">
                <h3>{formatDate(`${dia}T00:00:00`)}</h3>
                <div className="session-time-grid">
                  {sessoesPorDia[dia].map((sessao) => (
                    <Link key={sessao.id} className="session-time-card" to={`/checkout/${sessao.id}/ingressos`}>
                      <strong>{formatTime(sessao.horarioExibicao)}</strong>
                      <span>Sala {sessao.sala?.numero ?? sessao.salaId}</span>
                      <small>
                        Inteira {formatCurrency(sessao.valorInteira)} • Meia {formatCurrency(sessao.valorMeia)}
                      </small>
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
