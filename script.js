/* ============================================
   DeepDraft — script.js
   Animations, Canvas Logo, Formspree
   ============================================ */

'use strict';

/* ============================================
   Lucide Icons Init
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  initNavScroll();
  initIntersectionObserver();
  // initLogoCanvas(); // disabled — using PNG logo (assets/DeepDraft_logo_webhd-04.png)
  initWaitlistForm();
  injectAmbientBlobs();
});

/* ============================================
   Nav — add scrolled class on scroll
   ============================================ */
function initNavScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ============================================
   Intersection Observer — fade-in-up
   ============================================ */
function initIntersectionObserver() {
  const targets = document.querySelectorAll('.fade-in-up');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach((el) => observer.observe(el));
}

/* ============================================
   Canvas — Layered D Logo (Neural Network)
   ============================================ */
function initLogoCanvas() {
  const canvas = document.getElementById('logoCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const CX = W / 2;
  const CY = H / 2;

  const TEAL   = '#2E94A5';
  const ORANGE = '#F7931E';
  const WHITE  = 'rgba(255,255,255,0.85)';

  // ---- Node Definitions (relative to center) ----
  // The "D" shape: a vertical bar on the left + arc nodes on the right
  const nodes = [
    // Left vertical bar — 5 nodes
    { id: 0, x: -80, y: -120, r: 6,  color: TEAL,   layer: 0 },
    { id: 1, x: -80, y:  -60, r: 6,  color: TEAL,   layer: 0 },
    { id: 2, x: -80, y:    0, r: 8,  color: WHITE,  layer: 0 },
    { id: 3, x: -80, y:   60, r: 6,  color: TEAL,   layer: 0 },
    { id: 4, x: -80, y:  120, r: 6,  color: TEAL,   layer: 0 },

    // Middle layer — hidden nodes along D curve
    { id: 5,  x:  -20, y: -110, r: 5, color: ORANGE, layer: 1 },
    { id: 6,  x:   20, y:  -90, r: 5, color: ORANGE, layer: 1 },
    { id: 7,  x:   55, y:  -55, r: 5, color: ORANGE, layer: 1 },
    { id: 8,  x:   70, y:    0, r: 7, color: ORANGE, layer: 1 },
    { id: 9,  x:   55, y:   55, r: 5, color: ORANGE, layer: 1 },
    { id: 10, x:   20, y:   90, r: 5, color: ORANGE, layer: 1 },
    { id: 11, x:  -20, y:  110, r: 5, color: ORANGE, layer: 1 },

    // Output node — center right
    { id: 12, x:  80, y:    0, r: 9, color: TEAL,   layer: 2 },
  ];

  // ---- Edge Definitions ----
  const edges = [
    // Left bar → middle arc
    [0, 5], [0, 6],
    [1, 5], [1, 6], [1, 7],
    [2, 6], [2, 7], [2, 8], [2, 9],
    [3, 7], [3, 8], [3, 9], [3, 10],
    [4, 9], [4, 10], [4, 11],
    // Middle arc → output
    [5, 12], [6, 12], [7, 12],
    [8, 12],
    [9, 12], [10, 12], [11, 12],
    // Left bar top & bottom — vertical edges (the D's vertical stroke)
    [0, 1], [1, 2], [2, 3], [3, 4],
  ];

  // ---- Animated Pulse Particles ----
  const particles = edges.map((edge) => ({
    edge,
    progress: Math.random(),
    speed: 0.003 + Math.random() * 0.004,
    active: Math.random() > 0.4,
    opacity: 0,
  }));

  let animationId;
  let time = 0;

  function getNodePos(node) {
    return { x: CX + node.x, y: CY + node.y };
  }

  function drawEdge(fromNode, toNode, alpha) {
    const from = getNodePos(fromNode);
    const to   = getNodePos(toNode);

    const grad = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
    grad.addColorStop(0, `rgba(46,148,165,${alpha * 0.5})`);
    grad.addColorStop(1, `rgba(247,147,30,${alpha * 0.3})`);

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawNode(node, pulse) {
    const pos = getNodePos(node);
    const r = node.r + pulse * 2;

    // Outer glow
    const glow = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r * 4);
    const glowColor = node.color === ORANGE
      ? `rgba(247,147,30,${0.15 + pulse * 0.1})`
      : `rgba(46,148,165,${0.15 + pulse * 0.1})`;
    glow.addColorStop(0, glowColor);
    glow.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r * 4, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Core node
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.fillStyle = node.color;
    ctx.fill();

    // Inner highlight
    ctx.beginPath();
    ctx.arc(pos.x, pos.y - r * 0.2, r * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fill();
  }

  function drawPulseParticle(particle) {
    if (!particle.active) return;

    const [fromId, toId] = particle.edge;
    const fromNode = nodes[fromId];
    const toNode   = nodes[toId];
    const from = getNodePos(fromNode);
    const to   = getNodePos(toNode);

    const t = particle.progress;
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t;

    // Fade in/out across the edge
    const fade = Math.sin(t * Math.PI);

    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${fade * 0.9})`;
    ctx.fill();

    // Small trail
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(46,148,165,${fade * 0.3})`;
    ctx.fill();
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);

    time += 0.012;

    // Draw the D outline arc (decorative schematic arc)
    ctx.beginPath();
    ctx.arc(CX - 35, CY, 145, -Math.PI * 0.72, Math.PI * 0.72);
    ctx.strokeStyle = 'rgba(46,148,165,0.08)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw vertical bar of D
    ctx.beginPath();
    ctx.moveTo(CX - 80, CY - 130);
    ctx.lineTo(CX - 80, CY + 130);
    ctx.strokeStyle = 'rgba(46,148,165,0.08)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw edges
    edges.forEach(([fromId, toId]) => {
      const edgePulse = (Math.sin(time + fromId * 0.5) + 1) / 2;
      drawEdge(nodes[fromId], nodes[toId], 0.2 + edgePulse * 0.15);
    });

    // Draw pulse particles
    particles.forEach((p) => {
      p.progress += p.speed;
      if (p.progress >= 1) {
        p.progress = 0;
        p.active = Math.random() > 0.2;
      }
      drawPulseParticle(p);
    });

    // Draw nodes
    nodes.forEach((node) => {
      const pulse = (Math.sin(time * 1.5 + node.id * 0.8) + 1) / 2;
      drawNode(node, pulse * 0.4);
    });

    // Central label — subtle "D" mark
    ctx.font = 'bold 42px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(46,148,165,0.06)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('D', CX, CY);

    animationId = requestAnimationFrame(drawFrame);
  }

  drawFrame();

  // Pause animation when off-screen for performance
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) {
        cancelAnimationFrame(animationId);
      } else {
        drawFrame();
      }
    },
    { threshold: 0.1 }
  );
  observer.observe(canvas);
}

