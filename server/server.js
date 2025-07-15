const express=require('express');
const app=express();
const PORT=4000;
const cors = require('cors');
const http = require('http');
const server = http.createServer(app);
const wordList=require('./words');

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
                gameInterval: null
            };
        }
//         if (!rooms[roomID].players.includes(socket.id)) {
//   rooms[roomID].players.push(socket.id);
// }
if (!rooms[roomID].players.includes(socket.id)) {
            socket.join(roomID); // Also creates room if doesntt exist 
            rooms[roomID].players.push(socket.id);
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
    // socket.on('set-drawer', ()=>{
    //     const roomID=socket.roomID;
    //     socket.to(roomID).emit('set-guesser');
    // });
    socket.on('start-game', ()=>{
        const room = rooms[socket.roomID];
        if(room.players.length<2){
            console.log('Insufficient members');
            return;
        }
        io.to(room.players[room.drawerIndex]).emit('choose-word', ([wordList[0], wordList[1], wordList[2]])); 
    });

    socket.on('word-chosen', ()=>{
        const room = rooms[socket.roomID];
        const currDrawer=room.drawerIndex;
        console.log('Now drawing..');
        io.to(socket.roomID).emit('set-drawer', room.players[currDrawer]);
        // room.gameInterval= setInterval(()=>{
        //     console.log(`Now drawing: ${room.players[currDrawer]}`);
        //     room.round++;
        //     room.drawerIndex= (room.drawerIndex+1) % room.players.length;
        // },room.timer);
        setTimeout(() => {
        room.round++;
        room.drawerIndex= (room.drawerIndex+1) % room.players.length;
        if(room.round>room.numRounds){
            room.round=0;
            room.drawerIndex=0;
            io.to(socket.roomID).emit('game-over');
        }else{
            room.lines=[];
            io.to(socket.roomID).emit('clear');
            io.to(room.players[room.drawerIndex]).emit('choose-word', ([wordList[0], wordList[1], wordList[2]])); 
        }
        }, room.timer);
    });
});


app.get('/', (req,res)=>{
    res.json({message:"Hello world!"});
});

server.listen(PORT, ()=>{
    console.log(`Server is listening on port ${PORT}`);
})