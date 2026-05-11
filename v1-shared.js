/* ───── KDI V1 SHARED CHROME JS ───── */
(function(){
  // CURSOR
  const cur=document.querySelector('.cur'), ring=document.querySelector('.cur-ring'), lab=document.querySelector('.cur-label');
  if(cur){
    let mx=0,my=0,rx=0,ry=0,lx=0,ly=0,lastT=0;
    document.addEventListener('mousemove',e=>{
      mx=e.clientX; my=e.clientY;
      cur.style.left=mx+'px'; cur.style.top=my+'px';
      const t=performance.now();
      if(t-lastT>32){
        lastT=t;
        const s=document.createElement('div'); s.className='spark-trail';
        s.style.left=mx+'px'; s.style.top=my+'px';
        s.style.filter=`hue-rotate(${Math.random()*360}deg)`;
        document.body.appendChild(s);
        setTimeout(()=>s.remove(),1000);
      }
    });
    (function tick(){
      rx+=(mx-rx)*.18; ry+=(my-ry)*.18;
      lx+=(mx-lx)*.14; ly+=(my-ly)*.14;
      ring.style.left=rx+'px'; ring.style.top=ry+'px';
      lab.style.left=lx+'px'; lab.style.top=ly+'px';
      requestAnimationFrame(tick);
    })();
    document.addEventListener('mouseover',e=>{
      const t=e.target.closest('[data-cur]');
      if(t){ cur.classList.add('lg'); ring.classList.add('lg'); lab.textContent=t.dataset.cur; lab.classList.add('show'); }
    });
    document.addEventListener('mouseout',e=>{
      const t=e.target.closest('[data-cur]');
      if(t){ cur.classList.remove('lg'); ring.classList.remove('lg'); lab.classList.remove('show'); }
    });
  }
  // CLOCK
  const clk=document.getElementById('navClock');
  if(clk){
    function tk(){const d=new Date(); clk.textContent=`KR · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;}
    tk(); setInterval(tk,1000);
  }
  // HAMBURGER
  const hb=document.getElementById('hb'), mm=document.getElementById('mm');
  if(hb) hb.addEventListener('click',()=>{ hb.classList.toggle('open'); mm.classList.toggle('open'); });
  // REVEAL
  const obs=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('on'); }),{threshold:.12});
  document.querySelectorAll('.rv').forEach(el=>obs.observe(el));
  // MARQUEE SCROLL VELOCITY
  const marqs=document.querySelectorAll('.mq-inner');
  let lastY=window.scrollY, vel=0;
  window.addEventListener('scroll',()=>{ const y=window.scrollY; vel=y-lastY; lastY=y; }, {passive:true});
  let durBoost=0;
  setInterval(()=>{
    durBoost = durBoost*0.85 + Math.min(Math.abs(vel),60)*0.15;
    marqs.forEach(m=>{ m.style.animationDuration = Math.max(8, 35 - durBoost*0.4) + 's'; });
    vel*=0.9;
  },80);

})();
