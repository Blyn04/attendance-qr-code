import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LayoutMain from './components/LayoutMain';
import RegistrationForm from './components/RegistrationForm';
import AdminEventForms from './components/AdminEventForms';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LayoutMain />}>
           <Route index element={<Dashboard />} />
          <Route path="events" element={<div />} /> 
          <Route path="admin/manage-forms" element={<AdminEventForms />} />
        </Route>
        <Route path="/form/:eventId" element={<RegistrationForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
