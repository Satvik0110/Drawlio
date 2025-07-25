  import { io } from 'socket.io-client';
  import { useEffect, useState, useContext, createContext } from 'react'
  import { useNavigate } from 'react-router-dom';
  const socket = io(`${import.meta.env.VITE_BACKEND_URL}`, {
    autoConnect: false
  });

  export const SocketContext=createContext();

  const SocketProvider = ({children}) => {
      const navigate= useNavigate();
      const [connected, setConnected]= useState(false);
      const [roomID, setroomID]= useState('');
      const [name, setName]= useState('');
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
      <SocketContext.Provider value={{socket, connected, roomID, setroomID, name, setName}} > 
        {children}
      </SocketContext.Provider>
    )
  }

  export default SocketProvider;