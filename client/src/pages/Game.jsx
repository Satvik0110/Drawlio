import { useContext } from "react"
import { SocketContext } from "../SocketProvider"

const Game = () => {
  const {socket, connected}= useContext(SocketContext);
  const sendMsg= () =>{
    socket.emit('clientMessage', {x:5, y:10, text:'hi server!!'});
  }
  return (
    <>
    <div>Game</div>
    <button onClick={sendMsg}>Send Msg</button>
    </>

  )
}

export default Game