// ============================================================
//  JUMP IN THE WORLD — game.js
// ============================================================

// ──────────────────────────────────────────────
//  1. VARIABLES GLOBALES
// ──────────────────────────────────────────────

let canvas, ctx;
let W, H;
let GROUND_Y;

let state     = "idle";
let score     = 0;
let best      = 0;
let gameSpeed = 4;

let bgOffset = 0;

let currentWorld = "egypt";


// ──────────────────────────────────────────────
//  2. PHYSIQUE
// ──────────────────────────────────────────────

const GRAVITY    =  0.7;
const JUMP_FORCE = -15;
const SCALE_PLAYER   = 1.5;   // taille du joueur
const SCALE_OBSTACLE = 1.2;   // taille des obstacles


// ──────────────────────────────────────────────
//  3. JOUEUR
// ──────────────────────────────────────────────

const player = {
  x: 80,
  y: 0,
  vy: 0,
  w: 65 * SCALE_PLAYER,
  h: 65 * SCALE_PLAYER,
  onGround: true,
  ducking: false,
  duckKeyHeld: false,
  doubleJumpUsed: false,
  spriteFrame: 0,
};

const playerImgs = {
  sheet: new Image(),
  duck:  new Image(),
  sad:   new Image(),
};

const SPRITE_FRAMES = 8;
const PLAYER_OFFSET_Y = 15;  // ← augmente pour descendre, 0 = pas de décalage


// ──────────────────────────────────────────────
//  4. OBSTACLES
// ──────────────────────────────────────────────

let obstacles    = [];
let nextObstacle = 80;

const obstacleImgs = {};


// ──────────────────────────────────────────────
//  5. FOND D'ÉCRAN
// ──────────────────────────────────────────────

const bgImgs = {};


// ──────────────────────────────────────────────
//  6. CONFIG PAR MONDE
// ──────────────────────────────────────────────

const WORLD_CONFIG = {
  egypt: {
    label:    "Ancient Egypt",
    bgColor:  "#c8a050",
    accentColor: "#f0a500",
    bgImages: ["images/egypt/bg_egypt_game.png", "images/egypt/bg_egypt_game_1.jpg"],
    playerImgs: {
      sheet: "images/egypt/chat_animation.png",
      duck:  "images/egypt/chat_baisse.png",
    },
    obstacleImgs: {
      ground: [
        { src: "images/egypt/obstacles/parchment.png", w: 40, h: 50,  offsetY: 5  },
        { src: "images/egypt/obstacles/amphora.png",   w: 40, h: 50,  offsetY: 5  },
        { src: "images/egypt/obstacles/column.png",    w: 40, h: 100              },
        { src: "images/egypt/obstacles/sphynx.png",    w: 110, h: 80, offsetY: 30 },
      ],
      flying: [
        { src: "images/egypt/obstacles/bird.png", w: 60, h: 60 },
      ],
    },
  },
  farwest: {
    label:    "Far West",
    bgColor:  "#8b5e3c",
    accentColor: "#c0392b",
    bgImages: ["images/farwest/bg_farwest_game.png"],
    playerImgs: {
      sheet: "images/farwest/chat_animation.png",
      duck:  "images/farwest/chat_baisse.png",
    },
    obstacleImgs: {
      ground: [
        { src: "images/farwest/obstacle_cactus.png", w: 40, h: 80 },
        { src: "images/farwest/obstacle_barrel.png", w: 50, h: 50 },
      ],
      flying: [
        { src: "images/farwest/obstacle_bird.png", w: 60, h: 40 },
      ],
    },
  },
  space: {
    label:    "Space",
    bgColor:  "#0a0a1f",
    accentColor: "#7f8fff",
    bgImages: ["images/space/bg_space_game.jpg"],
    playerImgs: {
      sheet: "images/space/chat_animation.png",
      duck:  "images/space/chat_baisse.png",
    },
    obstacleImgs: {
      ground: [
        { src: "images/space/obstacle_rock.png", w: 50, h: 50 },
      ],
      flying: [
        { src: "images/space/obstacle_satellite.png", w: 60, h: 40 },
        { src: "images/space/obstacle_alien.png",     w: 50, h: 50 },
      ],
    },
  },
  sea: {
    label:    "Deep Sea",
    bgColor:  "#003366",
    accentColor: "#00ccff",
    bgImages: ["images/sea/bg_sea_game.jpg", "images/sea/bg_sea_game_1.jpg"],
    // 1. Une seule image (la sprite sheet) au lieu d'un tableau
    playerImgs: {
      sheet: "images/sea/chara/aqualis.png", 
      sad:  "images/sea/chara/aqualis_triste.png" // Même si tu n'en as pas, on met la même pour éviter les erreurs
    },
    // 2. Les dimensions d'UNE SEULE image de l'animation (ex: 48x48 pixels)
    frameW: 239, 
    frameH: 149, 
    
    // 3. Le nombre total d'images dans ton animation (ex: 8 frames)
    frameCount: 7, 
    
    // 4. La vitesse de l'animation (plus le chiffre est bas, plus c'est rapide)
    animationSpeed: 130, 
    
    // Tes obstacles restent les mêmes
    obstacleImgs: {
ground: [
        { src: "images/sea/obstacles/etoile.png",     w: 45, h: 45 },
        { src: "images/sea/obstacles/hippo.png", w: 50, h: 50 },
        { src: "images/sea/obstacles/meduse.png",    w: 35, h: 50 },
        { src: "images/sea/obstacles/perle.png",     w: 50, h: 50 },
        { src: "images/sea/obstacles/pieuvre.png",     w: 60, h: 60 }
      ],
flying:  [],
    },
  },
};


