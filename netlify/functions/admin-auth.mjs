import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';
import {adminPassword,checkPassword,issueSession,readSession,sessionCookie,clearCookie,json,sameOrigin} from './_auth-utils.mjs';

export default async (req) => {
  if (!sameOrigin(req)) return json({error:'Invalid request origin.'},403);
  const password = adminPassword();
  if (!password) return json({error:'Admin login is not configured. Set TOBA_ADMIN_PASSWORD to a unique password at least 14 characters long in Netlify Environment variables, then redeploy.'},503);
  if (req.method === 'GET') return json({authenticated:readSession(req)});
  if (req.method === 'DELETE') return json({ok:true},200,{'Set-Cookie':clearCookie(req)});
  if (req.method !== 'POST') return json({error:'Method not allowed.'},405,{'Allow':'GET, POST, DELETE'});

  let value;
  try { value = (await req.json()).password; }
  catch { return json({error:'Invalid login request.'},400); }
  const remoteIp = req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const ipKey = createHash('sha256').update('toba-login:'+remoteIp).digest('hex');
  try {
    const attempts = getStore({name:'toba-admin-rate-limit',consistency:'strong'});
    const row = await attempts.get(ipKey,{type:'json'});
    const now = Date.now();
    if (row?.lockedUntil && row.lockedUntil > now) return json({error:'Too many attempts. Wait 15 minutes and try again.'},429);
    if (checkPassword(value,password)) {
      await attempts.delete(ipKey);
      return json({ok:true},200,{'Set-Cookie':sessionCookie(issueSession(password),req)});
    }
    const failed = row?.startedAt && now - row.startedAt < 15*60*1000 ? (row.failed||0)+1 : 1;
    await attempts.setJSON(ipKey,{startedAt: failed===1?now:row.startedAt, failed,lockedUntil: failed>=5? now+15*60*1000:0});
    return json({error:failed>=5?'Too many attempts. Wait 15 minutes.':'Incorrect password.'},failed>=5?429:401);
  } catch (error) {
    console.error('ToBa admin auth infrastructure error:',error.message);
    return json({error:'Login service is temporarily unavailable. Check Netlify Function logs.'},503);
  }
};
