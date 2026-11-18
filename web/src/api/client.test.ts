import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../test/server'
import { NetworkError, request } from './client'

describe('api client', () => {
  it('sends JSON with the login token and parses the JSON reply', async () => {
    let seen: { auth: string | null; type: string | null; body: unknown } | undefined
    server.use(http.post('http://api.test/api/thing', async ({ request: r }) => {
      seen = { auth: r.headers.get('authorization'), type: r.headers.get('content-type'), body: await r.json() }
      return HttpResponse.json({ success: true, value: 7 })
    }))
    const res = await request<{ success: boolean; value: number }>('POST', '/api/thing', { body: { a: 1 }, token: 'jwt' })
    expect(seen).toEqual({ auth: 'Bearer jwt', type: 'application/json', body: { a: 1 } })
    expect(res).toMatchObject({ ok: true, status: 200, data: { success: true, value: 7 } })
  })

  it('returns failures with the status and the raw body', async () => {
    server.use(http.get('http://api.test/api/thing', () => HttpResponse.json({ success: false, message: 'Nope' }, { status: 400 })))
    const res = await request('GET', '/api/thing')
    expect(res.ok).toBe(false)
    expect(res.status).toBe(400)
    expect(res.raw).toBe('{"success":false,"message":"Nope"}')
  })

  it('keeps non-JSON replies as raw text', async () => {
    server.use(http.get('http://api.test/api/thing', () => new HttpResponse('<html>Bad Gateway</html>', { status: 502 })))
    const res = await request('GET', '/api/thing')
    expect(res).toMatchObject({ ok: false, status: 502, data: null, raw: '<html>Bad Gateway</html>' })
  })

  it('sends no Authorization header without a token', async () => {
    let auth: string | null = 'unset'
    server.use(http.get('http://api.test/api/thing', ({ request: r }) => { auth = r.headers.get('authorization'); return HttpResponse.json({}) }))
    await request('GET', '/api/thing')
    expect(auth).toBeNull()
  })

  it('throws NetworkError when the server cannot be reached', async () => {
    server.use(http.get('http://api.test/api/thing', () => HttpResponse.error()))
    await expect(request('GET', '/api/thing')).rejects.toBeInstanceOf(NetworkError)
  })

  it('throws NetworkError when the server does not answer in time', async () => {
    server.use(http.get('http://api.test/api/thing', async () => { await delay(500); return HttpResponse.json({}) }))
    await expect(request('GET', '/api/thing', { timeoutMs: 50 })).rejects.toBeInstanceOf(NetworkError)
  })
})
