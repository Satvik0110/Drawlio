//context, props, state sharing
//shift nodemon to dev dependency
//room in sockets....
//handle conect, disconnect

// Send to server from client	socket.emit(...) (on client)
// Send to sender client only	socket.emit(...) (on server)
// Send to all clients	io.emit(...)
// Send to all except sender	socket.broadcast.emit(...)
// Send to specific client	io.to(socketId).emit(...)
// Send to a room	io.to('roomName').emit(...)
// Send to room except sender	socket.broadcast.to('roomName').emit(...)