import { useEffect, useMemo, useState } from 'react'
import { listarFilmes } from '../../api/filmes'
import { listarProdutos } from '../../api/produtos'
import { listarSalas } from '../../api/salas'
import { listarSessoes } from '../../api/sessoes'
import { MovieCard } from '../../components/MovieCard'

const adminItems = [
  { id: 'filmes', label: 'Filmes', detail: 'em cartaz' },
  { id: 'salas', label: 'Salas', detail: 'matrizes ativas' },
  { id: 'sessoes', label: 'Sessões', detail: 'na semana' },
  { id: 'produtos', label: 'Produtos', detail: 'itens de bomboniere' },
]

const sampleMovies = [
  {
    id: 'sample-1',
    title: 'Interestelar',
    genre: 'Ficção científica',
    rating: '12',
    runtime: '169 min',
    room: 'Sala 1',
    times: ['14:20', '18:00', '21:40'],
    image:
      'https://image.tmdb.org/t/p/w500/nCbkOyOMTEwlEV0LtCOvCnwEONA.jpg',
  },
  {
    id: 'sample-2',
    title: 'Duna: Parte Dois',
    genre: 'Aventura',
    rating: '14',
    runtime: '166 min',
    room: 'Sala 3',
    times: ['15:10', '19:10', '22:20'],
    image:
      'https://image.tmdb.org/t/p/w500/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg',
  },
  {
    id: 'sample-3',
    title: 'Divertida Mente 2',
    genre: 'Animação',
    rating: 'Livre',
    runtime: '96 min',
    room: 'Sala 5',
    times: ['13:00', '16:30', '19:00'],
    image:
      'https://image.tmdb.org/t/p/w500/xGvz7nlGQeePcVOpAzOcHsC7kRt.jpg',
  },
]

const sampleProducts = [
  {
    id: 'sample-product-1',
    name: 'Combo Clássico',
    description: 'Pipoca grande, refrigerante e chocolate.',
    price: 'R$ 38,90',
  },
  {
    id: 'sample-product-2',
    name: 'Combo Família',
    description: 'Duas pipocas, duas bebidas e dois doces.',
    price: 'R$ 69,90',
  },
  {
    id: 'sample-product-3',
    name: 'Bebida 700ml',
    description: 'Refrigerante ou suco para acompanhar a sessão.',
    price: 'R$ 14,90',
  },
]

const steps = ['Filme', 'Dia', 'Sessão', 'Poltronas', 'Bomboniere', 'Pagamento']

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value ?? 0))
}

