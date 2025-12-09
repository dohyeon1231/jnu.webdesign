// ===============================
// 0. 기본 설정
// ===============================
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

function loadTexture(path) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = path;
    img.onload = () => resolve(img);
  });
}

// ===============================
// 1. EventEmitter & 메시지
// ===============================
class EventEmitter {
  constructor() {
    this.listeners = {};
  }
  on(message, listener) {
    if (!this.listeners[message]) this.listeners[message] = [];
    this.listeners[message].push(listener);
  }
  emit(message, payload) {
    const ls = this.listeners[message];
    if (ls) ls.forEach((l) => l(null, payload));
  }
  clear() {
    this.listeners = {};
  }
}

const Messages = {
  COLLISION_ENEMY_LASER: "COLLISION_ENEMY_LASER",
  COLLISION_ENEMY_HERO: "COLLISION_ENEMY_HERO",
  GAME_END_LOSS: "GAME_END_LOSS",
  GAME_END_WIN: "GAME_END_WIN",
  KEY_EVENT_ENTER: "KEY_EVENT_ENTER"
};

const eventEmitter = new EventEmitter();

// ===============================
// 2. 공용 유틸
// ===============================
class GameObject {
  constructor(x, y, width, height, speed = 0, type = "") {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.dead = false;
    this.type = type;
  }
  rectFromGameObject() {
    return {
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height
    };
  }
}

function intersectRect(r1, r2) {
  return !(
    r2.left > r1.right ||
    r2.right < r1.left ||
    r2.top > r1.bottom ||
    r2.bottom < r1.top
  );
}

// ===============================
// 3. 이미지 변수
// ===============================
let heroImg, heroLeftImg, heroRightImg, heroDamagedImg;
let enemyImg, bossImg;
let laserPlayerImg, laserPlayerChargedImg;
let laserEnemyImg;
let lifeImg, shieldImg;
let meteorBigImg, meteorSmallImg;
let explosionImg;

// ===============================
// 4. 게임 상태 변수
// ===============================
let hero;
let enemies = [];
let heroLasers = [];
let enemyLasers = [];
let items = [];
let meteors = [];
let explosions = [];

let stage = 1;
let enemiesKilled = 0;

let gameLoopId = null;
let gameOver = false;
let winState = false; // 승패 상태 저장

let lastEnemySpawn = 0;
const SPAWN_INTERVAL_STAGE1 = 1200; // ms
const SPAWN_INTERVAL_STAGE2 = 800;

// Meteor(광역 필살기)
let meteorReady = true;
const METEOR_COOLDOWN = 10000;
let lastMeteorTime = 0;

// ChargeShot
const CHARGE_MIN_MS = 600;
let keysDown = {};

// ===============================
// 5. Hero 클래스
// ===============================
class Hero extends GameObject {
  constructor() {
    super(canvas.width / 2 - 32, canvas.height - 120, 64, 64, 6, "Hero");
    this.life = 3;
    this.points = 0;
    this.shieldOn = false;
    this.shieldEndTime = 0;
    this.direction = "none";
    this.charging = false;
    this.chargeStartTime = 0;
    this.isDamaged = false;
    this.damagedEndTime = 0;
  }

  update(now) {
    if (keysDown["ArrowLeft"]) {
      this.x -= this.speed;
      this.direction = "left";
    } else if (keysDown["ArrowRight"]) {
      this.x += this.speed;
      this.direction = "right";
    } else {
      this.direction = "none";
    }

    if (keysDown["ArrowUp"]) this.y -= this.speed;
    if (keysDown["ArrowDown"]) this.y += this.speed;

    if (this.x < 0) this.x = 0;
    if (this.x > canvas.width - this.width)
      this.x = canvas.width - this.width;

    if (this.y < canvas.height / 2) this.y = canvas.height / 2;
    if (this.y > canvas.height - this.height)
      this.y = canvas.height - this.height;

    if (this.shieldOn && now > this.shieldEndTime) {
      this.shieldOn = false;
    }

    if (this.isDamaged && now > this.damagedEndTime) {
      this.isDamaged = false;
    }
  }

