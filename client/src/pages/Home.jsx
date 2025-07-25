import { useState, useContext } from "react";
import { SocketContext } from "../SocketProvider";
import axios from "axios";
import { z } from 'zod'; 

//Zod Schemas for Validation
const createRoomSchema = z.object({
  username: z.string().min(3, { message: "Name must be at least 3 characters" }),
  players: z.coerce.number().min(2, { message: "Players must be between 2 and 10" }).max(10, { message: "Players must be between 2 and 10" }),
  rounds: z.coerce.number().min(2, { message: "Rounds must be between 2 and 15" }).max(15, { message: "Rounds must be between 2 and 15" }),
  timer: z.coerce.number().min(30, { message: "Timer must be between 30 and 180" }).max(180, { message: "Timer must be between 30 and 180" })
});

const joinRoomSchema = z.object({
  username: z.string().min(3, { message: "Name must be at least 3 characters" }),
  code: z.string().min(1, { message: "Room code is required" })
});


const Home = () => {
    const [username, setUsername] = useState('');
    const [players, setPlayers] = useState('');
    const [timer, setTimer] = useState('');
    const [code, setCode] = useState('');
    const [rounds, setRounds] = useState('');
    const { socket, setroomID, setName } = useContext(SocketContext);
    const [activeMenu, setActiveMenu] = useState('create');
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');

    const connectToSocket = (id) => {
        if (!socket.connected) {
            socket.connect();
            setroomID(id);
            setName(username);
            console.log(`Connecting to socket with Room ID: ${id} and Username: ${username}`);
        }
    };

    const createRoom = async (e) => {
        e.preventDefault();
        setErrors({});

        const validationResult = createRoomSchema.safeParse({ username, players, rounds, timer });
        if (!validationResult.success) {

            const fieldErrors = validationResult.error.flatten().fieldErrors;
            const newErrors = {};
            for (const key in fieldErrors) {
                newErrors[key] = fieldErrors[key][0];
            }
            setErrors(newErrors);
            return; 
        }
        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/create-room`, { numRounds: validationResult.data.rounds, timer: validationResult.data.timer, maxPlayers: validationResult.data.players });
            console.log(response);
            connectToSocket(response.data.code);
        } catch (error) {
            setServerError('Could not create room, please try again');
            setTimeout(() => setServerError(''), 5000);
        }
    };

    const joinRoom = async (e) => {
        e.preventDefault();
        setErrors({}); 

        const validationResult = joinRoomSchema.safeParse({ username, code });
        if (!validationResult.success) {
            const fieldErrors = validationResult.error.flatten().fieldErrors;
            const newErrors = {};
            for (const key in fieldErrors) {
                newErrors[key] = fieldErrors[key][0];
            }
            setErrors(newErrors);
            return;
        }
        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/join-room`, { id: validationResult.data.code.trim().toUpperCase()});
            console.log(response);
            connectToSocket(validationResult.data.code.trim().toUpperCase());
        } catch (error) {
            setServerError('Invalid Room ID');
            setTimeout(() => setServerError(''), 5000);
        }
    };

    return (
        <div className="bg-gradient-to-br from-gray-900 to-indigo-900 text-white min-h-screen flex items-center justify-center font-sans p-4">
            <div className="w-full max-w-md mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Drawlio
                    </h1>
                </div>
                <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10">
                    <div className="flex">
                        <button onClick={() => { setActiveMenu('create'); setErrors({}); }} className={`w-1/2 p-4 text-lg font-bold focus:outline-none transition-colors duration-300 ${activeMenu === 'create' ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
                            Create Game
                        </button>
                        <button onClick={() => { setActiveMenu('join'); setErrors({}); }} className={`w-1/2 p-4 text-lg font-bold focus:outline-none transition-colors duration-300 ${activeMenu === 'join' ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
                            Join Game
                        </button>
                    </div>

                    <div className="relative h-[420px]">
                        <div className={`absolute top-0 left-0 w-full transition-transform duration-500 ease-in-out ${activeMenu === 'create' ? 'transform translate-x-0' : 'transform -translate-x-full'}`}>
                            <form className="p-8 space-y-4" onSubmit={createRoom} noValidate>
                                <InputField placeholder="Your Name" value={username} onChange={(e) => setUsername(e.target.value)} error={errors.username} />
                                <div className="flex space-x-4">
                                    <div className="w-1/2"><InputField type="number" placeholder="Players (2-10)" value={players} onChange={(e) => setPlayers(e.target.value)} error={errors.players} /></div>
                                    <div className="w-1/2"><InputField type="number" placeholder="Rounds (2-15)" value={rounds} onChange={(e) => setRounds(e.target.value)} error={errors.rounds} /></div>
                                </div>
                                <InputField type="number" placeholder="Timer (30-180s)" value={timer} onChange={(e) => setTimer(e.target.value)} error={errors.timer} />
                                {serverError && <p className="text-red-400 text-sm">{serverError}</p>}
                                <div className="pt-2">
                                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-transform duration-200 transform hover:-translate-y-1 shadow-lg shadow-indigo-600/50">
                                    Create & Start
                                </button>
                                </div>
                            </form>
                        </div>

                        <div className={`absolute top-0 left-0 w-full transition-transform duration-500 ease-in-out ${activeMenu === 'join' ? 'transform translate-x-0' : 'transform translate-x-full'}`}>
                            <form className="p-8 space-y-4" onSubmit={joinRoom} noValidate>
                                <InputField placeholder="Your Name" value={username} onChange={(e) => setUsername(e.target.value)} error={errors.username} />
                                <InputField placeholder="Enter Room Code" value={code} onChange={(e) => setCode(e.target.value)} error={errors.code} />
                                {serverError && <p className="text-red-400 text-sm">{serverError}</p>}
                                <div className="pt-2">
                                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-transform duration-200 transform hover:-translate-y-1 shadow-lg shadow-indigo-600/50">
                                    Join
                                </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InputField = ({ label, error, ...props }) => (
    <div className="h-20">
        <label className="block text-sm font-medium text-gray-400">{label}</label>
        <input
            {...props}
            className={`w-full bg-gray-700 border ${error ? 'border-red-500' : 'border-gray-600'} text-white rounded-lg px-4 py-3 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75`}
        />
        {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
);

    export default Home;