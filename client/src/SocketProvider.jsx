import { io } from 'socket.io-client';
import { useEffect, useState, useContext, createContext } from 'react'
import { useNavigate } from 'react-router-dom';
const socket = io('http://localhost:4000', {
  autoConnect: false
});

export const SocketContext=createContext();

const SocketProvider = ({children}) => {
    const navigate= useNavigate();
    const [connected, setConnected]= useState(false);
    useEffect(()=>{
        socket.on('connect', ()=>{
          console.log('Connected to server', socket.id);
          setConnected(true);
          navigate('/game');
        });
        socket.on('disconnect', () => {
          console.log('Disconnected');
          setConnected(false);
          navigate('/');
        });
        
    
        //cleanup
        return () => {
          socket.off('connect');
          socket.off('disconnect');
        };
      });
  return (
    <SocketContext.Provider value={{socket, connected}} > 
      {children}
    </SocketContext.Provider>
  )
}

export default SocketProvider;