import {getStore} from '@netlify/blobs';
import {json,readSession,sameOrigin} from './_auth-utils.mjs';

const statuses=new Set(['new','replied','completed']);
export default async(req)=>{
  if (!sameOrigin(req)) return json({error:'Invalid request origin.'},403);
  if(!readSession(req)) return json({error:'Please log in.'},401);
  if(!['GET','PUT'].includes(req.method)) return json({error:'Method not allowed.'},405);
  try {
    const store=getStore({name:'toba-inquiries',consistency:'strong'});
    if(req.method==='PUT') {
      let data;
      try {data=await req.json();} catch {return json({error:'Invalid update.'},400);}
      if(typeof data.id!=='string' || !/^\d{13}-[0-9a-f-]{36}$/.test(data.id) || !statuses.has(data.status)) return json({error:'Invalid enquiry or status.'},422);
      const key=`inquiries/${data.id}`;
      const record=await store.get(key,{type:'json'});
      if(!record) return json({error:'Enquiry not found.'},404);
      await store.setJSON(key,{...record,status:data.status});
      return json({ok:true});
    }
    const {blobs}=await store.list({prefix:'inquiries/'});
    // Show latest 200 enquiries first. Older records remain stored.
    const recent=blobs.map(item=>item.key).sort().reverse().slice(0,200);
    const result=[];
    for(let i=0;i<recent.length;i+=12){
      const items=await Promise.all(recent.slice(i,i+12).map(key=>store.get(key,{type:'json'})));
      result.push(...items.filter(Boolean));
    }
    return json({inquiries:result,totalStored:blobs.length,truncated:blobs.length>200});
  } catch(error){console.error('ToBa inbox failed:',error.message);return json({error:'Inbox temporarily unavailable. Check Netlify Function logs.'},503);}
};
