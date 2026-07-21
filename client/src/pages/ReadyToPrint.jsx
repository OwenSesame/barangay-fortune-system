import AdminSidebar from '../components/AdminSidebar';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReceiptModal from '../components/ReceiptModal';

export default function ReadyToPrint() {
  const navigate = useNavigate();
  const [printQueue, setPrintQueue] = useState([]);
  
  // Persistent Notification State
  const [badgeCounts, setBadgeCounts] = useState({ pending: 0, ready: 0, residentApprovals: 0 });

  const [showORModal, setShowORModal] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [orNumber, setOrNumber] = useState('');

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [requestsRes, residentsRes] = await Promise.all([
            axios.get('http://localhost:5000/api/staff/pending-requests'),
            axios.get('http://localhost:5000/api/admin/pending-residents')
        ]);
        const pending = requestsRes.data.filter(req => req.status === 'Pending').length;
        const ready = requestsRes.data.filter(req => req.status === 'Waiting for Printing' || req.status === 'Ready for Pickup').length;
        const residentApprovals = residentsRes.data.length;
        setBadgeCounts({ pending, ready, residentApprovals });
        
        setPrintQueue(requestsRes.data.filter(req => req.status === 'Waiting for Printing' || req.status === 'Ready for Pickup'));
      } catch (error) {
        console.error("Failed to fetch notification counts", error);
      }
    };
    
    fetchCounts();
    const interval = setInterval(fetchCounts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleReleaseClick = (requestId) => {
    setSelectedRequestId(requestId);
    setOrNumber('');
    setShowORModal(true);
  };

  const handleGenerateReceipt = () => {
    if (!orNumber.trim()) return toast.error("Please enter a valid OR Number.");
    setShowORModal(false);
    setShowReceiptPreview(true);
  };

  const handleReleaseSubmit = async () => {
    if (!window.confirm("Confirm finalizing this transaction?")) return;
    try {
      const adminId = localStorage.getItem('userId');
      await axios.put(`http://localhost:5000/api/staff/update-status/${selectedRequestId}`, { 
          status: 'Released', 
          official_id: adminId,
          orNumber: orNumber.trim()
      });
      setPrintQueue(prev => prev.filter(r => r.request_id !== selectedRequestId));
      toast.success("Document successfully marked as Released with OR!");
      setShowReceiptPreview(false);
    } catch (error) {
      console.error(error);
      toast.error("Error updating document status.");
    }
  };

  const handleNoShow = async (requestId) => {
    if (!window.confirm("WARNING: Mark this resident as a No-Show? This will forfeit their document and clear the queue slot.")) return;
    try {
      const adminId = localStorage.getItem('userId');
      await axios.put(`http://localhost:5000/api/staff/no-show/${requestId}`, { official_id: adminId });
      setPrintQueue(prev => prev.filter(r => r.request_id !== requestId));
      toast.success("Document forfeited due to No-Show.");
    } catch (error) {
      console.error(error);
      toast.error("Error updating document status.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#f8fafc' }}>
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

      {/* Dynamic Admin Sidebar */}
      <AdminSidebar badgeCounts={badgeCounts} />

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
              {printQueue.length > 0 ? printQueue.map((req) => (
                <tr key={req.request_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '15px 25px', fontWeight: 'bold', color: '#0f172a' }}>{req.daily_sequence_no}</td>
                  <td style={{ padding: '15px 25px', color: '#334155', fontWeight: '500' }}>{req.first_name} {req.last_name}</td>
                  <td style={{ padding: '15px 25px' }}>
                    <div style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '14px' }}>{req.doc_name}</div>
                    <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>Purpose: {req.purpose || 'None provided'}</div>
                  </td>
                  <td style={{ padding: '15px 25px' }}>
                    <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: req.status === 'Waiting for Printing' ? '#fef3c7' : '#dcfce7', color: req.status === 'Waiting for Printing' ? '#92400e' : '#166534' }}>
                      {req.status === 'Waiting for Printing' ? 'Waiting for Printing' : 'Ready for Pickup'}
                    </span>
                  </td>
                  <td style={{ padding: '15px 25px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {req.status === 'Waiting for Printing' ? (
                        <button onClick={() => navigate(`/print/${req.request_id}`)} className="transition-all duration-300 hover:scale-105" style={{ padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>🖨️ Print</button>
                      ) : (
                        <>
                          <button onClick={() => handleReleaseClick(req.request_id)} className="transition-all duration-300 hover:scale-105" style={{ padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>✅ Mark as Picked Up</button>
                          <button onClick={() => handleNoShow(req.request_id)} className="transition-all duration-300 hover:scale-105" style={{ padding: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>❌ Mark as No-Show</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No documents are currently waiting to be printed.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Receipt Modal */}
      {showORModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#0f172a', fontSize: '20px' }}>Finalize Transaction</h3>
            <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '14px' }}>Please enter the Official Receipt (OR) Number provided by the resident to officialize this release.</p>
            
            <input 
              type="text" 
              placeholder="e.g. OR-123456" 
              value={orNumber}
              onChange={(e) => setOrNumber(e.target.value)}
              style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '20px', fontSize: '16px', boxSizing: 'border-box' }}
              autoFocus
            />
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowORModal(false)} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
              <button onClick={handleGenerateReceipt} style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Generate Receipt</button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      <ReceiptModal 
        isOpen={showReceiptPreview}
        onClose={() => setShowReceiptPreview(false)}
        orNumber={orNumber}
        requestId={selectedRequestId}
        onFinalize={handleReleaseSubmit}
        mode="preview"
      />
    </div>
  );
}