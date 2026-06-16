// ════════════════════════════════════════════
// CONFIG & STATE
// ════════════════════════════════════════════
const WIN_LINES = [
  [0,1,2], [3,4,5], [6,7,8], // linhas
  [0,3,6], [1,4,7], [2,5,8], // colunas
  [0,4,8], [2,4,6]           // diagonais
];

const X_SVG = `<svg class="mark-svg" viewBox="0 0 100 100">
  <line class="x-line line1" x1="22" y1="22" x2="78" y2="78"/>
  <line class="x-line line2" x1="78" y1="22" x2="22" y2="78"/>
</svg>`;

const O_SVG = `<svg class="mark-svg" viewBox="0 0 100 100">
  <circle class="o-circle" cx="50" cy="50" r="30"/>
</svg>`;

let board = Array(9).fill(null);
let current = 'X';
let mode = 1;           // 1 = vs IA | 2 = 2 jogadores
let gameActive = true;
let scores = { X: 0, O: 0, D: 0 };

// ════════════════════════════════════════════
// DOM REFS
// ════════════════════════════════════════════
const boardEl     = document.getElementById('board');
const cells       = [...document.querySelectorAll('.cell')];
const statusEl    = document.getElementById('status');
const resetBtn    = document.getElementById('reset-btn');
const modeToggle  = document.getElementById('mode-toggle');

const scoreXEl    = document.getElementById('score-x');
const scoreOEl    = document.getElementById('score-o');
const scoreDEl    = document.getElementById('score-d');
const scoreItemX  = document.getElementById('score-item-x');
const scoreItemO  = document.getElementById('score-item-o');

// ════════════════════════════════════════════
// RENDER HELPERS
// ════════════════════════════════════════════
function renderStatus() {
  statusEl.classList.remove('thinking');

  if (!gameActive) return; // mensagem final já definida em endGame()

  if (mode === 1 && current === 'O') {
    statusEl.innerHTML = `A pensar`;
    statusEl.classList.add('thinking');
  } else {
    const cls = current === 'X' ? 'x-text' : 'o-text';
    statusEl.innerHTML = `Vez do <strong class="${cls}">${current}</strong>`;
  }

  scoreItemX.classList.toggle('is-turn', current === 'X' && gameActive);
  scoreItemO.classList.toggle('is-turn', current === 'O' && gameActive);
}

function renderScores() {
  scoreXEl.textContent = scores.X;
  scoreOEl.textContent = scores.O;
  scoreDEl.textContent = scores.D;
}

function placeMark(index, player) {
  board[index] = player;
  cells[index].innerHTML = player === 'X' ? X_SVG : O_SVG;
  cells[index].classList.add('taken');
}

// ════════════════════════════════════════════
// GAME LOGIC
// ════════════════════════════════════════════
function checkWin(b = board) {
  for (const line of WIN_LINES) {
    const [a, c, d] = line;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return line;
  }
  return null;
}

function isFull(b = board) {
  return b.every(c => c !== null);
}

function handleCellClick(e) {
  const index = Number(e.currentTarget.dataset.index);

  if (!gameActive || board[index]) return;
  if (mode === 1 && current === 'O') return; // bloqueia clique durante turno da IA

  play(index);
}

function play(index) {
  placeMark(index, current);

  const winLine = checkWin();
  if (winLine) return endGame('win', winLine);
  if (isFull())  return endGame('draw');

  current = current === 'X' ? 'O' : 'X';
  boardEl.dataset.current = current;
  renderStatus();

  if (mode === 1 && current === 'O' && gameActive) {
    setTimeout(aiMove, 400);
  }
}

function aiMove() {
  if (!gameActive) return;
  const index = bestMove(board);
  if (index !== -1) play(index);
}

function endGame(result, winLine = null) {
  gameActive = false;

  if (result === 'win') {
    winLine.forEach(i => cells[i].classList.add('win'));
    scores[current]++;
    const cls = current === 'X' ? 'x-text' : 'o-text';
    statusEl.innerHTML = `<strong class="${cls}">${current}</strong> venceu! 🎉`;
  } else {
    scores.D++;
    statusEl.textContent = 'Empate! 🤝';
  }

  scoreItemX.classList.remove('is-turn');
  scoreItemO.classList.remove('is-turn');
  renderScores();
}

function resetBoard() {
  board = Array(9).fill(null);
  current = 'X';
  gameActive = true;
  boardEl.dataset.current = current;

  cells.forEach(c => {
    c.innerHTML = '';
    c.classList.remove('taken', 'win');
  });

  renderStatus();
}

// ════════════════════════════════════════════
// AI — MINIMAX (jogador 'O' tenta maximizar)
// ════════════════════════════════════════════
function bestMove(b) {
  let best = -Infinity;
  let move = -1;

  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = 'O';
    const score = minimax(b, 0, false);
    b[i] = null;
    if (score > best) { best = score; move = i; }
  }
  return move;
}

function minimax(b, depth, isMaximizing) {
  const winLine = checkWin(b);
  if (winLine) return isMaximizing ? -10 + depth : 10 - depth;
  if (isFull(b)) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (b[i]) continue;
      b[i] = 'O';
      best = Math.max(best, minimax(b, depth + 1, false));
      b[i] = null;
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (b[i]) continue;
      b[i] = 'X';
      best = Math.min(best, minimax(b, depth + 1, true));
      b[i] = null;
    }
    return best;
  }
}

// ════════════════════════════════════════════
// EVENTS
// ════════════════════════════════════════════
cells.forEach(cell => cell.addEventListener('click', handleCellClick));

resetBtn.addEventListener('click', resetBoard);

modeToggle.addEventListener('click', (e) => {
  const btn = e.target.closest('.mode-btn');
  if (!btn) return;

  mode = Number(btn.dataset.mode);
  modeToggle.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b === btn));

  scores = { X: 0, O: 0, D: 0 };
  renderScores();
  resetBoard();
});

// ════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════
renderScores();
renderStatus();