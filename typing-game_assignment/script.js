document.addEventListener("DOMContentLoaded", () => {
  const quotes = [
    "Dream big work hard",
    "JavaScript is fun",
    "Frontend and backend",
    "Typing games are cool",
    "Keep learning every day",
  ];

  const quoteElement = document.getElementById("quote");
  const typedValueElement = document.getElementById("typed-value");
  const startButton = document.getElementById("start-button");
  const bestRecordElement = document.getElementById("best-record");
  const liveTimer = document.getElementById("live-timer");

  const modal = document.getElementById("result-modal");
  const modalMessage = document.getElementById("modal-message");
  const modalTime = document.getElementById("modal-time");
  const modalSpeed = document.getElementById("modal-speed");
  const restartButton = document.getElementById("restart-button");

  let startTime, wordIndex, words, timerInterval;
  let bestTime = localStorage.getItem("bestTime");

  if (bestTime) {
    bestRecordElement.textContent = `🏆 최고 기록: ${bestTime}초`;
  }

  function randomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 80%, 90%)`;
  }

  // 🎮 게임 시작
  startButton.addEventListener("click", () => {
    const quoteIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[quoteIndex];
    words = quote.split(" ");
    wordIndex = 0;

    const spanWords = words.map((word) => `<span>${word}</span>`);
    quoteElement.innerHTML = spanWords.join(" ");
    const spans = quoteElement.querySelectorAll("span");
    spans[0].classList.add("highlight");

    typedValueElement.value = "";
    typedValueElement.disabled = false;
    typedValueElement.focus();
    startButton.disabled = true;
    startTime = new Date().getTime();

    // 🕒 실시간 타이머 시작
    clearInterval(timerInterval);
    liveTimer.textContent = "⏱️ 진행 시간: 0.00초";
    timerInterval = setInterval(() => {
      const current = (new Date().getTime() - startTime) / 1000;
      liveTimer.textContent = `⏱️ 진행 시간: ${current.toFixed(2)}초`;
    }, 100);

    document.body.style.background = `linear-gradient(135deg, ${randomColor()}, ${randomColor()})`;
  });

  // ⌨️ 입력 감지
  typedValueElement.addEventListener("keyup", (e) => {
    const currentWord = words[wordIndex];
    const typedValue = typedValueElement.value.trim();
    const spans = quoteElement.querySelectorAll("span");

    // 마지막 단어 완료
    if (typedValue === currentWord && wordIndex === words.length - 1) {
      const elapsedTime = (new Date().getTime() - startTime) / 1000;
      clearInterval(timerInterval);
      showResult(elapsedTime);
      return;
    }

    // 공백 or 엔터 시 다음 단어 이동
    if ((e.key === " " || e.key === "Enter") && typedValue === currentWord) {
      typedValueElement.value = "";
      spans[wordIndex].classList.remove("highlight");
      wordIndex++;
      spans[wordIndex].classList.add("highlight");
      document.body.style.background = `linear-gradient(135deg, ${randomColor()}, ${randomColor()})`;
    }

    // 오타 표시
    if (currentWord.startsWith(typedValue)) {
      typedValueElement.className = "";
    } else {
      typedValueElement.className = "error";
    }
  });

  // 🎉 결과창 표시
  function showResult(elapsedTime) {
    typedValueElement.disabled = true;
    startButton.disabled = false;

    const wordCount = words.length;
    const speed = (elapsedTime / wordCount).toFixed(2);

    modalMessage.textContent = "🎉 축하합니다! 모든 단어를 완료했습니다.";
    modalTime.textContent = `⏱️ 소요 시간: ${elapsedTime.toFixed(2)}초`;
    modalSpeed.textContent = `⚡ 평균 속도: ${speed}초/단어`;
    modal.style.display = "flex";

    document.body.style.background = "linear-gradient(135deg, #fff59d, #f48fb1)";

    if (!bestTime || elapsedTime < parseFloat(bestTime)) {
      localStorage.setItem("bestTime", elapsedTime.toFixed(2));
      bestRecordElement.textContent = `🏆 최고 기록: ${elapsedTime.toFixed(2)}초`;
    }
  }

  // 🔁 다시 하기
  restartButton.addEventListener("click", () => {
    modal.style.display = "none";
    startButton.click();
  });
});
