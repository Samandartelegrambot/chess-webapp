// Shaxmat taxtasi va figurasi ma'lumotlari
const chessboard = document.getElementById('chessboard');
const status = document.getElementById('status');
const moveHistory = document.getElementById('moveHistory');
const whiteTimerEl = document.getElementById('whiteTimer');
const blackTimerEl = document.getElementById('blackTimer');

let game = {
    board: initializeBoard(),
    currentTurn: 'w', // Oq (white) navbatida boshlanadi
    moveHistory: [],
    whiteTime: 600, // 10 daqiqa (soniyalarda)
    blackTime: 600,
    timerInterval: null
};

const pieces = {
    'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
    'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♘'
};

// Boshlang‘ich taxta
function initializeBoard() {
    return [
        ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
        ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
        ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
    ];
}

// Taxtani render qilish
function renderBoard() {
    chessboard.innerHTML = '';
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.classList.add((i + j) % 2 === 0 ? 'white' : 'black');
            cell.dataset.row = i;
            cell.dataset.col = j;

            const piece = game.board[i][j];
            if (piece) {
                cell.innerHTML = `<span class="piece" draggable="true">${pieces[piece]}</span>`;
                cell.querySelector('.piece').addEventListener('dragstart', dragStart);
            }

            cell.addEventListener('dragover', dragOver);
            cell.addEventListener('drop', drop);
            cell.addEventListener('click', highlightMoves);

            chessboard.appendChild(cell);
        }
    }
}

// Drag and Drop funksiyalari
let draggedPiece = null;
let draggedFrom = null;

function dragStart(e) {
    draggedPiece = e.target.textContent;
    draggedFrom = { row: e.target.parentElement.dataset.row, col: e.target.parentElement.dataset.col };
    e.dataTransfer.setData('text/plain', draggedPiece);
    highlightPossibleMoves(draggedFrom.row, draggedFrom.col);
}

function dragOver(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    const target = e.target.closest('.cell');
    if (target && !target.querySelector('.piece')) {
        const toRow = parseInt(target.dataset.row);
        const toCol = parseInt(target.dataset.col);

        if (isValidMove(draggedFrom.row, draggedFrom.col, toRow, toCol)) {
            movePiece(draggedFrom.row, draggedFrom.col, toRow, toCol);
            renderBoard();
            updateStatus();
            updateMoveHistory();
            updateTimers();
            sendMoveToBot(draggedFrom, { row: toRow, col: toCol });
        }
    }
    removeHighlights();
    draggedPiece = null;
    draggedFrom = null;
}

// Mumkin bo‘lgan yurishlarni ta'kidlash
function highlightPossibleMoves(row, col) {
    const piece = game.board[row][col];
    if (!piece) return;

    const moves = getLegalMoves(row, col, piece);
    moves.forEach(move => {
        const cell = chessboard.children[move.row * 8 + move.col];
        cell.classList.add('highlight');
    });
}

function highlightMoves(e) {
    if (e.target.classList.contains('piece')) {
        const row = parseInt(e.target.parentElement.dataset.row);
        const col = parseInt(e.target.parentElement.dataset.col);
        highlightPossibleMoves(row, col);
    }
}

function removeHighlights() {
    const cells = chessboard.querySelectorAll('.cell');
    cells.forEach(cell => cell.classList.remove('highlight'));
}

// Figura yurishi
function movePiece(fromRow, fromCol, toRow, toCol) {
    const piece = game.board[fromRow][fromCol];
    game.board[toRow][toCol] = piece;
    game.board[fromRow][fromCol] = null;
    game.currentTurn = game.currentTurn === 'w' ? 'b' : 'w';
    game.moveHistory.push(`${piece[0] === 'w' ? 'O' : 'Q'}${pieces[piece]} ${fromRow}${fromCol} -> ${toRow}${toCol}`);
    
    // Animatsiya qo‘shish
    const fromCell = chessboard.children[fromRow * 8 + fromCol].querySelector('.piece');
    const toCell = chessboard.children[toRow * 8 + toCol];
    if (fromCell) {
        fromCell.classList.add('moving');
        setTimeout(() => {
            fromCell.classList.remove('moving');
            toCell.innerHTML = fromCell.outerHTML;
            fromCell.remove();
        }, 500);
    }
}

