(() => {
  'use strict';

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

  const opening = $('#opening');
  const envelope = $('#envelope');
  const invitation = $('#invitation');
  const musicBtn = $('#musicBtn');
  const bgMusic = $('#bgMusic');
  const progressBar = $('#progressBar');

  let invitationOpened = false;
  let petalTimer = null;
  let countdownTimer = null;

  // ---------------- Opening / invitation ----------------
  async function startMusic() {
    if (!bgMusic) return false;
    try {
      bgMusic.volume = 0.7;
      await bgMusic.play();
      updateMusicButton();
      return true;
    } catch (error) {
      // Browser autoplay policy may block playback until another user gesture.
      console.warn('Music could not start:', error);
      updateMusicButton();
      return false;
    }
  }

  function updateMusicButton() {
    if (!musicBtn || !bgMusic) return;
    const playing = !bgMusic.paused && !bgMusic.ended;
    musicBtn.textContent = playing ? '❚❚' : '♪';
    musicBtn.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
    musicBtn.setAttribute('aria-pressed', String(playing));
  }

  async function openInvitation() {
    if (invitationOpened) return;
    invitationOpened = true;

    await startMusic();

    envelope?.classList.add('revealed');

    window.setTimeout(() => {
      opening?.classList.add('opened');
      invitation?.classList.remove('hidden');
      document.body.classList.remove('locked');
      window.scrollTo({ top: 0, behavior: 'instant' });
      startPetals();
      startCountdown();
      setupAllScratchCards();
      updateProgress();
    }, 850);
  }

  if (envelope) {
    envelope.addEventListener('click', openInvitation);
    envelope.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openInvitation();
      }
    });
  }

  // ---------------- Scroll reveal ----------------
  const revealElements = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.12 });
    revealElements.forEach((element) => observer.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add('visible'));
  }

  // ---------------- Timeline animation ----------------
  const timeline = $('.timeline');
  if (timeline && 'IntersectionObserver' in window) {
    const timelineObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          timeline.classList.add('filled');
          timelineObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });
    timelineObserver.observe(timeline);
  }

  // ---------------- Scroll progress ----------------
  function updateProgress() {
    if (!progressBar) return;
    const doc = document.documentElement;
    const maxScroll = doc.scrollHeight - doc.clientHeight;
    const progress = maxScroll > 0 ? (doc.scrollTop / maxScroll) * 100 : 0;
    progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  // ---------------- Countdown ----------------
  function startCountdown() {
    const days = $('#cdDays');
    const hours = $('#cdHours');
    const mins = $('#cdMins');
    const secs = $('#cdSecs');
    if (!days || !hours || !mins || !secs) return;

    // Wedding date: 30 November 2026, 11:00 AM IST.
    const target = new Date('2026-11-30T11:00:00+05:30').getTime();
    if (countdownTimer) clearInterval(countdownTimer);

    function tick() {
      const diff = Math.max(0, target - Date.now());
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      days.textContent = String(d).padStart(2, '0');
      hours.textContent = String(h).padStart(2, '0');
      mins.textContent = String(m).padStart(2, '0');
      secs.textContent = String(s).padStart(2, '0');
    }

    tick();
    countdownTimer = setInterval(tick, 1000);
  }

  // ---------------- Falling petals ----------------
  const petals = $('#petals');

  function makePetal() {
    if (!petals) return;
    const petal = document.createElement('i');
    petal.className = 'petal';
    petal.style.left = `${Math.random() * 100}vw`;
    petal.style.setProperty('--x', `${Math.random() * 260 - 130}px`);
    petal.style.animationDuration = `${5 + Math.random() * 7}s`;
    petal.style.transform = `rotate(${Math.random() * 360}deg)`;
    petal.style.opacity = `${0.35 + Math.random() * 0.45}`;
    petal.style.width = `${7 + Math.random() * 8}px`;
    petal.style.height = `${10 + Math.random() * 10}px`;
    petal.style.background = ['#c1953f', '#7c1f2c', '#e9caa0', '#d99a8f'][Math.floor(Math.random() * 4)];
    petals.appendChild(petal);
    setTimeout(() => petal.remove(), 13000);
  }

  function startPetals() {
    if (!petals || petalTimer) return;
    petalTimer = setInterval(makePetal, 380);
    for (let i = 0; i < 18; i++) setTimeout(makePetal, i * 120);
  }

  // ---------------- Scratch cards ----------------
  // Each card has its own canvas/context. The old code used one ID for
  // multiple canvases, so querySelector/getElementById only handled one card.
  function setupScratchCard(canvas) {
    if (!canvas || canvas.dataset.scratchReady === 'true') return;

    const card = canvas.closest('.scratch-wrap');
    if (!card) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let drawing = false;
    let cleared = false;

    function resizeCanvas() {
      if (cleared) return;
      const rect = card.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      const dpr = Math.max(1, window.devicePixelRatio || 1);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#c1a884';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = 'rgba(255,255,255,.18)';
      for (let i = 0; i < 60; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 20, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#fff8ed';
      ctx.font = '600 12px "DM Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SCRATCH TO REVEAL', width / 2, height / 2);
    }

    function getPoint(event) {
      const rect = canvas.getBoundingClientRect();
      const source = event.touches?.[0] || event.changedTouches?.[0] || event;
      return {
        x: source.clientX - rect.left,
        y: source.clientY - rect.top
      };
    }

    function scratch(event) {
      if (cleared) return;
      const { x, y } = getPoint(event);
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / Math.max(1, rect.width);
      const scaleY = canvas.height / Math.max(1, rect.height);

      ctx.save();
      ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      checkCleared();
    }

    function checkCleared() {
      // Sample alpha values instead of scanning every pixel on every pointer move.
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let transparent = 0;
      let samples = 0;
      const step = Math.max(4, Math.floor(data.length / 16000));

      for (let i = 3; i < data.length; i += step) {
        samples++;
        if (data[i] < 40) transparent++;
      }

      if (samples && transparent / samples >= 0.58) reveal();
    }

    function reveal() {
      if (cleared) return;
      cleared = true;
      canvas.classList.add('scratched');
      canvas.style.pointerEvents = 'none';
      canvas.style.opacity = '0';
      canvas.setAttribute('aria-hidden', 'true');
      card.classList.add('revealed');
      const label = $('.scratch-label', card);
      if (label) label.style.opacity = '0';
    }

    function pointerDown(event) {
      drawing = true;
      canvas.setPointerCapture?.(event.pointerId);
      scratch(event);
    }

    function pointerMove(event) {
      if (drawing) scratch(event);
    }

    function pointerUp() {
      drawing = false;
    }

    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointermove', pointerMove);
    canvas.addEventListener('pointerup', pointerUp);
    canvas.addEventListener('pointercancel', pointerUp);
    canvas.addEventListener('pointerleave', pointerUp);

    // Prevent page scrolling while scratching on touch devices.
    canvas.style.touchAction = 'none';

    canvas.dataset.scratchReady = 'true';
    canvas._resizeScratch = resizeCanvas;
    resizeCanvas();
  }

  function setupAllScratchCards() {
    $$('.scratchCanvas').forEach(setupScratchCard);
  }

  setupAllScratchCards();
  window.addEventListener('resize', () => {
    $$('.scratchCanvas').forEach((canvas) => canvas._resizeScratch?.());
  });

  // ---------------- RSVP ----------------
  const attendanceInput = $('#attendance');
  const rsvpForm = $('#rsvpForm');
  const rsvpWrap = $('#rsvpFormWrap');
  const thankYou = $('#thankYou');

  $$('.segment').forEach((button) => {
    button.addEventListener('click', () => {
      $$('.segment').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      if (attendanceInput) attendanceInput.value = button.dataset.value || '';
    });
  });

  rsvpForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!attendanceInput?.value) {
      alert("Please let us know if you'll attend.");
      return;
    }
    rsvpWrap?.classList.add('hidden');
    thankYou?.classList.remove('hidden');
  });

  // ---------------- Music player ----------------
  async function toggleMusic() {
    if (!bgMusic) return;

    try {
      if (bgMusic.paused || bgMusic.ended) {
        await bgMusic.play();
      } else {
        bgMusic.pause();
      }
    } catch (error) {
      console.error('Music playback error:', error);
    } finally {
      updateMusicButton();
    }
  }

  musicBtn?.addEventListener('click', toggleMusic);
  bgMusic?.addEventListener('play', updateMusicButton);
  bgMusic?.addEventListener('pause', updateMusicButton);
  bgMusic?.addEventListener('ended', updateMusicButton);
  bgMusic?.addEventListener('error', () => {
    console.error('Could not load music.mp3. Make sure it is beside index.html.');
    updateMusicButton();
  });
  updateMusicButton();
})();
