import './App.css';
import './index.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from './component/SignIn';
import SignUp from './component/SignUp';
import Home from './component/Home';
function App() {
  return (
    <Router>
      <Routes>
        {/* <Route path="/signin" element={<SignIn info={{ theme, prefersDarkMode }} />} /> */}
        <Route path="/signin" element={<SignIn/>} />
        <Route path="/signup" element={<SignUp/>} />
        <Route path="/home" element={<Home/>} />
      </Routes>
    </Router>
  );
}

export default App;