// Haqiqiy shaxmat qoidalarini tekshirish
function getLegalMoves(row, col, piece) {
    const moves = [];
    const color = piece[0]; // 'w' yoki 'b'

    switch (piece.slice(1)) {
        case 'P': // Piyada
            const direction = color === 'w' ? -1 : 1;
            const startRow = color === 'w' ? 6 : 1;
            
            // Oldinga bir qadam
            if (row + direction >= 0 && row + direction < 8 && !game.board[row + direction][col]) {
                moves.push({ row: row + direction, col });
                // Dastlabki qadamda ikki qadam
                if (row === startRow && !game.board[row + direction * 2][col] && !game.board[row + direction][col]) {
                    moves.push({ row: row + direction * 2, col });
                }
            }
            // Diagonal hujum (agar dushman figura bo‘lsa)
            [-1, 1].forEach(delta => {
                if (col + delta >= 0 && col + delta < 8) {
                    const target = game.board[row + direction][col + delta];
                    if (target && target[0] !== color) {
                        moves.push({ row: row + direction, col: col + delta });
                    }
                }
            });
            break;

        case 'N': // Ot
            const knightMoves = [
                [-2, -1], [-2, 1], [-1, -2], [-1, 2],
                [1, -2], [1, 2], [2, -1], [2, 1]
            ];
            knightMoves.forEach(([dr, dc]) => {
                const newRow = row + dr;
                const newCol = col + dc;
                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                    const target = game.board[newRow][newCol];
                    if (!target || target[0] !== color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                }
            });
            break;

        case 'B': // Fil
            [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => {
                for (let i = 1; i < 8; i++) {
                    const newRow = row + i * dr;
                    const newCol = col + i * dc;
                    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                        const target = game.board[newRow][newCol];
                        if (!target) {
                            moves.push({ row: newRow, col: newCol });
                        } else if (target[0] !== color) {
                            moves.push({ row: newRow, col: newCol });
                            break;
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                }
            });
            break;

        case 'R': // Qal’a
            [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => {
                for (let i = 1; i < 8; i++) {
                    const newRow = row + i * dr;
                    const newCol = col + i * dc;
                    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                        const target = game.board[newRow][newCol];
                        if (!target) {
                            moves.push({ row: newRow, col: newCol });
                        } else if (target[0] !== color) {
                            moves.push({ row: newRow, col: newCol });
                            break;
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                }
            });
            break;

        case 'Q': // Qirolicha
            // Fil va qal’a harakatlarini birlashtirish
            getLegalMoves(row, col, `${color}B`).forEach(move => moves.push(move));
            getLegalMoves(row, col, `${color}R`).forEach(move => moves.push(move));
            break;

        case 'K': // Qirol
            [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]].forEach(([dr, dc]) => {
                const newRow = row + dr;
                const newCol = col + dc;
                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                    const target = game.board[newRow][newCol];
                    if (!target || target[0] !== color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                }
            });
            // Rokirovka (castling) qo‘shilishi mumkin, lekin bu komplexroq
            break;
    }

    return moves;
}

function isValidMove(fromRow, fromCol, toRow, toCol) {
    const piece = game.board[fromRow][fromCol];
    if (!piece || piece[0] !== game.currentTurn) return false;

    const moves = getLegalMoves(fromRow, fromCol, piece);
    return moves.some(move => move.row === toRow && move.col === toCol);
}

// Vaqt hisoblagichi
function startTimer() {
    if (game.timerInterval) clearInterval(game.timerInterval);
    game.timerInterval = setInterval(() => {
        if (game.currentTurn === 'w') {
            game.whiteTime--;
            if (game.whiteTime <= 0) {
                endGame('Qora g‘alaba qozondi (vaqt tugadi)');
                return;
            }
            whiteTimerEl.textContent = formatTime(game.whiteTime);
        } else {
            game.blackTime--;
            if (game.blackTime <= 0) {
                endGame('Oq g‘alaba qozondi (vaqt tugadi)');
                return;
            }
            blackTimerEl.textContent = formatTime(game.blackTime);
        }
    }, 1000);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

// O‘yin tugashini tekshirish
function isGameOver() {
    let whiteKing = false, blackKing = false;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (game.board[i][j] === 'wK') whiteKing = true;
            if (game.board[i][j] === 'bK') blackKing = true;
        }
    }
    if (!whiteKing) return 'Qora g‘alaba qozondi!';
    if (!blackKing) return 'Oq g‘alaba qozondi!';
    if (game.moveHistory.length >= 200) return 'Pat (50 yurish qoidasi)';
    return false;
}

