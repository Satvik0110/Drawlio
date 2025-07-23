import { Stage, Layer, Line } from 'react-konva';
import { useState, useRef, useContext, useEffect } from 'react';
import { SocketContext } from '../SocketProvider';
import WordChoiceModal from '../components/WordChoiceModal';
import ChatBox from '../components/ChatBox';

export default function DrawingCanvas() {
  const {socket, connected, roomID, name} = useContext(SocketContext); 
  const [lines, setLines] = useState([]);
  const [color, setColor] = useState('#000000');
  const [tool, setTool] = useState('brush'); 
  const [isDrawer, setDrawer]= useState(false);
  const [Host, setHost]=useState(null);
  const [showButton, setshowButton]=useState(true);
  const isDrawing = useRef(false);
  const [wordOptions, setWordOptions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [displayWord, setdisplayWord]= useState(null);
  const [timer, setTimer] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [disableChat, setdisableChat]= useState(false);
  const [showResults, setShowResults] = useState(false);
  const [resultsData, setResultsData] = useState(null);
  const [showWinner, setShowWinner] = useState(false);
  const [winnerData, setWinnerData] = useState(null);
  const [currentDrawer, setCurrentDrawer] = useState(null);
  const [players, setPlayers]= useState({});
  const [playerPoints, setPlayerPoints] = useState({});
  const [showInsufficientError, setShowInsufficientError] = useState(false);
  const timerInterval = useRef(null);

  useEffect(()=>{
    socket.emit('join-room', {roomID, name}); 
    socket.emit('get-initial-lines');
    socket.on('initial-lines', (lines)=>{
      setLines(lines);
    });
    socket.on('user-joined', (data)=>{
      const {newPlayers,hostID}= data;
      setHost(hostID);
      setPlayers(newPlayers);
      console.log(`new user joined the room!!`);
    });
        socket.on('draww', (data) => {
            setLines(prevLines => [...prevLines, data.lastLine]);
          });
        socket.on('clear',()=>{
          setLines([]);
        });
        socket.on('set-drawer', (socketID, word)=>{
          setDrawer(socket.id===socketID);
          setdisableChat(socket.id===socketID);
          setCurrentDrawer(socketID);
          const spaced = word.split('').map(c => c === ' ' ? '  ' : c).join(' ');
          setdisplayWord(socket.id===socketID ? spaced : spaced.replace(/[A-Z]/gi, '_'));
        });
         socket.on('game-over', (points) => {
            if (timerInterval.current) {
              clearInterval(timerInterval.current);
              timerInterval.current = null;
            }
            setLines([]);
            setDrawer(false);
            setshowButton(true);
            setdisplayWord(null);
            setdisableChat(false);
            setCurrentDrawer(null);
            setTimer(null);
            setPlayerPoints(points);
            const entries = Object.entries(points);
            const winner = entries.sort((a, b) => b[1] - a[1])[0];
            console.log(points);
            console.log(entries);
            console.log(winner);
            setWinnerData(winner);
            setShowWinner(true);
            setTimeout(() => setShowWinner(false), 10000);
            setPlayerPoints({});
          });
          socket.on('choose-word', (data)=>{
              const {words, drawerID}= data;
            if(socket.id===drawerID){
              setWordOptions(words);
              setShowModal(true);
            }else{
              setDrawer(false);
              setCurrentDrawer(drawerID);
              console.log(`${drawerID} is drawing..`);
            }
            });
          socket.on('timer-start', ({duration})=>{
            if (timerInterval.current) {
              clearInterval(timerInterval.current);
            }
            setTimer(duration/1000);
            timerInterval.current = setInterval(()=>{
                setTimer(prev => {
                if (prev === null || prev <= 1) {
                  clearInterval(timerInterval.current);
                  timerInterval.current = null;
                  return null;
                }
                return prev - 1;
            });
            },1000);
          })
          socket.on('turn-over', ()=>{
            if (timerInterval.current) {
              clearInterval(timerInterval.current);
              timerInterval.current = null;
            }
            setLines([]);
            setdisplayWord(null);
            setDrawer(false);
            setChatMessages([]);
            setCurrentDrawer(null);
            setTimer(null);
          });
          socket.on('chat-message', (data) => {
    console.log(data);
    if(data.correct) setdisableChat(true);
    setChatMessages(prev => [...prev, data]);
  });

   socket.on('round-results', (data) => {
    setResultsData(data);
    setPlayerPoints(data.points);
    setShowResults(true);
    setTimeout(() => setShowResults(false), 4000);
  });
  socket.on('disconnect-user', (id)=>{
    console.log(`${players[id]} disconnected`);
    setPlayers(prev => Object.fromEntries(Object.entries(prev).filter(([key, _]) => key !== id)));
  })
  socket.on('insufficient-members', ()=>{
    setshowButton(true);
    setShowInsufficientError(true);
    setTimeout(() => setShowInsufficientError(false), 3000);
  })
           
    return ()=>{
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      socket.off('draww');
      socket.off('clear');
      socket.off('initial-lines');
      socket.off('user-joined');
      socket.off('set-drawer');
      socket.off('game-over');
      socket.off('choose-word');
      socket.off('timer-start');
      socket.off('turn-over');
      socket.off('chat-message');
      socket.off('round-results');
      socket.off('disconnect-user');
    };
  },[connected, roomID, resultsData]);

const sendChat = (e) => {
  e.preventDefault();
  if (chatInput.trim()) {
    socket.emit('chat-message', chatInput);
    setChatInput('');
  }
};

  const handleMouseDown = (e) => {
    if(!isDrawer) return;
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, {
      tool,
      stroke: color,
      strokeWidth: tool === 'eraser' ? 20 : 4,
      points: [pos.x, pos.y],
    }]);
  };

 const handleMouseMove = (e) => {
  if (!isDrawing.current || !isDrawer) return;
  const stage = e.target.getStage();
  const point = stage.getPointerPosition();
  const lastLine = lines[lines.length - 1];
  const newPoints = lastLine.points.concat([point.x, point.y]);
  const updatedLine = {
    ...lastLine,
    points: newPoints,
  };
  const updatedLines = [...lines.slice(0, -1), updatedLine];
  setLines(updatedLines);

  if (connected) socket.emit('drawing', { lastLine: updatedLine, roomID });
  
};

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const handleClear = () => {
    if (connected) socket.emit('clear', {roomID});
  };

  const startGame= () =>{
      setshowButton(false);
      socket.emit('start-game');
  }

  return (
     <div className="relative h-screen w-screen bg-gray-50 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 bg-white shadow-md z-30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Drawlio
            </div>
            <div className="text-lg font-semibold text-gray-700">Hi {name}</div>
            <div className="text-sm text-gray-500">Room: {roomID}</div>
          </div>
          
          <div className="flex items-center space-x-6">
            {currentDrawer && (
              <div className="text-sm font-medium text-blue-600">
                {currentDrawer === socket.id ? "You are drawing" : `${players[currentDrawer]} is drawing`}
              </div>
            )}
            
            {timer !== null && (
              <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                {timer}s left
              </div>
            )}
            
            {displayWord && (
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-mono text-lg  whitespace-pre">
                {displayWord}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute top-20 right-4 bg-white rounded-lg shadow-lg p-4 z-20 w-64">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center border-b pb-2">
          Players ({Object.keys(players).length})
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {Object.entries(players).map(([socketId, playerName]) => (
            <div 
              key={socketId} 
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                socketId === socket.id 
                  ? 'bg-blue-100 border-2 border-blue-300' 
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  socketId === currentDrawer ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                <div className="flex flex-col">
                  <span className={`font-medium ${
                    socketId === socket.id ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    {socketId === socket.id ? `${playerName} (You)` : playerName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {playerPoints[socketId] || 0} pts
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-1">
                {socketId === currentDrawer && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    Drawing
                  </span>
                )}
                {Host===socketId && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                    Host
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {Host===socket.id && showButton && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="flex flex-col items-center">
            <button
              onClick={startGame}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-xl font-semibold shadow-lg transition-colors"
            >
              START GAME
            </button>
            {showInsufficientError && (
              <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
                Insufficient members cannot start
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <WordChoiceModal
          words={wordOptions}
          onChoose={(word) => {
            socket.emit('word-chosen', word);
            setShowModal(false);
            setWordOptions([]);
          }}
        />
      )}

      {showResults && resultsData && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-2xl p-6 z-50 border-2 border-blue-200">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Round Results</h2>
            <div className="space-y-2">
              {Object.entries(resultsData.points)
                .sort((a, b) => b[1] - a[1])
                .map(([id, pts]) => (
                <div key={id} className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded">
                  <span className="font-medium">
                    {id === socket.id ? "You" : players[id]}
                  </span>
                  <span className="text-blue-600 font-bold">
                    {pts} <span className="text-green-600">(+{resultsData.pointsThisRd[id]})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showWinner && winnerData && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 text-center max-w-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Game Over!</h2>
            <div className="mb-6">
              <div className="text-xl text-gray-600 mb-2">Winner:</div>
              <div className="text-2xl font-bold text-green-600">
                {winnerData[0] === socket.id ? "You" : players[winnerData[0]]}
              </div>
            </div>
            <div className="text-lg text-gray-700">
              Final Score: <span className="font-bold text-blue-600">{winnerData[1]} points</span>
            </div>
          </div>
        </div>
      )}

      {isDrawer && (
        <div className="absolute top-20 left-4 bg-white rounded-lg shadow-lg p-4 z-20">
          <div className="flex flex-col space-y-3">
            <div className="flex space-x-2">
              <button
                onClick={() => setTool('brush')}
                className={`px-4 py-2 rounded transition-colors ${
                  tool === 'brush' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Brush
              </button>
              <button
                onClick={() => setTool('eraser')}
                className={`px-4 py-2 rounded transition-colors ${
                  tool === 'eraser' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Eraser
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Color:</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={tool === 'eraser'}
                className="w-12 h-8 rounded border border-gray-300 cursor-pointer disabled:opacity-50"
              />
            </div>
            
            <button
              onClick={handleClear}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
            >
              Clear Canvas
            </button>
          </div>
        </div>
      )}

      <div>
        <ChatBox
          messages={chatMessages}
          input={chatInput}
          setInput={setChatInput}
          onSend={sendChat}
          disableSubmit={disableChat}
        />
      </div>

      <div className="pt-16">
        <Stage
          width={window.innerWidth}
          height={window.innerHeight - 64}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
        >
          <Layer>
            {lines.map((line, i) => (
              <Line
                key={i}
                points={line.points}
                stroke={line.tool === 'eraser' ? 'white' : line.stroke}
                strokeWidth={line.strokeWidth}
                tension={0.5}
                lineCap="round"
                globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}