// ──────────────────────────────────────────────
//  7. CHARGEMENT DES IMAGES
// ──────────────────────────────────────────────

function loadImages() {
  for (const world in WORLD_CONFIG) {
    const cfg = WORLD_CONFIG[world];

    bgImgs[world] = cfg.bgImages.map(src => {
      const img = new Image(); img.src = src; return img;
    });

    if (!obstacleImgs[world]) obstacleImgs[world] = { ground: [], flying: [] };
    obstacleImgs[world].ground = cfg.obstacleImgs.ground.map(obj => {
      const img = new Image();
      img.src = typeof obj === "string" ? obj : obj.src;
      return img;
    });
    obstacleImgs[world].flying = cfg.obstacleImgs.flying.map(obj => {
      const img = new Image();
      img.src = typeof obj === "string" ? obj : obj.src;
      return img;
    });
  }
}

function loadPlayerImgs() {
  const cfg = WORLD_CONFIG[currentWorld];
    playerImgs.sheet.onload = function() {
    console.log("spritesheet width:", playerImgs.sheet.naturalWidth);
    console.log("frameW:", playerImgs.sheet.naturalWidth / SPRITE_FRAMES);
  };
  playerImgs.sheet.src = cfg.playerImgs.sheet;
  playerImgs.duck.src  = cfg.playerImgs.duck;
  if (currentWorld === "sea" || currentWorld === "space") {
    playerImgs.sad.src = "images/sea/chara/aqualis_triste.png";
  }
}


// ──────────────────────────────────────────────
//  8. INITIALISATION
// ──────────────────────────────────────────────

window.onload = function () {
  canvas   = document.getElementById("game");
  ctx      = canvas.getContext("2d");
  W        = canvas.width;
  H        = canvas.height;
  GROUND_Y = H - 10;

  player.y = GROUND_Y - player.h;

  loadImages();
  loadPlayerImgs();

  setInterval(animatePlayer, 100);

  setupInput();

  requestAnimationFrame(update);
};


// ──────────────────────────────────────────────
//  9. DÉMARRER / RELANCER
// ──────────────────────────────────────────────

