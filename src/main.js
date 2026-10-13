import {TelegramClient,Api} from 'telegram';
import {StringSession} from 'telegram/sessions';
import {NewMessage} from 'telegram/events';
const $=s=>document.querySelector(s);
const K=k=>localStorage.getItem(k);
const apiId=+(K('rg-id')||API_ID),apiHash=K('rg-hash')||API_HASH;
const colors=['#3b7ddd','#7a5cc7','#d4577a','#e0892b','#2a8f7b'];
const hm=d=>d?new Date(d*1000).toTimeString().slice(0,5):'';
const err=t=>{$('#lerr').textContent=t||''};
let client,phone,hash,ents=[],sentFor='',timer,busy=false,need2fa=false;
data.length=0;

async function conn(sess){
  client=new TelegramClient(new StringSession(sess||''),apiId,apiHash,{connectionRetries:5,useWSS:true});
  await client.connect();
  client.addEventHandler(onNew,new NewMessage({}));
}
async function sendCode(){
  err('');
  try{
    if(!client)await conn();
    const r=await client.sendCode({apiId,apiHash},phone);
    hash=r.phoneCodeHash;
    $('#login2').hidden=false;$('#code').focus();
  }catch(e){err(e.errorMessage||e.message);$('#login2').hidden=true;sentFor=''}
}
async function load(){
  const ds=await client.getDialogs({limit:40});
  ents=ds;data.length=0;
  ds.forEach((d,i)=>data.push({n:d.title||d.name||'Nomalum',c:colors[i%5],u:d.unreadCount||0,id:String(d.id),m:[[(d.message&&d.message.message)||'📎',hm(d.date)]]}));
  renderList();
}
async function done(){
  localStorage.setItem('rg-sess',client.session.save());
  await load();show('s-list');
}
async function verify(){
  const code=$('#code').value.replace(/\D/g,'');
  if((!need2fa&&code.length<5)||busy)return;
  busy=true;err('');
  try{
    if(need2fa){
      await client.signInWithPassword({apiId,apiHash},{password:async()=>$('#pw').value,onError:async e=>{err(e.errorMessage||e.message);return true}});
    }else{
      await client.invoke(new Api.auth.SignIn({phoneNumber:phone,phoneCodeHash:hash,phoneCode:code}));
    }
    await done();
  }catch(e){
    if(e.errorMessage==='SESSION_PASSWORD_NEEDED'){need2fa=true;$('#pw').hidden=false;$('#pw').focus();err('Ikki bosqichli parolni kiriting va Kirish ni bosing.')}
    else if(e.message!=='AUTH_USER_CANCEL')err(e.errorMessage||e.message);
  }
  busy=false;
}
$('#phone').oninput=()=>{
  const p='+'+$('#phone').value.replace(/\D/g,'');
  clearTimeout(timer);$('#login2').hidden=true;hash=null;
  if(p.length>=13)timer=setTimeout(()=>{if(p!==sentFor){sentFor=p;phone=p;sendCode()}},900);
};
$('#code').oninput=verify;
$('#verify').onclick=verify;

window.openChat=async i=>{
  cur=i;data[i].u=0;data[i].m=[];$('#ctitle').textContent=data[i].n;renderMsgs();show('s-chat');
  try{
    const ms=await client.getMessages(ents[i].entity,{limit:40});
    data[i].m=ms.reverse().map(m=>[m.message||'📎',hm(m.date),m.out?1:0]);
    if(cur===i)renderMsgs();
  }catch(e){}
};
async function send(){
  const v=$('#inp').value.trim();
  if(!v||cur===null)return;
  $('#inp').value='';
  const i=cur;
  data[i].m.push([v,hm(Date.now()/1000),1]);renderMsgs();
  try{await client.sendMessage(ents[i].entity,{message:v})}
  catch(e){data[i].m.push(['⚠ Yuborilmadi: '+(e.errorMessage||e.message),''])}
  renderMsgs();
}
$('#send').onclick=send;
$('#inp').onkeydown=e=>{if(e.key==='Enter')send()};
async function onNew(){
  try{
    const ci=cur!==null&&data[cur]?data[cur].id:null;
    await load();
    if(ci!==null&&$('#s-chat').classList.contains('on')){
      const i=ents.findIndex(d=>String(d.id)===ci);
      if(i>=0)window.openChat(i);
    }
  }catch(e){}
}
$('#logout').onclick=async()=>{
  try{await client.invoke(new Api.auth.LogOut())}catch(e){}
  localStorage.removeItem('rg-sess');
  client=null;hash=null;sentFor='';need2fa=false;data.length=0;
  $('#phone').value='+998 ';$('#code').value='';$('#pw').value='';$('#pw').hidden=true;$('#login2').hidden=true;err('');
  show('s-login');
};
(async()=>{
  const s=K('rg-sess');
  if(!s)return;
  try{
    await conn(s);
    if(await client.checkAuthorization()){await load();show('s-list')}
    else localStorage.removeItem('rg-sess');
  }catch(e){}
})();
                       
