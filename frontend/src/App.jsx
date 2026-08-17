import { Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import PrivateRoute from "./components/PrivateRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CheckIn from "./pages/CheckIn";
import CheckOut from "./pages/CheckOut";
import Report from "./pages/Report";
import Vehicle from "./pages/Vehicle";
import Driver from "./pages/Driver";
import Assignment from "./pages/Assignment";
import GpsMap from "./pages/GpsMap";
import User from "./pages/User";
import Forbidden from "./pages/Forbidden";

export default function App() {

  return (

    <Routes>

      {/* Login */}
      <Route
        path="/"
        element={<Login />}
      />

      {/* 403 */}
      <Route
        path="/403"
        element={<Forbidden />}
      />

      {/* Layout */}
      <Route
        element={
          <PrivateRoute
            roles={[
              "SUPER_ADMIN",
              "ADMIN",
              "WAREHOUSE",
            ]}
          >
            <MainLayout />
          </PrivateRoute>
        }
      >

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute
              roles={[
                "SUPER_ADMIN",
                "ADMIN",
                "WAREHOUSE",
              ]}
            >
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* User */}
        <Route
          path="/users"
          element={
            <PrivateRoute
              roles={[
                "SUPER_ADMIN",
              ]}
            >
              <User />
            </PrivateRoute>
          }
        />

        {/* Vehicle */}
        <Route
          path="/vehicles"
          element={
            <PrivateRoute
              roles={[
                "SUPER_ADMIN",
                "ADMIN",
              ]}
            >
              <Vehicle />
            </PrivateRoute>
          }
        />

        {/* Driver */}
        <Route
          path="/drivers"
          element={
            <PrivateRoute
              roles={[
                "SUPER_ADMIN",
                "ADMIN",
              ]}
            >
              <Driver />
            </PrivateRoute>
          }
        />

        {/* Assignment */}
        <Route
          path="/assignments"
          element={
            <PrivateRoute
              roles={[
                "SUPER_ADMIN",
                "ADMIN",
                "WAREHOUSE",
              ]}
            >
              <Assignment />
            </PrivateRoute>
          }
        />

        {/* Check In */}
        <Route
          path="/checkin"
          element={
            <PrivateRoute
              roles={[
                "SUPER_ADMIN",
                "ADMIN",
                "WAREHOUSE",
              ]}
            >
              <CheckIn />
            </PrivateRoute>
          }
        />

        {/* Check Out */}
        <Route
          path="/checkout"
          element={
            <PrivateRoute
              roles={[
                "SUPER_ADMIN",
                "ADMIN",
                "WAREHOUSE",
              ]}
            >
              <CheckOut />
            </PrivateRoute>
          }
        />

        {/* Bản đồ GPS */}
        <Route
          path="/gps-map"
          element={
            <PrivateRoute
              roles={[
                "SUPER_ADMIN",
                "ADMIN",
                "WAREHOUSE",
              ]}
            >
              <GpsMap />
            </PrivateRoute>
          }
        />

        {/* Report */}
        <Route
          path="/report"
          element={
            <PrivateRoute
              roles={[
                "SUPER_ADMIN",
                "ADMIN",
              ]}
            >
              <Report />
            </PrivateRoute>
          }
        />

      </Route>

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>

  );

}