/* ===== HI-RES · hr-fx.js =====
   1) светлая / тёмная / авто тема
   2) ритм-эффект: неон + вспышки + молнии в такт басам (Web Audio AnalyserNode)
   3) навигация «назад» (Android / history) и жесты
   Требует window.__hr (его выставляет index.html в конце основного скрипта). */
(function(){
'use strict';
var H=window.__hr;if(!H)return;
var doc=document,root=doc.documentElement;
function $(i){return doc.getElementById(i)}
function ls(k,d){try{var v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}}
function lss(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function clamp(v,a,b){return v<a?a:(v>b?b:v)}
var reduce=false;try{reduce=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}

/* ================= 1. ТЕМА ================= */
var SUN='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
var MOON='<svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
var tmode=ls('hrtheme','dark');if(tmode!=='light'&&tmode!=='auto')tmode='dark';
var mq=null;try{mq=matchMedia('(prefers-color-scheme: light)')}catch(e){}
function effTheme(){return tmode==='light'?'light':(tmode==='auto'&&mq&&mq.matches?'light':'dark')}
function isLight(){return root.getAttribute('data-theme')==='light'}
var thbtn=null;
function applyTheme(){
  var e=effTheme(),L=e==='light';
  root.setAttribute('data-theme',e);root.style.colorScheme=e;
  var m=doc.querySelector('meta[name="color-scheme"]');if(m)m.setAttribute('content',e);
  var tc=doc.querySelectorAll('meta[name="theme-color"]');for(var i=0;i<tc.length;i++)tc[i].setAttribute('content',L?'#f2f0fa':'#07060d');
  if(thbtn){thbtn.innerHTML=L?MOON:SUN;thbtn.setAttribute('aria-label',L?'Тёмная тема':'Светлая тема')}
  try{var SB=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.StatusBar;
    if(SB){SB.setStyle({style:L?'LIGHT':'DARK'});if(SB.setBackgroundColor)SB.setBackgroundColor({color:L?'#f2f0fa':'#07060d'})}}catch(x){}
  themeChips();setEdgeColor();
}
function setTheme(m){tmode=m;lss('hrtheme',m);applyTheme()}
if(mq){var onmq=function(){if(tmode==='auto')applyTheme()};if(mq.addEventListener)mq.addEventListener('change',onmq);else if(mq.addListener)mq.addListener(onmq)}

/* кнопка в шапке */
(function(){
  var nr=doc.querySelector('.nr'),gear=$('gear');if(!nr||!gear)return;
  thbtn=doc.createElement('button');thbtn.id='thbtn';
  thbtn.onclick=function(){setTheme(effTheme()==='light'?'dark':'light')};
  nr.insertBefore(thbtn,gear);
})();

/* ================= карточки в настройках ================= */
var R={on:true,lvl:1,bolt:true};
try{var r0=JSON.parse(ls('hrfx','null'));if(r0){R.on=r0.on!==false;R.lvl=clamp(Math.round(+r0.lvl||0),0,2);R.bolt=r0.bolt!==false}}catch(e){}
function rSave(){lss('hrfx',JSON.stringify(R))}
(function(){
  var stin=$('st')&&$('st').querySelector('.stin');if(!stin)return;
  var f=doc.createDocumentFragment(),a=doc.createElement('div');a.className='scard';a.id='hrthm';
  a.innerHTML='<div class="sh">Тема оформления</div><div class="chips" id="hrthc"></div>';
  var b=doc.createElement('div');b.className='scard';b.id='hrrc';
  b.innerHTML='<div class="srow"><div><b>Ритм-эффект</b><small>Неон и вспышки в такт басам</small></div><button class="sw" id="hrrsw" aria-label="Ритм-эффект"></button></div>'+
    '<div class="sep"><div class="sh">Сила</div><div class="chips" id="hrrl"></div></div>'+
    '<div class="srow sep"><div><b>Молнии</b><small>Разряды на сильных ударах</small></div><button class="sw" id="hrbsw" aria-label="Молнии"></button></div>'+
    '<p class="snote" id="hrrn"></p>';
  f.appendChild(a);f.appendChild(b);
  stin.insertBefore(f,stin.children[1]||null);
})();
function chip(box,label,on,fn){var c=doc.createElement('button');c.className='chip'+(on?' on':'');c.textContent=label;c.onclick=fn;box.appendChild(c)}
function themeChips(){
  var box=$('hrthc');if(!box)return;box.textContent='';
  [['dark','Тёмная'],['light','Светлая'],['auto','Авто']].forEach(function(x){chip(box,x[1],tmode===x[0],function(){setTheme(x[0])})});
}
function rhythmUI(){
  var sw=$('hrrsw');if(!sw)return;
  sw.className='sw'+(R.on?' on':'');$('hrbsw').className='sw'+(R.bolt?' on':'');
  var box=$('hrrl');box.textContent='';
  [['Мягко',0],['Средне',1],['Сильно',2]].forEach(function(x){chip(box,x[0],R.lvl===x[1],function(){R.lvl=x[1];rSave();rhythmUI()})});
  box.parentNode.style.opacity=R.on?1:.45;
  $('hrrn').textContent=H.nOn()
    ?'Native-движок: звук идёт мимо Web Audio, поэтому реальный бит недоступен — показывается мягкая пульсация без молний. Для точной синхронизации выберите Web Audio.'
    :'Анализ басов в реальном времени (Web Audio). Эффект работает, пока играет трек и экран включён.';
}
$('hrrsw').onclick=function(){R.on=!R.on;rSave();rhythmUI();if(R.on)kick();else stopFx()};
$('hrbsw').onclick=function(){R.bolt=!R.bolt;rSave();rhythmUI()};

/* ================= 2. РИТМ-ЭФФЕКТ ================= */
var flash=doc.createElement('div');flash.id='rfx-flash';
var edge=doc.createElement('div');edge.id='rfx-edge';
var cv=doc.createElement('canvas');cv.id='rfx-bolt';
doc.body.appendChild(flash);doc.body.appendChild(edge);doc.body.appendChild(cv);
var c2=cv.getContext('2d'),S=.6;
function resize(){cv.width=Math.max(2,Math.ceil(innerWidth*S));cv.height=Math.max(2,Math.ceil(innerHeight*S))}
resize();addEventListener('resize',resize);

var PAL={dark:[['#2ef2c3','rgba(123,44,255,.55)'],['#ff3da5','rgba(46,242,195,.45)'],['#7b2cff','rgba(255,61,165,.5)'],['#ffe600','rgba(255,61,165,.4)']],
         light:[['#0b9e82','rgba(106,44,240,.4)'],['#d81b84','rgba(11,158,130,.35)'],['#6a2cf0','rgba(216,27,132,.35)'],['#e07b00','rgba(216,27,132,.3)']]};
var BC={dark:['#7ff6ff','#ff7bd0','#c9a6ff','#fff27a'],light:['#0b6bff','#d81b84','#6a2cf0','#e07b00']};
var an=null,anCtx=null,buf=null,b0=1,b1=3,lastTap=0;
var avg=0,pk=.2,prev=0,lvl=0,beat=0,lastBeat=0,pal=0,bolts=[],dirty=false,raf=0,lastT=0,nowT=0;
var nn=null,npbg=$('npbg'),npart=$('npart'),mart=doc.querySelector('.mart');

function setEdgeColor(){var p=PAL[isLight()?'light':'dark'][pal%4];edge.style.setProperty('--rc',p[0]);edge.style.setProperty('--rc2',p[1])}

function isActive(){
  var a=H.au();
  return R.on&&!reduce&&!doc.hidden&&a&&!a.paused&&!!H.curT()&&!$('st').classList.contains('on')&&!$('lg').classList.contains('on');
}
function getAn(t){
  var E=H.E,c=E.ctx,n=E.n;
  if(H.nOn()||!c||!n||!n.dvc||c.state==='closed')return null;
  if(anCtx!==c){
    try{
      an=c.createAnalyser();var fs=1024;while(fs<8192&&c.sampleRate/fs>50)fs*=2;
      an.fftSize=fs;an.smoothingTimeConstant=.45;buf=new Uint8Array(an.frequencyBinCount);
      var bw=c.sampleRate/fs;b0=Math.max(1,Math.floor(35/bw));b1=Math.max(b0+1,Math.ceil(150/bw));
      anCtx=c;lastTap=0;
    }catch(e){an=null;anCtx=null;return null}
  }
  /* движок при загрузке квантизатора делает dvc.disconnect() — поэтому подключаем отвод заново раз в секунду */
  if(t-lastTap>1000){lastTap=t;try{n.dvc.connect(an)}catch(e){}}
  return an;
}
function spawnBolt(st){
  if(bolts.length>=3)return;
  var w=cv.width,h=cv.height,x=w*(.08+Math.random()*.84),y=0,segs=12+Math.floor(Math.random()*6);
  var endY=h*(.3+Math.random()*.45)*(.75+.5*st),dy=endY/segs,jag=w*.04,pts=[[x,0]],i;
  for(i=0;i<segs;i++){x+=(Math.random()-.5)*2*jag;y+=dy*(.7+Math.random()*.6);pts.push([x,y])}
  var br=[],nb=1+Math.floor(Math.random()*2);
  for(i=0;i<nb;i++){
    var s=pts[2+Math.floor(Math.random()*(segs-5))],bx=s[0],by=s[1],dir=Math.random()<.5?-1:1,bp=[[bx,by]];
    for(var k=0;k<4+Math.floor(Math.random()*3);k++){bx+=dir*jag*(.6+Math.random()*1.1);by+=dy*(.5+Math.random()*.6);bp.push([bx,by])}
    br.push(bp);
  }
  var cols=BC[isLight()?'light':'dark'];
  bolts.push({m:pts,b:br,born:nowT,life:230+170*st,col:cols[Math.floor(Math.random()*cols.length)]});
}
function path(p){c2.beginPath();c2.moveTo(p[0][0],p[0][1]);for(var i=1;i<p.length;i++)c2.lineTo(p[i][0],p[i][1]);c2.stroke()}
function drawBolts(t){
  if(!bolts.length){if(dirty){c2.clearRect(0,0,cv.width,cv.height);dirty=false}return}
  c2.clearRect(0,0,cv.width,cv.height);dirty=true;
  var L=isLight();c2.globalCompositeOperation=L?'source-over':'lighter';c2.lineJoin='round';c2.lineCap='round';
  for(var i=bolts.length-1;i>=0;i--){
    var b=bolts[i],age=t-b.born;
    if(age>b.life){bolts.splice(i,1);continue}
    var a=(1-age/b.life)*(age<70||Math.random()<.65?1:.45),j;
    c2.globalAlpha=clamp(a,0,1);
    c2.shadowColor=b.col;c2.shadowBlur=14;c2.strokeStyle=b.col;
    c2.lineWidth=3.2;path(b.m);c2.lineWidth=1.8;for(j=0;j<b.b.length;j++)path(b.b[j]);
    c2.shadowBlur=0;c2.strokeStyle=L?b.col:'#ffffff';c2.lineWidth=1.1;path(b.m);
  }
  c2.globalAlpha=1;c2.shadowBlur=0;
}
function frame(t){
  raf=0;nowT=t;
  if(!isActive()){stopFx();return}
  var dt=lastT?Math.min(t-lastT,60):16.7;lastT=t;
  var A=getAn(t),k=[.6,1,1.5][R.lvl],i;
  if(A){
    A.getByteFrequencyData(buf);
    var hi=Math.min(b1,buf.length-1),s=0;for(i=b0;i<=hi;i++)s+=buf[i];
    var bass=s/((hi-b0+1)*255);
    avg+=(bass-avg)*Math.min(1,dt/900);
    pk=Math.max(bass,pk-dt*.00004);if(pk<.2)pk=.2;
    var base=avg*.7,norm=pk>base?clamp((bass-base)/(pk-base),0,1):0;
    lvl+=(norm-lvl)*(norm>lvl?Math.min(1,dt/30):Math.min(1,dt/140));
    if(bass>avg*1.28+.035&&bass>.22&&bass-prev>.02&&t-lastBeat>170){
      lastBeat=t;var st=clamp((bass-avg)/(pk-avg+.001),.25,1);
      beat=Math.max(beat,.55+.45*st);pal=(pal+1)%4;setEdgeColor();
      if(R.bolt&&st>.5)spawnBolt(st);
    }
    prev=bass;
  }else{lvl=.22+.12*Math.sin(t/650)}   /* native-режим: только мягкое «дыхание» */
  beat=Math.max(0,beat-dt/360);
  /* применяем: только opacity / scale / transform — без перерисовки */
  flash.style.opacity=clamp(beat*.5*k,0,.9).toFixed(3);
  edge.style.opacity=clamp((lvl*.35+beat*.5)*k,0,1).toFixed(3);
  if(!nn)nn=doc.querySelector('h1 .neon');
  if(nn)nn.style.setProperty('--nb',(beat*k*.8+lvl*.25*k).toFixed(3));
  if($('np').classList.contains('on')){
    npart.style.scale=(1+(lvl*.025+beat*.035)*k).toFixed(4);
    npbg.style.opacity=(.5+.28*lvl*k+.1*beat).toFixed(3);
  }
  if(mart&&$('pl').style.display!=='none')mart.style.scale=(1+(beat*.08+lvl*.03)*k).toFixed(4);
  drawBolts(t);
  raf=requestAnimationFrame(frame);
}
function stopFx(){
  if(raf){cancelAnimationFrame(raf);raf=0}
  flash.style.opacity=0;edge.style.opacity=0;
  if(nn)nn.style.removeProperty('--nb');
  if(npart)npart.style.scale='';if(npbg)npbg.style.opacity='';if(mart)mart.style.scale='';
  bolts=[];if(dirty){c2.clearRect(0,0,cv.width,cv.height);dirty=false}
  lvl=0;beat=0;lastT=0;
}
function kick(){if(!raf&&isActive()){lastT=0;raf=requestAnimationFrame(frame)}}
setInterval(kick,300);
doc.addEventListener('visibilitychange',function(){if(doc.hidden)stopFx();else kick()});

/* ================= 3. НАВИГАЦИЯ «НАЗАД» ================= */
var OV=[
  ['lg',function(){return $('lg').classList.contains('on')},function(){$('lgx').click()}],
  ['st',function(){return $('st').classList.contains('on')},function(){$('stx').click()}],
  ['qs',function(){return $('qs').classList.contains('on')},function(){$('bk').click()}],
  ['ti',function(){return $('ti').classList.contains('on')},function(){$('bk').click()}],
  ['np',function(){return $('np').classList.contains('on')},function(){$('npx').click()}],
  ['lb',function(){return $('lb').style.display==='flex'},function(){$('lb').click()}],
  ['tab',function(){var t=$('tabs').children;return t.length>0&&t[0].className.indexOf('on')<0},function(){$('tabs').children[0].click()}]
];
function countOpen(){var n=0;for(var i=0;i<OV.length;i++)if(OV[i][1]())n++;return n}
function closeTop(){for(var i=0;i<OV.length;i++)if(OV[i][1]()){OV[i][2]();return true}return false}
var pushed=0,ignore=0,syncT=0;
function sync(){
  var n=countOpen();
  if(n>pushed){for(;pushed<n;pushed++){try{history.pushState({hr:pushed+1},'')}catch(e){}}}
  else if(n<pushed){
    var d=pushed-n;pushed=n;ignore++;
    setTimeout(function(){ignore=0},600);
    try{history.go(-d)}catch(e){ignore=0}
  }
}
function schedSync(){clearTimeout(syncT);syncT=setTimeout(sync,0)}
addEventListener('popstate',function(){
  if(ignore>0){ignore--;return}
  if(pushed>0){pushed--;closeTop()}
});
try{
  var mo=new MutationObserver(schedSync);
  ['np','st','lg','qs','ti'].forEach(function(id){mo.observe($(id),{attributes:true,attributeFilter:['class']})});
  mo.observe($('lb'),{attributes:true,attributeFilter:['style']});
  mo.observe($('tabs'),{attributes:true,attributeFilter:['class'],subtree:true});
  var mo2=new MutationObserver(function(){rhythmUI()});
  mo2.observe($('st'),{attributes:true,attributeFilter:['class']});
}catch(e){}
/* Android: кнопка / жест «назад» в Capacitor */
try{
  var App=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.App;
  if(App&&App.addListener){
    App.addListener('backButton',function(){
      if(closeTop())return;
      if(App.minimizeApp)App.minimizeApp();else if(App.exitApp)App.exitApp();   /* музыка продолжает играть */
    });
  }
}catch(e){}

/* ================= ЖЕСТЫ ================= */
/* свайп от левого края = назад */
(function(){
  var es=null;
  doc.addEventListener('touchstart',function(e){var t=e.touches[0];es=(e.touches.length===1&&t.clientX<=20)?{x:t.clientX,y:t.clientY,done:false}:null},{passive:true});
  doc.addEventListener('touchmove',function(e){
    if(!es||es.done)return;var t=e.touches[0],dx=t.clientX-es.x,dy=t.clientY-es.y;
    if(dx>72&&Math.abs(dy)<dx*.6){es.done=true;closeTop()}
  },{passive:true});
  doc.addEventListener('touchend',function(){es=null},{passive:true});
  doc.addEventListener('touchcancel',function(){es=null},{passive:true});
})();

/* потянуть вниз = закрыть (экран плеера, настройки, шторки) */
function pullDown(el,scroller,closeFn,ignore){
  if(!el)return;var s=null;
  el.addEventListener('touchstart',function(e){
    if(e.touches.length!==1||scroller.scrollTop>0||(ignore&&e.target.closest&&e.target.closest(ignore))){s=null;return}
    var t=e.touches[0];s={x:t.clientX,y:t.clientY,t:Date.now(),lock:0,dy:0};
  },{passive:true});
  el.addEventListener('touchmove',function(e){
    if(!s)return;var t=e.touches[0],dx=t.clientX-s.x,dy=t.clientY-s.y;
    if(!s.lock){
      if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)*1.4){if(dy>0&&scroller.scrollTop<=0)s.lock=1;else{s=null;return}}
      else if(Math.abs(dx)>12){s=null;return}
      if(!s.lock)return;
    }
    s.dy=Math.max(0,dy);el.style.transition='none';el.style.transform='translateY('+(s.dy*.92).toFixed(1)+'px)';
    if(e.cancelable)e.preventDefault();
  },{passive:false});
  function end(){
    if(!s)return;var d=s.dy,v=d/Math.max(1,Date.now()-s.t),lk=s.lock;s=null;
    if(!lk)return;
    el.style.transition='';el.style.transform='';
    if(d>110||(d>50&&v>.6))closeFn();
  }
  el.addEventListener('touchend',end,{passive:true});
  el.addEventListener('touchcancel',end,{passive:true});
}
pullDown($('np'),$('np').querySelector('.npin'),function(){$('npx').click()},'input[type=range],.bsheet');
pullDown($('st'),$('st'),function(){$('stx').click()},'input[type=range],.eqv,.fxr');
pullDown($('qs'),$('qs'),function(){$('bk').click()},'input');
pullDown($('ti'),$('ti'),function(){$('bk').click()},'input');

/* свайп по обложке: следующий / предыдущий трек */
(function(){
  var art=$('npart');if(!art)return;
  var TR='transform .5s cubic-bezier(.2,.8,.2,1), translate .22s ease, opacity .22s ease',s=null;
  art.style.transition=TR;
  art.addEventListener('touchstart',function(e){if(e.touches.length!==1){s=null;return}var t=e.touches[0];s={x:t.clientX,y:t.clientY,lock:0,dx:0}},{passive:true});
  art.addEventListener('touchmove',function(e){
    if(!s)return;var t=e.touches[0],dx=t.clientX-s.x,dy=t.clientY-s.y;
    if(!s.lock){
      if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)*1.3)s.lock=1;
      else if(Math.abs(dy)>10){s=null;return}
      if(!s.lock)return;
    }
    s.dx=dx;art.style.transition='none';art.style.translate=(dx*.55).toFixed(1)+'px 0';art.style.opacity=(1-Math.min(.35,Math.abs(dx)/500)).toFixed(2);
    if(e.cancelable)e.preventDefault();
  },{passive:false});
  function end(){
    if(!s)return;var d=s.dx,lk=s.lock;s=null;if(!lk)return;
    art.style.transition=TR;art.style.translate='';art.style.opacity='';
    if(Math.abs(d)>70){if(d<0)$('nnx').click();else $('npv').click()}
  }
  art.addEventListener('touchend',end,{passive:true});
  art.addEventListener('touchcancel',end,{passive:true});
})();

/* свайп вверх по мини-плееру = открыть экран плеера */
(function(){
  var pl=$('pl'),s=null;if(!pl)return;
  pl.addEventListener('touchstart',function(e){
    if(e.touches.length!==1||(e.target.closest&&e.target.closest('input,.mbt'))){s=null;return}
    var t=e.touches[0];s={x:t.clientX,y:t.clientY};
  },{passive:true});
  pl.addEventListener('touchend',function(e){
    if(!s)return;var t=e.changedTouches[0],dx=t.clientX-s.x,dy=t.clientY-s.y;s=null;
    if(dy<-48&&Math.abs(dy)>Math.abs(dx)*1.5){var ph=pl.querySelector('.ph');if(ph)ph.click()}
  },{passive:true});
})();

applyTheme();rhythmUI();kick();
})();
