var board = null;
var game = new Chess();
var $status = $('#status');

// Figura tortilganda
function onDrop(source, target) {
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Har doim qirolichaga aylantirish
    });

    if (move === null) return 'snapback';

    // Yurishni Telegram botga yuborish
    window.Telegram.WebApp.sendData(JSON.stringify({
        move: { from: source, to: target }
    }));

    // Holatni yangilash
    updateStatus();
}

// Taxta konfiguratsiyasi
var config = {
    draggable: true,
    position: 'start',
    onDrop: onDrop,
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
};
board = Chessboard('myBoard', config);

// Yangi o‘yin tugmasi
$('#newGameBtn').on('click', function() {
    game.reset();
    board.start();
    updateStatus();
    window.Telegram.WebApp.sendData(JSON.stringify({ action: 'new_game' }));
});

// Orqaga qaytish tugmasi
$('#undoBtn').on('click', function() {
    game.undo();
    board.position(game.fen());
    updateStatus();
    window.Telegram.WebApp.sendData(JSON.stringify({ action: 'undo' }));
});

// Holatni yangilash funksiyasi
function updateStatus() {
    var status = 'O‘yin davom etmoqda...';
    if (game.game_over()) {
        if (game.in_checkmate()) {
            status = 'O‘yin tugadi: Mat!';
        } else if (game.in_stalemate()) {
            status = 'O‘yin tugadi: Pat!';
        } else {
            status = 'O‘yin tugadi!';
        }
    }
    $status.text(status);
}

// Telegram WebAppni sozlash
window.Telegram.WebApp.ready();
window.Telegram.WebApp.expand();

// Telegram MainButton qo‘shish
window.Telegram.WebApp.MainButton.setText('Yurishni tasdiqlash');
window.Telegram.WebApp.MainButton.show();
window.Telegram.WebApp.MainButton.onClick(function() {
    window.Telegram.WebApp.sendData(JSON.stringify({
        move: { from: 'last', to: 'confirmed' } // Oxirgi yurishni tasdiqlash
    }));
});

// Boshlang‘ich holat
updateStatus();