//App.jsx
import {Route, BrowserRouter as Router, Routes} from 'react-router-dom' 
import Home from './pages/Home';
import Game from './pages/Game';
import SocketProvider from './SocketProvider';


const App = () => {
 

  return (
    <Router>
      <SocketProvider>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/game' element={<Game />} />
      </Routes>
      </SocketProvider>
    </Router>
  )
}

export default App