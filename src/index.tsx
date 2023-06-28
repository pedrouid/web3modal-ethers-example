import React from "react";
import ReactDOM from "react-dom";
import { Buffer as BufferPolyfill } from "buffer";

import "./index.css";

import App from "./App";

declare global {
  interface Window {
    Buffer: typeof BufferPolyfill;
  }
}

window.Buffer = BufferPolyfill;

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);
