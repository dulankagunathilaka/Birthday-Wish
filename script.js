const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealTargets = document.querySelectorAll(".reveal");
const memoryCards = Array.from(document.querySelectorAll("[data-card]"));
const imageCards = document.querySelectorAll(".memory-card img");
const confettiButton = document.getElementById("confettiBtn");
const carousel = document.getElementById("memoryCarousel");
const carouselPrev = document.getElementById("carouselPrev");
const carouselNext = document.getElementById("carouselNext");
const carouselDots = document.getElementById("carouselDots");
const surpriseActionButtons = document.querySelectorAll("[data-action]");
const carouselStage = document.querySelector(".carousel-stage");
const supportsFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const questButton = document.getElementById("questButton");
const questReset = document.getElementById("questReset");
const questMeter = document.getElementById("questMeter");
const questCopy = document.getElementById("questCopy");
const questSteps = Array.from(document.querySelectorAll(".quest-step"));

let activeIndex = 0;
let autoRotateId = null;
let isPointerInside = false;
let pointerFrame = 0;
let questStep = 0;

const questState = [
  {
    label: "Start Quest",
    meter: "Step 1 of 3",
    copy: "Press start to wake up the birthday magic.",
    toast: "The birthday quest has begun.",
    effect: () => createParticleStorm({ symbol: "✦", colors: ["#ffe28a", "#ffffff", "#62e6c4"], count: 16, duration: 1400, spread: 160 }),
  },
  {
    label: "Find the Clue",
    meter: "Step 2 of 3",
    copy: "A clue appears. Look for the sparkle in the memories.",
    toast: "Clue found: Kavi is the main character.",
    effect: () => {
      showSurpriseMessage("Clue found");
      carouselNext?.click();
    },
  },
  {
    label: "Unlock Wish",
    meter: "Step 3 of 3",
    copy: "Final step: unlock the wish and collect your surprise.",
    toast: "Wish unlocked. Birthday magic complete.",
    effect: () => {
      createParticleStorm({ symbol: "♥", colors: ["#ff7fb8", "#ffb3d1", "#ffe28a", "#ffffff"], count: 22, duration: 2000, spread: 220, sizeRange: [18, 30] });
      launchSecretNote();
    },
  },
];

function updateQuestUi() {
  if (!questButton || !questReset || !questMeter || !questCopy || questSteps.length === 0) {
    return;
  }

  const current = questState[Math.min(questStep, questState.length - 1)];
  questButton.textContent = questStep >= questState.length ? "Quest Complete" : current.label;
  questMeter.textContent = current.meter;
  questCopy.textContent = current.copy;

  questSteps.forEach((step, index) => {
    step.classList.toggle("is-active", index === Math.min(questStep, questState.length - 1));
    step.classList.toggle("is-complete", index < questStep);
  });

  questButton.classList.toggle("is-done", questStep >= questState.length);
}

function resetQuest() {
  questStep = 0;
  updateQuestUi();
  showSurpriseMessage("Quest reset");
}

function advanceQuest() {
  if (questStep >= questState.length) {
    resetQuest();
    return;
  }

  const current = questState[questStep];
  current.effect();
  showSurpriseMessage(current.toast);
  questStep += 1;
  updateQuestUi();
  addSparkPoints(2);
}

function setStageTilt(clientX, clientY) {
  if (!carouselStage || prefersReducedMotion || !supportsFinePointer) {
    return;
  }

  if (pointerFrame) {
    cancelAnimationFrame(pointerFrame);
  }

  pointerFrame = requestAnimationFrame(() => {
    const bounds = carouselStage.getBoundingClientRect();
    const normalizedX = ((clientX - bounds.left) / bounds.width - 0.5) * 2;
    const normalizedY = ((clientY - bounds.top) / bounds.height - 0.5) * 2;
    const tiltX = normalizedX * 10;
    const tiltY = normalizedY * -6;
    const spotX = Math.max(18, Math.min(82, 50 + normalizedX * 18));
    const spotY = Math.max(18, Math.min(72, 34 + normalizedY * 14));

    carouselStage.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
    carouselStage.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
    carouselStage.style.setProperty("--spot-x", `${spotX.toFixed(2)}%`);
    carouselStage.style.setProperty("--spot-y", `${spotY.toFixed(2)}%`);
    carousel.style.transform = `rotateX(${tiltY.toFixed(2)}deg) rotateY(${activeIndex * -72 + tiltX * 0.5}deg)`;
  });
}

