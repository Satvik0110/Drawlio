const handleRoomEvents = require('./roomHandler');
const handleCanvasEvents = require('./canvasHandler');
const handleGameEvents = require('./gameHandler');

module.exports = (io, rooms) => {
    io.on('connection', (socket) => {
        console.log(`${socket.id} user just connected!`);

        handleRoomEvents(socket, io, rooms);
        handleCanvasEvents(socket, io, rooms);
        handleGameEvents(socket, io, rooms);
    });
};