function formatGenre(genre) {
  if (!genre) return 'Gênero'

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

function formatTime(date) {
  if (!date) return '--:--'

  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function mapMovie(filme, sessoes) {
  const movieSessions = sessoes.filter((sessao) => sessao.filmeId === filme.id)

  return {
    id: filme.id,
    title: filme.titulo,
    genre: formatGenre(filme.genero),
    rating: filme.classificacao,
    runtime: `${filme.duracao} min`,
    room: movieSessions[0]?.sala ? `Sala ${movieSessions[0].sala.numero}` : 'Sem sessão',
    times: movieSessions.length
      ? movieSessions.slice(0, 3).map((sessao) => formatTime(sessao.horarioExibicao))
      : ['Em breve'],
    image: filme.cartazUrl,
  }
}

function mapProduct(produto) {
  return {
    id: produto.id,
    name: produto.nome,
    description: produto.descricao,
    price: formatCurrency(produto.valorUnitario),
    active: produto.ativo,
  }
}

export function Home() {
  const [activeArea, setActiveArea] = useState('filmes')
  const [selectedMovie, setSelectedMovie] = useState(sampleMovies[0].title)
  const [movies, setMovies] = useState(sampleMovies)
  const [products, setProducts] = useState(sampleProducts)
  const [stats, setStats] = useState({
    filmes: sampleMovies.length,
    salas: 0,
    sessoes: 0,
    produtos: sampleProducts.length,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [apiStatus, setApiStatus] = useState('Conectando ao backend...')

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [filmes, sessoes, produtos, salas] = await Promise.all([
          listarFilmes(),
          listarSessoes(),
          listarProdutos(),
          listarSalas(),
        ])

        const mappedMovies = filmes.map((filme) => mapMovie(filme, sessoes))
        const mappedProducts = produtos.filter((produto) => produto.ativo).map(mapProduct)

        if (mappedMovies.length > 0) {
          setMovies(mappedMovies)
          setSelectedMovie(mappedMovies[0].title)
        }

        if (mappedProducts.length > 0) {
          setProducts(mappedProducts)
        }

        setStats({
          filmes: filmes.length,
          salas: salas.length,
          sessoes: sessoes.length,
          produtos: produtos.filter((produto) => produto.ativo).length,
        })
        setApiStatus('Dados carregados do backend')
      } catch {
        setApiStatus('Backend indisponível: exibindo dados de exemplo')
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const selectedMovieData = useMemo(
    () => movies.find((movie) => movie.title === selectedMovie) ?? movies[0] ?? sampleMovies[0],
    [movies, selectedMovie],
  )

  return (
    <>
      <main id="inicio">
        <section className="hero-band" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">Plataforma de cinema</p>
            <h1 id="hero-title">Venda ingressos, monte sessões e gerencie a bomboniere em um só lugar.</h1>
            <p>
              Base inicial para conectar com o backend NestJS: filmes, salas, sessões,
              produtos e pedidos aparecem no mesmo fluxo de compra.
            </p>
            <span className={apiStatus.includes('backend') ? 'api-pill warning' : 'api-pill'}>
              {isLoading ? 'Carregando...' : apiStatus}
            </span>
            <div className="hero-actions">
              <a className="primary-action" href="#em-cartaz">
                Ver filmes
              </a>
              <a className="secondary-action" href="#admin">
                Área admin
              </a>
            </div>
          </div>

          <div className="showtime-panel" aria-label="Próxima sessão em destaque">
            <div className="screen-label">Próxima sessão</div>
            <h2>{selectedMovieData.title}</h2>
            <p>{selectedMovieData.genre} • {selectedMovieData.runtime}</p>
            <div className="seat-preview" aria-label="Mapa resumido de poltronas">
              {Array.from({ length: 36 }).map((_, index) => (
                <span
                  key={index}
                  className={index % 7 === 0 || index === 19 ? 'seat taken' : 'seat'}
                />
              ))}
            </div>
            <div className="panel-footer">
              <span>{selectedMovieData.room}</span>
              <strong>{selectedMovieData.times[1] ?? selectedMovieData.times[0]}</strong>
            </div>
          </div>
        </section>

        <section className="flow-band" aria-label="Fluxo de compra">
          {steps.map((step, index) => (
            <div key={step} className="flow-step">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </section>

        <section className="content-band" id="em-cartaz">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Cliente</p>
              <h2>Filmes em cartaz</h2>
            </div>
            <p>Escolha o filme para ver os horários disponíveis.</p>
          </div>

          <div className="movie-grid">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                isSelected={selectedMovie === movie.title}
                onSelect={() => setSelectedMovie(movie.title)}
              />
            ))}
          </div>
        </section>

        <section className="content-band muted" id="admin">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Administração</p>
              <h2>Painel inicial</h2>
            </div>
            <p>Resumo das áreas que vamos ligar aos CRUDs do backend.</p>
          </div>

          <div className="admin-grid">
            {adminItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={activeArea === item.id ? 'admin-card active' : 'admin-card'}
                onClick={() => setActiveArea(item.id)}
              >
                <span>{item.label}</span>
                <strong>{stats[item.id]}</strong>
                <small>{item.detail}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="content-band">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Bomboniere</p>
              <h2>Produtos e combos</h2>
            </div>
            <p>Os itens entram no mesmo pedido dos ingressos.</p>
          </div>

          <div className="product-list">
            {products.map((product) => (
              <article key={product.id} className="product-row">
                <div>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                </div>
                <strong>{product.price}</strong>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
