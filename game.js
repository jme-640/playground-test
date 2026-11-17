(() => {
  const canvas = document.getElementById('sprout-game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height, GROUND = H - 34;
  const scoreEl = document.getElementById('game-score');
  const bestEl = document.getElementById('game-best');
  canvas.tabIndex = 0;

  let best = 0;
  try { best = +localStorage.getItem('sproutHopBest') || 0; } catch (e) {}
  bestEl.textContent = best;

  const player = { x: 70, y: GROUND, w: 30, h: 40, vy: 0 };
  let obstacles, clouds, speed, score, spawnIn, state, last, frame, acc = 0;

  function reset() {
    obstacles = [];
    clouds = [{ x: 200, y: 40 }, { x: 560, y: 70 }];
    speed = 6; score = 0; spawnIn = 60; frame = 0;
    player.y = GROUND; player.vy = 0;
  }

  function jump() {
    if (state !== 'play') { reset(); state = 'play'; return; }
    if (player.y >= GROUND) player.vy = -13;
  }

  addEventListener('keydown', e => {
    if ((e.code === 'Space' || e.code === 'ArrowUp') && canvasInView()) {
      e.preventDefault(); jump();
    }
  });
  canvas.addEventListener('pointerdown', e => { e.preventDefault(); canvas.focus(); jump(); });

  function canvasInView() {
    const r = canvas.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight;
  }

  function spawn() {
    const snail = score > 150 && Math.random() < 0.3;
    if (snail) obstacles.push({ type: 'snail', x: W, w: 34, h: 22 });
    else {
      const big = Math.random() < 0.4;
      obstacles.push({ type: 'cactus', x: W, w: big ? 26 : 18, h: big ? 48 : 34 });
    }
    spawnIn = 50 + Math.random() * 60 - Math.min(speed * 2, 20);
  }

  function update() {
    frame++;
    speed = 6 + score / 250;
    score += 0.25;
    player.vy += 0.7;
    player.y = Math.min(GROUND, player.y + player.vy);
    if (player.y === GROUND) player.vy = 0;

    if (--spawnIn <= 0) spawn();
    obstacles.forEach(o => (o.x -= speed));
    obstacles = obstacles.filter(o => o.x + o.w > 0);
    clouds.forEach(c => { c.x -= speed * 0.2; if (c.x < -60) { c.x = W + 20; c.y = 25 + Math.random() * 60; } });

    // Collision, with a small forgiving margin
    const px = player.x + 6, pw = player.w - 12, ptop = player.y - player.h + 6;
    for (const o of obstacles) {
      if (px < o.x + o.w - 4 && px + pw > o.x + 4 && player.y > GROUND - o.h + 4 && ptop < GROUND) {
        state = 'over';
        if (Math.floor(score) > best) {
          best = Math.floor(score); bestEl.textContent = best;
          try { localStorage.setItem('sproutHopBest', best); } catch (e) {}
        }
      }
    }
    scoreEl.textContent = Math.floor(score);
  }

  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); }

  function drawPlayer() {
    const { x, y } = player;
    const bob = player.y === GROUND && state === 'play' ? Math.sin(frame / 3) * 1.5 : 0;
    // leaves
    ctx.fillStyle = '#4f8f5f';
    ctx.beginPath(); ctx.ellipse(x + 9, y - 31 + bob, 9, 5, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6fae6a';
    ctx.beginPath(); ctx.ellipse(x + 21, y - 33 + bob, 9, 5, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2f6b45'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + 15, y - 18); ctx.lineTo(x + 15, y - 30 + bob); ctx.stroke();
    // pot
    ctx.fillStyle = '#a9552f'; rr(x, y - 20, 30, 6, 2);
    ctx.fillStyle = '#c4693f';
    ctx.beginPath(); ctx.moveTo(x + 3, y - 14); ctx.lineTo(x + 27, y - 14); ctx.lineTo(x + 23, y); ctx.lineTo(x + 7, y); ctx.fill();
    // eyes
    ctx.fillStyle = '#1f2a22';
    const blink = state === 'over' ? 0.6 : 2;
    ctx.fillRect(x + 10, y - 10, 2.5, blink * 1.5); ctx.fillRect(x + 18, y - 10, 2.5, blink * 1.5);
  }

  function drawCactus(o) {
    const x = o.x, base = GROUND, h = o.h, w = o.w;
    ctx.fillStyle = '#3f8a52';
    rr(x + w * 0.25, base - h, w * 0.5, h, w * 0.25);
    rr(x, base - h * 0.7, w * 0.3, h * 0.35, 4);
    rr(x, base - h * 0.45, w * 0.5, 6, 3);
    rr(x + w * 0.7, base - h * 0.8, w * 0.3, h * 0.4, 4);
    rr(x + w * 0.5, base - h * 0.5, w * 0.5, 6, 3);
  }

  function drawSnail(o) {
    const x = o.x, b = GROUND;
    ctx.fillStyle = '#d9b48a'; rr(x, b - 7, o.w, 7, 4);
    ctx.fillRect(x + 2, b - 14, 3, 8);
    ctx.fillStyle = '#8a5a34';
    ctx.beginPath(); ctx.arc(x + 20, b - 12, 11, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f2d4ad'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x + 20, b - 12, 5, 0, Math.PI * 1.6); ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#e9e3d4';
    clouds.forEach(c => { rr(c.x, c.y, 50, 12, 6); rr(c.x + 12, c.y - 8, 26, 12, 6); });
    ctx.fillStyle = '#c9bfa8'; ctx.fillRect(0, GROUND, W, 2);
    ctx.fillStyle = '#d8cfba';
    const off = (frame * speed) % 40;
    for (let i = 0; i < W / 40 + 1; i++) ctx.fillRect(i * 40 - off, GROUND + 10 + (i % 3) * 6, 10, 2);
    obstacles.forEach(o => (o.type === 'cactus' ? drawCactus(o) : drawSnail(o)));
    drawPlayer();

    if (state !== 'play') {
      ctx.fillStyle = 'rgba(251,248,241,.75)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#1e4a2f'; ctx.textAlign = 'center';
      ctx.font = '600 28px Fraunces, Georgia, serif';
      ctx.fillText(state === 'over' ? 'Ouch! Game over' : 'Sprout Hop', W / 2, H / 2 - 10);
      ctx.font = '500 16px Inter, system-ui, sans-serif'; ctx.fillStyle = '#5d6b60';
      ctx.fillText('Press Space or tap to ' + (state === 'over' ? 'try again' : 'start'), W / 2, H / 2 + 20);
    }
  }

  function loop(t) {
    // Fixed 60 fps steps so speed is the same on all screens
    if (last === undefined) last = t;
    acc = Math.min(acc + t - last, 100); last = t;
    while (state === 'play' && acc >= 16.67) { update(); acc -= 16.67; }
    if (state !== 'play') acc = 0;
    draw();
    requestAnimationFrame(loop);
  }

  reset(); state = 'ready';
  requestAnimationFrame(loop);
})();