/* ============================================
   Formspree Waitlist Submission
   ============================================ */
function initWaitlistForm() {
  const form      = document.getElementById('waitlistForm');
  const input     = document.getElementById('emailInput');
  const msgEl     = document.getElementById('formMessage');
  const submitBtn = document.getElementById('submitBtn');

  if (!form) return;

  // ⚠️  Replace with your actual Formspree endpoint:
  //     1. Go to https://formspree.io/
  //     2. Create a new form and copy the endpoint URL
  //     3. Replace the URL below
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = input.value.trim();
    if (!email) return;

    // Loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'sending...';
    msgEl.className = 'hidden font-mono text-sm';
    msgEl.textContent = '';

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        showMessage(msgEl, 'Access request received. We\'ll be in touch.', 'success');
        input.value = '';
        animateSuccess();
      } else {
        const data = await res.json().catch(() => ({}));
        const errMsg = data?.errors?.[0]?.message || 'Submission failed. Try again.';
        showMessage(msgEl, errMsg, 'error');
      }
    } catch {
      showMessage(msgEl, 'Network error. Check connection and retry.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="text-orange mr-1">↵</span> execute';
    }
  });
}

function showMessage(el, text, type) {
  el.textContent = text;
  el.className = `font-mono text-sm form-${type}`;
}

function animateSuccess() {
  // Brief terminal-style flash on the waitlist section
  const section = document.getElementById('waitlist');
  if (!section) return;
  section.style.transition = 'background 0.3s ease';
  section.style.background = 'rgba(46,148,165,0.04)';
  setTimeout(() => {
    section.style.background = '';
  }, 800);
}

/* ============================================
   Ambient Blobs — inject into hero
   ============================================ */
function injectAmbientBlobs() {
  const hero = document.getElementById('hero');
  if (!hero) return;

  const blobTeal = document.createElement('div');
  blobTeal.className = 'hero-blob-teal';

  const blobOrange = document.createElement('div');
  blobOrange.className = 'hero-blob-orange';

  hero.prepend(blobTeal, blobOrange);
}
