import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import CMS from "./pages/CMS";

export default function App() {
  return (
    <BrowserRouter basename="/cms/leden">
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* CMS */}
        <Route path="/dashboard" element={<CMS />} />
      </Routes>
    </BrowserRouter>
  );
}
