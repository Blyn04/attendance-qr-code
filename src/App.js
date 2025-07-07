import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/FirebaseConfig';

import LayoutMain from './components/LayoutMain';
import RegistrationForm from './components/RegistrationForm';
import AdminEventForms from './components/AdminEventForms';
import Dashboard from './components/Dashboard';
import Login from './components/Login';

function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  if (checking) return <div>Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route
          path="/"
          element={
            user ? <Navigate to="/dashboard" replace /> : <Login />
          }
        />
        <Route path="/form/:eventId" element={<RegistrationForm />} />

        {/* PROTECTED ROUTES WRAPPED WITH LayoutMain */}
        {user && (
          <Route path="/" element={<LayoutMain />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="events" element={<div />} />
            <Route path="admin/manage-forms" element={<AdminEventForms />} />
          </Route>
        )}

        {/* REDIRECT UNKNOWN ROUTES */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
