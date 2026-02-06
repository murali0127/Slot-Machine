document.addEventListener("DOMContentLoaded", () => {

  /* =============================================
     1. GAME STATE (Single Source of Truth)
  ============================================= */
  const gameState = {
    balance: 1000,
    bet: 50,
    isSpinning: false,
    minBet: 10,
    maxBet: 500
  };

  /* =============================================
     2. DOM ELEMENTS
  ============================================= */
  const spinBtn = document.querySelector(".spin-btn");
  const balanceUI = document.querySelector(".balance-amount");
  const reels = document.querySelectorAll(".reel-column");
  const statusMsg = document.querySelector(".status-msg");
  const betDisplay = document.getElementById("bet-display");
  const betMinusBtn = document.getElementById("bet-minus");
  const betPlusBtn = document.getElementById("bet-plus");

  /* =============================================
     3. SOUND SETUP
  ============================================= */
  const sounds = {
    win: document.getElementById("winAudio"),
    loss: document.getElementById("lossAudio"),
    spin: document.getElementById("spinAudio")
  };

  // Ensure sounds are ready (with fallback if files don't exist)
  Object.values(sounds).forEach(sound => {
    if (sound) {
      sound.volume = 0.3;
      sound.preload = "auto";
    }
  });

  /* =============================================
     4. SYMBOL ARRAY FOR ANIMATION
  ============================================= */
  const SYMBOLS = ["🍒", "🔔", "💎", "🍋", "🍀", "🎰"];

  /* =============================================
     5. EVENT LISTENERS
  ============================================= */
  spinBtn.addEventListener("click", spin);
  betMinusBtn.addEventListener("click", decreaseBet);
  betPlusBtn.addEventListener("click", increaseBet);

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!gameState.isSpinning) spin();
    } else if (e.key === "-" || e.key === "_") {
      decreaseBet();
    } else if (e.key === "+" || e.key === "=") {
      increaseBet();
    }
  });

  /* =============================================
     6. BET ADJUSTMENT FUNCTIONS
  ============================================= */
  function increaseBet() {
    if (gameState.isSpinning) return;
    const newBet = Math.min(gameState.bet + 10, gameState.maxBet, gameState.balance);
    if (newBet !== gameState.bet) {
      gameState.bet = newBet;
      updateBetDisplay();
      animateBetChange();
    }
  }

  function decreaseBet() {
    if (gameState.isSpinning) return;
    const newBet = Math.max(gameState.bet - 10, gameState.minBet);
    if (newBet !== gameState.bet) {
      gameState.bet = newBet;
      updateBetDisplay();
      animateBetChange();
    }
  }

  function updateBetDisplay() {
    betDisplay.textContent = `Bet: $${gameState.bet}`;
  }

  function animateBetChange() {
    betDisplay.style.transform = "scale(1.2)";
    betDisplay.style.color = "#ffd700";
    setTimeout(() => {
      betDisplay.style.transform = "scale(1)";
      betDisplay.style.color = "";
    }, 200);
  }

  /* =============================================
     7. MAIN SPIN FUNCTION (Flask Integration)
  ============================================= */
  async function spin() {
    if (!canSpin()) return;

    lockUI(true);
    deductBet();  // Deduct bet immediately for better UX
    playSound("spin");
    setStatus("Spinning...");

    // Add spin button animation
    spinBtn.classList.add("spinning");

    try {
      // Start animation
      const animationPromise = animateReels();

      // Call Flask backend API
      const response = await fetch("/spin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ bet: gameState.bet })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Spin failed');
      }

      const result = await response.json();

      // Wait for animation to complete
      await animationPromise;

      // Show final result from backend
      showFinalResult(result.reels);

      // Small delay before showing result
      await new Promise(resolve => setTimeout(resolve, 300));

      // Apply result (win/loss)
      applyResult(result);
      
      lockUI(false);
      spinBtn.classList.remove("spinning");
    } catch (error) {
      console.error("Spin failed:", error);
      setStatus("Error! Please try again.");
      lockUI(false);

      // Refund bet on error
      gameState.balance += gameState.bet;
      updateBalanceUI();
      
      spinBtn.classList.remove("spinning");
    }
  }

  /* =============================================
     8. VALIDATION LOGIC
  ============================================= */
  function canSpin() {
    if (gameState.isSpinning) {
      setStatus("Already spinning!");
      return false;
    }

    if (gameState.balance < gameState.bet) {
      setStatus("Insufficient Balance!");
      showNotification("Insufficient Balance!", "error");
      return false;
    }
    return true;
  }

  /* =============================================
     9. UI LOCKING
  ============================================= */
  function lockUI(lock) {
    gameState.isSpinning = lock;
    spinBtn.disabled = lock;
    betMinusBtn.disabled = lock;
    betPlusBtn.disabled = lock;

    if (lock) {
      spinBtn.style.opacity = "0.7";
      spinBtn.style.cursor = "not-allowed";
    } else {
      spinBtn.style.opacity = "1";
      spinBtn.style.cursor = "pointer";
    }
  }

  /* =============================================
     10. BALANCE HANDLING
  ============================================= */
  function deductBet() {
    gameState.balance -= gameState.bet;
    updateBalanceUI();
    animateBalanceChange("decrease");
  }

  function addWinnings(amount) {
    gameState.balance += amount;
    updateBalanceUI();
    animateBalanceChange("increase");
  }

  function updateBalanceUI() {
    balanceUI.textContent = `$${gameState.balance}`;
  }

  function animateBalanceChange(type) {
    balanceUI.style.transform = type === "increase" ? "scale(1.3)" : "scale(0.9)";
    balanceUI.style.color = type === "increase" ? "#4ade80" : "#f87171";
    setTimeout(() => {
      balanceUI.style.transform = "scale(1)";
      balanceUI.style.color = "";
    }, 300);
  }

  /* =============================================
     11. REEL ANIMATION
  ============================================= */
  async function animateReels() {
    const SPIN_DURATION = 2000;  // 2 seconds
    const symbolHeight = 80;

    const animations = Array.from(reels).map((reel, index) => {
      return new Promise(resolve => {
        const strip = reel.querySelector(".reel-strip");
        const delay = index * 300;

        setTimeout(() => {
          // Fill reel with random symbols for spin illusion
          strip.innerHTML = "";
          for (let i = 0; i < 12; i++) {
            const sym = document.createElement("div");
            sym.className = "symbol";
            sym.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
            strip.appendChild(sym);
          }

          // Reset transform and set up for animation
          strip.style.transition = "none";
          strip.style.transform = "translateY(0)";

          // Force reflow
          void strip.offsetHeight;

          // Start spinning
          strip.style.transition = `transform ${SPIN_DURATION / 1000}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
          strip.style.transform = `translateY(-${symbolHeight * 15}px)`;

          // Resolve after animation completes
          setTimeout(() => {
            resolve();
          }, SPIN_DURATION);

        }, delay);
      });
    });

    await Promise.all(animations);
  }

  /* =============================================
     12. SHOW FINAL RESULT (From Backend)
  ============================================= */
  function showFinalResult(finalReels) {
    reels.forEach((reel, index) => {
      const strip = reel.querySelector(".reel-strip");

      // Stop animation
      strip.style.transition = "none";
      strip.style.transform = "translateY(0)";

      // Clear and show final symbols from backend
      strip.innerHTML = "";
      finalReels[index].forEach(symbol => {
        const sym = document.createElement("div");
        sym.className = "symbol";
        sym.textContent = symbol;
        strip.appendChild(sym);
      });
    });
  }

  /* =============================================
     13. APPLY RESULT (Enhanced)
  ============================================= */
  function applyResult(result) {
    if (result.win) {
      addWinnings(result.payout);
      playSound("win");
      setStatus(`🎉 You Win $${result.payout}! 🎉`);
      showWinAnimation();
      createConfetti();
      highlightWinningLine();
    } else {
      playSound("loss");
      setStatus("😢 Try Again!");
      showLossAnimation();
    }
  }

  function highlightWinningLine() {
    reels.forEach((reel) => {
      const cells = reel.querySelectorAll(".symbol");
      const middleCell = cells[1];  // Middle symbol is the payline
      if (middleCell) {
        middleCell.style.background = "linear-gradient(180deg, #ffd700, #ffed4e)";
        middleCell.style.boxShadow = "0 0 20px #ffd700, inset 0 0 10px #ffd700";
        middleCell.style.transform = "scale(1.2)";
        middleCell.style.transition = "all 0.3s ease";

        setTimeout(() => {
          middleCell.style.background = "";
          middleCell.style.boxShadow = "";
          middleCell.style.transform = "scale(1)";
        }, 2000);
      }
    });
  }

  function showWinAnimation() {
    const slotMachine = document.querySelector(".slot-machine");
    slotMachine.style.animation = "winPulse 0.5s ease 3";

    setTimeout(() => {
      slotMachine.style.animation = "";
    }, 1500);
  }

  function showLossAnimation() {
    const slotMachine = document.querySelector(".slot-machine");
    slotMachine.style.animation = "shake 0.5s ease";

    setTimeout(() => {
      slotMachine.style.animation = "";
    }, 500);
  }

  function createConfetti() {
    const colors = ["#ffd700", "#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24", "#f0932b"];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
      setTimeout(() => {
        const confetti = document.createElement("div");
        confetti.className = "confetti";
        confetti.style.left = Math.random() * 100 + "%";
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 0.5 + "s";
        document.body.appendChild(confetti);

        setTimeout(() => {
          confetti.remove();
        }, 3000);
      }, i * 20);
    }
  }

  function showNotification(message, type) {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("show");
    }, 10);

    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  /* =============================================
     14. STATUS MESSAGE
  ============================================= */
  function setStatus(message) {
    if (!statusMsg) return;
    statusMsg.textContent = message;
    statusMsg.style.animation = "fadeIn 0.3s ease";

    setTimeout(() => {
      statusMsg.style.animation = "";
    }, 300);
  }

  /* =============================================
     15. SOUND PLAYER
  ============================================= */
  function playSound(type) {
    const sound = sounds[type];
    if (!sound) return;

    // Reset and play
    sound.currentTime = 0;
    const playPromise = sound.play();

    if (playPromise !== undefined) {
      playPromise.catch(err => {
        // This is normal on first interaction - browsers require user interaction
        console.log(`Sound play prevented (${type}):`, err.message);
      });
    }
  }

  /* =============================================
     16. INITIALIZE
  ============================================= */
  updateBetDisplay();
  updateBalanceUI();
  setStatus("Press SPIN to Play");

  console.log("🎰 Slot Machine initialized successfully!");
});
