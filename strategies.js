// ===========================================
// СТРАТЕГИИ - Допълнителен скрипт за автоматични демонстрации
// ===========================================

// Флаг за демонстрационен режим
var isAutoplayActive = false;
var autoplayMoves = [];
var autoplayIndex = 0;

// Нулиране на демонстрацията
function resetDemo() {
  isAutoplayActive = false;
  autoplayMoves = [];
  autoplayIndex = 0;
  initGame();
  updateInfo("Дъската е нулирана");
}

// =========================================================
// ПОМОЩНИ ФУНКЦИИ ЗА АВТОПЛЕЙ
// =========================================================

function executeAutoplayMove(
  fromRow,
  fromCol,
  toRow,
  toCol,
  isJump,
  capturedRow,
  capturedCol,
  callback
) {
  // Намиране на пула
  var piece = board[fromRow][fromCol];
  if (!piece) {
    console.log("Няма пул на позиция:", fromRow, fromCol);
    if (callback) callback();
    return;
  }

  // Подсветка за визуализация
  selectPiece(piece);

  setTimeout(function () {
    // Изпълнение на хода
    movePiece(piece, toRow, toCol, isJump, capturedRow, capturedCol);

    // Смяна на играча след анимацията
    setTimeout(function () {
      deselectPiece();
      if (!isJump) {
        currentPlayer = currentPlayer === "white" ? "black" : "white";
        updateStatus(
          "Ход на " + (currentPlayer === "white" ? "белите" : "черните")
        );
      }
      if (callback) callback();
    }, 400);
  }, 500);
}

function selectPiece(piece) {
  if (selectedPiece) {
    deselectPiece();
  }
  selectedPiece = piece;
  piece.isSelected = true;
  highlightValidMoves(piece);
}

function deselectPiece() {
  if (selectedPiece) {
    selectedPiece.isSelected = false;
    selectedPiece = null;
  }
  clearHighlights();
}

