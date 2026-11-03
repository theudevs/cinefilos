import { http } from './http'

export function listarFilmes() {
  return http('/filmes')
}

export function buscarFilme(id) {
  return http(`/filmes/${id}`)
}

export function criarFilme(filme) {
  return http('/filmes', {
    method: 'POST',
    body: JSON.stringify(filme),
  })
}

export function atualizarFilme(id, filme) {
  return http(`/filmes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(filme),
  })
}

export function removerFilme(id) {
  return http(`/filmes/${id}`, {
    method: 'DELETE',
  })
}