const surpriseLines = [
  "Surprise unlocked: this one was made just for Kavi.",
  "Birthday boost activated.",
  "A little sparkle for your day.",
  "Big friendship energy, right here.",
  "Press again for more birthday magic.",
];

const secretNotes = [
  "Kavi, you are the kind of friend people remember forever.",
  "This day is brighter because your name is on it.",
  "Five photos, one friendship, endless memories.",
  "The best stories usually start with a best friend.",
  "More wins, more joy, more good days ahead.",
];

const gameMessages = {
  "friendship-hug": [
    "A friendship hug just wrapped around the page.",
    "Warm hug mode: activated.",
    "Best-friend hug received.",
  ],
  "lucky-roll": [
    "You rolled a birthday 5.",
    "Lucky friend unlocked.",
    "A perfect roll for Kavi.",
  ],
  "friend-quest": [
    "Quest complete: best friend energy found.",
    "You found the friendship chest.",
    "New clue: more smiles ahead.",
  ],
  "star-tap": [
    "Star tapped. Wish accepted.",
    "You caught a birthday star.",
    "One tap, one sparkle.",
  ],
  "magic-spin": [
    "Magic spin activated.",
    "The birthday wheel says yes.",
    "Surprise mode: glowing.",
  ],
};

const surpriseScore = document.getElementById("surpriseScore");
let sparkPoints = 0;

function addSparkPoints(amount = 1) {
  sparkPoints += amount;
  if (surpriseScore) {
    surpriseScore.textContent = `Spark points: ${sparkPoints}`;
  }
}

questButton?.addEventListener("click", () => {
  pulseButton(questButton);
  advanceQuest();
});

questReset?.addEventListener("click", () => {
  pulseButton(questReset);
  resetQuest();
});

updateQuestUi();

function createParticleStorm({ symbol, colors, count = 24, duration = 2400, spread = 220, sizeRange = [16, 30] }) {
  const originX = window.innerWidth * 0.5;
  const originY = window.innerHeight * 0.34;

  for (let index = 0; index < count; index += 1) {
    const particle = document.createElement("span");
    const size = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
    const angle = (Math.random() - 0.5) * Math.PI * 2;
    const distance = 70 + Math.random() * spread;
    const driftX = Math.cos(angle) * distance;
    const driftY = Math.sin(angle) * distance * 0.65;

    particle.textContent = symbol;
    particle.style.position = "fixed";
    particle.style.left = `${originX}px`;
    particle.style.top = `${originY}px`;
    particle.style.fontSize = `${size}px`;
    particle.style.color = colors[index % colors.length];
    particle.style.zIndex = 9999;
    particle.style.pointerEvents = "none";
    particle.style.textShadow = "0 0 18px rgba(255,255,255,0.22)";
    particle.style.transform = "translate(-50%, -50%)";
    document.body.appendChild(particle);

    particle.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.7)", opacity: 0.15 },
        { transform: `translate(${driftX * 0.55}px, ${driftY * 0.55}px) scale(1)`, opacity: 1 },
        { transform: `translate(${driftX}px, ${driftY + 180}px) scale(0.2)`, opacity: 0 },
      ],
      {
        duration: duration + Math.random() * 500,
        easing: "cubic-bezier(.2,.7,.2,1)",
        fill: "forwards",
      }
    ).onfinish = () => particle.remove();
  }
}

function launchSecretNote() {
  const note = document.createElement("div");
  note.className = "surprise-toast";
  note.innerHTML = `<strong>Secret note</strong><span>${secretNotes[Math.floor(Math.random() * secretNotes.length)]}</span>`;
  document.body.appendChild(note);

  requestAnimationFrame(() => {
    note.classList.add("is-visible");
  });

  window.setTimeout(() => {
    note.remove();
  }, 3200);
}

