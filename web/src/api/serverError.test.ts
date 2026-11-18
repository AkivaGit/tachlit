import { describe, expect, it } from 'vitest'
import { describeServerError } from './serverError'

describe('describeServerError (port of ServerError.kt)', () => {
  it('lists field errors in Hebrew, then English', () => {
    const body = JSON.stringify({
      success: false, message: 'Validation failed', message_he: 'חלק מהפרטים אינם תקינים',
      errors: [
        { field: 'password', message: 'Password rule', message_he: 'כלל סיסמה', value: 'abc' },
        { field: 'phone', message: 'Phone rule', message_he: 'כלל טלפון', value: '050-1' },
      ],
    })
    expect(describeServerError(400, body)).toBe('• כלל סיסמה\n• כלל טלפון\n\n• Password rule\n• Phone rule')
  })

  it('shows a single message in Hebrew, then English', () => {
    const body = '{"success":false,"message":"User with this email already exists","message_he":"כבר קיים משתמש"}'
    expect(describeServerError(400, body)).toBe('כבר קיים משתמש\n\nUser with this email already exists')
  })

  it('shows English only when the server sent no Hebrew', () => {
    const body = '{"success":false,"message":"Validation failed","errors":[{"field":"email","message":"Bad email"}]}'
    expect(describeServerError(400, body)).toBe('Bad email')
  })

  it('falls back to the status code for an HTML error page', () => {
    expect(describeServerError(502, '<html>Bad Gateway</html>')).toBe('שגיאת שרת (HTTP 502)\n\nServer error (HTTP 502)')
  })

  it('shows a short plain-text reply as is', () => {
    expect(describeServerError(429, 'Too many requests')).toBe('Too many requests')
  })

  it('uses the "error" field when there is no message', () => {
    expect(describeServerError(500, '{"error":"Boom"}')).toBe('Boom')
  })

  it('removes duplicate field messages', () => {
    const body = JSON.stringify({ errors: [{ message: 'Same', message_he: 'זהה' }, { message: 'Same', message_he: 'זהה' }] })
    expect(describeServerError(400, body)).toBe('זהה\n\nSame')
  })

  it('falls back to the status code for an empty body', () => {
    expect(describeServerError(500, null)).toBe('שגיאת שרת (HTTP 500)\n\nServer error (HTTP 500)')
    expect(describeServerError(500, '   ')).toBe('שגיאת שרת (HTTP 500)\n\nServer error (HTTP 500)')
  })
})
