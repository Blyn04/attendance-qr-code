import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LayoutMain from './components/LayoutMain';
import RegistrationForm from './components/RegistrationForm';
import AdminEventForms from './components/AdminEventForms';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Wrap all layout-based pages inside LayoutMain */}
        <Route path="/" element={<LayoutMain />}>
          <Route path="events" element={<div />} /> {/* Placeholder, real content comes from LayoutMain */}
          <Route path="admin/manage-forms" element={<AdminEventForms />} />
        </Route>

        {/* Pages without layout (e.g., public registration form) */}
        <Route path="/form/:eventId" element={<RegistrationForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