function startGame() {
  state        = "running";
  score        = 0;
  gameSpeed    = 4;
  bgOffset     = 0;
  obstacles    = [];
  nextObstacle = 80;

  player.y              = GROUND_Y - player.h;
  player.vy             = 0;
  player.onGround       = true;
  player.ducking        = false;
  player.duckKeyHeld    = false;
  player.doubleJumpUsed = false;
  player.w              = 65 * SCALE_PLAYER;
  player.h              = 65 * SCALE_PLAYER;

  loadPlayerImgs();
}


// ──────────────────────────────────────────────
//  10. BOUCLE PRINCIPALE — update()
// ──────────────────────────────────────────────

function update() {
  if (state === "running") {

    bgOffset  += gameSpeed * 0.5;
    gameSpeed  = 4 + Math.floor(score / 30) * 0.5;
   // --- PHYSIQUE JOUEUR ---
if (currentWorld === "sea"|| currentWorld === "space") {
    // 1. COMPORTEMENT POUR LE MONDE "SEA"
    player.y += player.vy;

    // On remet la vitesse à 0 immédiatement pour un contrôle total (pas de descente auto)
    player.vy = 0; 

    // Limites pour ne pas sortir de l'écran (Haut et Bas)
    if (player.y < -20) { player.y = -20; player.vy = 0; }
    if (player.y > H - player.h-15) { player.y = H - player.h-15; player.vy = 0; }
    

  } else {

    if (!player.ducking) {
      player.vy += GRAVITY;
      player.y  += player.vy;

      if (player.y >= GROUND_Y - player.h) {
        player.y  = GROUND_Y - player.h;
        player.vy = 0;
        if (!player.onGround) {
          player.onGround       = true;
          player.doubleJumpUsed = false;
          if (player.duckKeyHeld) applyDuck();
        }
      } else {
        player.onGround = false;
      }
    }
  }
    nextObstacle--;
    if (nextObstacle <= 0) {
      addObstacle();
      const gap    = Math.max(50, 100 - gameSpeed * 5);
      nextObstacle = Math.floor(gap + Math.random() * 70);
    }

    obstacles.forEach(obs => {
      obs.x -= gameSpeed;
      if (checkCollision(obs)) gameOver();
      if (!obs.scored && obs.x + obs.w < player.x) {
        obs.scored = true;
        score += 5;
      }
    });

    obstacles = obstacles.filter(o => o.x > -120);

    updateHUD();
  }

  draw();
  requestAnimationFrame(update);
}


// ──────────────────────────────────────────────
//  11. DESSIN — draw()
// ──────────────────────────────────────────────

function draw() {
  drawBackground();
  drawGround();
  obstacles.forEach(obs => drawObstacle(obs));
  if (state !== "idle") drawPlayer();
  drawOverlay();
}


// ──────────────────────────────────────────────
//  12. FOND D'ÉCRAN DÉFILANT
// ──────────────────────────────────────────────

function drawBackground() {
  const cfg  = WORLD_CONFIG[currentWorld];
  const imgs = bgImgs[currentWorld];

  const img0 = imgs[0];
  const img1 = imgs[1] || imgs[0];

  const imageOk = (img) => img && img.complete && img.naturalWidth > 0;

  if (imageOk(img0)) {
    const offset = bgOffset % (W * 2);
    ctx.drawImage(imageOk(img0) ? img0 : null, -offset,         0, W, H);
    ctx.drawImage(imageOk(img1) ? img1 : img0,  W - offset,     0, W, H);
    ctx.drawImage(imageOk(img0) ? img0 : null,  W * 2 - offset, 0, W, H);
    ctx.drawImage(imageOk(img1) ? img1 : img0,  W * 3 - offset, 0, W, H);
  } else {
    ctx.fillStyle = cfg.bgColor;
    ctx.fillRect(0, 0, W, H);
  }
}


// ──────────────────────────────────────────────
//  13. SOL
// ──────────────────────────────────────────────