  shootNormal() {
    heroLasers.push(new HeroLaser(this.x + this.width / 2 - 4, this.y - 10, false));
  }

  shootCharged() {
    heroLasers.push(new HeroLaser(this.x + this.width / 2 - 6, this.y - 20, true));
  }

  startCharge(now) {
    if (!this.charging) {
      this.charging = true;
      this.chargeStartTime = now;
    }
  }

  releaseCharge(now) {
    if (!this.charging) return;
    const duration = now - this.chargeStartTime;
    this.charging = false;

    if (duration >= CHARGE_MIN_MS) this.shootCharged();
    else this.shootNormal();
  }

  addPoints(amount) {
    this.points += amount;
  }

  takeDamage() {
    if (this.shieldOn) return;
    this.life--;
    this.isDamaged = true;
    this.damagedEndTime = Date.now() + 200;

    if (this.life <= 0) {
      this.dead = true;
      eventEmitter.emit(Messages.GAME_END_LOSS);
    }
  }

  activateShield(durationMs) {
    this.shieldOn = true;
    this.shieldEndTime = Date.now() + durationMs;
  }
}

// ===============================
// Enemy / Boss / Laser / Meteor
// ===============================
class Enemy extends GameObject {
  constructor(x, y, speed, canShoot = false) {
    super(x, y, 48, 48, speed, "Enemy");
    this.canShoot = canShoot;
    this.lastShotTime = 0;
  }

  update(now) {
    this.y += this.speed;
    if (this.y > canvas.height + 50) this.dead = true;

    if (this.canShoot && now - this.lastShotTime > 1500) {
      if (Math.random() < 0.6) {
        enemyLasers.push(new EnemyLaser(this.x + this.width / 2 - 4, this.y + this.height));
      }
      this.lastShotTime = now;
    }
  }
}

class Boss extends GameObject {
  constructor() {
    super(canvas.width / 2 - 80, 60, 160, 160, 0, "Boss");
    this.hp = 30;
    this.lastShotTime = 0;
  }

  update(now) {
    this.x = canvas.width / 2 - 80 + Math.sin(now / 700) * 200;

    if (now - this.lastShotTime > 800) {
      enemyLasers.push(new EnemyLaser(this.x + this.width / 2, this.y + this.height));
      enemyLasers.push(new EnemyLaser(this.x + 30, this.y + this.height));
      enemyLasers.push(new EnemyLaser(this.x + this.width - 30, this.y + this.height));
      this.lastShotTime = now;
    }
  }

  hit(dmg) {
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.dead = true;
      eventEmitter.emit(Messages.GAME_END_WIN);
    }
  }
}

class HeroLaser extends GameObject {
  constructor(x, y, charged) {
    super(x, y, charged ? 14 : 8, charged ? 28 : 20, 10, "HeroLaser");
    this.charged = charged;
  }
  update() {
    this.y -= this.speed;
    if (this.y < -40) this.dead = true;
  }
}

class EnemyLaser extends GameObject {
  constructor(x, y) {
    super(x, y, 8, 20, 6, "EnemyLaser");
  }
  update() {
    this.y += this.speed;
    if (this.y > canvas.height + 20) this.dead = true;
  }
}

class ShieldItem extends GameObject {
  constructor(x, y) {
    super(x, y, 32, 32, 3, "ShieldItem");
  }
  update() {
    this.y += this.speed;
    if (this.y > canvas.height) this.dead = true;
  }
}

class Meteor extends GameObject {
  constructor() {
    super(canvas.width / 2 - 64, -150, 128, 150, 10, "Meteor");
  }
  update() {
    this.y += this.speed;
    if (this.y > canvas.height + 200) this.dead = true;
  }
}

