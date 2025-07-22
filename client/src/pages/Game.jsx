import { Stage, Layer, Line } from 'react-konva';
import { useState, useRef, useContext, useEffect } from 'react';
import { SocketContext } from '../SocketProvider';
import WordChoiceModal from '../components/WordChoiceModal';
import ChatBox from '../components/ChatBox';

export default function DrawingCanvas() {
  const {socket, connected, roomID, name} = useContext(SocketContext); 
  const [lines, setLines] = useState([]);
  const [color, setColor] = useState('#000000');
  const [tool, setTool] = useState('brush'); // or 'eraser'
  const [isDrawer, setDrawer]= useState(false);
  const [isHost, setHost]=useState(false);
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

  useEffect(()=>{
    socket.emit('join-room', {roomID, name}); 
    socket.emit('get-initial-lines');
    socket.on('initial-lines', (lines)=>{
      setLines(lines);
    });
    socket.on('user-joined', (data)=>{
      const {name,hostID}= data;
      setHost(socket.id===hostID);
      console.log(`${name} joined the room!!`);
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
          const spaced = word.split('').map(c => c === ' ' ? '  ' : c).join(' ');
          setdisplayWord(socket.id===socketID ? spaced : spaced.replace(/[A-Z]/gi, '_'));
        });
         socket.on('game-over', () => {
            setLines([]);
            setDrawer(false);
            setshowButton(true);
            setdisplayWord(null);
          //   const entries = Object.entries(resultsData?.points || {});
          // const winner = entries.sort((a, b) => b[1] - a[1])[0];
          // setWinnerData(winner);
          // setShowWinner(true); 
          });
          socket.on('choose-word', (data)=>{
              const {words, drawerID}= data;
            if(socket.id===drawerID){
              setWordOptions(words);
              setShowModal(true);
            }else{
              setDrawer(false);
              console.log(`${drawerID} is drawing..`);
            }
            });
          socket.on('timer-start', ({duration})=>{
            setTimer(duration/1000); //in seconds
            let interval=setInterval(()=>{
                setTimer(prev => {
                if (prev===1) {
                  clearInterval(interval);
                  return null;
                }
                return prev - 1;
            });
            },1000);
          return () => clearInterval(interval);
          })
          socket.on('turn-over', ()=>{
            setLines([]);
            setdisplayWord(null);
            setDrawer(false);
            setChatMessages([]);
          });
          socket.on('chat-message', (data) => {
    console.log(data);
    if(data.correct) setdisableChat(true);
    setChatMessages(prev => [...prev, data]);
  });

   socket.on('round-results', (data) => {
    setResultsData(data);
    setShowResults(true);
    setTimeout(() => setShowResults(false), 5000); // Hide after 5s
  });

           
    return ()=>{
      socket.off('draww');
      socket.off('clear');
      socket.off('initial-lines');
      socket.off('user-joined');
      socket.off('set-drawer');
      socket.off('game-over');
      socket.off('choose-word');
      socket.off('timer-start');
      socket.off('chat-message');
      socket.off('round-results');
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
    // setLines([]);
    if (connected) socket.emit('clear', {roomID});
  };

  const startGame= () =>{
      setshowButton(false);
      socket.emit('start-game');
  }

  return (
     <div>
      <p>{`Hi ${name} `}</p>
      <p> {`Room ID: ${roomID}`}</p>
      {isHost && showButton && <button onClick={startGame}>START</button>}
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
  {timer !== null && <div>Time left: {timer}s</div>}
  {displayWord && <div style={{ whiteSpace: 'pre' }}> {displayWord}</div>}
      {/* Controls */}  
      {isDrawer && <div style={{ position: 'fixed', top: 30, left: 10, zIndex: 10 }}>
        <button onClick={() => setTool('brush')}>Brush</button>
        <button onClick={() => setTool('eraser')}>Eraser</button>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          disabled={tool === 'eraser'}
        />
        <button onClick={handleClear}>Clear</button>
      </div>}
      <ChatBox
      messages={chatMessages}
      input={chatInput}
      setInput={setChatInput}
      onSend={sendChat}
      disableSubmit={disableChat}
    />

    {showResults && resultsData && (
  <div className="modal">
    <h2>Round Results</h2>
    <ul>
      {Object.entries(resultsData.points).map(([id, pts]) => (
        <li key={id}>{id === socket.id ? "You" : id}: {`${pts}(+${resultsData.pointsThisRd[id]})`} pts</li>
      ))}
    </ul>
    {/* <p>Drawer got {resultsData.drawerPoints} pts</p> */}
  </div>
)}
{showWinner && winnerData && (
  <div className="modal">
    <h2>Game Over!</h2>
    <p>Winner: {winnerData[0] === socket.id ? "You" : winnerData[0]}</p>
    <p>Points: {winnerData[1]}</p>
    <button onClick={() => setShowWinner(false)}>Close</button>
  </div>
)}

      {/* Canvas */}
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
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
  );
}
