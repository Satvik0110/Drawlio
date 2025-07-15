const express=require('express');
const app=express();
const PORT=4000;
const cors = require('cors');
const http = require('http');
const server = http.createServer(app);
const generateWords = require('./utils/generateWords');

app.use(cors());
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
    }
});

let rooms={}
io.on('connection', (socket)    => {
    console.log(`${socket.id} user just connected!`);   
    socket.on('join-room', (data) => {
        const {roomID, name}= data;

        if(!rooms[roomID]){
            rooms[roomID]={
                players:[],
                lines:[],
                drawerIndex:0,
                host:socket.id,
                round:0,
                numRounds: 3, //hardcoded for now
                timer: 10000,  //hardcoded for now,
                currentWord:null,
                points: {}, 
                guessed: [], 
            };
        }
//         if (!rooms[roomID].players.includes(socket.id)) {
//   rooms[roomID].players.push(socket.id);
// }
if (!rooms[roomID].players.includes(socket.id)) {
            socket.join(roomID); // Also creates room if doesntt exist 
            rooms[roomID].players.push(socket.id);
            rooms[roomID].points[socket.id] = 0; 
            socket.roomID=roomID;
            socket.name=name;
            console.log(`${rooms[roomID].players.length}`);
            io.to(socket.roomID).emit('user-joined', {name:socket.name, hostID: rooms[socket.roomID].host});
        }
        // rooms[roomID].players.push(socket.id); 
  });


    socket.on('get-initial-lines', ()=>{
        socket.emit('initial-lines', rooms[socket.roomID].lines);
    });

   
    socket.on('disconnect', () => {
      console.log(`${socket.name} disconnected`);
      rooms[socket.roomID].players = rooms[socket.roomID].players.filter(id => id!==socket.id);
      //TO ADD ALL MEMBERS DISCONNECTED PART
      if(rooms[socket.roomID].players.length==0){
        //remove room
        console.log('Empty room...deleting');
        delete rooms[socket.roomID];
      }
    });
   
   
    socket.on('drawing', (data)=>{
        const roomID=socket.roomID;
        rooms[roomID].lines.push(data.lastLine);
        socket.to(roomID).emit('draww', data);
    });

      socket.on('clear', ()=>{
        const roomID=socket.roomID;
        rooms[roomID].lines=[];
        io.to(roomID).emit('clear');
    });
    
    socket.on('start-game', ()=>{
        const room = rooms[socket.roomID];
        if(room.players.length<2){
            console.log('Insufficient members');
            return;
        }
        const words= generateWords();
        io.to(socket.roomID).emit('choose-word', {words, drawerID: room.players[room.drawerIndex]}); 
    });

    socket.on('word-chosen', (word)=>{
        const room = rooms[socket.roomID];
        const currDrawer=room.drawerIndex;
        room.currentWord=word;
        room.startTime = Date.now();
        console.log('Now drawing..');
        io.to(socket.roomID).emit('set-drawer', room.players[currDrawer], word);
        io.to(socket.roomID).emit('timer-start', { duration: room.timer });

        setTimeout(() => {
        room.round++;
        room.drawerIndex= (room.drawerIndex+1) % room.players.length;
            const drawerID = room.players[room.drawerIndex];
            const drawerPoints = room.guessed.length * 50; // 50 points per guesser
            room.points[drawerID] += drawerPoints;
            io.to(socket.roomID).emit('round-results', {
            points: room.points,
            guessed: room.guessed,
            drawer: drawerID,
            drawerPoints,
        });
        if(room.round>room.numRounds){
            room.round=0;
            room.drawerIndex=0;
            io.to(socket.roomID).emit('game-over');
        }else{
            room.lines=[];
            io.to(socket.roomID).emit('turn-over');
            const words= generateWords();
            io.to(socket.roomID).emit('choose-word', {words, drawerID: room.players[room.drawerIndex]}); 
        }
        }, room.timer);
    });

     socket.on('chat-message', (msg) => {
        const room = rooms[socket.roomID];
        if (!room) return;
        // Check for correct guess (case-insensitive)
        if (room.currentWord && msg.trim().toLowerCase() === room.currentWord.trim().toLowerCase()) {
            const timeLeft = Math.max(0, Math.floor((room.timer - (Date.now() - room.startTime)) / 1000));
            const basePoints = 100;
            const bonus = timeLeft * 5;
            room.points[socket.id] += basePoints + bonus;
            room.guessed.push(socket.id);
            io.to(socket.roomID).emit('chat-message', { name: socket.name, msg: 'guessed the word!', correct: true, points: basePoints + bonus  });

        //     if (room.guessed.length === room.players.length - 1) {
        //     io.to(socket.roomID).emit('turn-over');
        // }
        } else {
            io.to(socket.roomID).emit('chat-message', { name: socket.name, msg, correct: false });
        }
    });
});


app.get('/', (req,res)=>{
    res.json({message:"Hello world!"});
});

server.listen(PORT, ()=>{
    console.log(`Server is listening on port ${PORT}`);
})