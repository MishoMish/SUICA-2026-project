// ===========================================
// ШАШКИ - JavaScript логика
// Демонстрационен пример за СИУКС
// ===========================================

// =========================================================
// КОНСТАНТИ И НАСТРОЙКИ
// =========================================================

const BOARD_SIZE = 8;
const CELL_SIZE = 30;
const BOARD_OFFSET = (-CELL_SIZE * (BOARD_SIZE - 1)) / 2;

const LIGHT_CELL = "#f0d9b5";
const DARK_CELL = "#b58863";
const WHITE_PIECE = "#fff8dc";
const BLACK_PIECE = "#2d1f14";
const HIGHLIGHT_COLOR = "#7fff00";
const SELECTED_COLOR = "#ffd700";

// =========================================================
// ГЛОБАЛНИ ПРОМЕНЛИВИ
// =========================================================

var board = []; // Логическа дъска (2D масив)
var pieces = []; // Масив с всички пулове (Suica обекти)
var cells = []; // Масив с клетките на дъската
var highlightCells = []; // Подсветени клетки за възможни ходове
var selectedPiece = null; // Избран пул
var currentPlayer = "white"; // Чий ход е
var showCoordinates = true; // Показване на координати
var showHighlightMoves = true; // Показване на възможни ходове
var isAutoplayActive = false; // Флаг за блокиране при демонстрация

// За въртене на дъската
var isDragging = false;
var lastMouseX = 0;
var lastMouseY = 0;
var rotationH = 0; // Хоризонтална ротация (0 = перфектен изглед отгоре)
var rotationV = 0; // Вертикална ротация (без начално завъртане)

// Групов обект за цялата дъска
var boardGroup;
var coordinateLabels = [];

// =========================================================
// ИНИЦИАЛИЗАЦИЯ НА SUICA
// =========================================================

// Камера
background("#2d3436");
perspective(40);
lookAt([0, 275, 250], [0, 0, 0], [0, 0, -1]);

// Създаване на групов обект за дъската
boardGroup = group();

// =========================================================
// СЪЗДАВАНЕ НА ДЪСКАТА
// =========================================================

/**
 * Създава 3D шахматна дъска със SUICA
 * Включва:
 * - Дървена основа и рамка
 * - 64 клетки (8x8) в шахматен ред
 * - Координатни етикети (A-H, 1-8)
 */
function createBoard() {
  // Основа на дъската
  var boardBase = cube(
    [0, -5, 0],
    [CELL_SIZE * BOARD_SIZE + 10, 8, CELL_SIZE * BOARD_SIZE + 10],
    "#5d3a1a"
  );
  boardGroup.add(boardBase);

  // Рамка около дъската
  var frame = cube(
    [0, -2, 0],
    [CELL_SIZE * BOARD_SIZE + 20, 4, CELL_SIZE * BOARD_SIZE + 20],
    "#3d2914"
  );
  boardGroup.add(frame);

  // Създаване на клетките
  for (var row = 0; row < BOARD_SIZE; row++) {
    cells[row] = [];
    for (var col = 0; col < BOARD_SIZE; col++) {
      var x = BOARD_OFFSET + col * CELL_SIZE;
      var z = BOARD_OFFSET + row * CELL_SIZE;

      // Определяне на цвета на клетката (шахматен ред)
      var isLightCell = (row + col) % 2 === 0;
      var cellColor = isLightCell ? LIGHT_CELL : DARK_CELL;

      // Създаване на клетката като квадрат
      var cell = cube([x, 0, z], [CELL_SIZE - 1, 2, CELL_SIZE - 1], cellColor);
      cell.row = row;
      cell.col = col;
      cell.isLight = isLightCell;
      cells[row][col] = cell;
      boardGroup.add(cell);
    }
  }

  // Добавяне на координатни етикети
  createCoordinateLabels();
}

// =========================================================
// КООРДИНАТНИ ЕТИКЕТИ
// =========================================================

