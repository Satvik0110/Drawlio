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

let players=[];
let choices={};
let lines=[];
io.on('connection', (socket)    => {
    console.log(`${socket.id} user just connected!`);
    players.push(socket.id);
    console.log(players);
    socket.on('get-initial-lines', (data)=>{
        socket.emit('initial-lines', lines);
    });
   
    socket.on('disconnect', () => {
      console.log('A user disconnected');
      players = players.filter(id => id !== socket.id);
      delete choices[socket.id];
    });
    socket.on('clientMessage', (data) => {
      console.log(`Received from client:${data.text}, ${data.x}, ${data.y}`);
      socket.broadcast.emit('serverMessage', {text: 'Hi client!', x:data.x, y:data.y});
    });
    socket.on('drawing', (data)=>{
        lines.push(data.lastLine);
        socket.broadcast.emit('draww', data);
    });
      socket.on('clear', (data)=>{
        socket.broadcast.emit('clear', data);
    });


    socket.on('choice', (data)=>{
        console.log(`Received choice from ${socket.id}: ${data.choice}`);
        choices[socket.id]=data.choice;
        if(Object.keys(choices).length === 2){
            const [p1, p2] = players;
            const c1 = choices[p1];
            const c2 = choices[p2];
            p1result='';
            p2result='';
            if(c1==c2){
                p1result='draw';
                p2result='draw';
            }
            else if((c1=='paper' && c2=='rock') || (c1=='rock' && c2=='scissors') || (c1=='scissors' && c2=='paper')){
                p1result=`YOU WON BUDDY!!`
                p2result=`Oof you lost...`
            } 
            else{
                p2result=`YOU WON BUDDY!!`
                p1result=`Oof you lost...`
            }
            io.to(p1).emit('result',{you:choices[p1], they: choices[p2], result:p1result} )
            io.to(p2).emit('result', {you:choices[p2], they: choices[p1], result:p2result});
            choices={};
        }

    });
});


app.get('/', (req,res)=>{
    res.json({message:"Hello world!"});
});

server.listen(PORT, ()=>{
    console.log(`Server is listening on port ${PORT}`);
})