    import { useState, useContext } from "react";
   import { SocketContext } from "../SocketProvider";
   
    const Home = () => {
        const [ID, setID] = useState('');
    const [password, setPassword] = useState('');
    const {socket, connected}= useContext(SocketContext);
        const connectToSocket = () => {
        if(!socket.connected) socket.connect();
        
    };
        const submitForm = (e)=>{
        e.preventDefault();
        if(password=="123" && ID=="abc"){
            console.log('Valid')
            connectToSocket();
        } 
        else console.log('Invalid creds');
    }
    return (
        <>    
            <form>
            <input placeholder='ID' onChange={(e)=>setID(e.target.value)}></input>
            <input placeholder='password' type='password' onChange={(e)=>setPassword(e.target.value)}></input>
            <button type="submit" onClick={submitForm}>Connect</button>
            </form>
            </>
    )
    }

    export default Home