function createCoordinateLabels() {
  var letters = "ABCDEFGH";

  // Букви (колони) - отпред и отзад
  for (var col = 0; col < BOARD_SIZE; col++) {
    var x = BOARD_OFFSET + col * CELL_SIZE;

    // Етикет отпред
    var labelFront = point(
      [x, 2, BOARD_OFFSET + BOARD_SIZE * (CELL_SIZE - 4) + 25],
      18,
      "#ffffff"
    );
    var drawingF = drawing(64);
    fillText(0, 0, letters[col], "#ffffff", "bold 48px Arial");
    labelFront.image = drawingF;
    coordinateLabels.push(labelFront);
    boardGroup.add(labelFront);

    // Етикет отзад
    var labelBack = point([x, 2, BOARD_OFFSET - 20], 18, "#ffffff");
    var drawingB = drawing(64);
    fillText(0, 0, letters[col], "#ffffff", "bold 48px Arial");
    labelBack.image = drawingB;
    coordinateLabels.push(labelBack);
    boardGroup.add(labelBack);
  }

  // Числа (редове) - отляво и отдясно
  for (var row = 0; row < BOARD_SIZE; row++) {
    var z = BOARD_OFFSET + row * CELL_SIZE;

    // Етикет отляво
    var labelLeft = point([BOARD_OFFSET - 20, 2, z], 18, "#ffffff");
    var drawingL = drawing(64);
    fillText(0, 0, String(BOARD_SIZE - row), "#ffffff", "bold 48px Arial");
    labelLeft.image = drawingL;
    coordinateLabels.push(labelLeft);
    boardGroup.add(labelLeft);

    // Етикет отдясно
    var labelRight = point(
      [BOARD_OFFSET + BOARD_SIZE * (CELL_SIZE - 4) + 25, 2, z],
      18,
      "#ffffff"
    );
    var drawingR = drawing(64);
    fillText(0, 0, String(BOARD_SIZE - row), "#ffffff", "bold 48px Arial");
    labelRight.image = drawingR;
    coordinateLabels.push(labelRight);
    boardGroup.add(labelRight);
  }
}

// =========================================================
// СЪЗДАВАНЕ НА ПУЛОВЕ
// =========================================================

/**
 * Създава 3D пул за игра на шашки
 * @param {number} row - Ред на дъската (0-7)
 * @param {number} col - Колона на дъската (0-7)
 * @param {boolean} isWhite - Дали пулът е бял
 * @returns {Object} SUICA група съдържаща пула
 */
function createPiece(row, col, isWhite) {
  var x = BOARD_OFFSET + col * CELL_SIZE;
  var z = BOARD_OFFSET + row * CELL_SIZE;
  var color = isWhite ? WHITE_PIECE : BLACK_PIECE;

  // Основен пул - цилиндър
  var piece = group();

  // Долна част на пула
  var base = cylinder([0, 4, 0], [CELL_SIZE * 0.4, 6, CELL_SIZE * 0.4], color);
  piece.add(base);

  // Горна част
  var top = cylinder([0, 8, 0], [CELL_SIZE * 0.35, 3, CELL_SIZE * 0.35], color);
  piece.add(top);

  // Ръб (контур)
  var rim = cylinder(
    [0, 6, 0],
    [CELL_SIZE * 0.42, 1, CELL_SIZE * 0.42],
    isWhite ? "#c9b896" : "#1a1410"
  );
  piece.add(rim);

  piece.center = [x, -3, z];
  piece.row = row;
  piece.col = col;
  piece.isWhite = isWhite;
  piece.isKing = false;
  piece.isSelected = false;

  boardGroup.add(piece);
  return piece;
}

/**
 * Превръща обикновен пул в дама (King)
 * Добавя визуална коронка и позволява движение назад
 * @param {Object} piece - Пулът за превръщане
 */
function promoteToKing(piece) {
  if (piece.isKing) return;

  piece.isKing = true;

  // Добавяне на "коронка"
  var crownColor = piece.isWhite ? "#ffd700" : "#b8860b";
  var crown = cone(
    [0, 12, 0],
    [CELL_SIZE * 0.2, 6, CELL_SIZE * 0.2],
    crownColor
  );
  piece.add(crown);

  // Втори пръстен за коронка
  var crownRing = cylinder(
    [0, 10, 0],
    [CELL_SIZE * 0.25, 2, CELL_SIZE * 0.25],
    crownColor
  );
  piece.add(crownRing);

  updateStatus("Дама! Пулът може да се движи и назад.");
}

// =========================================================
// ИНИЦИАЛИЗАЦИЯ НА ИГРАТА
// =========================================================

