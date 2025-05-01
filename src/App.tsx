import { Routes, Route, Link } from 'react-router-dom';
import TextExtractor from './pages/TextExtractor';
import DbTransform from './pages/DbTransform';
import './App.css';
import TextTransform from './pages/TextTransform';

function App() {
  return (
    <div style={{ padding: 20 }}>
      <nav style={{ marginBottom: 20 }}>
        <Link to="/" style={{ marginRight: 10 }}>Text Extractor</Link>
        <Link to="/transform" style={{ marginRight: 10 }}>DB Transform</Link>
        <Link to="/text-transform">Text Transform</Link>
      </nav>

      <Routes>
        <Route path="/" element={<TextExtractor />} />
        <Route path="/transform" element={<DbTransform />} />
        <Route path="/text-transform" element={<TextTransform />} />
      </Routes>
    </div>
  );
}

export default App;