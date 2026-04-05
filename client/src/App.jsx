import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ResidentDashboard from './pages/ResidentDashboard';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DocumentRequest from './pages/DocumentRequest'; // <-- ADD THIS
import Profile from './pages/Profile';
import PrintCertificate from './pages/PrintCertificate';
import DocumentRecords from './pages/DocumentRecords';
import AccountManagement from './pages/AccountManagement';
import PendingReview from './pages/PendingReview';
import ReadyToPrint from './pages/ReadyToPrint';
import DocumentManagement from './pages/DocumentManagement';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/resident-dashboard" element={<ResidentDashboard />} />
        <Route path="/staff-dashboard" element={<StaffDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/document-request" element={<DocumentRequest />} />
        <Route path="/print/:id" element={<PrintCertificate />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/document-records" element={<DocumentRecords />} />
        <Route path="/account-management" element={<AccountManagement />} />
        <Route path="/pending-review" element={<PendingReview />} />
        <Route path="/ready-to-print" element={<ReadyToPrint />} />
        <Route path="/document-management" element={<DocumentManagement />} />
      </Routes>
    </Router>
  );
}

export default App;