function drawGround() {
  if (currentWorld === "space" || currentWorld === "sea") return;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, GROUND_Y, W, 1);
}


// ──────────────────────────────────────────────
//  14. OBSTACLES
// ──────────────────────────────────────────────

function addObstacle() {
  const cfg = WORLD_CONFIG[currentWorld];
  const isFlyingWorld = (currentWorld === "sea" || currentWorld === "space");

  if (isFlyingWorld) {
    // --- TA LOGIQUE SIMPLIFIÉE (Un seul type d'obstacle) ---
    const variants = cfg.obstacleImgs.ground; // On regarde uniquement ground
    const idx      = Math.floor(Math.random() * variants.length);
    const variant  = variants[idx];
    
    // On récupère l'image correspondante dans le cache
    const img = obstacleImgs[currentWorld].ground[idx];

    const w = (variant.w || 40) * SCALE_OBSTACLE;
    const h = (variant.h || 50) * SCALE_OBSTACLE;
    
    // Hauteur aléatoire (ton système de flottaison)
    const y = Math.random() * (H - h - 60) + 30;

    obstacles.push({ x: W + 20, y, w, h, img, scored: false, speedMult: 1.1 });
  } else {
    const flying = cfg.obstacleImgs.flying.length > 0 && Math.random() < 0.3;
    
    if (flying) {
      const pool = obstacleImgs[currentWorld].flying;
      const img  = pool[Math.floor(Math.random() * pool.length)] || null;
      const w    = 60 * SCALE_OBSTACLE;
      const h    = 45 * SCALE_OBSTACLE;
      const y    = GROUND_Y - 65 * SCALE_PLAYER - 5; 
      obstacles.push({ x: W + 20, y, w, h, img, scored: false, speedMult: 1.2 });

    } else {
      const variants = cfg.obstacleImgs.ground;
      const idx      = Math.floor(Math.random() * variants.length);
      const variant  = variants[idx];
      const img      = obstacleImgs[currentWorld].ground[idx];
      const w        = (variant.w || 40) * SCALE_OBSTACLE;
      const h        = (variant.h || 50) * SCALE_OBSTACLE;
      const offsetY  = variant.offsetY || 0;
      const y        = GROUND_Y - h + offsetY;
      obstacles.push({ x: W + 20, y, w, h, img, scored: false, speedMult: 1 });
    }
  }
}

function drawObstacle(obs) {
  const imageOk = obs.img && obs.img.complete && obs.img.naturalWidth > 0;
  if (imageOk) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(obs.img, obs.x, obs.y, obs.w, obs.h);
  } else {
    ctx.fillStyle = WORLD_CONFIG[currentWorld].accentColor;
    ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
  }
}


// ──────────────────────────────────────────────
//  15. JOUEUR
// ──────────────────────────────────────────────

function animatePlayer() {
  if (state === "running" && player.onGround && !player.ducking)
    player.spriteFrame = (player.spriteFrame + 1) % SPRITE_FRAMES;
}

