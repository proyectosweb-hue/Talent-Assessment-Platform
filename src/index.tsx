import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";

/**
 * Punto de entrada principal de la aplicación.
 * Se encarga de montar el componente <App /> en el elemento #root del HTML.
 */

const container = document.getElementById("root");

if (!container) {
  throw new Error(
    "No se encontró el elemento raíz. Asegúrate de que index.html tenga un <div id='root'></div>"
  );
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);