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

io.on('connection', (socket)    => {
    console.log(`${socket.id} user just connected!`);
    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
    socket.on('clientMessage', (data) => {
      console.log(`Received from client:${data.text}, ${data.x}, ${data.y}`);
      io.emit('serverMessage', {text: 'Hi client!', x:data.x, y:data.y});
    });
});


app.get('/', (req,res)=>{
    res.json({message:"Hello world!"});
});

server.listen(PORT, ()=>{
    console.log(`Server is listening on port ${PORT}`);
})