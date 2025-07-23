//hadnles core game logic of selecting words, switching turns, guessing logic, points etc

const generateWords = require('../utils/generateWords');

module.exports = (socket, io, rooms) => {
    socket.on('start-game', () => {
        const room = rooms[socket.roomID];
        if (!room.checkSufficientMembers()) {
            console.log('Insufficient members');
            socket.emit('insufficient-members');
            return;
        }
        const words = generateWords();
        io.to(socket.roomID).emit('choose-word', { words, drawerID: room.getDrawerID() });
    });

    socket.on('word-chosen', (word) => {
        const room = rooms[socket.roomID];
        const [drawerID, timer] = room.roundStart(word);

        console.log('Now drawing..');
        io.to(socket.roomID).emit('set-drawer', drawerID, word);
        io.to(socket.roomID).emit('timer-start', { duration: timer });

        const timeoutId= setTimeout(() => {
            endRound(socket.roomID, rooms, io);
        }, room.getTimer());
        room.setRoundTimeout(timeoutId);
    });

    socket.on('chat-message', (msg) => {
        const room = rooms[socket.roomID];
        const check = room.checkGuess(msg, socket.id);

        if (check[0]) {
            io.to(socket.roomID).emit('chat-message', { name: socket.name, msg: 'guessed the word!', correct: true, points: check[1] });
            if (room.checkAllGuessed()) {
                console.log('All players guessed! Ending round early.');
                clearTimeout(room.getRoundTimeout());
                endRound(socket.roomID, rooms, io);
            }
        } else {
            io.to(socket.roomID).emit('chat-message', { name: socket.name, msg, correct: false });
        }
    });
};

function endRound(roomID, rooms, io) {
    const room = rooms[roomID];
    if (!room) return;
    
    const drawerPoints = room.getGuessed() * 50;
    const [points, pointsThisRd] = room.handleRoundEnd(drawerPoints);

    io.to(roomID).emit('round-results', {
        pointsThisRd,
        points,
    });
    io.to(roomID).emit('turn-over');
    
    if (room.checkRounds()) {
        io.to(roomID).emit('game-over', points);
        room.prepareNextRound();
    } else {
        room.prepareNextRound();
        const words = generateWords();
        io.to(roomID).emit('choose-word', { words, drawerID: room.getDrawerID() });
    }
}