function initGame() {
  // Изчистване на логическата дъска
  board = [];
  for (var row = 0; row < BOARD_SIZE; row++) {
    board[row] = [];
    for (var col = 0; col < BOARD_SIZE; col++) {
      board[row][col] = null;
    }
  }

  // Премахване на стари пулове
  for (var i = 0; i < pieces.length; i++) {
    pieces[i].visible = false;
  }
  pieces = [];

  // Създаване на черни пулове (горни 3 реда)
  for (var row = 0; row < 3; row++) {
    for (var col = 0; col < BOARD_SIZE; col++) {
      // Само на тъмни клетки
      if ((row + col) % 2 === 1) {
        var piece = createPiece(row, col, false);
        pieces.push(piece);
        board[row][col] = piece;
      }
    }
  }

  // Създаване на бели пулове (долни 3 реда)
  for (var row = BOARD_SIZE - 3; row < BOARD_SIZE; row++) {
    for (var col = 0; col < BOARD_SIZE; col++) {
      // Само на тъмни клетки
      if ((row + col) % 2 === 1) {
        var piece = createPiece(row, col, true);
        pieces.push(piece);
        board[row][col] = piece;
      }
    }
  }

  currentPlayer = "white";
  selectedPiece = null;
  clearHighlights();
  updateStatus("Ход на белите");
}

// =========================================================
// ЛОГИКА ЗА ВЪЗМОЖНИ ХОДОВЕ
// =========================================================

/**
 * Изчислява всички валидни ходове за даден пул
 * Проверява за обикновени ходове и скокове (взимане)
 * При наличие на скокове, връща САМО тях (задължително взимане)
 * @param {Object} piece - Пулът за проверка
 * @returns {Array} Масив от възможни ходове
 */
function getValidMoves(piece) {
  var moves = [];
  var jumps = [];
  var row = piece.row;
  var col = piece.col;

  // Определяне на посоката (белите се движат нагоре, черните надолу)
  var directions = [];
  if (piece.isWhite || piece.isKing) {
    directions.push({ dr: -1, dc: -1 }); // нагоре-ляво
    directions.push({ dr: -1, dc: 1 }); // нагоре-дясно
  }
  if (!piece.isWhite || piece.isKing) {
    directions.push({ dr: 1, dc: -1 }); // надолу-ляво
    directions.push({ dr: 1, dc: 1 }); // надолу-дясно
  }

  for (var i = 0; i < directions.length; i++) {
    var dr = directions[i].dr;
    var dc = directions[i].dc;
    var newRow = row + dr;
    var newCol = col + dc;

    // Проверка дали е в границите на дъската
    if (
      newRow >= 0 &&
      newRow < BOARD_SIZE &&
      newCol >= 0 &&
      newCol < BOARD_SIZE
    ) {
      if (board[newRow][newCol] === null) {
        // Празна клетка - може да се мести
        moves.push({ row: newRow, col: newCol, isJump: false });
      } else if (board[newRow][newCol].isWhite !== piece.isWhite) {
        // Противников пул - проверка за скок
        var jumpRow = newRow + dr;
        var jumpCol = newCol + dc;
        if (
          jumpRow >= 0 &&
          jumpRow < BOARD_SIZE &&
          jumpCol >= 0 &&
          jumpCol < BOARD_SIZE
        ) {
          if (board[jumpRow][jumpCol] === null) {
            jumps.push({
              row: jumpRow,
              col: jumpCol,
              isJump: true,
              capturedRow: newRow,
              capturedCol: newCol,
            });
          }
        }
      }
    }
  }

  // Ако има скокове, връщаме само тях (задължително взимане)
  if (jumps.length > 0) {
    return jumps;
  }
  return moves;
}

// =========================================================
// ПОДСВЕТКА НА ВЪЗМОЖНИ ХОДОВЕ
// =========================================================

function highlightValidMoves(piece) {
  clearHighlights();

  if (!showHighlightMoves) return;

  var moves = getValidMoves(piece);

  for (var i = 0; i < moves.length; i++) {
    var move = moves[i];
    var x = BOARD_OFFSET + move.col * CELL_SIZE;
    var z = BOARD_OFFSET + move.row * CELL_SIZE;

    var highlight = cylinder(
      [x, 1, z],
      [CELL_SIZE * 0.4, 2, CELL_SIZE * 0.4],
      move.isJump ? "#ff6347" : HIGHLIGHT_COLOR
    );
    highlight.row = move.row;
    highlight.col = move.col;
    highlight.isJump = move.isJump;
    if (move.isJump) {
      highlight.capturedRow = move.capturedRow;
      highlight.capturedCol = move.capturedCol;
    }
    highlightCells.push(highlight);
    boardGroup.add(highlight);
  }
}

function clearHighlights() {
  for (var i = 0; i < highlightCells.length; i++) {
    highlightCells[i].visible = false;
  }
  highlightCells = [];
}

// =========================================================
// ДВИЖЕНИЕ НА ПУЛ
// =========================================================

