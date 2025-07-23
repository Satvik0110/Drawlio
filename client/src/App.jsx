//App.jsx
import {Route, BrowserRouter as Router, Routes, Navigate} from 'react-router-dom' 
import Home from './pages/Home';
import Game from './pages/Game';
import SocketProvider from './SocketProvider';
import { useContext } from 'react';
import { SocketContext } from './SocketProvider';

const App = () => {
  return (
    <Router>
      <SocketProvider>
        <AppRoutes />
      </SocketProvider>
    </Router>
  );
};

const AppRoutes = () => {
  const { connected } = useContext(SocketContext);
  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/game' element={connected ? <Game /> : <Navigate to="/" replace /> } />
    </Routes>
  );
};

export default App;

