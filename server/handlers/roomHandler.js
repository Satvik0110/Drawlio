//handles room joining and disconnecting
const endRound = require('./gameHandler').endRound;
module.exports = (socket, io, rooms) => {
    socket.on('join-room', (data) => {
        const { roomID, name } = data;
        if (rooms[roomID] && rooms[roomID].addPlayer(socket.id, name)) {
            socket.join(roomID); // Also creates room if doesntt exist
            socket.roomID = roomID;
            socket.name = name;
            rooms[roomID]
            io.to(socket.roomID).emit('user-joined', { newPlayers:rooms[roomID].getPlayers() , hostID: rooms[socket.roomID].getHostID() });
        }
    });

    socket.on('disconnect', () => {
        console.log(`${socket.name} disconnected`);
        const room=rooms[socket.roomID];
        if(!room) return;

        if (socket.id===room.getDrawerID() && room.getRoundTimeout()) {
            clearTimeout(room.getRoundTimeout());
            io.to(socket.roomID).emit('drawer-disconnected')
            endRound(socket.roomID, rooms, io);
        }
        const wasHost = socket.id === room.getHostID();

        socket.to(socket.roomID).emit('disconnect-user', socket.id);
        if (rooms[socket.roomID].deletePlayer(socket.id)) {
            console.log('Empty room...deleting');
            delete rooms[socket.roomID];
        }else if(wasHost){
            const newHostID=room.switchHost();
            io.to(socket.roomID).emit('new-host', newHostID);
        }
    });
};