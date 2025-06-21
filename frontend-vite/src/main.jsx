import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx"; // ✅ Works if App.jsx has `export default App`
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