/**
 * Премества пул на нова позиция с анимация
 * Обработва взимане на противникови пулове и верижни скокове
 * Проверява за превръщане в дама и смяна на играч
 * @param {Object} piece - Пулът за преместване
 * @param {number} targetRow - Целеви ред
 * @param {number} targetCol - Целева колона
 * @param {boolean} isJump - Дали е скок (взимане)
 * @param {number} capturedRow - Ред на взетия пул
 * @param {number} capturedCol - Колона на взетия пул
 */
function movePiece(
  piece,
  targetRow,
  targetCol,
  isJump,
  capturedRow,
  capturedCol
) {
  // Обновяване на логическата дъска
  board[piece.row][piece.col] = null;
  board[targetRow][targetCol] = piece;

  // Изчисляване на целевата позиция
  var targetX = BOARD_OFFSET + targetCol * CELL_SIZE;
  var targetZ = BOARD_OFFSET + targetRow * CELL_SIZE;

  // Запазване на текущата позиция
  var startX = piece.x;
  var startY = piece.y;
  var startZ = piece.z;

  // Анимация с TWEEN - използваме обект с прогрес
  var animState = { progress: 0 };
  new TWEEN.Tween(animState)
    .to({ progress: 1 }, 300)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(function () {
      // Плавно преместване с lerp ефект
      piece.x = startX + (targetX - startX) * animState.progress;
      piece.y = startY + 20 * Math.sin(Math.PI * animState.progress); // Лек скок нагоре
      piece.z = startZ + (targetZ - startZ) * animState.progress;
    })
    .onComplete(function () {
      // Финално позициониране
      piece.x = targetX;
      piece.y = -3;
      piece.z = targetZ;
    })
    .start();

  // Обновяване на координатите на пула
  piece.row = targetRow;
  piece.col = targetCol;

  // Премахване на прескочен пул
  if (isJump) {
    var capturedPiece = board[capturedRow][capturedCol];
    if (capturedPiece) {
      capturedPiece.visible = false;
      board[capturedRow][capturedCol] = null;

      // Премахване от масива с пулове
      var index = pieces.indexOf(capturedPiece);
      if (index > -1) {
        pieces.splice(index, 1);
      }

      updateInfo("Взет пул!");
    }

    // Проверка за верижно скачане
    var additionalJumps = getValidMoves(piece).filter(function (m) {
      return m.isJump;
    });
    if (additionalJumps.length > 0) {
      selectedPiece = piece;
      highlightValidMoves(piece);
      updateStatus("Продължи скачането!");
      return; // Не сменяме играча
    }
  }

  // Проверка за превръщане в дама
  if (piece.isWhite && targetRow === 0) {
    promoteToKing(piece);
  } else if (!piece.isWhite && targetRow === BOARD_SIZE - 1) {
    promoteToKing(piece);
  }

  // Смяна на играча
  selectedPiece = null;
  clearHighlights();
  currentPlayer = currentPlayer === "white" ? "black" : "white";
  updateStatus("Ход на " + (currentPlayer === "white" ? "белите" : "черните"));

  // Плавно нулиране на камерата след ход
  resetCamera();

  // Проверка за победител
  checkWinner();
}

// =========================================================
// ПРОВЕРКА ЗА ПОБЕДИТЕЛ
// =========================================================

function checkWinner() {
  var whitePieces = 0;
  var blackPieces = 0;
  var whiteCanMove = false;
  var blackCanMove = false;

  for (var i = 0; i < pieces.length; i++) {
    if (pieces[i].visible !== false) {
      if (pieces[i].isWhite) {
        whitePieces++;
        if (getValidMoves(pieces[i]).length > 0) whiteCanMove = true;
      } else {
        blackPieces++;
        if (getValidMoves(pieces[i]).length > 0) blackCanMove = true;
      }
    }
  }

  if (blackPieces === 0 || !blackCanMove) {
    updateStatus("🏆 Белите печелят! 🏆");
  } else if (whitePieces === 0 || !whiteCanMove) {
    updateStatus("🏆 Черните печелят! 🏆");
  }
}

// =========================================================
// ОБРАБОТКА НА СЪБИТИЯ
// =========================================================