function scrollToDisplayArea() {
  var canvas = document.getElementById("suicaCanvas");
  if (canvas && canvas.scrollIntoView) {
    canvas.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function playAutoplaySequence(moves, index) {
  if (!isAutoplayActive || index >= moves.length) {
    isAutoplayActive = false;
    updateInfo("Демонстрацията приключи!");
    return;
  }

  var move = moves[index];
  updateInfo("Ход " + (index + 1) + ": " + move.description);

  executeAutoplayMove(
    move.fromRow,
    move.fromCol,
    move.toRow,
    move.toCol,
    move.isJump || false,
    move.capturedRow,
    move.capturedCol,
    function () {
      setTimeout(function () {
        playAutoplaySequence(moves, index + 1);
      }, 800);
    }
  );
}

// =========================================================
// СТРАТЕГИЯ 1: КОНТРОЛ НА ЦЕНТЪРА
// =========================================================

function playStrategy1() {
  if (isAutoplayActive) return;

  resetDemo();
  isAutoplayActive = true;
  updateInfo("Стратегия 1: Контрол на центъра");
  scrollToDisplayArea();

  var moves = [
    {
      fromRow: 5,
      fromCol: 2,
      toRow: 4,
      toCol: 3,
      description: "Бял пул се придвижва към центъра",
    },
    {
      fromRow: 2,
      fromCol: 5,
      toRow: 3,
      toCol: 4,
      description: "Черен пул контраатакува",
    },
    {
      fromRow: 5,
      fromCol: 4,
      toRow: 4,
      toCol: 5,
      description: "Белите заемат друга централна позиция",
    },
    {
      fromRow: 2,
      fromCol: 3,
      toRow: 3,
      toCol: 2,
      description: "Черните се опитват да блокират",
    },
    {
      fromRow: 4,
      fromCol: 3,
      toRow: 2,
      toCol: 5,
      isJump: true,
      capturedRow: 3,
      capturedCol: 4,
      description: "Белите укрепват контрола на центъра",
    },
  ];

  setTimeout(function () {
    playAutoplaySequence(moves, 0);
  }, 1000);
}

// =========================================================
// СТРАТЕГИЯ 2: ЖЕРТВА ЗА ПОЗИЦИЯ
// =========================================================

function playStrategy2() {
  if (isAutoplayActive) return;

  resetDemo();
  isAutoplayActive = true;
  updateInfo("Стратегия 2: Жертва за позиция");
  scrollToDisplayArea();

  var moves = [
    {
      fromRow: 5,
      fromCol: 2,
      toRow: 4,
      toCol: 3,
      description: "Бял пул се премества напред",
    },
    {
      fromRow: 2,
      fromCol: 3,
      toRow: 3,
      toCol: 4,
      description: "Черен пул атакува",
    },
    {
      fromRow: 5,
      fromCol: 4,
      toRow: 4,
      toCol: 5,
      description: "Белите позиционират друг пул",
    },
    {
      fromRow: 3,
      fromCol: 4,
      toRow: 5,
      toCol: 2,
      isJump: true,
      capturedRow: 4,
      capturedCol: 3,
      description: "Черните взимат примамката",
    },
    {
      fromRow: 6,
      fromCol: 1,
      toRow: 4,
      toCol: 3,
      isJump: true,
      capturedRow: 5,
      capturedCol: 2,
      description: "Белите печелят по-добра позиция!",
    },
  ];

  setTimeout(function () {
    playAutoplaySequence(moves, 0);
  }, 1000);
}

// =========================================================
// СТРАТЕГИЯ 3: ВЕРИЖНО ВЗИМАНЕ
// =========================================================

function setupChainCapture() {
  // Изчистване на дъската
  for (var i = 0; i < pieces.length; i++) {
    pieces[i].visible = false;
  }
  pieces = [];
  board = [];
  for (var row = 0; row < BOARD_SIZE; row++) {
    board[row] = [];
    for (var col = 0; col < BOARD_SIZE; col++) {
      board[row][col] = null;
    }
  }

  // Създаване на специална позиция за демонстрация на верижно взимане
  // Бял пул на A3 (ред 5, колона 0)
  var whitePiece = createPiece(5, 0, true);
  pieces.push(whitePiece);
  board[5][0] = whitePiece;

  // Черни пулове за прескачане
  var black1 = createPiece(4, 1, false);
  pieces.push(black1);
  board[4][1] = black1;

  var black2 = createPiece(2, 3, false);
  pieces.push(black2);
  board[2][3] = black2;

  var black3 = createPiece(2, 5, false);
  pieces.push(black3);
  board[2][5] = black3;
}

function playStrategy3() {
  if (isAutoplayActive) return;

  isAutoplayActive = true;
  updateInfo("Стратегия 3: Верижно взимане - подготовка...");
  scrollToDisplayArea();

  // Специална настройка за демонстрация
  setupChainCapture();

  var moves = [
    {
      fromRow: 5,
      fromCol: 0,
      toRow: 3,
      toCol: 2,
      isJump: true,
      capturedRow: 4,
      capturedCol: 1,
      description: "Първо прескачане!",
    },
    {
      fromRow: 3,
      fromCol: 2,
      toRow: 1,
      toCol: 4,
      isJump: true,
      capturedRow: 2,
      capturedCol: 3,
      description: "Верижно прескачане - 2!",
    },
    {
      fromRow: 1,
      fromCol: 4,
      toRow: 3,
      toCol: 6,
      isJump: true,
      capturedRow: 2,
      capturedCol: 5,
      description: "Тройна верига - 3 взети пула!",
    },
  ];

  setTimeout(function () {
    playAutoplaySequence(moves, 0);
  }, 1000);
}

// =========================================================
// СТРАТЕГИЯ 4: ЗАЩИТА НА КРАИЩАТА
// =========================================================

function playStrategy4() {
  if (isAutoplayActive) return;

  resetDemo();
  isAutoplayActive = true;
  updateInfo("Стратегия 4: Защита на краищата");
  scrollToDisplayArea();

  var moves = [
    {
      fromRow: 5,
      fromCol: 6,
      toRow: 4,
      toCol: 7,
      description: "Бял пул заема краен ред",
    },
    {
      fromRow: 2,
      fromCol: 7,
      toRow: 3,
      toCol: 6,
      description: "Черните се опитват да атакуват",
    },
    {
      fromRow: 6,
      fromCol: 7,
      toRow: 5,
      toCol: 6,
      description: "Белите укрепват защитата",
    },
    {
      fromRow: 3,
      fromCol: 6,
      toRow: 4,
      toCol: 5,
      description: "Черните търсят пробив",
    },
    {
      fromRow: 5,
      fromCol: 6,
      toRow: 3,
      toCol: 4,
      isJump: true,
      capturedRow: 4,
      capturedCol: 5,
      description: "Белите контраатакуват от защитена позиция!",
    },
  ];

  setTimeout(function () {
    playAutoplaySequence(moves, 0);
  }, 1000);
}

// =========================================================
// СТРАТЕГИЯ 5: СЪЗДАВАНЕ НА ДАМА
// =========================================================

function setupKingCreation() {
  // Изчистване на дъската
  for (var i = 0; i < pieces.length; i++) {
    pieces[i].visible = false;
  }
  pieces = [];
  board = [];
  for (var row = 0; row < BOARD_SIZE; row++) {
    board[row] = [];
    for (var col = 0; col < BOARD_SIZE; col++) {
      board[row][col] = null;
    }
  }

  // Бял пул близо до края
  var whitePiece1 = createPiece(2, 3, true);
  pieces.push(whitePiece1);
  board[2][3] = whitePiece1;

  // Черен пул за блокиране
  var black1 = createPiece(1, 4, false);
  pieces.push(black1);
  board[1][4] = black1;
}

function playStrategy5() {
  if (isAutoplayActive) return;

  isAutoplayActive = true;
  updateInfo("Стратегия 5: Създаване на дама");
  scrollToDisplayArea();

  setupKingCreation();

  var moves = [
    {
      fromRow: 2,
      fromCol: 3,
      toRow: 0,
      toCol: 5,
      isJump: true,
      capturedRow: 1,
      capturedCol: 4,
      description: "Белият пул прескача и става ДАМА!",
    },
  ];

  setTimeout(function () {
    playAutoplaySequence(moves, 0);
  }, 1000);
}

// Обновяване на статуса при зареждане
setTimeout(function () {
  updateStatus("Демонстрационен режим - изберете стратегия");
}, 100);
