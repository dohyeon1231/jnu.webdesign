// app.js

// 이미지 로더 함수 (슬라이드 기본 코드)
function loadTexture(path) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = path;
    img.onload = () => {
      resolve(img);
    };
  });
}

// 3. 별 무늬 우주 배경 만들기 (createPattern 사용)
function drawSpaceBackground(ctx, canvas) {
  // 패턴용 임시 캔버스
  const patternCanvas = document.createElement("canvas");
  patternCanvas.width = 64;
  patternCanvas.height = 64;

  const pctx = patternCanvas.getContext("2d");

  // 배경색 (보라색 느낌)
  pctx.fillStyle = "#3a215d";
  pctx.fillRect(0, 0, patternCanvas.width, patternCanvas.height);

  // 작은 별 몇 개 찍기
  pctx.fillStyle = "#ffffff";
  pctx.fillRect(5, 5, 2, 2);
  pctx.fillRect(30, 10, 2, 2);
  pctx.fillRect(10, 30, 2, 2);
  pctx.fillRect(45, 40, 2, 2);
  pctx.fillRect(20, 50, 2, 2);

  // 십자 모양 별 함수
  function drawCrossStar(x, y) {
    pctx.fillRect(x, y, 2, 2);
    pctx.fillRect(x - 2, y, 2, 2);
    pctx.fillRect(x + 2, y, 2, 2);
    pctx.fillRect(x, y - 2, 2, 2);
    pctx.fillRect(x, y + 2, 2, 2);
  }

  drawCrossStar(50, 15);
  drawCrossStar(25, 25);

  // 패턴 생성 후 전체 배경 채우기
  const pattern = ctx.createPattern(patternCanvas, "repeat");
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// 1. 플레이어 우주선 + 양옆 보조 우주선 2기
function drawPlayerWithSupportShips(ctx, canvas, heroImg) {
  // 메인 우주선 크기
  const mainScale = 1.0;
  const mainWidth = heroImg.width * mainScale;
  const mainHeight = heroImg.height * mainScale;

  // 보조 우주선 크기 (조금 작게)
  const subScale = 0.6;
  const subWidth = heroImg.width * subScale;
  const subHeight = heroImg.height * subScale;

  // 메인 우주선 위치
  const baseY = canvas.height - canvas.height / 4;
  const mainX = canvas.width / 2 - mainWidth / 2;

  // 메인 우주선
  ctx.drawImage(heroImg, mainX, baseY, mainWidth, mainHeight);

  // 양옆 보조 우주선
  const gap = 40; // 메인과 보조 사이 간격
  const leftX = mainX - subWidth - gap;
  const rightX = mainX + mainWidth + gap;
  const subY = baseY + (mainHeight - subHeight) / 2;

  ctx.drawImage(heroImg, leftX, subY, subWidth, subHeight);
  ctx.drawImage(heroImg, rightX, subY, subWidth, subHeight);
}

// 2. 기존 슬라이드에 있던 적군 배치 (참고용)
function createEnemies(ctx, canvas, enemyImg) {
  const MONSTER_TOTAL = 5;
  const MONSTER_WIDTH = MONSTER_TOTAL * enemyImg.width;
  const START_X = (canvas.width - MONSTER_WIDTH) / 2;
  const STOP_X = START_X + MONSTER_WIDTH;

  for (let x = START_X; x < STOP_X; x += enemyImg.width) {
    for (let y = 0; y < enemyImg.height * 5; y += enemyImg.height) {
      ctx.drawImage(enemyImg, x, y);
    }
  }
}

function createEnemies2(ctx, canvas, enemyImg) {
  const ROWS = 5;          // 총 줄 수 (5줄)
  const startY = 50;       // 위쪽 여백
  const gapX = 10;         // 비행기 가로 간격
  const gapY = 10;         // 세로 줄 간격
  const centerX = canvas.width / 2;

  for (let row = 0; row < ROWS; row++) {
    // 역피라미드: 위쪽은 5개, 아래는 1개
    const count = ROWS - row; // 5,4,3,2,1 순서

    const totalWidth = count * enemyImg.width + (count - 1) * gapX;
    const startX = centerX - totalWidth / 2;

    for (let i = 0; i < count; i++) {
      const x = startX + i * (enemyImg.width + gapX);
      const y = startY + row * (enemyImg.height + gapY);
      ctx.drawImage(enemyImg, x, y);
    }
  }
}


window.onload = async () => {
  const canvas = document.getElementById("myCanvas");
  const ctx = canvas.getContext("2d");

  // 경로 정확하게 수정
  const heroImg = await loadTexture("assets/player.png");
  const enemyImg = await loadTexture("assets/enemyShip.png");

  drawSpaceBackground(ctx, canvas);
  createEnemies2(ctx, canvas, enemyImg);
  drawPlayerWithSupportShips(ctx, canvas, heroImg);
};
