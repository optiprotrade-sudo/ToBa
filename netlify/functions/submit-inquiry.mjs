import { randomUUID } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import { json,sameOrigin } from './_auth-utils.mjs';

const allowedServices = new Set(['Landing page','Business website','Dashboard or web app','Fix an existing website','Deployment and setup','Something else']);
const allowedBudgets = new Set(['','Under $100 USD','$100–$300 USD','$300–$1,000 USD','Over $1,000 USD']);
function clean(value,max) { return typeof value === 'string' ? value.trim().slice(0,max+1) : ''; }

export default async (req) => {
  if (req.method !== 'POST') return json({error:'Method not allowed.'},405);
  if (!sameOrigin(req)) return json({error:'Invalid request origin.'},403);
  const len = Number(req.headers.get('content-length'));
  if (len > 16000) return json({error:'Message is too long.'},413);
  let payload;
  try { payload = await req.json(); }
  catch { return json({error:'Invalid enquiry. Please try again.'},400); }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return json({error:'Invalid enquiry.'},400);
  if (clean(payload['bot-field'],200)) return json({ok:true}); // silently discard honeypot spam
  const name = clean(payload.name,120), email = clean(payload.email,254).toLowerCase();
  const service = clean(payload.service,120), budget=clean(payload.budget,120);
  const details=clean(payload['project-details'],4000);
  if (name.length<2 || name.length>120 || email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !allowedServices.has(service) || !allowedBudgets.has(budget) || details.length<15 || details.length>4000) {
    return json({error:'Check your name, email, service and project description before submitting.'},422);
  }
  const createdAt=new Date().toISOString();
  const id=`${Date.now()}-${randomUUID()}`;
  const record={id,createdAt,name,email,service,budget:budget||'Prefer to discuss',details,status:'new'};
  try {
    const store=getStore({name:'toba-inquiries',consistency:'strong'});
    await store.setJSON(`inquiries/${id}`,record,{onlyIfNew:true});
  } catch(error) {
    console.error('ToBa: unable to save enquiry:',error.message);
    return json({error:'We could not save your enquiry. Please try again later.'},503);
  }

  // Notification is optional: even when Telegram is down, the enquiry is already safely in the private admin inbox.
  const token=process.env.TELEGRAM_BOT_TOKEN, chatId=process.env.TELEGRAM_CHAT_ID;
  if(token && chatId) {
    try {
      const msg=[`📩 NEW TOBA PROJECT ENQUIRY`,`Customer: ${name}`,`Email: ${email}`,`Service: ${service}`,`Budget: ${record.budget}`,`Project: ${details.slice(0,2600)}`].join('\n\n');
      const response=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:chatId,text:msg}) ,signal:AbortSignal.timeout(5000)});
      if(!response.ok) console.warn('ToBa optional Telegram notification failed with HTTP',response.status);
    } catch(error) {console.warn('ToBa optional Telegram notification unavailable:',error.message);}
  }
  return json({ok:true,message:'Your enquiry has been sent successfully.'},201);
};