function onPointerDown(event) {
  // Блокиране на взаимодействие по време на демонстрация
  if (isAutoplayActive) {
    updateInfo("Моля, изчакайте демонстрацията да приключи");
    return;
  }

  var pos = findPosition(event);

  // Опит да намерим кликнат обект
  var clickedPiece = findObject(
    event,
    pieces.filter(function (p) {
      return p.visible !== false;
    })
  );
  var clickedHighlight = findObject(event, highlightCells);

  if (clickedHighlight) {
    // Кликнато върху подсветена клетка - преместване
    if (selectedPiece) {
      movePiece(
        selectedPiece,
        clickedHighlight.row,
        clickedHighlight.col,
        clickedHighlight.isJump,
        clickedHighlight.capturedRow,
        clickedHighlight.capturedCol
      );
    }
  } else if (clickedPiece) {
    // Кликнато върху пул
    var isCurrentPlayerPiece =
      (currentPlayer === "white" && clickedPiece.isWhite) ||
      (currentPlayer === "black" && !clickedPiece.isWhite);

    if (isCurrentPlayerPiece) {
      if (selectedPiece === clickedPiece) {
        // Кликнато върху вече избран пул - отмяна
        selectedPiece = null;
        clearHighlights();
        updateInfo("Изборът е отменен");
      } else {
        // Избиране на нов пул
        selectedPiece = clickedPiece;
        highlightValidMoves(clickedPiece);
        updateInfo(
          "Избран пул на " + getPositionName(clickedPiece.row, clickedPiece.col)
        );
      }
    } else {
      updateInfo("Не е ваш ход!");
    }
  } else {
    // Кликнато върху празно място - започване на въртене
    isDragging = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
  }
}

function onPointerMove(event) {
  if (isDragging) {
    var deltaX = event.clientX - lastMouseX;
    var deltaY = event.clientY - lastMouseY;

    rotationV += deltaX * 0.5;
    rotationH += deltaY * 0.3;

    // Ограничаване на вертикалния ъгъл
    rotationH = clamp(rotationH, 10, 80);

    // Прилагане на ротацията към групата
    boardGroup.spin = [rotationH, rotationV, 0];

    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
  }
}

function onPointerUp(event) {
  isDragging = false;
}

// =========================================================
// ПОМОЩНИ ФУНКЦИИ
// =========================================================

function getPositionName(row, col) {
  var letters = "ABCDEFGH";
  return letters[col] + (BOARD_SIZE - row);
}

function updateStatus(text) {
  document.getElementById("status").innerHTML = text;
}

function updateInfo(text) {
  document.getElementById("info").innerHTML = text;
  setTimeout(function () {
    document.getElementById("info").innerHTML = "";
  }, 3000);
}

function toggleSection(button, sectionId) {
  var section = document.getElementById(sectionId);
  if (section.style.display === "none") {
    section.style.display = "block";
    button.innerHTML = button.innerHTML.replace("Покажи", "Скрий");
  } else {
    section.style.display = "none";
    button.innerHTML = button.innerHTML.replace("Скрий", "Покажи");
  }
}

function resetGame() {
  initGame();
  updateInfo("Нова игра започна!");
}

function toggleCoordinates() {
  showCoordinates = !showCoordinates;
  for (var i = 0; i < coordinateLabels.length; i++) {
    coordinateLabels[i].visible = showCoordinates;
  }
}

/**
 * Плавно връща камерата към изглед отгоре
 * Използва TWEEN анимация за плавен преход
 */
function resetCamera() {
  var startH = rotationH;
  var startV = rotationV;
  var targetH = 0;
  var targetV = 0;

  var animState = { progress: 0 };
  new TWEEN.Tween(animState)
    .to({ progress: 1 }, 500)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(function () {
      rotationH = startH + (targetH - startH) * animState.progress;
      rotationV = startV + (targetV - startV) * animState.progress;
      boardGroup.spin = [rotationH, rotationV, 0];
    })
    .start();
}

// Fullscreen функционалност
function toggleFullscreen() {
  var canvas = document.getElementById("suicaCanvas");
  if (!document.fullscreenElement) {
    if (canvas.requestFullscreen) {
      canvas.requestFullscreen();
    } else if (canvas.webkitRequestFullscreen) {
      canvas.webkitRequestFullscreen();
    } else if (canvas.mozRequestFullScreen) {
      canvas.mozRequestFullScreen();
    } else if (canvas.msRequestFullscreen) {
      canvas.msRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
}

// =========================================================
// АНИМАЦИОНЕН ЦИКЪЛ ЗА TWEEN
// =========================================================

suicaCanvas.ontime = function (t, dt) {
  TWEEN.update();
};

// =========================================================
// СТАРТИРАНЕ НА ИГРАТА
// =========================================================

createBoard();
initGame();

// Начална ротация на дъската
boardGroup.spin = [rotationH, rotationV, 0];
