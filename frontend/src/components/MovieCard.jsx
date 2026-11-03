import { useState } from 'react'
import { Link } from 'react-router-dom'

function MoviePoster({ movie }) {
  const [hasImageError, setHasImageError] = useState(false)
  const initials = movie.title.slice(0, 2).toUpperCase()

  if (!movie.image || hasImageError) {
    return (
      <div className="poster-fallback" aria-label={`Cartaz de ${movie.title}`}>
        {initials}
      </div>
    )
  }

  return (
    <img
      src={movie.image}
      alt={`Cartaz de ${movie.title}`}
      onError={() => setHasImageError(true)}
    />
  )
}

export function MovieCard({ movie, isSelected, onSelect }) {
  const isRealMovie = typeof movie.id === 'number'

  return (
    <article className={isSelected ? 'movie-card selected' : 'movie-card'}>
      <MoviePoster movie={movie} />
      <div className="movie-card-body">
        <div>
          <span className="rating">{movie.rating}</span>
          <h3>{movie.title}</h3>
          <p>{movie.genre} • {movie.runtime}</p>
        </div>
        <div className="time-list">
          {movie.times.map((time) => (
            <button key={time} type="button" onClick={onSelect}>
              {time}
            </button>
          ))}
        </div>
        {isRealMovie ? (
          <Link className="movie-detail-link" to={`/filmes/${movie.id}`}>
            Ver sessões
          </Link>
        ) : (
          <button className="movie-detail-link disabled" type="button" disabled>
            Ver sessões
          </button>
        )}
      </div>
    </article>
  )
}
