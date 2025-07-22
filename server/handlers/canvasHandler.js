module.exports = (socket, io, rooms) => {
    socket.on('get-initial-lines', () => {
        socket.emit('initial-lines', rooms[socket.roomID].getLines());
    });

    socket.on('drawing', (data) => {
        const roomID = socket.roomID;
        rooms[roomID].setLines(data.lastLine);
        socket.to(roomID).emit('draww', data);
    });

    socket.on('clear', () => {
        const roomID = socket.roomID;
        rooms[roomID].clearLines()
        io.to(roomID).emit('clear');
    });
};