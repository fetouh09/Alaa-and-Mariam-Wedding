'use strict';

const gate = document.getElementById('gate');
const enterButton = document.getElementById('enterButton');
const experience = document.getElementById('experience');
const music = document.getElementById('weddingMusic');
const soundButton = document.getElementById('soundButton');
const soundLabel = document.getElementById('soundLabel');
const toast = document.getElementById('toast');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let toastTimer;
let soundEnabled = true;
let entered = false;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3500);
}
function updateSoundUI() {
  const actuallyOn = soundEnabled && !music.paused && !music.muted;
  soundButton.classList.toggle('is-muted', !actuallyOn);
  soundButton.setAttribute('aria-pressed', String(actuallyOn));
  soundButton.setAttribute('aria-label', actuallyOn ? 'Mute music' : 'Play music');
  soundButton.title = actuallyOn ? 'Mute music' : 'Play music';
  soundLabel.textContent = actuallyOn ? 'SOUND ON' : 'SOUND OFF';
}
function startMusic() {
  // The file is already trimmed to begin at 00:29 of the original recording.
  music.muted = false;
  music.volume = 0.85;
  soundEnabled = true;
  try {
    const playPromise = music.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.then(updateSoundUI).catch(() => {
        soundEnabled = false;
        updateSoundUI();
        showToast('Tap SOUND OFF above to start the music.');
      });
    }
  } catch (error) {
    soundEnabled = false;
    updateSoundUI();
    showToast('Tap the sound button to start the music.');
  }
}
function enterInvitation() {
  if (entered) return;
  entered = true;
  // Call play synchronously inside the user click, so iOS/Android allow audio.
  startMusic();
  experience.classList.add('is-live');
  experience.setAttribute('aria-hidden', 'false');
  gate.classList.add('is-opening');
  document.body.classList.remove('is-locked');
  enterButton.disabled = true;
  setTimeout(() => { gate.hidden = true; }, reducedMotion ? 30 : 1220);
  if (!reducedMotion) spawnPetals();
  revealSections();
  updateCountdown();
}
enterButton.addEventListener('click', enterInvitation);

soundButton.addEventListener('click', () => {
  if (music.paused) {
    // User gesture: restart playback if mobile browser originally blocked it.
    music.muted = false;
    soundEnabled = true;
    const playResult = music.play();
    if (playResult) playResult.catch(() => showToast('Music could not start. Please tap again.'));
  } else {
    soundEnabled = !soundEnabled;
    music.muted = !soundEnabled;
  }
  updateSoundUI();
});
music.addEventListener('playing', updateSoundUI);
music.addEventListener('pause', updateSoundUI);
music.addEventListener('error', () => {
  soundEnabled = false;
  updateSoundUI();
  if (entered) showToast('Music file unavailable. Make sure music.mp3 is uploaded.');
});

// Decorative stars are fixed in place and petals drift gently down.
(function spawnStars() {
  const field = document.getElementById('constellation');
  const stars = 54;
  for (let i = 0; i < stars; i++) {
    const dot = document.createElement('i');
    dot.className = 'spark-star' + (i % 8 === 0 ? ' plus' : '');
    dot.style.left = `${(i * 71.29 + 13.5) % 99}%`;
    dot.style.top = `${(i * 43.71 + 10.2) % 96}%`;
    dot.style.setProperty('--duration', `${2.5 + (i % 9) * .37}s`);
    dot.style.setProperty('--delay', `${-(i % 7) * .6}s`);
    field.appendChild(dot);
  }
})();
function spawnPetals() {
  const field = document.getElementById('petalField');
  for (let i = 0; i < 21; i++) {
    const petal = document.createElement('span');
    petal.className = 'petal';
    petal.style.setProperty('--x', `${(i * 43.7 + 8) % 100}%`);
    petal.style.setProperty('--size', `${5 + i % 8}px`);
    petal.style.setProperty('--fall', `${10 + (i % 6) * 1.7}s`);
    petal.style.setProperty('--delay', `${-(i * 1.31)}s`);
    petal.style.setProperty('--drift', `${i % 2 ? -80 - (i % 5) * 17 : 70 + (i % 4) * 30}px`);
    field.appendChild(petal);
  }
}

function revealSections() {
  const elements = document.querySelectorAll('[data-reveal]');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .08, rootMargin: '0px 0px -30px 0px' });
  elements.forEach(el => observer.observe(el));
}

// December in Cairo is UTC+02:00. The countdown respects every visitor's timezone.
const weddingTimestamp = Date.parse('2026-12-17T19:00:00+02:00');
function updateCountdown() {
  const diff = Math.max(0, weddingTimestamp - Date.now());
  const parts = {
    days: Math.floor(diff / 86400000),
    hours: Math.floor(diff / 3600000) % 24,
    minutes: Math.floor(diff / 60000) % 60,
    seconds: Math.floor(diff / 1000) % 60,
  };
  Object.entries(parts).forEach(([name, value]) => {
    const el = document.getElementById(name);
    if (el) el.textContent = String(value).padStart(2, '0');
  });
  if (diff === 0) document.getElementById('countdownComplete').hidden = false;
}
updateCountdown();
setInterval(updateCountdown, 1000);

// A tiny interactive shower of hearts for the happy couple.
document.getElementById('loveButton').addEventListener('click', event => {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const hearts = ['♥', '♡', '✦', '✧'];
  const colors = ['#b66c82', '#d39d90', '#8c4b6d', '#dfb29b'];
  for (let i = 0; i < (reducedMotion ? 5 : 27); i++) {
    const particle = document.createElement('span');
    particle.className = 'love-spark';
    particle.textContent = hearts[i % hearts.length];
    const angle = (Math.PI * 2 * i) / 27;
    const radius = 80 + Math.random() * 210;
    particle.style.setProperty('--start-x', `${x}px`);
    particle.style.setProperty('--start-y', `${y}px`);
    particle.style.setProperty('--dx', `${Math.cos(angle) * radius}px`);
    particle.style.setProperty('--dy', `${Math.sin(angle) * radius - 40}px`);
    particle.style.setProperty('--life', `${.8 + Math.random() * .8}s`);
    particle.style.setProperty('--size', `${15 + Math.random() * 17}px`);
    particle.style.setProperty('--rotation', `${(Math.random() - .5) * 230}deg`);
    particle.style.setProperty('--color', colors[i % colors.length]);
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 1800);
  }
  showToast('Love sent! ♡');
});

document.getElementById('shareButton').addEventListener('click', async () => {
  const url = location.href.split('#')[0];
  const title = 'Alaa & Mariam — Wedding Invitation';
  const text = 'You’re invited! Join Alaa & Mariam on December 17, 2026 at 7:00 PM at Green Plaza. ♡';
  if (navigator.share && /^https?:/.test(location.protocol)) {
    try { await navigator.share({ title, text, url }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    showToast('Invitation link copied! ♡');
  } catch (_) {
    // Clipboard APIs can be denied on local previews or non-HTTPS pages.
    showToast('Copy the website address to share the invitation.');
  }
});
