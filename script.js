const state = {
  bloodSugar: 90,
  insulin: 50,
  uptake: 0,
  particles: [],
  lastTs: 0,
  simulationStarted: false
};

const refs = {
  bloodSugarValue: document.getElementById('bloodSugarValue'),
  insulinValue: document.getElementById('insulinValue'),
  uptakeValue: document.getElementById('uptakeValue'),
  bloodSugarBar: document.getElementById('bloodSugarBar'),
  insulinBar: document.getElementById('insulinBar'),
  uptakeBar: document.getElementById('uptakeBar'),
  sugarSlider: document.getElementById('sugarSlider'),
  insulinSlider: document.getElementById('insulinSlider'),
  eatBtn: document.getElementById('eatBtn'),
  resetBtn: document.getElementById('resetBtn'),
  statusPill: document.getElementById('statusPill'),
  glucoseLayer: document.getElementById('glucoseLayer'),
  insulinLayer: document.getElementById('insulinLayer'),
  scene: document.querySelector('.scene'),
  sequenceText: document.getElementById('sequenceText'),
  registrationOverlay: document.getElementById('registrationOverlay'),
  registrationForm: document.getElementById('registrationForm'),
  learnerNameInput: document.getElementById('learnerNameInput'),
  learnerEmailInput: document.getElementById('learnerEmailInput'),
  registrationError: document.getElementById('registrationError'),
  learnerInfo: document.getElementById('learnerInfo')
};

const receptors = Array.from(document.querySelectorAll('.receptor'));
const disposableDomains = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'yopmail.com',
  'trashmail.com',
  'getnada.com'
]);

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function pct(value, min, max) {
  return ((value - min) / (max - min)) * 100;
}

function receptorTargets() {
  return receptors.map((r) => {
    const rect = refs.scene.getBoundingClientRect();
    const rr = r.getBoundingClientRect();
    return {
      x: rr.left - rect.left + rr.width / 2,
      y: rr.top - rect.top + rr.height / 2
    };
  });
}

function spawnParticles(type, count) {
  for (let i = 0; i < count; i += 1) {
    const y = refs.scene.clientHeight * (0.32 + Math.random() * 0.36);
    const speed = 30 + Math.random() * 60;
    state.particles.push({
      type,
      x: 16 + Math.random() * 40,
      y,
      speed,
      absorbed: false,
      el: null
    });
  }
}

function ensureParticleElement(p) {
  if (p.el) return;
  const el = document.createElement('div');
  el.className = `particle ${p.type}`;
  if (p.type === 'glucose') {
    refs.glucoseLayer.appendChild(el);
  } else {
    refs.insulinLayer.appendChild(el);
  }
  p.el = el;
}

function removeParticle(p) {
  if (p.el && p.el.parentNode) {
    p.el.parentNode.removeChild(p.el);
  }
}

function updateReceptors() {
  const boundCount = Math.min(4, Math.floor(state.insulin / 25));
  receptors.forEach((r, i) => {
    r.classList.toggle('bound', i < boundCount);
  });
  return boundCount;
}

function updateStatus(boundCount) {
  if (state.bloodSugar <= 80) {
    refs.statusPill.textContent = 'Stable blood sugar';
    refs.statusPill.className = 'rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-700';
    return;
  }

  if (boundCount === 0) {
    refs.statusPill.textContent = 'No insulin binding -> low uptake';
    refs.statusPill.className = 'rounded-full bg-rose-100 px-3 py-1 text-sm text-rose-700';
    return;
  }

  refs.statusPill.textContent = `Insulin bound to ${boundCount}/4 receptors`;
  refs.statusPill.className = 'rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700';
}

function updateReadouts() {
  refs.bloodSugarValue.textContent = `${Math.round(state.bloodSugar)} mg/dL`;
  refs.insulinValue.textContent = `${Math.round(state.insulin)} a.u.`;
  refs.uptakeValue.textContent = `${state.uptake.toFixed(1)} a.u./s`;

  refs.bloodSugarBar.style.width = `${clamp(pct(state.bloodSugar, 40, 260), 0, 100)}%`;
  refs.insulinBar.style.width = `${clamp(pct(state.insulin, 0, 100), 0, 100)}%`;
  refs.uptakeBar.style.width = `${clamp(pct(state.uptake, 0, 10), 0, 100)}%`;

  refs.sugarSlider.value = String(Math.round(state.bloodSugar));
  refs.insulinSlider.value = String(Math.round(state.insulin));
}

