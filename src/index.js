import React, { useContext } from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider, useAuth } from "./context/AuthContext"; // Import AuthContext


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <AuthProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </AuthProvider>
);