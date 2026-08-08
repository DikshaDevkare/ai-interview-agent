import { Link, Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Interview from './pages/Interview.jsx'
import Feedback from './pages/Feedback.jsx'
import './App.css'

function App() {
  return (
    <main className="app-shell">
      <header>
        <Link className="brand" to="/">AI Interview Agent</Link>
        <nav aria-label="Main navigation">
          <Link to="/">Home</Link>
          <Link to="/interview">Interview</Link>
          <Link to="/feedback">Feedback</Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/feedback" element={<Feedback />} />
      </Routes>
    </main>
  )
}

export default App
