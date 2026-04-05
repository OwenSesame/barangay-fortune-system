import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ReadyToPrint() {
  const navigate = useNavigate();
  const [printQueue, setPrintQueue] = useState([]);

  const fetchPrintQueue = async () => {
    try {
      // We reuse the staff queue route, but filter strictly for "Ready to Print"
      const response = await axios.get('http://localhost:5000/api/staff/pending-requests');
      const readyOnly = response.data.filter(req => req.status === 'Ready to Print');
      setPrintQueue(readyOnly);
    } catch (error) {
      console.error("Failed to fetch print queue", error);
    }
  };

  useEffect(() => {
    fetchPrintQueue();
    const interval = setInterval(fetchPrintQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  // Reusing the status update route we built earlier!
  const handleRelease = async (requestId) => {
    if (!window.confirm("Confirm: Has the resident physically picked up this document?")) return;

    try {
      const adminId = localStorage.getItem('userId');
      await axios.put(`http://localhost:5000/api/staff/update-status/${requestId}`, {
        status: 'Released',
        official_id: adminId
      });
      alert("Document successfully marked as Released!");
      fetchPrintQueue();
    } catch (error) {
      alert("Error updating document status.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#f8fafc' }}>
      
      {/* Administrator Sidebar */}
      <div style={{ width: '260px', background: '#1e1b4b', color: 'white', padding: '30px 20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '22px', margin: '0 0 40px 0', borderBottom: '1px solid #3730a3', paddingBottom: '15px' }}>Barangay Fortune</h2>
        <div style={{ flex: 1 }}>
          <p onClick={() => navigate('/admin-dashboard')} style={{ margin: '15px 0', cursor: 'pointer', color: '#a5b4fc' }}>🏠 Home</p>
          <p onClick={() => navigate('/account-management')} style={{ margin: '15px 0', cursor: 'pointer', color: '#a5b4fc' }}>👤 Account Management</p>
          <p onClick={() => navigate('/pending-review')} style={{ margin: '15px 0', cursor: 'pointer', color: '#a5b4fc' }}>📋 Pending Review</p>
          <p style={{ margin: '15px 0', cursor: 'pointer', fontWeight: 'bold', color: 'white' }}>🔖 Ready to Print</p>
          <p onClick={() => navigate('/document-management')} style={{ margin: '15px 0', cursor: 'pointer', color: '#a5b4fc' }}>📄 Document Templates</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '10px', background: 'white', color: '#1e1b4b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '40px' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ margin: 0, color: '#0f172a', fontSize: '28px' }}>Printing & Release Queue</h1>
          <p style={{ color: '#64748b', marginTop: '5px' }}>Generate official documents and mark them as released upon pickup.</p>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 25px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <h3 style={{ margin: 0, color: '#334155' }}>Approved Documents ({printQueue.length})</h3>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left', fontSize: '14px', textTransform: 'uppercase' }}>
                <th style={{ padding: '15px 25px' }}>Queue #</th>
                <th style={{ padding: '15px 25px' }}>Resident Name</th>
                <th style={{ padding: '15px 25px' }}>Document & Purpose</th>
                <th style={{ padding: '15px 25px' }}>Status</th>
                <th style={{ padding: '15px 25px', width: '200px' }}>Final Action</th>
              </tr>
            </thead>
            <tbody>
              {printQueue.length > 0 ? (
                printQueue.map((req) => (
                  <tr key={req.request_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '15px 25px', fontWeight: 'bold', color: '#0f172a' }}>{req.daily_sequence_no}</td>
                    <td style={{ padding: '15px 25px', color: '#334155', fontWeight: '500' }}>{req.first_name} {req.last_name}</td>
                    <td style={{ padding: '15px 25px' }}>
                      <div style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '14px' }}>{req.doc_name}</div>
                      <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>Purpose: {req.purpose || 'None provided'}</div>
                    </td>
                    <td style={{ padding: '15px 25px' }}>
                      <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: '#dcfce7', color: '#166534' }}>
                        Ready for Pickup
                      </span>
                    </td>
                    <td style={{ padding: '15px 25px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {/* Reuses our beautiful A4 PrintCertificate page! */}
                        <button onClick={() => navigate(`/print/${req.request_id}`)} style={{ padding: '8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', flex: 1 }}>
                          🖨️ Print
                        </button>
                        <button onClick={() => handleRelease(req.request_id)} style={{ padding: '8px', background: '#64748b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', flex: 1 }}>
                          ✅ Release
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No documents are currently waiting to be printed.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}