const opening = document.getElementById("opening");
const envelope = document.getElementById("envelope");
const invitation = document.getElementById("invitation");
const musicBtn = document.getElementById("musicBtn");
const bgMusic = document.getElementById("bgMusic");

function openInvitation(){

  // Start wedding music after user taps the envelope
  bgMusic.play()
    .then(() => {
      musicBtn.textContent = "❚❚";
      console.log("Music started successfully");
    })
    .catch((error) => {
      console.log("Music error:", error);
    });

  envelope.classList.add("revealed");

  setTimeout(()=>{
    opening.classList.add("opened");
    invitation.classList.remove("hidden");
    document.body.classList.remove("locked");
    window.scrollTo({top:0, behavior:"instant"});
    startPetals();
    startCountdown();
  },850);
}
envelope.addEventListener("click",openInvitation);
envelope.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" ")openInvitation()});

// Scroll reveal
const observer = new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting) entry.target.classList.add("visible");
  });
},{threshold:.12});
document.querySelectorAll(".reveal").forEach(el=>observer.observe(el));

// Timeline line fill, once in view
const timelineEl = document.querySelector(".timeline");
if(timelineEl){
  const timelineObserver = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        timelineEl.classList.add("filled");
        timelineObserver.unobserve(entry.target);
      }
    });
  },{threshold:.25});
  timelineObserver.observe(timelineEl);
}

// Scroll progress bar
const progressBar = document.getElementById("progressBar");
function updateProgress(){
  const h = document.documentElement;
  const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
  progressBar.style.width = (scrolled*100)+"%";
}
window.addEventListener("scroll",updateProgress,{passive:true});

// Countdown to the wedding ceremony
function startCountdown(){
  const target = new Date("2026-11-30T11:00:00+05:30").getTime();
  const days = document.getElementById("cdDays");
  const hours = document.getElementById("cdHours");
  const mins = document.getElementById("cdMins");
  const secs = document.getElementById("cdSecs");
  if(!days) return;
  function tick(){
    const diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff/86400000);
    const h = Math.floor(diff%86400000/3600000);
    const m = Math.floor(diff%3600000/60000);
    const s = Math.floor(diff%60000/1000);
    days.textContent = String(d).padStart(2,"0");
    hours.textContent = String(h).padStart(2,"0");
    mins.textContent = String(m).padStart(2,"0");
    secs.textContent = String(s).padStart(2,"0");
  }
  tick();
  setInterval(tick,1000);
}

// Falling petals
const petals = document.getElementById("petals");
let petalTimer;
function makePetal(){
  const p=document.createElement("i");
  p.className="petal";
  p.style.left=Math.random()*100+"vw";
  p.style.setProperty("--x",(Math.random()*260-130)+"px");
  p.style.animationDuration=(5+Math.random()*7)+"s";
  p.style.transform=`rotate(${Math.random()*360}deg)`;
  p.style.opacity=(.35+Math.random()*.45);
  p.style.width=(7+Math.random()*8)+"px";
  p.style.height=(10+Math.random()*10)+"px";
  p.style.background=["#c1953f","#7c1f2c","#e9caa0","#d99a8f"][Math.floor(Math.random()*4)];
  petals.appendChild(p);
  setTimeout(()=>p.remove(),13000);
}
function startPetals(){
  if(petalTimer) return;
  petalTimer=setInterval(makePetal,380);
  for(let i=0;i<18;i++) setTimeout(makePetal,i*120);
}

// Scratch card
const canvas=document.getElementById("scratchCanvas");
const ctx=canvas.getContext("2d");
let drawing=false, cleared=false;
function setupScratch(){
  const dpr=window.devicePixelRatio||1;
  const rect=canvas.getBoundingClientRect();
  canvas.width=rect.width*dpr; canvas.height=rect.height*dpr;
  ctx.scale(dpr,dpr);
  ctx.fillStyle="#c1a884";
  ctx.fillRect(0,0,rect.width,rect.height);
  ctx.fillStyle="rgba(255,255,255,.18)";
  for(let i=0;i<60;i++){
    ctx.beginPath();ctx.arc(Math.random()*rect.width,Math.random()*rect.height,Math.random()*20,0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle="#fff8ed";ctx.font="600 12px DM Sans";ctx.textAlign="center";
  ctx.fillText("SCRATCH TO REVEAL",rect.width/2,rect.height/2);
}
function scratch(e){
  if(cleared) return;
  const r=canvas.getBoundingClientRect();
  const x=(e.touches?e.touches[0].clientX:e.clientX)-r.left;
  const y=(e.touches?e.touches[0].clientY:e.clientY)-r.top;
  ctx.globalCompositeOperation="destination-out";
  ctx.beginPath();ctx.arc(x,y,28,0,Math.PI*2);ctx.fill();
  const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  let transparent=0;
  for(let i=3;i<data.length;i+=32) if(data[i]<40) transparent++;
  if(transparent>data.length/32*.58){
    cleared=true; canvas.style.opacity="0"; canvas.style.pointerEvents="none";
    document.querySelector(".hidden-year").style.visibility="visible";
  }
}
canvas.addEventListener("pointerdown",e=>{drawing=true;scratch(e)});
canvas.addEventListener("pointermove",e=>{if(drawing)scratch(e)});
window.addEventListener("pointerup",()=>drawing=false);
canvas.addEventListener("touchstart",e=>{e.preventDefault();drawing=true;scratch(e)},{passive:false});
canvas.addEventListener("touchmove",e=>{e.preventDefault();if(drawing)scratch(e)},{passive:false});
setTimeout(setupScratch,100);
window.addEventListener("resize",()=>{if(!cleared)setupScratch()});

// RSVP — segmented attendance control
const attendanceInput = document.getElementById("attendance");
document.querySelectorAll(".segment").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".segment").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    attendanceInput.value = btn.dataset.value;
  });
});

// RSVP demo
document.getElementById("rsvpForm").addEventListener("submit",e=>{
  e.preventDefault();
  if(!attendanceInput.value){
    alert("Please let us know if you'll attend.");
    return;
  }
  document.getElementById("rsvpFormWrap").classList.add("hidden");
  document.getElementById("thankYou").classList.remove("hidden");
});

// Music toggle — add an MP3 source in HTML to make this play.
musicBtn.addEventListener("click", async () => {
  try {
    if (bgMusic.paused) {
      await bgMusic.play();
      musicBtn.textContent = "❚❚";
    } else {
      bgMusic.pause();
      musicBtn.textContent = "♪";
    }
  } catch (error) {
    console.error("Music playback error:", error);
  }
});
