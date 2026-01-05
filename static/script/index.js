/************************************************
 * SLOT MACHINE – MAIN JAVASCRIPT
 * Author: You
 * Goal: Clean, predictable, debuggable code
 ************************************************/

/* =============================================
   1. WAIT FOR DOM TO BE READY
   (prevents null querySelector errors)
============================================= */
document.addEventListener("DOMContentLoaded", () => {

  /* =============================================
     2. GAME STATE (Single Source of Truth)
  ============================================= */
  const gameState = {
    balance: 1000,
    bet: 50,
    isSpinning: false
  };

  /* =============================================
     3. DOM ELEMENT REFERENCES
  ============================================= */
  const spinBtn = document.querySelector(".spin-btn");
  const balanceUI = document.querySelector(".balance-amount");
  const reels = document.querySelectorAll(".reel-column");
  const statusMsg = document.querySelector(".status-msg");

  /* =============================================
     4. SOUND SETUP
  ============================================= */
  const sounds = {
    win: new Audio("/static/win.mp3"),
    loss: new Audio("/static/loss.mp3"),
    spin: new Audio("/static/spin.mp3")
  };

  Object.values(sounds).forEach(sound => {
    sound.preload = "auto";
  });

  /* =============================================
     5. EVENT LISTENERS
  ============================================= */
  spinBtn.addEventListener("click", spin);

  /* =============================================
     6. MAIN SPIN FUNCTION
  ============================================= */
  async function spin() {
    if (!canSpin()) return;

    lockUI(true);
    deductBet();
    playSound("spin");

    try {
      const response = await fetch("/spin", { method: "POST" });
      const result = await response.json();

      animateReels(result.reels, () => {
        applyResult(result);
        lockUI(false);
      });

    } catch (error) {
      console.error("Spin failed:", error);
      lockUI(false);
    }
  }

  /* =============================================
     7. VALIDATION LOGIC
  ============================================= */
  function canSpin() {
    if (gameState.isSpinning) return false;

    if (gameState.balance < gameState.bet) {
      alert("Insufficient Balance!");
      return false;
    }
    return true;
  }

  /* =============================================
     8. UI LOCKING
  ============================================= */
  function lockUI(lock) {
    gameState.isSpinning = lock;
    spinBtn.disabled = lock;
  }

  /* =============================================
     9. BALANCE HANDLING
  ============================================= */
  function deductBet() {
    gameState.balance -= gameState.bet;
    updateBalanceUI();
  }

  function updateBalanceUI() {
    balanceUI.textContent = `₹${gameState.balance}`;
  }

  /* =============================================
     10. REEL ANIMATION
  ============================================= */
  function animateReels(reelData, onComplete) {
    reels.forEach((reel, index) => {
        setTimeout(() => {
        updateReelSymbols(reel, reelData[index]);

        if (index === reels.length - 1) {
          onComplete();
        }
      }, 500 + index * 300);
    });
  }

  function updateReelSymbols(reel, symbols) {
    const cells = reel.querySelectorAll(".symbol");
    cells.forEach((cell, i) => {
      cell.textContent = symbols[i];
    });
  }

  /* =============================================
     11. APPLY RESULT
  ============================================= */
  function applyResult(result) {
    if (result.win) {
      gameState.balance += result.payout;
      updateBalanceUI();
      playSound("win");
      setStatus("🎉 You Win!");
    } else {
      playSound("loss");
      setStatus("😢 Try Again");
    }
  }

  /* =============================================
     12. STATUS MESSAGE
  ============================================= */
  function setStatus(message) {
    if (!statusMsg) return;
    statusMsg.textContent = message;
  }

  /* =============================================
     13. SOUND PLAYER
  ============================================= */
  function playSound(type) {
    const sound = sounds[type];
    if (!sound) return;

    sound.currentTime = 0;
    sound.play();
  }

});
