/**
 * Fake Tachlit server: answers like https://tachlit.onrender.com with sample
 * data kept in memory. No database, no Firebase, nothing reaches production.
 *
 * Used by:
 *  - the web app's end-to-end tests (Playwright starts it),
 *  - local development: `npm run fake-server`, then run the app with
 *    VITE_API_BASE_URL=http://localhost:4010,
 *  - capturing Android reference screenshots with sample data.
 *
 * Supervisor password: "Test1234". Any other password is refused.
 * POST /__reset restores the sample data (tests call it between runs).
 */
import http from 'node:http'

const PORT = Number(process.env.PORT || 4010)
export const SUPERVISOR_EMAIL = 'supervisor@tachlit.com'
export const SUPERVISOR_PASSWORD = 'Test1234'

const NOW = '2026-11-18T10:00:00.000Z'

function sampleUsers() {
  const u = (id, name, family_name, email, phone, city, userType) => ({
    id, email, name, family_name, phone, city, userType, is_active: true, created_at: NOW, updated_at: NOW,
  })
  return [
    u(1, 'System', 'Administrator', SUPERVISOR_EMAIL, '+972-50-1234567', 'Jerusalem', 'SUPERVISOR'),
    u(2, 'דוד', 'כהן', 'david@example.com', '0501234567', 'ירושלים', 'LEARN_ASKER'),
    u(3, 'יעקב', 'לוי', 'yaakov@example.com', '0502345678', 'בני ברק', 'LEARN_ASKER'),
    u(4, 'שרה', 'לוי', 'sara@example.com', '0527654321', 'בני ברק', 'LEARN_GIVER'),
    u(5, 'משה', 'פרץ', 'moshe@example.com', '0541112233', 'חיפה', 'OFFICE_VOLUNTEER'),
    u(6, 'רחל', 'מזרחי', 'rachel@example.com', '0533334444', 'תל אביב', 'FOOD_VOLUNTEER'),
    u(7, 'יוסף', 'אברהם', 'yosef@example.com', '0585556666', 'פתח תקווה', 'GROUP_COORDINATOR'),
  ]
}

let users = sampleUsers()
let nextId = 100
const deviceTokens = new Map() // token -> { userId, userType, platform }
const sentPushes = []

const tokenFor = (user) => `fake-jwt-${user.id}`
const userFromAuth = (req) => {
  const m = /^Bearer fake-jwt-(\d+)$/.exec(req.headers.authorization || '')
  return m ? users.find((x) => x.id === Number(m[1])) : undefined
}

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type,authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  })
  res.end(JSON.stringify(body))
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (c) => { data += c })
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}) } catch { resolve({}) }
    })
  })
}

function stats() {
  const count = (t) => users.filter((x) => x.userType === t).length
  return {
    totalUsers: users.length,
    learnAskers: count('LEARN_ASKER'),
    learnGivers: count('LEARN_GIVER'),
    officeVolunteers: count('OFFICE_VOLUNTEER'),
    foodVolunteers: count('FOOD_VOLUNTEER'),
    supervisors: count('SUPERVISOR'),
    groupCoordinators: count('GROUP_COORDINATOR'),
    unmatchedLearners: 0,
    availableTeachers: 0,
    totalPairings: 0,
    recentRegistrations: 0,
  }
}

const REGISTRABLE = ['LEARN_ASKER', 'LEARN_GIVER', 'OFFICE_VOLUNTEER', 'FOOD_VOLUNTEER', 'GROUP_COORDINATOR']