class Explosion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.frame = 0;
    this.dead = false;
  }
  update() {
    this.frame++;
    if (this.frame > 15) this.dead = true;
  }
}

// ===============================
// 7. UI 그리기
// ===============================
function drawText(msg, x, y, color = "white", size = 24, align = "center") {
  ctx.font = `${size}px Arial`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(msg, x, y);
}

function drawPoints() {
  drawText(`Points: ${hero.points}`, 80, canvas.height - 20, "cyan", 20, "left");
}

function drawLife() {
  for (let i = 0; i < hero.life; i++) {
    ctx.drawImage(lifeImg, canvas.width - 150 + i * 45, canvas.height - 50, 40, 40);
  }
}

function drawStage() {
  drawText(`Stage ${stage}`, 60, 40, "yellow", 26, "left");
}

function drawMeteorUI(now) {
  if (meteorReady)
    drawText("Meteor READY (M)", canvas.width / 2, canvas.height - 20, "orange", 20);
  else {
    const remain = METEOR_COOLDOWN - (now - lastMeteorTime);
    drawText(`Meteor CD: ${(remain / 1000).toFixed(1)}s`, canvas.width / 2, canvas.height - 20, "gray", 18);
  }
}

function drawChargeUI(now) {
  if (hero.charging) {
    const barW = 200;
    const ratio = Math.min(1, (now - hero.chargeStartTime) / CHARGE_MIN_MS);
    const x = canvas.width / 2 - barW / 2;
    const y = canvas.height - 60;

    ctx.strokeStyle = "white";
    ctx.strokeRect(x, y, barW, 10);
    ctx.fillStyle = "orange";
    ctx.fillRect(x, y, barW * ratio, 10);
    drawText("Charging...", canvas.width / 2, y - 8, "orange", 16);
  } else {
    drawText("Charge Shot: Hold SPACE", canvas.width / 2, canvas.height - 60, "orange", 16);
  }
}

function drawBossHpBar() {
  const boss = enemies.find((e) => e.type === "Boss");
  if (!boss) return;

  const barW = 300;
  const x = canvas.width / 2 - barW / 2;
  const y = 20;

  ctx.strokeStyle = "white";
  ctx.strokeRect(x, y, barW, 12);

  ctx.fillStyle = "red";
  ctx.fillRect(x, y, barW * (boss.hp / 30), 12);

  drawText("BOSS", canvas.width / 2, y - 5, "red", 16);
}

// ===============================
// 8. 스테이지 / 스폰
// ===============================
function spawnEnemy(now) {
  if (stage === 3) return;

  const interval = stage === 1 ? SPAWN_INTERVAL_STAGE1 : SPAWN_INTERVAL_STAGE2;
  if (now - lastEnemySpawn < interval) return;

  lastEnemySpawn = now;
  const x = Math.random() * (canvas.width - 48);

  if (stage === 1) enemies.push(new Enemy(x, -60, 3, false));
  else if (stage === 2) enemies.push(new Enemy(x, -60, 4, Math.random() < 0.5));
}

function maybeSpawnShieldItem() {
  if (Math.random() < 0.003) {
    const x = Math.random() * (canvas.width - 32);
    items.push(new ShieldItem(x, -40));
  }
}

function checkStageUpgrade() {
  if (stage === 1 && enemiesKilled >= 3) stage = 2;
  else if (stage === 2 && enemiesKilled >= 5) {
    stage = 3;
    enemies = [];
    enemies.push(new Boss());
  }
}


// ===============================
// 9. Meteor / Charge / 입력 처리
// ===============================
function useMeteor(now) {
  if (!meteorReady) return;
  meteorReady = false;
  lastMeteorTime = now;
  meteors.push(new Meteor());
}

document.addEventListener("keydown", (e) => {
  keysDown[e.key] = true;
  if (!hero) return;

  const now = Date.now();
  if (e.key === " ") hero.startCharge(now);
});

