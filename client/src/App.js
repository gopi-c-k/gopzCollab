import './App.css';
import './index.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import Hero from './pages/Hero';
import TextEditor from './pages/TextEditor';
import Notification from './pages/Notification';
import CanvasEditor from './pages/CanvasEditor';

import CodeEditor from './pages/CodeEditor';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/home" element={<Home />} />
        <Route path="/" element={<Hero />} />
        <Route path="/notification" element={<Notification />} />
        <Route path="/editor" element={<TextEditor />} />
        <Route path="/canvas/editor" element={<CanvasEditor />} />

        <Route
          path="/code-editor"
          element={
            // ChakraProvider is used *only* for this route.
         
                <CodeEditor />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