async function handle(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const path = url.pathname
  if (req.method === 'OPTIONS') return send(res, 204, {})

  if (req.method === 'GET' && path === '/health') return send(res, 200, { success: true, message: 'Server is running' })
  if (req.method === 'POST' && path === '/__reset') {
    users = sampleUsers(); deviceTokens.clear(); sentPushes.length = 0
    return send(res, 200, { success: true })
  }
  if (req.method === 'GET' && path === '/__state') {
    return send(res, 200, { users, deviceTokens: [...deviceTokens.entries()], sentPushes })
  }

  if (req.method === 'POST' && path === '/api/auth/register') {
    const b = await readBody(req)
    if (!REGISTRABLE.includes(b.userType)) {
      return send(res, 400, { success: false, message: 'Validation failed', message_he: 'חלק מהפרטים אינם תקינים',
        errors: [{ field: 'userType', message: 'Invalid user type', message_he: 'סוג משתמש לא תקין' }] })
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(b.password || '')) {
      return send(res, 400, { success: false, message: 'Validation failed', message_he: 'חלק מהפרטים אינם תקינים',
        errors: [{ field: 'password', message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
          message_he: 'הסיסמה חייבת להכיל לפחות אות קטנה אחת באנגלית, אות גדולה אחת באנגלית וספרה אחת' }] })
    }
    if (users.some((x) => x.email === b.email)) {
      return send(res, 400, { success: false, message: 'User with this email already exists', message_he: 'כבר קיים משתמש עם כתובת האימייל הזו' })
    }
    const user = { id: nextId++, email: b.email, name: b.name, family_name: b.family_name, phone: b.phone, city: b.city,
      userType: b.userType, is_active: true, created_at: NOW, updated_at: NOW }
    users.push(user)
    return send(res, 201, { success: true, message: 'User registered successfully', token: tokenFor(user), user })
  }

  if (req.method === 'POST' && path === '/api/auth/login') {
    const b = await readBody(req)
    const user = users.find((x) => x.email === b.email)
    const ok = user && (user.userType !== 'SUPERVISOR' || b.password === SUPERVISOR_PASSWORD)
    if (!ok) return send(res, 401, { success: false, message: 'Invalid email or password' })
    return send(res, 200, { success: true, message: 'Login successful', token: tokenFor(user), user })
  }

  if (req.method === 'POST' && path === '/api/auth/logout') {
    if (!req.headers.authorization) return send(res, 401, { success: false, message: 'Access token required', message_he: 'חסר אסימון התחברות' })
    const user = userFromAuth(req)
    if (!user) return send(res, 200, { success: true, deleted: false, message: 'Registration was already deleted', message_he: 'ההרשמה כבר נמחקה' })
    if (user.userType === 'SUPERVISOR') return send(res, 200, { success: true, deleted: false, message: 'Supervisor logged out; account kept', message_he: 'המנהל התנתק; החשבון נשמר' })
    users = users.filter((x) => x.id !== user.id)
    return send(res, 200, { success: true, deleted: true, message: 'Logged out and registration deleted', message_he: 'ההתנתקות בוצעה וההרשמה נמחקה' })
  }

  const admin = path.startsWith('/api/admin/') || path === '/api/notifications/send-to-role'
  const caller = userFromAuth(req)
  if (admin || path.startsWith('/api/notifications/')) {
    if (!caller) return send(res, 401, { success: false, message: 'Invalid token' })
    if (admin && caller.userType !== 'SUPERVISOR') return send(res, 403, { success: false, message: 'Admin access required' })
  }

  if (req.method === 'GET' && path === '/api/admin/users') {
    return send(res, 200, { success: true, message: 'Users retrieved successfully',
      data: { users, pagination: { page: 1, pageSize: 100, total: users.length, totalPages: 1 } } })
  }
  if (req.method === 'GET' && path === '/api/admin/stats') {
    return send(res, 200, { success: true, message: 'Statistics retrieved successfully', stats: stats() })
  }
  const del = /^\/api\/admin\/users\/(\d+)$/.exec(path)
  if (req.method === 'DELETE' && del) {
    const id = Number(del[1])
    if (!users.some((x) => x.id === id)) return send(res, 404, { success: false, message: 'User not found' })
    users = users.filter((x) => x.id !== id)
    return send(res, 200, { success: true, message: 'User deleted successfully' })
  }

  if (req.method === 'POST' && path === '/api/notifications/register-token') {
    const b = await readBody(req)
    deviceTokens.set(b.token, { userId: caller.id, userType: caller.userType, platform: b.platform || 'android' })
    return send(res, 200, { success: true, message: 'Device token registered' })
  }
  if (req.method === 'DELETE' && path === '/api/notifications/token') {
    const b = await readBody(req)
    deviceTokens.delete(b.token)
    return send(res, 200, { success: true, message: 'Device token removed' })
  }
  if (req.method === 'POST' && path === '/api/notifications/send-to-role') {
    const b = await readBody(req)
    if (!b.title || !b.body) return send(res, 400, { success: false, message: 'title and body are required' })
    const roles = Array.isArray(b.roles) ? b.roles : [b.roles]
    const targets = [...deviceTokens.values()].filter((t) => roles.includes(t.userType))
    sentPushes.push({ roles, title: b.title, body: b.body })
    return send(res, 200, { success: true, message: 'Notifications processed', sent: targets.length, failed: 0, cleanedInvalidTokens: 0 })
  }

  return send(res, 404, { success: false, message: 'Route not found' })
}

export function startFakeServer(port = PORT) {
  const server = http.createServer((req, res) => {
    handle(req, res).catch((err) => send(res, 500, { success: false, message: String(err) }))
  })
  return new Promise((resolve) => server.listen(port, () => resolve(server)))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startFakeServer().then(() => console.log(`Fake Tachlit server on http://localhost:${PORT}`))
}