function drawPlayer() {
  const p = player;
  const cfg = WORLD_CONFIG[currentWorld];
  const PLAYER_OFFSET_Y = 15;
  ctx.imageSmoothingEnabled = false;

  const isAquaWorld = (currentWorld === "sea" );

  // 1. SI MORT (AQUALIS TRISTE)
  if (state === "dead" && isAquaWorld) {
    const imgSad = playerImgs.sad;
    if (imgSad && imgSad.complete && imgSad.naturalWidth > 0) {
      ctx.drawImage(imgSad, p.x, p.y + PLAYER_OFFSET_Y, p.w, p.h);
      return; 
    }
  }

  // 2. RÉCUPÉRATION DE LA LARGEUR DE FRAME
  const currentFrameW = cfg.frameW || 205;

  // 3. GESTION DES DIFFÉRENTS ÉTATS
  
  // Si on est dans l'eau : ON IGNORE LE DUCK ET LE SAUT
  if (isAquaWorld) {
    const img = playerImgs.sheet;
    if (img && img.complete && img.naturalWidth > 0) {
      // Animation de nage rapide
      const frameIndex = Math.floor(Date.now() / (cfg.animationSpeed || 70)) % (cfg.frameCount || 8);
      const srcX = frameIndex * currentFrameW;

      ctx.save();
      ctx.beginPath();
      ctx.rect(p.x, p.y + PLAYER_OFFSET_Y, p.w, p.h);
      ctx.clip();
      ctx.drawImage(img, srcX, 0, currentFrameW, img.naturalHeight, p.x, p.y + PLAYER_OFFSET_Y, p.w, p.h);
      ctx.restore();
    }
  } 
  // Sinon : LOGIQUE POUR LE CHAT (Duck et Saut inclus)
  else {
    if (p.ducking) {
      const img = playerImgs.duck;
      if (img.complete) ctx.drawImage(img, p.x, p.y + PLAYER_OFFSET_Y, p.w, p.h);
    } 
    else if (!p.onGround) {
      const img = playerImgs.sheet;
      ctx.save();
      ctx.beginPath();
      ctx.rect(p.x, p.y + PLAYER_OFFSET_Y, p.w, p.h);
      ctx.clip();
      ctx.drawImage(img, 2 * currentFrameW, 0, currentFrameW, img.naturalHeight, p.x, p.y + PLAYER_OFFSET_Y, p.w, p.h);
      ctx.restore();
    } 
    else {
      const img = playerImgs.sheet;
      const srcX = Math.floor(p.spriteFrame * currentFrameW);
      ctx.save();
      ctx.beginPath();
      ctx.rect(p.x, p.y + PLAYER_OFFSET_Y, p.w, p.h);
      ctx.clip();
      ctx.drawImage(img, srcX, 0, currentFrameW, img.naturalHeight, p.x, p.y + PLAYER_OFFSET_Y, p.w, p.h);
      ctx.restore();
    }
  }
}

// ──────────────────────────────────────────────
//  16. SAUT / ACCROUPI
// ──────────────────────────────────────────────

function doJump() {
  if (state === "idle" || state === "dead") { startGame(); return; }
if (currentWorld === "sea"|| currentWorld === "space") {
    player.vy = -7; // Vitesse vers le haut
  } else {
    if (player.onGround) {
      player.vy             = JUMP_FORCE;
      player.onGround       = false;
      player.doubleJumpUsed = false;
    } else if (!player.doubleJumpUsed) {
      player.vy             = JUMP_FORCE * 0.85;
      player.doubleJumpUsed = true;
    }
  }
}
function doDuckStart() {
if (state !== "running") return;
  if (currentWorld === "sea"|| currentWorld === "space") {
    player.vy = 7; // Vitesse vers le bas
  } else {
    player.duckKeyHeld = true;
    if (player.onGround) applyDuck();
  }
}

function doDuckEnd() {
  player.duckKeyHeld = false;
  if (player.ducking) removeDuck();
}

function applyDuck() {
  if (!player.ducking) {
    player.ducking = true;
    player.h = 30 * SCALE_PLAYER;
    player.y = GROUND_Y - player.h;
  }
}

function removeDuck() {
  player.ducking = false;
  player.h = 65 * SCALE_PLAYER;
  player.y = GROUND_Y - player.h;
}


// ──────────────────────────────────────────────
//  17. COLLISION
// ──────────────────────────────────────────────

function checkCollision(obs) {
  const p = player;
  const OFFSET = 15; 
  
  // On crée une position virtuelle pour la collision qui correspond au dessin
  const playerVisualY = p.y + OFFSET;

  // On réduit aussi un peu la hitbox des obstacles pour être plus permissif (le padding)
  const padding = 8; 

  return (
    p.x + padding < obs.x + obs.w - padding &&
    p.x + p.w - padding > obs.x + padding &&
    playerVisualY + padding < obs.y + obs.h - padding && // On utilise la position VISUELLE
    playerVisualY + p.h - padding > obs.y + padding    // On utilise la position VISUELLE
  );
}


