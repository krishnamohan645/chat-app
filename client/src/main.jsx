import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./app/store.js";
import SocketProvider from "./socket/SocketProvider.jsx";
import process from "process";
import { Buffer } from "buffer";

const root = ReactDOM.createRoot(document.getElementById("root"));
window.process = process;
window.Buffer = Buffer;
root.render(
  <Provider store={store}>
    <SocketProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SocketProvider>
  </Provider>,
);
