import { createHmac, createHash, timingSafeEqual } from 'node:crypto';

const COOKIE = 'toba_admin_session';
const SESSION_SECONDS = 8 * 60 * 60;

export function adminPassword() {
  const value = process.env.TOBA_ADMIN_PASSWORD || '';
  return value.length >= 14 ? value : null;
}

export function sameOrigin(req) {
  const origin = req.headers.get('origin');
  if (!origin) return true; // some direct GETs and non-browser clients
  try { return new URL(origin).origin === new URL(req.url).origin; }
  catch { return false; }
}

function signature(payload, secret) {
  // Domain-separated key, derived from a unique high-entropy admin password.
  const key = createHash('sha256').update('toba-admin-cookie:v1:' + secret).digest();
  return createHmac('sha256', key).update(payload).digest('base64url');
}

export function issueSession(password) {
  const payload = Buffer.from(JSON.stringify({v:1, exp:Math.floor(Date.now()/1000)+SESSION_SECONDS})).toString('base64url');
  return `${payload}.${signature(payload, password)}`;
}

export function readSession(req) {
  const password = adminPassword();
  if (!password) return false;
  const cookies = (req.headers.get('cookie') || '').split(';');
  const raw = cookies.find(part => part.trim().startsWith(COOKIE + '='));
  if (!raw) return false;
  const token = raw.trim().slice((COOKIE+'=').length);
  const pieces = token.split('.');
  if (pieces.length !== 2 || pieces[0].length > 300 || pieces[1].length > 100) return false;
  const expected = Buffer.from(signature(pieces[0], password));
  const actual = Buffer.from(pieces[1]);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
  try {
    const session = JSON.parse(Buffer.from(pieces[0], 'base64url').toString());
    return session.v === 1 && Number.isSafeInteger(session.exp) && session.exp > Date.now()/1000;
  } catch { return false; }
}

export function checkPassword(input, expected) {
  if (typeof input !== 'string' || input.length > 256) return false;
  const a = createHash('sha256').update(input).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

export function sessionCookie(token, req) {
  // Secure on HTTPS production. The site must run on HTTPS for cookie auth.
  const isSecure = new URL(req.url).protocol === 'https:';
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${isSecure?'; Secure':''}`;
}
export function clearCookie(req) {
  const isSecure = new URL(req.url).protocol === 'https:';
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${isSecure?'; Secure':''}`;
}
export function json(body, status=200, additional={}) {
  return new Response(JSON.stringify(body), {status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...additional}});
}
