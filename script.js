(() => {
  "use strict";

  const BOARD_WIDTH = 10;
  const BOARD_HEIGHT = 20;
  const CELL_SIZE = 30;
  const INITIAL_DROP_INTERVAL = 850;

  const boardCanvas = document.querySelector("#board");
  const boardContext = boardCanvas.getContext("2d");
  const nextCanvas = document.querySelector("#next");
  const nextContext = nextCanvas.getContext("2d");

  const colors = ["#68e0c2", "#f5d76e", "#c29cff", "#ff8e70", "#72a7ff", "#7fdd77", "#ff78b7"];
  const shapes = [
    [[1, 1, 1, 1]],
    [[1, 1], [1, 1]],
    [[0, 1, 0], [1, 1, 1]],
    [[1, 0, 0], [1, 1, 1]],
    [[0, 0, 1], [1, 1, 1]],
    [[0, 1, 1], [1, 1, 0]],
    [[1, 1, 0], [0, 1, 1]]
  ];

  let grid = [];
  let currentPiece;
  let nextPiece;
  let score = 0;
  let lines = 0;
  let level = 1;
  let dropInterval = INITIAL_DROP_INTERVAL;
  let lastDropTime = 0;
  let animationFrame;
  let isPlaying = false;
  let isPaused = false;

  const getElement = (id) => document.getElementById(id);

  const createEmptyGrid = () => Array.from(
    { length: BOARD_HEIGHT },
    () => Array(BOARD_WIDTH).fill(0)
  );

  const createPiece = () => {
    const type = Math.floor(Math.random() * shapes.length);
    const shape = shapes[type].map((row) => row.slice());

    return {
      type,
      shape,
      x: Math.floor((BOARD_WIDTH - shape[0].length) / 2),
      y: 0
    };
  };

  // A clockwise matrix rotation. Counter-clockwise is three clockwise turns.
  const rotateClockwise = (matrix) => matrix[0].map((_, index) => (
    matrix.map((row) => row[index]).reverse()
  ));

  const rotateCounterClockwise = (matrix) => rotateClockwise(
    rotateClockwise(rotateClockwise(matrix))
  );

  const collides = (piece, offsetX = 0, offsetY = 0, shape = piece.shape) => {
    return shape.some((row, y) => row.some((value, x) => {
      if (!value) return false;

      const nextX = piece.x + x + offsetX;
      const nextY = piece.y + y + offsetY;

      return nextX < 0 || nextX >= BOARD_WIDTH || nextY >= BOARD_HEIGHT || (
        nextY >= 0 && grid[nextY][nextX]
      );
    }));
  };

  const drawCell = (context, x, y, size, color, isGhost = false) => {
    context.fillStyle = isGhost ? `${color}44` : color;
    context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);

    if (!isGhost) {
      context.fillStyle = "#ffffff22";
      context.fillRect(x * size + 3, y * size + 3, size - 7, 3);
    }
  };

  const drawBoard = () => {
    boardContext.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
    boardContext.fillStyle = "#11161d";
    boardContext.fillRect(0, 0, boardCanvas.width, boardCanvas.height);

    grid.forEach((row, y) => row.forEach((value, x) => {
      if (value) drawCell(boardContext, x, y, CELL_SIZE, colors[value - 1]);
    }));

    if (!currentPiece) return;

    let ghostOffset = 0;
    while (!collides(currentPiece, 0, ghostOffset + 1)) ghostOffset += 1;

    currentPiece.shape.forEach((row, y) => row.forEach((value, x) => {
      if (!value) return;
      drawCell(boardContext, currentPiece.x + x, currentPiece.y + y + ghostOffset, CELL_SIZE, colors[currentPiece.type], true);
      drawCell(boardContext, currentPiece.x + x, currentPiece.y + y, CELL_SIZE, colors[currentPiece.type]);
    }));
  };

  const drawNextPiece = () => {
    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (!nextPiece) return;

    const size = 20;
    const shape = nextPiece.shape;
    const offsetX = (nextCanvas.width - shape[0].length * size) / 2;
    const offsetY = (nextCanvas.height - shape.length * size) / 2;

    shape.forEach((row, y) => row.forEach((value, x) => {
      if (!value) return;
      nextContext.fillStyle = colors[nextPiece.type];
      nextContext.fillRect(offsetX + x * size + 1, offsetY + y * size + 1, size - 2, size - 2);
    }));
  };

  const updateStats = () => {
    getElement("score").textContent = score.toLocaleString();
    getElement("lines").textContent = lines;
    getElement("level").textContent = level;
  };

  const setOverlay = (title, text, visible = true) => {
    getElement("overlayTitle").textContent = title;
    getElement("overlayText").textContent = text;
    getElement("overlay").hidden = !visible;
  };

  const spawnPiece = () => {
    currentPiece = nextPiece || createPiece();
    nextPiece = createPiece();
    drawNextPiece();

    if (collides(currentPiece)) {
      isPlaying = false;
      setOverlay("Game over", "Press restart to try again");
      getElement("status").textContent = "Game over";
    }
  };

  const lockPiece = () => {
    currentPiece.shape.forEach((row, y) => row.forEach((value, x) => {
      if (value && currentPiece.y + y >= 0) {
        grid[currentPiece.y + y][currentPiece.x + x] = currentPiece.type + 1;
      }
    }));

    let cleared = 0;
    grid = grid.filter((row) => {
      if (row.every(Boolean)) {
        cleared += 1;
        return false;
      }
      return true;
    });

    while (grid.length < BOARD_HEIGHT) grid.unshift(Array(BOARD_WIDTH).fill(0));

    if (cleared) {
      lines += cleared;
      score += [0, 100, 300, 500, 800][cleared] * level;
      level = Math.floor(lines / 10) + 1;
      dropInterval = Math.max(90, INITIAL_DROP_INTERVAL - (level - 1) * 70);
      updateStats();
    }

    spawnPiece();
  };

  const move = (offsetX) => {
    if (!isPlaying || isPaused || collides(currentPiece, offsetX)) return;
    currentPiece.x += offsetX;
    drawBoard();
  };

  const softDrop = () => {
    if (!isPlaying || isPaused) return;

    if (collides(currentPiece, 0, 1)) lockPiece();
    else {
      currentPiece.y += 1;
      score += 1;
      updateStats();
    }

    drawBoard();
  };

  const hardDrop = () => {
    if (!isPlaying || isPaused) return;

    let distance = 0;
    while (!collides(currentPiece, 0, distance + 1)) distance += 1;
    currentPiece.y += distance;
    score += distance * 2;
    updateStats();
    lockPiece();
    drawBoard();
  };

  const rotate = (direction) => {
    if (!isPlaying || isPaused) return;

    const rotatedShape = direction === "clockwise"
      ? rotateClockwise(currentPiece.shape)
      : rotateCounterClockwise(currentPiece.shape);

    // Small horizontal kicks make rotations near walls feel natural.
    for (const offsetX of [0, -1, 1, -2, 2]) {
      if (!collides(currentPiece, offsetX, 0, rotatedShape)) {
        currentPiece.shape = rotatedShape;
        currentPiece.x += offsetX;
        break;
      }
    }

    drawBoard();
  };

  const startGame = () => {
    grid = createEmptyGrid();
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = INITIAL_DROP_INTERVAL;
    isPlaying = true;
    isPaused = false;
    nextPiece = createPiece();
    spawnPiece();
    updateStats();
    setOverlay("", "", false);
    getElement("status").textContent = "Playing";
    lastDropTime = performance.now();
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(gameLoop);
  };

  const togglePause = () => {
    if (!isPlaying) return;

    isPaused = !isPaused;
    setOverlay(isPaused ? "Paused" : "", "", isPaused);
    getElement("status").textContent = isPaused ? "Paused" : "Playing";

    if (!isPaused) {
      lastDropTime = performance.now();
      animationFrame = requestAnimationFrame(gameLoop);
    }
  };

  const gameLoop = (time) => {
    if (!isPlaying) return;

    if (!isPaused) {
      if (time - lastDropTime > dropInterval) {
        softDrop();
        lastDropTime = time;
      }
      drawBoard();
      animationFrame = requestAnimationFrame(gameLoop);
    }
  };

  const handleKeyboard = (event) => {
    const controls = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "p", "P"];
    if (controls.includes(event.key)) event.preventDefault();

    if (event.key === "ArrowLeft") move(-1);
    else if (event.key === "ArrowRight") move(1);
    else if (event.key === "ArrowUp") rotate("clockwise");
    else if (event.key === "ArrowDown") rotate("counterclockwise");
    else if (event.key === " ") isPlaying ? hardDrop() : startGame();
    else if (event.key.toLowerCase() === "p") togglePause();
  };

  const handleTouchControl = (action) => {
    const actions = {
      left: () => move(-1),
      right: () => move(1),
      "rotate-clockwise": () => rotate("clockwise"),
      "rotate-counterclockwise": () => rotate("counterclockwise"),
      drop: hardDrop
    };
    actions[action]?.();
  };

  getElement("start").addEventListener("click", startGame);
  getElement("pause").addEventListener("click", togglePause);
  document.addEventListener("keydown", handleKeyboard);
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleTouchControl(button.dataset.action));
  });

  grid = createEmptyGrid();
  drawNextPiece();
  drawBoard();
})();