function pulseButton(button) {
  button.classList.remove("is-pulse");
  void button.offsetWidth;
  button.classList.add("is-pulse");
  window.setTimeout(() => button.classList.remove("is-pulse"), 560);
}

function showSurpriseMessage(sourceLabel) {
  const toast = document.createElement("div");
  const title = sourceLabel || "Surprise";
  const message = surpriseLines[Math.floor(Math.random() * surpriseLines.length)];

  toast.className = "surprise-toast";
  toast.innerHTML = `<strong>${title}</strong><span>${message}</span>`;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("is-visible");
  });

  window.setTimeout(() => {
    toast.remove();
  }, 2800);
}

if (carousel && memoryCards.length) {
  memoryCards.forEach((card, index) => {
    card.style.setProperty("--offset", index);
  });

  const dotButtons = memoryCards.map((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "carousel-dot";
    dot.ariaLabel = `Show image ${index + 1}`;
    dot.addEventListener("click", () => {
      setActiveIndex(index);
      showSurpriseMessage(`Image ${index + 1}`);
    });
    carouselDots?.appendChild(dot);
    return dot;
  });

  const updateCarousel = () => {
    carousel.style.transform = `rotateX(var(--tilt-y, 0deg)) rotateY(calc(${activeIndex * -72}deg + var(--tilt-x, 0deg)))`;
    memoryCards.forEach((card, index) => {
      const rawDistance = (index - activeIndex + memoryCards.length) % memoryCards.length;
      const distance = Math.min(rawDistance, memoryCards.length - rawDistance);
      const isActive = index === activeIndex;
      card.classList.toggle("is-active", isActive);
      card.classList.toggle("is-nearby", distance === 1);
      card.style.setProperty("--card-scale", isActive ? "1.14" : distance === 1 ? "0.98" : "0.84");
      card.style.zIndex = isActive ? "3" : distance === 1 ? "2" : "1";
    });

    dotButtons.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === activeIndex);
    });
  };

  const setActiveIndex = (nextIndex) => {
    activeIndex = (nextIndex + memoryCards.length) % memoryCards.length;
    updateCarousel();
  };

  carouselPrev?.addEventListener("click", () => {
    setActiveIndex(activeIndex - 1);
    showSurpriseMessage("Previous surprise");
  });
  carouselNext?.addEventListener("click", () => {
    setActiveIndex(activeIndex + 1);
    showSurpriseMessage("Next surprise");
  });

  carousel.addEventListener("pointerenter", () => {
    isPointerInside = true;
    stopAutoplay();
  });

  carousel.addEventListener("pointermove", (event) => {
    if (supportsFinePointer) {
      setStageTilt(event.clientX, event.clientY);
    }
  });

  carousel.addEventListener("pointerleave", () => {
    isPointerInside = false;
    if (carouselStage) {
      carouselStage.style.setProperty("--tilt-x", "0deg");
      carouselStage.style.setProperty("--tilt-y", "0deg");
      carouselStage.style.setProperty("--spot-x", "50%");
      carouselStage.style.setProperty("--spot-y", "34%");
    }
    carousel.style.transform = `rotateX(0deg) rotateY(${activeIndex * -72}deg)`;
    startAutoplay();
  });

  const startAutoplay = () => {
    if (prefersReducedMotion || isPointerInside || autoRotateId) {
      return;
    }

    autoRotateId = window.setInterval(() => {
      setActiveIndex(activeIndex + 1);
    }, 3200);
  };

  const stopAutoplay = () => {
    if (autoRotateId) {
      window.clearInterval(autoRotateId);
      autoRotateId = null;
    }
  };

  window.addEventListener("focus", startAutoplay);
  window.addEventListener("blur", stopAutoplay);

  updateCarousel();
  startAutoplay();
}

document.querySelectorAll(".button:not(.surprise-action), .hero-copy a[href], .hero-copy button").forEach((control) => {
  control.addEventListener("click", () => {
    const label = control.dataset.surprise || control.textContent?.trim() || "Surprise";
    showSurpriseMessage(label);
  });
});

surpriseActionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;
    pulseButton(button);
    addSparkPoints(1);

    if (action === "sparkle-burst") {
      createParticleStorm({
        symbol: "✦",
        colors: ["#ffe28a", "#ffffff", "#62e6c4", "#7aa7ff"],
        count: 28,
        duration: 2000,
        spread: 280,
      });
      showSurpriseMessage("Sparkle Burst");
      return;
    }

    if (action === "friendship-hug") {
      createParticleStorm({
        symbol: "🤗",
        colors: ["#ffe28a", "#ffffff", "#62e6c4", "#7aa7ff"],
        count: 18,
        duration: 2200,
        spread: 180,
        sizeRange: [18, 28],
      });
      showSurpriseMessage("Friendship Hug");
      return;
    }

    if (action === "carousel-shuffle") {
      if (typeof carouselNext?.click === "function") {
        const jumps = 1 + Math.floor(Math.random() * 4);
        for (let jump = 0; jump < jumps; jump += 1) {
          window.setTimeout(() => carouselNext.click(), jump * 120);
        }
      }
      showSurpriseMessage("Shuffle Magic");
      return;
    }

    if (action === "secret-note") {
      launchSecretNote();
      return;
    }

    if (action === "lucky-roll" || action === "friend-quest" || action === "star-tap" || action === "magic-spin") {
      const variants = gameMessages[action] || ["A new surprise appears."];
      const message = variants[Math.floor(Math.random() * variants.length)];
      showSurpriseMessage(message);
      if (action === "magic-spin") {
        carouselNext?.click();
      }
      return;
    }
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

revealTargets.forEach((target) => revealObserver.observe(target));

imageCards.forEach((image) => {
  image.addEventListener("load", () => {
    image.closest(".memory-card")?.classList.remove("is-fallback");
  });

  image.addEventListener("error", () => {
    image.closest(".memory-card")?.classList.add("is-fallback");
    const fallback = document.createElement("div");
    fallback.className = "memory-fallback";
    fallback.textContent = image.dataset.fallback || "memory";
    image.after(fallback);
    image.remove();
  });

  if (image.complete && image.naturalWidth === 0) {
    image.dispatchEvent(new Event("error"));
  }
});

function launchConfetti() {
  if (prefersReducedMotion) {
    return;
  }

  const colors = ["#ffd36f", "#62e6c4", "#7aa7ff", "#ffffff"];

  for (let i = 0; i < 36; i += 1) {
    const confetti = document.createElement("span");
    const size = 8 + Math.random() * 10;
    confetti.style.position = "fixed";
    confetti.style.left = `${Math.random() * 100}vw`;
    confetti.style.top = "-18px";
    confetti.style.width = `${size}px`;
    confetti.style.height = `${size * (0.5 + Math.random())}px`;
    confetti.style.background = colors[i % colors.length];
    confetti.style.borderRadius = `${Math.random() > 0.5 ? 999 : 4}px`;
    confetti.style.zIndex = 9999;
    confetti.style.pointerEvents = "none";
    confetti.style.boxShadow = "0 0 18px rgba(255,255,255,0.15)";
    confetti.style.transform = `rotate(${Math.random() * 180}deg)`;
    confetti.style.opacity = "0.95";
    document.body.appendChild(confetti);

    const fallDistance = 100 + Math.random() * 100;
    const drift = (Math.random() - 0.5) * 220;
    const duration = 1800 + Math.random() * 1200;
    const delay = Math.random() * 160;

    confetti.animate(
      [
        { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
        {
          transform: `translate(${drift * 0.4}px, ${fallDistance * 0.5}px) rotate(140deg)`,
          opacity: 1,
        },
        {
          transform: `translate(${drift}px, ${window.innerHeight + 60}px) rotate(320deg)`,
          opacity: 0,
        },
      ],
      {
        duration,
        delay,
        easing: "cubic-bezier(.2,.7,.2,1)",
        fill: "forwards",
      }
    ).onfinish = () => confetti.remove();
  }
}

confettiButton?.addEventListener("click", launchConfetti);
window.addEventListener("load", launchConfetti);