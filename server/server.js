const express = require('express');
const app = express();
require('dotenv').config();
const PORT = process.env.PORT || 4000;
const cors = require('cors');
const http = require('http');
const server = http.createServer(app);
const generateRoomID = require('./utils/generateRoomID');
const Room = require('./models/Room');

const allowedOrigin = process.env.FRONTEND_URL;
app.use(cors({
    origin: allowedOrigin,
}));
const io = require('socket.io')(server, {
    cors: {
        origin: allowedOrigin,
        methods: ["GET", "POST"],
    }
});
app.use(express.json());

let rooms = {};

// Importing and initializing the socket event handlers
require('./handlers/socketHandlers')(io, rooms);

app.get('/', (req, res) => {
    res.status(200).json({ message: "Server Testing Endpoint" });
});

//route to create room and join as host.
app.post('/create-room', (req, res) => {
    const { numRounds, timer, maxPlayers } = req.body;
    console.log(numRounds, timer, maxPlayers);
    if (!numRounds || !timer || !maxPlayers) res.status(400).json({ status: 'false' });

    let roomID;
    do {
        roomID = generateRoomID();
    } while (rooms[roomID]);
    rooms[roomID] = new Room(roomID, timer, maxPlayers, numRounds);
    return res.status(201).json({ code: roomID });
})

//route to try and join room
app.post('/join-room', (req, res) => {
    const { id } = req.body;
    if (!id || !rooms[id]) return res.status(404).json({ msg: 'Room not found!' });
    else if (rooms[id].checkSufficientMembers()) return res.status(400).json({ msg: 'Room full' });
    return res.status(200).json({ msg: 'success' });

})

server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
})