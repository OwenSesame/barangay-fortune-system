import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReceiptModal from '../components/ReceiptModal';

export default function StaffReadyToPrint() {
  const navigate = useNavigate();
  const staffId = localStorage.getItem('userId');
  
  const [canReview, setCanReview] = useState(localStorage.getItem('canReview') === '1');
  const [readyRequests, setReadyRequests] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, ready: 0 });
  
  const [showORModal, setShowORModal] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [orNumber, setOrNumber] = useState('');

  useEffect(() => {
    const fetchRequestsAndSync = async () => {
      try {
        // 1. Sync permissions silently in the background
        const profileRes = await axios.get(`http://localhost:5000/api/staff/profile/${staffId}`);
        const currentPermission = Number(profileRes.data.can_review) === 1;
        setCanReview(currentPermission);
        localStorage.setItem('canReview', profileRes.data.can_review);

        // 2. Fetch the Ready Queue
        const response = await axios.get('http://localhost:5000/api/staff/pending-requests');
        setReadyRequests(response.data.filter(req => req.status === 'Waiting for Printing' || req.status === 'Ready for Pickup'));
        
        // 3. Fetch Notifications Count
        setCounts({
          pending: response.data.filter(req => req.status === 'Pending').length,
          ready: response.data.filter(req => req.status === 'Waiting for Printing' || req.status === 'Ready for Pickup').length
        });
      } catch (error) {
        console.error("Failed to fetch requests", error);
      }
    };

    fetchRequestsAndSync();
    const interval = setInterval(fetchRequestsAndSync, 5000);
    return () => clearInterval(interval);
  }, [staffId]);

  const handleReleaseClick = (requestId) => {
    setSelectedRequestId(requestId);
    setOrNumber('');
    setShowORModal(true);
  };

  const generateORCode = (id) => {
    if (!id) return '';
    const salt = 83721;
    const val = (parseInt(id) * salt).toString(16).toUpperCase();
    return `OR-${val.padStart(6, 'X')}`;
  };

  const handleGenerateReceipt = () => {
    const cleanOr = orNumber.trim().toUpperCase();
    if (!cleanOr) return toast.error("Please enter the Official Receipt (OR) / Pickup Code.");
    
    const expectedCode = generateORCode(selectedRequestId);
    if (cleanOr !== expectedCode.toUpperCase()) {
      return toast.error(`Invalid OR Code. The entered code does not match the resident's pickup code (${expectedCode}).`);
    }

    setShowORModal(false);
    setShowReceiptPreview(true);
  };

  const handleUpdateStatus = async (requestId, newStatus, receiptNo = null) => {
    if (newStatus === 'Released' && !window.confirm("Confirm finalizing this transaction?")) return;
    try {
      await axios.put(`http://localhost:5000/api/staff/update-status/${requestId}`, { 
          status: newStatus, 
          official_id: staffId,
          orNumber: receiptNo ? receiptNo.trim() : null
      });
      const response = await axios.get('http://localhost:5000/api/staff/pending-requests');
      setReadyRequests(response.data.filter(req => req.status === 'Waiting for Printing' || req.status === 'Ready for Pickup'));
      setCounts({
        pending: response.data.filter(req => req.status === 'Pending').length,
        ready: response.data.filter(req => req.status === 'Waiting for Printing' || req.status === 'Ready for Pickup').length
      });
      toast.success("Document released successfully!");
      if (newStatus === 'Released') setShowReceiptPreview(false);
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || error.response?.data?.message || "Error releasing document.";
      toast.error(msg);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Segoe UI", Tahoma, sans-serif', backgroundColor: '#f8fafc', overflowY: 'scroll' }}>
      {/* CSS for the glowing notification dots */}
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

      <div style={{ width: '280px', background: '#0f172a', color: 'white', padding: '30px 25px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '24px', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>👨‍💼 Front Desk System</h2>
        <hr style={{ border: '0', borderTop: '1px solid #334155', marginBottom: '40px', width: '100%' }} />
        
        <div style={{ flex: 1 }}>
          <p onClick={() => navigate('/staff-home')} className="transition-all duration-300 hover:translate-x-2 hover:opacity-80" style={{ margin: '25px 0', cursor: 'pointer', fontWeight: 'normal', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
            🏠 Home Dashboard
          </p>
          
          {canReview && (
            <p onClick={() => navigate('/staff-pending')} className="transition-all duration-300 hover:translate-x-2 hover:opacity-80" style={{ margin: '25px 0', cursor: 'pointer', fontWeight: 'normal', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
              📋 Pending Review 
              {counts.pending > 0 && <span className="notification-dot">{counts.pending}</span>}
            </p>
          )}

          <p style={{ margin: '25px 0', cursor: 'default', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center' }}>
            🔖 Ready to Print 
            {counts.ready > 0 && <span className="notification-dot">{counts.ready}</span>}
          </p>
          
          <p onClick={() => navigate('/document-records')} className="transition-all duration-300 hover:translate-x-2 hover:opacity-80" style={{ margin: '25px 0', cursor: 'pointer', fontWeight: 'normal', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
            📁 Document Records
          </p>
        </div>
        <button onClick={handleLogout} className="transition-all duration-300 bg-[#334155] text-white hover:bg-red-500 hover:text-white" style={{ padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Logout</button>
      </div>

      <div style={{ flex: 1, padding: '40px' }}>
        <h1 style={{ margin: '0 0 30px 0', color: '#0f172a', fontSize: '28px' }}>Printing & Release Queue</h1>
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left', fontSize: '14px', textTransform: 'uppercase' }}>
                <th style={{ padding: '15px 25px' }}>Q #</th>
                <th style={{ padding: '15px 25px' }}>Resident Name</th>
                <th style={{ padding: '15px 25px' }}>Document & Purpose</th>
                <th style={{ padding: '15px 25px', width: '200px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {readyRequests.length > 0 ? readyRequests.map((req) => (
                <tr key={req.request_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '15px 25px', fontWeight: 'bold' }}>{req.daily_sequence_no}</td>
                  <td style={{ padding: '15px 25px' }}>{req.first_name} {req.last_name}</td>
                  <td style={{ padding: '15px 25px' }}><b>{req.doc_name}</b><br/><span style={{fontSize:'12px', color:'#64748b'}}>{req.purpose}</span></td>
                  <td style={{ padding: '15px 25px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {req.status === 'Waiting for Printing' ? (
                        <button onClick={() => navigate(`/print/${req.request_id}`)} className="transition-all duration-300 hover:scale-105" style={{ padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>🖨️ Print</button>
                      ) : (
                        <button onClick={() => handleReleaseClick(req.request_id)} className="transition-all duration-300 hover:scale-105" style={{ padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>✅ Mark as Picked Up</button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No documents ready for printing.</td></tr>}
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
        onFinalize={() => handleUpdateStatus(selectedRequestId, 'Released', orNumber)}
        mode="preview"
      />
    </div>
  );
}