(() => {
  'use strict';
  const q = id => document.getElementById(id);
  const screenLogin = q('login-screen'), screenInbox = q('inbox-screen');
  const loadMsg = q('initial-status');
  const records = { items:[], total:0 };
  let loading = false;
  let liveTimer;

  function showLogin(message='') {
    screenInbox.hidden = true; screenLogin.hidden = false; loadMsg.hidden = true;
    q('login-status').textContent = message;
    if (liveTimer) {clearInterval(liveTimer); liveTimer=undefined;}
  }
  function showInbox() {
    screenLogin.hidden = true; screenInbox.hidden = false; loadMsg.hidden = true;
    if (!liveTimer) liveTimer=setInterval(()=>refresh(false),30000);
  }
  async function api(path, options={}) {
    const response = await fetch('/.netlify/functions/'+path, {
      ...options, credentials:'same-origin', headers:{'Content-Type':'application/json',...(options.headers||{})},cache:'no-store'
    });
    let body={};try{body=await response.json()}catch{}
    if(!response.ok){const err=new Error(body.error||'Unable to connect to the inbox.');err.status=response.status;throw err;}
    return body;
  }
  const formatDate = iso => {try{return new Date(iso).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});}catch{return iso;}};
  const escapedForCSV = text => '"'+String(text??'').replace(/"/g,'""')+'"';
  function element(tag, className, value){const node=document.createElement(tag);if(className)node.className=className;if(value!==undefined)node.textContent=value;return node;}
  function cell(key,value,asEmail=false){
    const item=element('div','cell'); item.append(element('small','',key));
    const content=element(asEmail?'a':'span',asEmail?'email':'',value);
    if(asEmail)content.href='mailto:'+value;
    item.append(content);return item;
  }
  async function updateStatus(id,value,select){
    select.disabled = true;
    try{await api('admin-inquiries',{method:'PUT',body:JSON.stringify({id,status:value})});records.items.find(x=>x.id===id).status=value;render();}
    catch(error){alert('Unable to change status: '+error.message);select.disabled=false;}
  }
  function render(){
    const items=records.items;
    q('total').textContent=records.total;
    q('new').textContent=items.filter(x=>x.status==='new').length;
    q('replied').textContent=items.filter(x=>x.status==='replied').length;
    const term=q('search').value.trim().toLowerCase(),filter=q('filter').value;
    const shown=items.filter(x=>(filter==='all'||x.status===filter)&&[x.name,x.email,x.service,x.details].some(v=>String(v||'').toLowerCase().includes(term)));
    const grid=q('messages');grid.replaceChildren();
    if(!shown.length){grid.append(element('div','empty',items.length?'No enquiries match your search.':'No project enquiries yet. New customer submissions will appear here.'));return;}
    shown.forEach(x=>{
      const card=element('article','item '+x.status);
      const head=element('div','item-head');
      const left=element('div');left.append(element('div','customer',x.name));
      left.append(element('div','meta',formatDate(x.createdAt)+' · '+x.service));
      head.append(left,element('span','pill '+x.status,x.status.toUpperCase())); card.append(head);
      const body=element('div','item-body'), info=element('div','grid');
      info.append(cell('Customer email',x.email,true),cell('Project budget',x.budget||'Prefer to discuss'));
      body.append(info,element('div','desc-title','Project details'),element('div','desc',x.details));
      const actions=element('div','actions'), reply=element('a','reply','✉ Reply by email');
      reply.href='mailto:'+encodeURIComponent(x.email)+'?subject='+encodeURIComponent('Re: Your ToBa project enquiry');
      const label=element('label','','Status:'); const select=element('select');select.setAttribute('aria-label','Update status for '+x.name);
      ['new','replied','completed'].forEach(status=>{const opt=element('option','',status[0].toUpperCase()+status.slice(1));opt.value=status;opt.selected=x.status===status;select.append(opt);});
      select.addEventListener('change',()=>updateStatus(x.id,select.value,select));label.append(select);
      actions.append(reply,label);body.append(actions);card.append(body);grid.append(card);
    });
  }
  async function refresh(manual){
    if(loading)return;loading=true;
    if(manual)q('refresh').disabled=true;
    q('inbox-alert').hidden=true;
    try{
      const result=await api('admin-inquiries');records.items=result.inquiries||[];records.total=result.totalStored??records.items.length;
      q('sync-note').textContent='Last updated '+new Date().toLocaleTimeString()+(result.truncated?' · Showing latest 200':'') ;render();
    }catch(error){
      if(error.status===401){showLogin('Your session expired. Please log in again.');return;}
      q('inbox-alert').hidden=false;q('inbox-alert').textContent=error.message;
    }finally{loading=false;q('refresh').disabled=false;}
  }
  q('login-form').addEventListener('submit',async event=>{
    event.preventDefault();const pw=q('admin-password').value;
    q('login-button').disabled=true;q('login-status').textContent='Checking access…';
    try{await api('admin-auth',{method:'POST',body:JSON.stringify({password:pw})});q('admin-password').value='';showInbox();await refresh(true);}
    catch(error){q('login-status').textContent=error.message;}
    finally{q('login-button').disabled=false;}
  });
  q('logout').addEventListener('click',async()=>{try{await api('admin-auth',{method:'DELETE'});}catch{}showLogin('Logged out.');});
  q('refresh').addEventListener('click',()=>refresh(true));
  q('search').addEventListener('input',render);q('filter').addEventListener('change',render);
  q('export').addEventListener('click',()=>{
    const cols=['createdAt','name','email','service','budget','details','status'];
    const csv=[cols.join(','),...records.items.map(x=>cols.map(c=>escapedForCSV(x[c])).join(','))].join('\r\n');
    const blob=new Blob([String.fromCharCode(0xFEFF),csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob);
    const link=document.createElement('a');link.href=url;link.download='toba-enquiries-'+new Date().toISOString().slice(0,10)+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
  });
  api('admin-auth').then(result=>{if(result.authenticated){showInbox();refresh(false);}else showLogin();}).catch(error=>showLogin(error.message));
})();
