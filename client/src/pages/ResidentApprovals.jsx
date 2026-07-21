import AdminSidebar from '../components/AdminSidebar';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function ResidentApprovals() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [pendingResidents, setPendingResidents] = useState([]);
  const [selectedIdImage, setSelectedIdImage] = useState(null);
  const [badgeCounts, setBadgeCounts] = useState({ pending: 0, ready: 0, residentApprovals: 0 });

  useEffect(() => {
    fetchPendingResidents();
  }, []);

  const fetchPendingResidents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/pending-residents');
      setPendingResidents(response.data);
    } catch (error) {
      console.error("Failed to fetch pending residents", error);
    }
  };

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [requestsRes, residentsRes] = await Promise.all([
            axios.get('http://localhost:5000/api/staff/pending-requests'),
            axios.get('http://localhost:5000/api/admin/pending-residents')
        ]);
        const pending = requestsRes.data.filter(req => req.status === 'Pending').length;
        const ready = requestsRes.data.filter(req => req.status === 'Ready to Print').length;
        const residentApprovals = residentsRes.data.length;
        setBadgeCounts({ pending, ready, residentApprovals });
      } catch (error) {
        console.error("Failed to fetch notification counts", error);
      }
    };
    
    fetchCounts();
    const interval = setInterval(fetchCounts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (residentId) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/approve-resident/${residentId}`);
      setPendingResidents(prev => prev.filter(r => r.resident_id !== residentId));
      toast.success("Resident approved successfully! An email notification has been sent.");
    } catch (error) {
      console.error(error);
      toast.error("Error approving resident.");
    }
  };

  const handleReject = async (residentId) => {
    const reason = window.prompt("⚠️ REJECT REGISTRATION\nPlease enter the reason for rejection (e.g., Unclear ID, Suspected Duplicate):");
    if (!reason || reason.trim() === "") return;

    try {
      await axios.put(`http://localhost:5000/api/admin/reject-resident/${residentId}`, { reason });
      setPendingResidents(prev => prev.filter(r => r.resident_id !== residentId));
      toast.success("Resident rejected. An email notification has been sent.");
    } catch (error) {
      console.error(error);
      toast.error("Error rejecting resident.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#f8fafc', overflowY: 'scroll' }}>
      
      <style>
        {`
          @keyframes pulse-red {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }
          .notification-dot {
            display: inline-flex; align-items: center; justify-content: center;
            background: #ef4444; color: white; border-radius: 50%;
            min-width: 20px; height: 20px; font-size: 11px; font-weight: bold;
            margin-left: 10px; animation: pulse-red 2s infinite;
          }
        `}
      </style>

      {/* Admin Sidebar */}
      <AdminSidebar badgeCounts={badgeCounts} />

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '40px' }}>
        <h1 style={{ margin: '0 0 30px 0', color: '#0f172a', fontSize: '28px' }}>Resident Registration Approvals</h1>
        <p style={{ color: '#64748b', marginBottom: '30px' }}>Review and verify resident accounts before they can access E-Services.</p>
        
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left', fontSize: '14px', textTransform: 'uppercase' }}>
                <th style={{ padding: '15px 25px' }}>Name</th>
                <th style={{ padding: '15px 25px' }}>Contact Details</th>
                <th style={{ padding: '15px 25px' }}>Address</th>
                <th style={{ padding: '15px 25px' }}>ID Proof</th>
                <th style={{ padding: '15px 25px', width: '200px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingResidents.length > 0 ? pendingResidents.map((resident) => (
                <tr key={resident.resident_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '15px 25px' }}>
                    <b>{resident.first_name} {resident.last_name}</b><br/>
                    <span style={{fontSize:'12px', color:'#64748b'}}>DOB: {new Date(resident.date_of_birth).toLocaleDateString()}</span>
                  </td>
                  <td style={{ padding: '15px 25px' }}>
                    <span style={{ display: 'block', fontSize: '14px' }}>{resident.email_address}</span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{resident.contact_number}</span>
                  </td>
                  <td style={{ padding: '15px 25px', fontSize: '14px' }}>{resident.addres_street}</td>
                  <td style={{ padding: '15px 25px' }}>
                    {resident.id_proof_image ? (
                        <button onClick={() => setSelectedIdImage(resident.id_proof_image)} style={{ padding: '6px 12px', fontSize: '12px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>👁️ View ID</button>
                    ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>No ID Uploaded</span>
                    )}
                  </td>
                  <td style={{ padding: '15px 25px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleApprove(resident.resident_id)} style={{ padding: '8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', flex: 1 }}>Approve</button>
                      <button onClick={() => handleReject(resident.resident_id)} style={{ padding: '8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', flex: 1 }}>Reject</button>
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No pending resident registrations.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* ID Proof Modal */}
      {selectedIdImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#1e293b' }}>Resident ID Proof</h2>
              <button onClick={() => setSelectedIdImage(null)} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Close Window</button>
            </div>
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center' }}>
              <img src={`http://localhost:5000/${selectedIdImage}`} alt="ID Proof" style={{ width: '100%', maxHeight: '600px', objectFit: 'contain', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
