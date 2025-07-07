//App.jsx
import {Route, BrowserRouter as Router, Routes} from 'react-router-dom' 
import Home from './pages/Home';
import Game from './pages/Game';
import Game2 from './pages/Game2';
import SocketProvider from './SocketProvider';


const App = () => {
 

  return (
    <Router>
      <SocketProvider>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/game' element={<Game />} />
        <Route path='/game2' element={<Game2 />} />
      </Routes>
      </SocketProvider>
    </Router>
  )
}

export default App