function tick(ts) {
  if (!state.simulationStarted) return;

  const dt = state.lastTs ? (ts - state.lastTs) / 1000 : 0.016;
  state.lastTs = ts;

  const boundCount = updateReceptors();
  const sugarExcess = Math.max(0, state.bloodSugar - 70);
  const uptakeCapacity = (boundCount / 4) * (state.insulin / 100) * 10;
  state.uptake = sugarExcess > 0 ? uptakeCapacity : 0;

  if (state.uptake > 0) {
    state.bloodSugar -= state.uptake * dt * 1.5;
  }
  state.bloodSugar = clamp(state.bloodSugar, 40, 260);

  if (Math.random() < 0.22) spawnParticles('glucose', 1);
  if (Math.random() < state.insulin / 500) spawnParticles('insulin', 1);

  const targets = receptorTargets();
  const uptakeGate = boundCount > 0;

  state.particles = state.particles.filter((p) => {
    ensureParticleElement(p);
    p.x += p.speed * dt;

    if (!p.absorbed && p.type === 'insulin' && p.x > refs.scene.clientWidth * 0.74 && boundCount > 0) {
      const t = targets[Math.floor(Math.random() * boundCount)] || targets[0];
      p.x += (t.x - p.x) * 0.12;
      p.y += (t.y - p.y) * 0.12;
      if (Math.abs(p.x - t.x) < 4 && Math.abs(p.y - t.y) < 4) p.absorbed = true;
    }

    if (!p.absorbed && p.type === 'glucose' && p.x > refs.scene.clientWidth * 0.72 && uptakeGate) {
      const t = { x: refs.scene.clientWidth * 0.86, y: refs.scene.clientHeight * 0.45 };
      p.x += (t.x - p.x) * 0.08;
      p.y += (t.y - p.y) * 0.08;
      if (Math.abs(p.x - t.x) < 5 && Math.abs(p.y - t.y) < 5) p.absorbed = true;
    }

    if (p.absorbed || p.x > refs.scene.clientWidth + 24) {
      removeParticle(p);
      return false;
    }

    p.el.style.left = `${p.x}px`;
    p.el.style.top = `${p.y}px`;
    return true;
  });

  updateStatus(boundCount);
  updateReadouts();
  requestAnimationFrame(tick);
}

function startSimulation() {
  if (state.simulationStarted) return;
  state.simulationStarted = true;
  state.lastTs = 0;
  spawnParticles('glucose', 14);
  spawnParticles('insulin', 8);
  requestAnimationFrame(tick);
}

refs.insulinSlider.addEventListener('input', (e) => {
  state.insulin = Number(e.target.value);
});

refs.sugarSlider.addEventListener('input', (e) => {
  state.bloodSugar = Number(e.target.value);
});

refs.eatBtn.addEventListener('click', () => {
  state.bloodSugar = clamp(state.bloodSugar + 35, 40, 260);
  refs.scene.classList.add('scenePulse');
  refs.sequenceText.textContent = 'Eating event: blood sugar rises. If insulin binds receptors, glucose enters cells and blood sugar falls over time.';
  spawnParticles('glucose', 15);
  setTimeout(() => refs.scene.classList.remove('scenePulse'), 500);
});

refs.resetBtn.addEventListener('click', () => {
  state.bloodSugar = 90;
  state.insulin = 50;
  state.uptake = 0;
  state.particles.forEach(removeParticle);
  state.particles = [];
  refs.sequenceText.textContent = '1) Eating raises blood sugar. 2) Insulin binds receptors. 3) Cells absorb glucose. 4) Blood sugar falls.';
});

refs.learnerNameInput.addEventListener('input', () => {
  refs.registrationError.classList.add('hidden');
});

refs.learnerEmailInput.addEventListener('input', () => {
  refs.registrationError.classList.add('hidden');
});

refs.registrationForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = refs.learnerNameInput.value.trim();
  const email = refs.learnerEmailInput.value.trim();
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailDomain = email.split('@')[1]?.toLowerCase() || '';
  const hasValidName = name.length >= 2;
  const isDisposableEmail = disposableDomains.has(emailDomain);

  if (!hasValidName) {
    refs.registrationError.textContent = 'Please enter a name with at least 2 characters.';
    refs.registrationError.classList.remove('hidden');
    return;
  }

  if (!isEmailValid) {
    refs.registrationError.textContent = 'Please enter a valid email address.';
    refs.registrationError.classList.remove('hidden');
    return;
  }

  if (isDisposableEmail) {
    refs.registrationError.textContent = 'Please use a non-disposable email address.';
    refs.registrationError.classList.remove('hidden');
    return;
  }

  refs.registrationError.classList.add('hidden');
  refs.learnerInfo.textContent = `Registered learner: ${name} (${email})`;
  refs.learnerInfo.classList.remove('hidden');
  refs.registrationOverlay.classList.add('registration-hidden');
  startSimulation();
});