// ──────────────────────────────────────────────
//  18. GAME OVER
// ──────────────────────────────────────────────

function gameOver() {
  state = "dead";
  if (score > best) {
    best = score;
    if (document.getElementById("best"))
      document.getElementById("best").textContent = Math.floor(best);
  }
}


// ──────────────────────────────────────────────
//  19. OVERLAY
// ──────────────────────────────────────────────

function drawOverlay() {
  const cfg = WORLD_CONFIG[currentWorld];
  ctx.textAlign = "center";

  if (state === "idle") {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = cfg.accentColor;
    ctx.font = '10px "Press Start 2P"';
    ctx.fillText("APPUIE SUR ↑ OU ESPACE POUR JOUER", W / 2, H / 2);
    ctx.fillStyle = "#888";
    ctx.font = '7px "Press Start 2P"';
    ctx.fillText("↑  SAUTER   ↑↑  DOUBLE SAUT   ↓  S'ACCROUPIR", W / 2, H / 2 + 22);
  }

  if (state === "dead") {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#ff5555";
    ctx.font = '16px "Press Start 2P"';
    ctx.fillText("GAME OVER", W / 2, H / 2 - 18);
    ctx.fillStyle = "#aaa";
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText("SCORE : " + Math.floor(score), W / 2, H / 2 + 6);
    ctx.fillStyle = cfg.accentColor;
    ctx.font = '9px "Press Start 2P"';
    ctx.fillText("↑ OU ESPACE POUR REJOUER", W / 2, H / 2 + 28);
  }

  ctx.textAlign = "left";
}


// ──────────────────────────────────────────────
//  20. HUD HTML
// ──────────────────────────────────────────────

function updateHUD() {
  const el = id => document.getElementById(id);
  if (el("score")) el("score").textContent = Math.floor(score);
  if (el("speed")) el("speed").textContent = gameSpeed.toFixed(1) + "x";
}


// ──────────────────────────────────────────────
//  21. INPUTS CLAVIER & MOBILE
// ──────────────────────────────────────────────

function setupInput() {
  document.addEventListener("keydown", e => {
    if (e.code === "ArrowUp" || e.code === "Space") { e.preventDefault(); doJump(); }
    if (e.code === "ArrowDown")                     { e.preventDefault(); doDuckStart(); }
  });
  document.addEventListener("keyup", e => {
    if (e.code === "ArrowDown") doDuckEnd();
  });

  const btnJump = document.getElementById("btn-jump");
  const btnDuck = document.getElementById("btn-duck");
  if (btnJump) btnJump.addEventListener("touchstart", e => { e.preventDefault(); doJump(); }, { passive: false });
  if (btnDuck) {
    btnDuck.addEventListener("touchstart", e => { e.preventDefault(); doDuckStart(); }, { passive: false });
    btnDuck.addEventListener("touchend",   e => { e.preventDefault(); doDuckEnd(); },   { passive: false });
  }
}


// ──────────────────────────────────────────────
//  22. RÉCUPÉRATION DU MONDE DEPUIS L'URL
// ──────────────────────────────────────────────

(function () {
  const params = new URLSearchParams(window.location.search);
  const world  = params.get("world") || "egypt";

  document.addEventListener("DOMContentLoaded", function () {
    const labelEl = document.getElementById("world-label");
    if (labelEl && typeof WORLD_CONFIG !== "undefined")
      labelEl.textContent = WORLD_CONFIG[world]?.label || world;
  });

  window.addEventListener("load", function () {
    if (typeof currentWorld !== "undefined") currentWorld = world;
    const labelEl = document.getElementById("world-label");
    if (labelEl && typeof WORLD_CONFIG !== "undefined")
      labelEl.textContent = WORLD_CONFIG[world]?.label || world;
  });
})();