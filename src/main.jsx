import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  // Opcional: puedes quitar StrictMode para evitar efectos dobles en desarrollo
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);
