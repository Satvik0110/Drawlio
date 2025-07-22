const express=require('express');
const app=express();
const PORT=4000;
const cors = require('cors');
const http = require('http');
const server = http.createServer(app);
const generateWords = require('./utils/generateWords');
const generateRoomID= require('./utils/generateRoomID');
const Room= require('./models/Room');

app.use(cors());
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
    }
});
app.use(express.json());

let rooms={}

io.on('connection', (socket)    => {
    console.log(`${socket.id} user just connected!`);   
    socket.on('join-room', (data) => {
        const {roomID, name}= data;
        if(rooms[roomID].addPlayer(socket.id)){
            socket.join(roomID); // Also creates room if doesntt exist
            socket.roomID=roomID;
            socket.name=name;
            rooms[roomID]
        }
        io.to(socket.roomID).emit('user-joined', {name:socket.name, hostID: rooms[socket.roomID].getHostID()});
  });


    socket.on('get-initial-lines', ()=>{
        socket.emit('initial-lines', rooms[socket.roomID].getLines()); 
    });

   
    socket.on('disconnect', () => {
      console.log(`${socket.name} disconnected`);
      if(rooms[socket.roomID].deletePlayer(socket.id)){
        console.log('Empty room...deleting');
        delete rooms[socket.roomID];
      }
    });
   
   
    socket.on('drawing', (data)=>{
        const roomID=socket.roomID;
        rooms[roomID].setLines(data.lastLine);
        socket.to(roomID).emit('draww', data);
    });

      socket.on('clear', ()=>{
        const roomID=socket.roomID;
        rooms[roomID].clearLines()
        io.to(roomID).emit('clear');
    });
    
    socket.on('start-game', ()=>{
        const room = rooms[socket.roomID];
        if(!room.checkSufficientMembers()){ 
            console.log('Insufficient members');
            return;
        }
        const words= generateWords();
        io.to(socket.roomID).emit('choose-word', {words, drawerID: room.getDrawerID()});
    });

    socket.on('word-chosen', (word)=>{
        const room = rooms[socket.roomID];
        const [drawerID, timer]=room.roundStart(word);
       
        console.log('Now drawing..');
        io.to(socket.roomID).emit('set-drawer', drawerID, word);
        io.to(socket.roomID).emit('timer-start', { duration: timer });

        setTimeout(() => {
        const drawerPoints = room.getGuessed()*50; // 50 points per guesser
        const [points, pointsThisRd]= room.handleRoundEnd(drawerPoints);
       
        io.to(socket.roomID).emit('turn-over');
        io.to(socket.roomID).emit('round-results', {
            pointsThisRd,
            points,
        });
        if(room.prepareNextRound()){
            io.to(socket.roomID).emit('game-over');
        }else{
            const words= generateWords();
            io.to(socket.roomID).emit('choose-word', {words, drawerID: room.getDrawerID()}); 
        }
        }, room.getTimer());
    });

     socket.on('chat-message', (msg) => {
        const room = rooms[socket.roomID];
            const check= room.checkGuess(msg, socket.id);

            if(check[0]){
                io.to(socket.roomID).emit('chat-message', { name: socket.name, msg: 'guessed the word!', correct: true, points:check[1]});
            }else{
                io.to(socket.roomID).emit('chat-message', { name: socket.name, msg, correct: false });

            }
    });
});


app.get('/', (req,res)=>{
    res.json({message:"Hello world!"});
});

app.post('/create-room', (req,res)=>{
    const {numRounds, timer, maxPlayers}= req.body;
    console.log(numRounds, timer, maxPlayers); 
    if(!numRounds || !timer || !maxPlayers) res.status(401).json({status:'false'});

    let roomID;
    do {
       roomID= generateRoomID();
    } while (rooms[roomID]);
        rooms[roomID]= new Room(roomID, timer, maxPlayers, numRounds);
        return res.status(201).json({code:roomID});
})

app.post('/join-room', (req,res)=>{ 
    const {id} = req.body;
    if(!id || !rooms[id]) return res.status(400).json({msg: 'Room not found!'});
    else if(rooms[id].checkSufficientMembers()) return res.status(400).json({msg: 'Room full'});
    return res.status(200).json({msg:'success'});
    
})

server.listen(PORT, ()=>{
    console.log(`Server is listening on port ${PORT}`);
})