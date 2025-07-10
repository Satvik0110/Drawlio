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

let lines={};
io.on('connection', (socket)    => {
    console.log(`${socket.id} user just connected!`);   
    socket.on('get-initial-lines', (roomID)=>{
        if(!lines[roomID]) lines[roomID]=[];
        socket.emit('initial-lines', lines[roomID]);
    });

    socket.on('join-room', (roomId) => {
        socket.join(roomId); // Also creates room if doesntt exist 
        console.log(`${socket.id} joined room ${roomId}`);
        socket.to(roomId).emit('user-joined', socket.id);
  });
   
    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
   
   
    socket.on('drawing', (data)=>{
        const roomID=data.roomID;
        lines[roomID].push(data.lastLine);
        socket.to(roomID).emit('draww', data);
    });

      socket.on('clear', (data)=>{
        const roomID=data.roomID;
        socket.to(roomID).emit('clear');
        lines[roomID]=[];
    });

});


app.get('/', (req,res)=>{
    res.json({message:"Hello world!"});
});

server.listen(PORT, ()=>{
    console.log(`Server is listening on port ${PORT}`);
})