import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Home from "./pages/Home";
import History from "./pages/History";
import CheckInOutWizard from "./pages/CheckInOutWizard";
import IncidentReport from "./pages/IncidentReport";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />

        <Route
          path="/checkin/:id"
          element={
            <ProtectedRoute>
              <CheckInOutWizard mode="checkin" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/checkout/:id"
          element={
            <ProtectedRoute>
              <CheckInOutWizard mode="checkout" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/incident/:id"
          element={
            <ProtectedRoute>
              <IncidentReport />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
