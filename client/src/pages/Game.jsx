import { useEffect, useState, useContext} from "react"
import { SocketContext } from "../SocketProvider"

const Game = () => {
  const {socket, connected}= useContext(SocketContext);
  const [x, setX]= useState(null);
  const [y, setY]= useState(null);
  useEffect(()=>{
    if(connected){
      socket.on('serverMessage', (data) => {
            console.log(`Server says: ${data.text}, ${data.x}, ${data.y}`);
            setX(data.x);
            setY(data.y);
          });
    }

    return ()=>{
      socket.off('serverMessage');
    };
  },[connected]);
  const sendMsg= () =>{
    socket.emit('clientMessage', {x, y, text:'hi server!!'});
  }
  return (
    <>
    <div>Game</div>
    <input placeholder="x" onChange={(e)=>setX(e.target.value)}></input>
    <input placeholder="y" onChange={(e)=>setY(e.target.value)}></input>
    <button onClick={sendMsg}>Send Msg</button>
    {x!=null && <div>{x}</div>}
    {y!=null && <div>{y}</div>}
    </>

  )
}

export default Game