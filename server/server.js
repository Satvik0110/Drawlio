const express=require('express');
const app=express();
const PORT=4000;
const cors = require('cors');
const http = require('http');
const server = http.createServer(app);

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
                round:1
            };
        }
        socket.join(roomID); // Also creates room if doesntt exist 
        rooms[roomID].players.push(socket.id); 
        socket.roomID=roomID;
        socket.name=name;
        console.log(`${socket.name} joined room ${socket.roomID}`);
        socket.to(socket.roomID).emit('user-joined', {name:socket.name, hostID: rooms[socket.roomID].host});
  });


    socket.on('get-initial-lines', ()=>{
        socket.emit('initial-lines', rooms[socket.roomID].lines);
    });

   
    socket.on('disconnect', () => {
      console.log(`${socket.name} disconnected`);
    });
   
   
    socket.on('drawing', (data)=>{
        const roomID=socket.roomID;
        rooms[roomID].lines.push(data.lastLine);
        socket.to(roomID).emit('draww', data);
    });

      socket.on('clear', ()=>{
        const roomID=socket.roomID;
        rooms[roomID].lines=[];
        socket.to(roomID).emit('clear');
    });
    socket.on('set-drawer', ()=>{
        const roomID=socket.roomID;
        socket.to(roomID).emit('set-guesser');
    })

});


app.get('/', (req,res)=>{
    res.json({message:"Hello world!"});
});

server.listen(PORT, ()=>{
    console.log(`Server is listening on port ${PORT}`);
})