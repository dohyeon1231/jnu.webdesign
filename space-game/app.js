// ===============================
// 기본 설정
// ===============================
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

let gameState = "title"; // "title" → "playing" → "gameover"
let audioUnlocked = false;

// 오디오 언락
function unlockAudio() {
  if (!audioUnlocked) {
    document.getElementById("snd-laser").play().catch(() => {});
    audioUnlocked = true;
  }
}

// 이미지 로드 함수
function loadTexture(path) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = path;
    img.onload = () => resolve(img);
  });
}

// ===============================
// 리소스 로드
// ===============================
let heroImg, enemyImg, bossImg;
let laserRedImg, laserGreenImg;
let explosionImg;
let bgImg;

Promise.all([
  loadTexture("assets/player.png"),
  loadTexture("assets/enemyShip.png"),
  loadTexture("assets/enemyUFO.png"),
  loadTexture("assets/laserRed.png"),
  loadTexture("assets/laserGreen.png"),
  loadTexture("assets/explosion.png"),
  loadTexture("assets/space_bg.png"),
]).then((imgs) => {
  [heroImg, enemyImg, bossImg, laserRedImg, laserGreenImg, explosionImg, bgImg] = imgs;
  loop();
});

// ===============================
// 게임 오브젝트
// ===============================
let hero = {
  x: canvas.width / 2 - 32,
  y: canvas.height - 100,
  width: 64,
  height: 64,
  speed: 6,
  hp: 3,
};

let enemies = [];
let lasersHero = [];
let lasersEnemy = [];
let explosions = [];

let bossMode = false;
let bossObject = null;

const BG_SCROLL_SPEED = 1;
let bgY = 0;

// ===============================
// 입력 처리
// ===============================
let keys = {};

document.addEventListener("keydown", (e) => {
  unlockAudio();
  keys[e.key] = true;

  if (gameState === "title" && e.key === "Enter") startGame();

  if (e.key === " " && gameState === "playing") {
    lasersHero.push(new HeroLaser(hero.x + 28, hero.y));
    let s = document.getElementById("snd-laser");
    s.currentTime = 0;
    s.play();
  }

  if (gameState === "gameover" && e.key === "Enter") startGame();
});

document.addEventListener("keyup", (e) => (keys[e.key] = false));

document.getElementById("btn-start").addEventListener("click", () => {
  unlockAudio();
  startGame();
});

// ===============================
// 게임 시작
// ===============================
function startGame() {
  gameState = "playing";
  document.getElementById("title-screen").style.display = "none";
  canvas.style.display = "block";
  document.getElementById("ui-life").style.display = "block";
  document.getElementById("stage-text").style.display = "block";

  hero.hp = 3;
  updateHPUI();

  bossMode = false;
  bossObject = null;

  enemies = [];
  lasersHero = [];
  lasersEnemy = [];
  explosions = [];

  spawnEnemiesStage1();
}

// ===============================
// 레이저 클래스
// ===============================
class HeroLaser {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 8;
    this.height = 20;
    this.speed = 10;
    this.dead = false;
  }
}

class EnemyLaser {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 6;
    this.height = 16;
    this.speed = 5;
    this.dead = false;
  }
}

// ===============================
// 적 스폰
// ===============================
function spawnEnemiesStage1() {
  for (let i = 0; i < 10; i++) {
    enemies.push({
      x: Math.random() * 900 + 40,
      y: Math.random() * -800 - 50,
      width: 48,
      height: 48,
      speed: 2,
      dead: false
    });
  }
}

// ===============================
// 충돌 검사
// ===============================
function isCollide(a, b) {
  return !(
    a.x + a.width < b.x ||
    a.x > b.x + b.width ||
    a.y + a.height < b.y ||
    a.y > b.y + b.height
  );
}

// ===============================
// 배경 스크롤
// ===============================
function drawBackground() {
  const pattern = ctx.createPattern(bgImg, "repeat");
  ctx.save();

  ctx.translate(0, bgY);
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.restore();

  bgY += BG_SCROLL_SPEED;
  if (bgY >= canvas.height) bgY = 0;
}

// ===============================
// HP UI 업데이트
// ===============================
function updateHPUI() {
  for (let i = 1; i <= 3; i++) {
    document.getElementById(`life${i}`).style.opacity = i <= hero.hp ? 1 : 0.2;
  }
}

// ===============================
// 보스 스폰
// ===============================
function spawnBoss() {
  bossMode = true;
  document.getElementById("boss-hp-wrapper").style.display = "block";

  bossObject = {
    x: canvas.width / 2 - 80,
    y: 80,
    width: 160,
    height: 160,
    hp: 40,     // ★ 보스 체력
    maxHp: 40   // ★ 최대 체력 추가
  };

  document.getElementById("snd-boss").play();
}