function endGame(message) {
    clearInterval(game.timerInterval);
    status.textContent = message;
    window.Telegram.WebApp.sendData(JSON.stringify({ action: 'game_over', message }));
}

// Holatni yangilash
function updateStatus() {
    const gameOver = isGameOver();
    if (gameOver) {
        endGame(gameOver);
    } else {
        status.textContent = `Navbat: ${game.currentTurn === 'w' ? 'Oq' : 'Qora'} (${formatTime(game.currentTurn === 'w' ? game.whiteTime : game.blackTime)})`;
    }
}

// Yurish tarixini yangilash
function updateMoveHistory() {
    moveHistory.innerHTML = game.moveHistory.map((move, index) => {
        const moveNumber = Math.floor(index / 2) + 1;
        return index % 2 === 0 ? `${moveNumber}. ${move}` : ` ${move}<br>`;
    }).join('');
}

// Botga yurish yuborish
function sendMoveToBot(from, to) {
    window.Telegram.WebApp.sendData(JSON.stringify({
        move: { from: `${from.row}${from.col}`, to: `${to.row}${to.col}` }
    }));
}

// Yangi o‘yin
document.getElementById('newGameBtn').addEventListener('click', () => {
    game = {
        board: initializeBoard(),
        currentTurn: 'w',
        moveHistory: [],
        whiteTime: 600,
        blackTime: 600,
        timerInterval: null
    };
    renderBoard();
    updateStatus();
    updateMoveHistory();
    clearInterval(game.timerInterval);
    startTimer();
    window.Telegram.WebApp.sendData(JSON.stringify({ action: 'new_game' }));
});

// Orqaga qaytish
document.getElementById('undoBtn').addEventListener('click', () => {
    if (game.moveHistory.length > 0) {
        game.moveHistory.pop();
        game.currentTurn = game.currentTurn === 'w' ? 'b' : 'w';
        game = {
            board: initializeBoard(),
            currentTurn: game.currentTurn,
            moveHistory: game.moveHistory,
            whiteTime: game.whiteTime,
            blackTime: game.blackTime,
            timerInterval: game.timerInterval
        };
        renderBoard();
        updateStatus();
        updateMoveHistory();
        window.Telegram.WebApp.sendData(JSON.stringify({ action: 'undo' }));
    }
});

// Taslim bo‘lish
document.getElementById('resignBtn').addEventListener('click', () => {
    const winner = game.currentTurn === 'w' ? 'Qora' : 'Oq';
    endGame(`${winner} g‘alaba qozondi (taslim bo‘ldi)`);
    window.Telegram.WebApp.sendData(JSON.stringify({ action: 'resign' }));
});

// Telegram WebApp sozlash
window.Telegram.WebApp.ready();
window.Telegram.WebApp.expand();

window.Telegram.WebApp.MainButton.setText('Yurishni tasdiqlash');
window.Telegram.WebApp.MainButton.show();
window.Telegram.WebApp.MainButton.onClick(() => {
    const moves = game.moveHistory;
    if (moves.length > 0) {
        const lastMove = moves[moves.length - 1].match(/(\d)(\d)\s*->\s*(\d)(\d)/);
        if (lastMove) {
            window.Telegram.WebApp.sendData(JSON.stringify({
                move: { from: `${lastMove[1]}${lastMove[2]}`, to: `${lastMove[3]}${lastMove[4]}` }
            }));
        }
    }
});

// Foydalanuvchi nomini olish
const username = window.Telegram.WebApp.initDataUnsafe?.user?.username || 'Mehmon';
document.getElementById('username').textContent = username;

// Boshlang‘ich holat
renderBoard();
updateStatus();
startTimer();
