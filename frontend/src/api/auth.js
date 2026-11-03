import { http } from './http'

export function login(credentials) {
  return http('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}
