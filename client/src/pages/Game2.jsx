import { Stage, Layer, Line } from 'react-konva';
import { useState, useRef, useContext, useEffect } from 'react';
import { SocketContext } from '../SocketProvider';
export default function DrawingCanvas() {
  const {socket, connected, roomID, name} = useContext(SocketContext); 
  const [lines, setLines] = useState([]);
  const [color, setColor] = useState('black');
  const [tool, setTool] = useState('brush'); // or 'eraser'
  const [isDrawer, setDrawer]= useState(false);
  const [isHost, setHost]=useState(false);
  const isDrawing = useRef(false);
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
        socket.on('set-guesser', ()=>{
          setDrawer(false);
        });
           
    return ()=>{
      socket.off('draww');
      socket.off('clear');
      socket.off('initial-lines');
      socket.off('user-joined');
      socket.off('set-guesser');
    };
  },[connected, roomID]);

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
    setLines([]);
    if (connected) socket.emit('clear', {roomID});
  };

  const startDrawing= () =>{
      setDrawer(true);
      socket.emit('set-drawer', {roomID});
  }
  return (
     <div>
      <p>{`Hi ${name} `}</p>
      {isHost && <p>YOU ARE THE HOST</p>}

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
      {!isDrawer && <button onClick={startDrawing}>DRAW!!</button>}

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
