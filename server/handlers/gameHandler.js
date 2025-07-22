//hadnles core game logic of selecting words, switching turns, guessing logic, points etc

const generateWords = require('../utils/generateWords');

module.exports = (socket, io, rooms) => {
    socket.on('start-game', () => {
        const room = rooms[socket.roomID];
        if (!room.checkSufficientMembers()) {
            console.log('Insufficient members');
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

        setTimeout(() => {
            const drawerPoints = room.getGuessed() * 50; // 50 points per guesser
            const [points, pointsThisRd] = room.handleRoundEnd(drawerPoints);

            io.to(socket.roomID).emit('round-results', {
                pointsThisRd,
                points,
            });
            io.to(socket.roomID).emit('turn-over');
            if (room.checkRounds()) {
                io.to(socket.roomID).emit('game-over',points);
                room.prepareNextRound();
            } else {
                room.prepareNextRound();
                const words = generateWords();
                io.to(socket.roomID).emit('choose-word', { words, drawerID: room.getDrawerID() });
            }
        }, room.getTimer());
    });

    socket.on('chat-message', (msg) => {
        const room = rooms[socket.roomID];
        const check = room.checkGuess(msg, socket.id);

        if (check[0]) {
            io.to(socket.roomID).emit('chat-message', { name: socket.name, msg: 'guessed the word!', correct: true, points: check[1] });
        } else {
            io.to(socket.roomID).emit('chat-message', { name: socket.name, msg, correct: false });
        }
    });
};