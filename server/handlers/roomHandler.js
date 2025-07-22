module.exports = (socket, io, rooms) => {
    socket.on('join-room', (data) => {
        const { roomID, name } = data;
        if (rooms[roomID].addPlayer(socket.id)) {
            socket.join(roomID); // Also creates room if doesntt exist
            socket.roomID = roomID;
            socket.name = name;
            rooms[roomID]
        }
        io.to(socket.roomID).emit('user-joined', { name: socket.name, hostID: rooms[socket.roomID].getHostID() });
    });

    socket.on('disconnect', () => {
        console.log(`${socket.name} disconnected`);
        if (rooms[socket.roomID].deletePlayer(socket.id)) {
            console.log('Empty room...deleting');
            delete rooms[socket.roomID];
        }
    });
};