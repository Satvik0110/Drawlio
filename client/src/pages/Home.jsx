    import { useState, useContext } from "react";
   import { SocketContext } from "../SocketProvider";
   
    const Home = () => {
        const [ID, setID] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername]=useState('');
    const {socket, setroomID, setName}= useContext(SocketContext);
        const connectToSocket = (id) => {
        if(!socket.connected){
            socket.connect();
            setroomID(id);
            setName(username);
        } 
    };
        const submitForm = (e)=>{
        e.preventDefault();
        if(password=="123" && ID=="abc"){
            console.log('Valid')
            connectToSocket('room123');
        }else if(password=="234" && ID=="bcd"){
             console.log('Valid')
            connectToSocket('room234');  
        }
        else console.log('Invalid creds');
    }
    return (
        <>    
            <form>
            <input placeholder='ID' onChange={(e)=>setID(e.target.value)}></input>
            <input placeholder='password' type='password' onChange={(e)=>setPassword(e.target.value)}></input>
            <input placeholder='name' onChange={(e)=>setUsername(e.target.value)}></input>
            <button type="submit" onClick={submitForm}>Connect</button>
            </form>
            </>
    )
    }

    export default Home