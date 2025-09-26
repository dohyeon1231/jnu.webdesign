// blackjack.js

// 플레이어 카드
let cardOne = 7;
let cardTwo = 5;
let cardThree = 7; 

let playerSum = cardOne + cardTwo;
playerSum += cardThree; 

//딜러 카드
let cardOneBank = 7;
let cardTwoBank = 5;
let cardThreeBank = 6; 
let cardFourBank = 4;

let dealerSum = cardOneBank + cardTwoBank;


const dealerDrawPile = [cardThreeBank, cardFourBank];
let drawIndex = 0;
while (dealerSum < 17 && drawIndex < dealerDrawPile.length) {
  dealerSum += dealerDrawPile[drawIndex++];
}

// 승패 판정
// 1) 플레이어 Bust
if (playerSum > 21) {
  console.log(`Player ${playerSum} vs Dealer ${dealerSum} → Player Bust! Dealer wins.`);
}
// 2) 플레이어 블랙잭(즉시 승리)
else if (playerSum === 21) {
  console.log(`Player ${playerSum} vs Dealer ${dealerSum} → Blackjack! Player wins 🎉`);
}
// 3) 딜러 Bust
else if (dealerSum > 21) {
  console.log(`Player ${playerSum} vs Dealer ${dealerSum} → Dealer Bust! Player wins 🎉`);
}
// 4) 무승부(동점)
else if (playerSum === dealerSum) {
  console.log(`Player ${playerSum} vs Dealer ${dealerSum} → Draw.`);
}
// 5) 21을 넘지 않은 범위에서 더 높은 쪽이 승리
else if (playerSum > dealerSum) {
  console.log(`Player ${playerSum} vs Dealer ${dealerSum} → Player wins 🎉`);
} else {
  console.log(`Player ${playerSum} vs Dealer ${dealerSum} → Dealer wins.`);
}
