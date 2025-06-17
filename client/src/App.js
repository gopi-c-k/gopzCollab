import './App.css';
import './index.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import TextEditor from './pages/TextEditor';
import Notification from './pages/Notification';
function App() {
  return (
    <Router>
      <Routes>
        {/* <Route path="/signin" element={<SignIn info={{ theme, prefersDarkMode }} />} /> */}
        <Route path="/signin" element={<SignIn/>} />
        <Route path="/signup" element={<SignUp/>} />
        <Route path="/home" element={<Home/>} />
        <Route path="/" element={<Home/>} />
        <Route path='/notification' element={<Notification/>} />
        <Route path="/editor" element={<TextEditor/>} />
      </Routes>
    </Router>
  );
}

export default App;
