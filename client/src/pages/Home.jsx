    import { useState, useContext } from "react";
   import { SocketContext } from "../SocketProvider";
   import axios from "axios";
    const Home = () => {
    //     const [ID, setID] = useState('');
    // const [password, setPassword] = useState('');
    //  const [ID, setID] = useState('');

    const [username, setUsername]=useState('');
    const [players, setPlayers] = useState(null);
    const [timer, setTimer]=useState(null);
    const [code, setCode]=useState(null);
    const [rounds, setRounds]=useState(null);

    const {socket, setroomID, setName}= useContext(SocketContext);

        const connectToSocket = (id) => {
        if(!socket.connected){
            socket.connect();
            setroomID(id);
            setName(username);
        } 
    };

    const createRoom= async (e) =>{
        e.preventDefault();
        try {
            const response=await axios.post('http://localhost:4000/create-room', {numRounds:rounds, timer:timer, maxPlayers:players});
            console.log(response);
            connectToSocket(response.data.code);
        } catch (error) {
            console.log(error);
        }
    }
    const joinRoom= async (e) =>{
        e.preventDefault();
        try {
            const response=await axios.post('http://localhost:4000/join-room', {id:code});
            console.log(response);
            connectToSocket(code);
        } catch (error) {
            console.log(error);
        }
    }
    return (
        <>   

            <p>Create Game</p>
            <form>
                <input placeholder="No. of players" onChange={(e)=>setPlayers(e.target.value)}></input>
                <input placeholder="No. of rounds" onChange={(e)=>setRounds(e.target.value)}></input>
                <input placeholder='name' onChange={(e)=>setUsername(e.target.value)}></input>
                <input placeholder="Timer" onChange={(e)=>setTimer(e.target.value)}></input>
                <button type="submit" onClick={createRoom}>Create</button>
            </form>
             <p>Join Game</p>
            <form>
                <input placeholder="Enter Room Code" onChange={(e)=>setCode(e.target.value)}></input>
                <input placeholder='name' onChange={(e)=>setUsername(e.target.value)}></input>
                <button type="submit" onClick={joinRoom}>Join</button>
            </form>
            </>
    )
    }

    export default Home