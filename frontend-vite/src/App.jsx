// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import VideoUpload from "./pages/VideoUpload";
import Results from "./pages/Results";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<VideoUpload />} />
        <Route path="/results" element={<Results />} /> {/* Add this */}
      </Routes>
    </Router>
  );
}

export default App;
