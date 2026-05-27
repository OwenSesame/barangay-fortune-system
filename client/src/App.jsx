import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ResidentDashboard from './pages/ResidentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ResidentApprovals from './pages/ResidentApprovals';
import DocumentRequest from './pages/DocumentRequest'; // <-- ADD THIS
import Profile from './pages/Profile';
import PrintCertificate from './pages/PrintCertificate';
import DocumentRecords from './pages/DocumentRecords';
import AccountManagement from './pages/AccountManagement';
import PendingReview from './pages/PendingReview';
import ReadyToPrint from './pages/ReadyToPrint';
import DocumentManagement from './pages/DocumentManagement';
import AuditLogs from './pages/AuditLogs';
import StaffHome from './pages/StaffHome';
import StaffPendingReview from './pages/StaffPendingReview';
import StaffReadyToPrint from './pages/StaffReadyToPrint';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/resident-dashboard" element={<ResidentDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/resident-approvals" element={<ResidentApprovals />} />
        <Route path="/document-request" element={<DocumentRequest />} />
        <Route path="/print/:id" element={<PrintCertificate />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/document-records" element={<DocumentRecords />} />
        <Route path="/account-management" element={<AccountManagement />} />
        <Route path="/pending-review" element={<PendingReview />} />
        <Route path="/ready-to-print" element={<ReadyToPrint />} />
        <Route path="/document-management" element={<DocumentManagement />} />
        <Route path="/audit-logs" element={<AuditLogs />} />
        <Route path="/staff-home" element={<StaffHome />} />
        <Route path="/staff-pending" element={<StaffPendingReview />} />
        <Route path="/staff-ready" element={<StaffReadyToPrint />} />
      </Routes>
    </Router>
  );
}

export default App;