document.addEventListener("keyup", (e) => {
  keysDown[e.key] = false;
  if (!hero) return;

  const now = Date.now();
  if (e.key === " ") hero.releaseCharge(now);
  else if (e.key === "m" || e.key === "M") useMeteor(now);
  else if (e.key === "Enter") eventEmitter.emit(Messages.KEY_EVENT_ENTER);
});

// ===============================
// 10. 업데이트 & 충돌
// ===============================
function updateGameObjects(now) {
  if (gameOver) return;

  spawnEnemy(now);
  maybeSpawnShieldItem();
  checkStageUpgrade();
  hero.update(now);

  enemies.forEach((e) => e.update(now));
  heroLasers.forEach((l) => l.update());
  enemyLasers.forEach((l) => l.update());
  items.forEach((i) => i.update());
  meteors.forEach((m) => m.update());
  explosions.forEach((ex) => ex.update());

  if (!meteorReady && now - lastMeteorTime >= METEOR_COOLDOWN)
    meteorReady = true;

  // Hero 레이저 → 적 / 보스
  enemies.forEach((enemy) => {
    heroLasers.forEach((laser) => {
      if (enemy.dead || laser.dead) return;
      if (!intersectRect(enemy.rectFromGameObject(), laser.rectFromGameObject())) return;

      laser.dead = true;
      const dmg = laser.charged ? 3 : 1;

      if (enemy.type === "Boss") enemy.hit(dmg);
      else {
        enemy.dead = true;
        enemiesKilled++;
      }

      explosions.push(new Explosion(enemy.x, enemy.y));
      hero.addPoints(laser.charged ? 200 : 100);
    });
  });

  // Enemy 레이저 → Hero
  enemyLasers.forEach((laser) => {
    if (laser.dead || hero.dead) return;
    if (intersectRect(hero.rectFromGameObject(), laser.rectFromGameObject())) {
      laser.dead = true;
      hero.takeDamage();
      explosions.push(new Explosion(hero.x, hero.y));
    }
  });

  // 적 충돌 → Hero
  enemies.forEach((enemy) => {
    if (enemy.dead || hero.dead) return;
    if (intersectRect(hero.rectFromGameObject(), enemy.rectFromGameObject())) {
      enemy.dead = true;
      hero.takeDamage();
      explosions.push(new Explosion(enemy.x, enemy.y));
    }
  });

  // 아이템 → Hero
  items.forEach((item) => {
    if (item.dead) return;
    if (intersectRect(hero.rectFromGameObject(), item.rectFromGameObject())) {
      item.dead = true;
      hero.activateShield(5000);
    }
  });

  // Meteor 충돌
  meteors.forEach((meteor) => {
    enemies.forEach((enemy) => {
      if (enemy.dead) return;
      if (intersectRect(meteor.rectFromGameObject(), enemy.rectFromGameObject())) {
        if (enemy.type === "Boss") enemy.hit(5);
        else {
          enemy.dead = true;
          enemiesKilled++;
        }
        explosions.push(new Explosion(enemy.x, enemy.y));
      }
    });

    enemyLasers.forEach((laser) => {
      if (!laser.dead && intersectRect(meteor.rectFromGameObject(), laser.rectFromGameObject()))
        laser.dead = true;
    });
  });

  // dead 제거
  enemies = enemies.filter((e) => !e.dead);
  heroLasers = heroLasers.filter((e) => !e.dead);
  enemyLasers = enemyLasers.filter((e) => !e.dead);
  items = items.filter((e) => !e.dead);
  meteors = meteors.filter((e) => !e.dead);
  explosions = explosions.filter((e) => !e.dead);
}

