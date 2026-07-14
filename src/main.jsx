import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { PlayersProvider } from "./context/PlayersContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PlayersProvider>
      <App />
    </PlayersProvider>
  </React.StrictMode>
);
