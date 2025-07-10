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
        {/* LOGIN ALWAYS FIRST */}
        <Route path="/" element={<Login />} />

        {/* REGISTRATION FORM PUBLICLY ACCESSIBLE */}
        <Route path="/form/:eventId" element={<RegistrationForm />} />

        {/* PROTECTED ROUTES */}
        {user ? (
          <Route path="/" element={<LayoutMain />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="events" element={<div />} />
            <Route path="admin/manage-forms" element={<AdminEventForms />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/" replace />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