// ===============================
// 11. 화면 그리기
// ===============================
function drawGame(now) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  meteors.forEach((m) => ctx.drawImage(meteorBigImg, m.x, m.y, m.width, m.height));

  let heroSprite = heroImg;
  if (hero.isDamaged) heroSprite = heroDamagedImg;
  else if (hero.direction === "left") heroSprite = heroLeftImg;
  else if (hero.direction === "right") heroSprite = heroRightImg;

  ctx.drawImage(heroSprite, hero.x, hero.y, hero.width, hero.height);

  if (hero.shieldOn) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.drawImage(shieldImg, hero.x - 10, hero.y - 10, hero.width + 20, hero.height + 20);
    ctx.restore();
  }

  enemies.forEach((e) => {
    const sprite = e.type === "Boss" ? bossImg : enemyImg;
    ctx.drawImage(sprite, e.x, e.y, e.width, e.height);
  });

  heroLasers.forEach((l) =>
    ctx.drawImage(l.charged ? laserPlayerChargedImg : laserPlayerImg, l.x, l.y, l.width, l.height)
  );

  enemyLasers.forEach((l) =>
    ctx.drawImage(laserEnemyImg, l.x, l.y, l.width, l.height)
  );

  items.forEach((i) => ctx.drawImage(shieldImg, i.x, i.y, i.width, i.height));

  explosions.forEach((ex) =>
    ctx.drawImage(explosionImg, ex.x, ex.y, 64, 64)
  );

  drawStage();
  drawPoints();
  drawLife();
  drawMeteorUI(now);
  drawChargeUI(now);
  drawBossHpBar();

  // ★★★ 게임 종료 메시지 표시 ★★★
  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const msg = winState
      ? "Victory!!! Press [Enter] to start a new game Captain Pew Pew"
      : "You died !!! Press [Enter] to start a new game Captain Pew Pew";

    drawText(msg, canvas.width / 2, canvas.height / 2, winState ? "green" : "red", 26);
    return;
  }
}

// ===============================
// 12. 게임 종료 / 재시작
// ===============================
function endGame(win) {
  gameOver = true;
  winState = win;
}

function resetGame() {
  gameOver = false;
  winState = false;

  enemies = [];
  heroLasers = [];
  enemyLasers = [];
  items = [];
  meteors = [];
  explosions = [];

  stage = 1;
  enemiesKilled = 0;
  lastEnemySpawn = 0;

  meteorReady = true;
  lastMeteorTime = 0;

  hero = new Hero();

  eventEmitter.clear();
  eventEmitter.on(Messages.GAME_END_WIN, () => endGame(true));
  eventEmitter.on(Messages.GAME_END_LOSS, () => endGame(false));
}

eventEmitter.on(Messages.KEY_EVENT_ENTER, () => {
  if (gameOver) resetGame();
});

// ===============================
// 13. 게임 루프
// ===============================
function gameLoop() {
  const now = Date.now();
  updateGameObjects(now);
  drawGame(now);
}

function startGameLoop() {
  if (gameLoopId) clearInterval(gameLoopId);
  gameLoopId = setInterval(gameLoop, 1000 / 60);
}

// ===============================
// 14. 시작
// ===============================
(async function () {
  heroImg = await loadTexture("assets/player.png");
  heroLeftImg = await loadTexture("assets/playerLeft.png");
  heroRightImg = await loadTexture("assets/playerRight.png");
  heroDamagedImg = await loadTexture("assets/playerDamaged.png");

  enemyImg = await loadTexture("assets/enemyShip.png");
  bossImg = await loadTexture("assets/enemyUFO.png");

  laserPlayerImg = await loadTexture("assets/laserRed.png");
  laserPlayerChargedImg = await loadTexture("assets/laserRedShot.png");

  laserEnemyImg = await loadTexture("assets/laserGreen.png");

  lifeImg = await loadTexture("assets/life.png");
  shieldImg = await loadTexture("assets/shield.png");

  meteorBigImg = await loadTexture("assets/meteorBig.png");
  meteorSmallImg = await loadTexture("assets/meteorSmall.png");

  explosionImg = await loadTexture("assets/explosion.png");

  resetGame();
  startGameLoop();
})();