// ===============================
// 게임 업데이트
// ===============================
function update() {
  if (gameState !== "playing") return;

  // 플레이어 이동
  if (keys["ArrowLeft"]) hero.x -= hero.speed;
  if (keys["ArrowRight"]) hero.x += hero.speed;
  if (keys["ArrowUp"]) hero.y -= hero.speed;
  if (keys["ArrowDown"]) hero.y += hero.speed;

  hero.x = Math.max(0, Math.min(hero.x, canvas.width - hero.width));
  hero.y = Math.max(0, Math.min(hero.y, canvas.height - hero.height));

  // 적 이동 + 충돌 처리
  enemies.forEach((e) => {
    e.y += e.speed;

    // 히어로 레이저가 일반 적에게 닿는 처리
    lasersHero.forEach((l) => {
      if (!l.dead && !e.dead && isCollide(l, e)) {
        e.dead = true;
        l.dead = true;
        explosions.push({ x: e.x, y: e.y, frame: 0 });

        let ex = document.getElementById("snd-explosion");
        ex.currentTime = 0;
        ex.play();
      }
    });

    // 히어로와 충돌
    if (!e.dead && isCollide(hero, e)) {
      hero.hp--;
      updateHPUI();

      document.getElementById("snd-hit").play();
      e.dead = true;

      if (hero.hp <= 0) return gameOver(false);
    }

    if (e.y > canvas.height) e.dead = true;
  });

  // 보스로 넘어가기
  if (!bossMode && enemies.every((e) => e.dead)) {
    spawnBoss();
  }

  // 보스 이동 + 공격
  if (bossMode && bossObject) {
    bossObject.x += Math.sin(Date.now() / 500) * 2;

    if (Math.random() < 0.02) {
      lasersEnemy.push(new EnemyLaser(
        bossObject.x + bossObject.width / 2,
        bossObject.y + bossObject.height
      ));
    }
  }

  // 히어로 레이저 이동 + 보스 충돌
  lasersHero.forEach((l) => {
    l.y -= l.speed;

    if (bossMode && bossObject && isCollide(l, bossObject)) {
      bossObject.hp--;
      l.dead = true;

      // ★ 수정된 보스 HP 계산 공식
      document.getElementById("boss-hp-bar").style.width =
        `${(bossObject.hp / bossObject.maxHp) * 100}%`;

      if (bossObject.hp <= 0) return gameOver(true);
    }
  });

  // 적 레이저 이동 + 히어로 충돌
  lasersEnemy.forEach((l) => {
    l.y += l.speed;

    if (isCollide(l, hero)) {
      hero.hp--;
      l.dead = true;
      updateHPUI();

      document.getElementById("snd-hit").play();

      if (hero.hp <= 0) return gameOver(false);
    }
  });

  enemies = enemies.filter((e) => !e.dead);
  lasersHero = lasersHero.filter((l) => !l.dead);
  lasersEnemy = lasersEnemy.filter((l) => !l.dead);
  explosions = explosions.filter((ex) => ex.frame++ < 20);
}

// ===============================
// 게임 종료
// ===============================
function gameOver(victory) {
  gameState = "gameover";
  document.getElementById("boss-hp-wrapper").style.display = "none";
}

// ===============================
// 그리기
// ===============================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();

  if (gameState === "title") return;

  if (gameState === "gameover") {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";

    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "24px Arial";
    ctx.fillText("Press ENTER to restart", canvas.width / 2, canvas.height / 2 + 40);
    return;
  }

  // 적
  enemies.forEach((e) => ctx.drawImage(enemyImg, e.x, e.y, e.width, e.height));

  // 레이저
  lasersHero.forEach((l) => ctx.drawImage(laserRedImg, l.x, l.y, l.width, l.height));
  lasersEnemy.forEach((l) => ctx.drawImage(laserGreenImg, l.x, l.y, l.width, l.height));

  // 폭발
  explosions.forEach((ex) =>
    ctx.drawImage(explosionImg, ex.x, ex.y, 64, 64)
  );

  // 플레이어
  ctx.drawImage(heroImg, hero.x, hero.y, hero.width, hero.height);

  // 보스
  if (bossMode && bossObject)
    ctx.drawImage(bossImg, bossObject.x, bossObject.y, bossObject.width, bossObject.height);
}

// ===============================
// 게임 루프
// ===============================
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
