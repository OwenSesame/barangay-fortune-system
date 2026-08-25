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
  
  // Payment / OR Generation Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentReq, setSelectedPaymentReq] = useState(null);
  const [paymentOrInput, setPaymentOrInput] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Validation & Release Modal State
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [selectedReleaseReq, setSelectedReleaseReq] = useState(null);
  const [validateOrInput, setValidateOrInput] = useState('');

  // Receipt Preview State
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [previewRequestId, setPreviewRequestId] = useState(null);
  const [previewOrNumber, setPreviewOrNumber] = useState('');

  const createRandomORCode = () => {
    const randomHex = Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase().padStart(6, '0');
    return `OR-${randomHex}`;
  };

  const fetchRequestsAndSync = async () => {
    try {
      const profileRes = await axios.get(`http://localhost:5000/api/staff/profile/${staffId}`);
      const currentPermission = Number(profileRes.data.can_review) === 1;
      setCanReview(currentPermission);
      localStorage.setItem('canReview', profileRes.data.can_review);

      const response = await axios.get('http://localhost:5000/api/staff/pending-requests');
      setReadyRequests(response.data.filter(req => req.status === 'Waiting for Printing' || req.status === 'Ready for Pickup'));
      
      setCounts({
        pending: response.data.filter(req => req.status === 'Pending').length,
        ready: response.data.filter(req => req.status === 'Waiting for Printing' || req.status === 'Ready for Pickup').length
      });
    } catch (error) {
      console.error("Failed to fetch requests", error);
    }
  };

  useEffect(() => {
    fetchRequestsAndSync();
    const interval = setInterval(fetchRequestsAndSync, 5000);
    return () => clearInterval(interval);
  }, [staffId]);

  // Step 1: Open Payment & OR Generation Modal
  const handleOpenPaymentModal = (req) => {
    setSelectedPaymentReq(req);
    setPaymentOrInput(createRandomORCode());
    setShowPaymentModal(true);
  };

  // Step 1: Confirm Payment & Issue OR
  const handleConfirmPayment = async () => {
    if (!paymentOrInput.trim()) {
      return toast.error("Please enter or generate an Official Receipt (OR) number.");
    }
    setIsProcessingPayment(true);
    try {
      const res = await axios.put(`http://localhost:5000/api/staff/generate-or/${selectedPaymentReq.request_id}`, {
        official_id: staffId,
        orNumber: paymentOrInput.trim().toUpperCase()
      });
      toast.success(res.data.message || "Payment confirmed & OR generated!");
      setShowPaymentModal(false);
      fetchRequestsAndSync();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || "Error recording payment.";
      toast.error(msg);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Step 2: Open Validation & Release Modal
  const handleOpenReleaseModal = (req) => {
    setSelectedReleaseReq(req);
    setValidateOrInput('');
    setShowValidateModal(true);
  };

  // Step 2: Validate entered OR code
  const handleValidateOR = () => {
    const cleanInput = validateOrInput.trim().toUpperCase();
    if (!cleanInput) {
      return toast.error("Please enter the Official Receipt (OR) Number from the resident's receipt.");
    }

    if (selectedReleaseReq.or_number && cleanInput !== selectedReleaseReq.or_number.toUpperCase()) {
      return toast.error(`Invalid OR Code. The code does not match the issued Official Receipt (${selectedReleaseReq.or_number}).`);
    }

    setShowValidateModal(false);
    setPreviewRequestId(selectedReleaseReq.request_id);
    setPreviewOrNumber(cleanInput);
    setShowReceiptPreview(true);
  };

  // Step 3: Finalize Release and Save to Audit Logs
  const handleFinalizeRelease = async () => {
    if (!window.confirm("Confirm finalizing this transaction and releasing the official document?")) return;
    try {
      await axios.put(`http://localhost:5000/api/staff/update-status/${previewRequestId}`, { 
          status: 'Released', 
          official_id: staffId,
          orNumber: previewOrNumber
      });
      setShowReceiptPreview(false);
      toast.success("Document successfully released and recorded in Audit Logs!");
      fetchRequestsAndSync();
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
        <h1 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '28px' }}>Printing, Payment & Release Queue</h1>
        <p style={{ margin: '0 0 30px 0', color: '#64748b', fontSize: '14px' }}>Print approved certificates, process cashier payments (generate OR), and validate receipts to release documents.</p>
        
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left', fontSize: '14px', textTransform: 'uppercase' }}>
                <th style={{ padding: '15px 25px' }}>Q #</th>
                <th style={{ padding: '15px 25px' }}>Resident Name</th>
                <th style={{ padding: '15px 25px' }}>Document & Fee</th>
                <th style={{ padding: '15px 25px' }}>Payment Status</th>
                <th style={{ padding: '15px 25px', width: '230px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {readyRequests.length > 0 ? readyRequests.map((req) => (
                <tr key={req.request_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '15px 25px', fontWeight: 'bold', color: '#1e293b' }}>{req.daily_sequence_no}</td>
                  <td style={{ padding: '15px 25px', fontWeight: '500', color: '#0f172a' }}>{req.first_name} {req.last_name}</td>
                  <td style={{ padding: '15px 25px' }}>
                    <b style={{ color: '#1e3a8a' }}>{req.doc_name}</b><br/>
                    <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 'bold' }}>Fee: ₱{req.base_fee || 0}</span>
                  </td>
                  <td style={{ padding: '15px 25px' }}>
                    {req.status === 'Waiting for Printing' ? (
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: '#fef3c7', color: '#92400e' }}>
                        🖨️ Needs Printing
                      </span>
                    ) : req.or_number ? (
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: '#dcfce7', color: '#15803d' }}>
                        💰 Paid ({req.or_number})
                      </span>
                    ) : (
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: '#fee2e2', color: '#991b1b' }}>
                        ⏳ Unpaid / Awaiting Cashier
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '15px 25px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {req.status === 'Waiting for Printing' ? (
                        <button onClick={() => navigate(`/print/${req.request_id}`)} className="transition-all duration-300 hover:scale-105" style={{ padding: '9px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>🖨️ Print Certificate</button>
                      ) : !req.or_number ? (
                        <button onClick={() => handleOpenPaymentModal(req)} className="transition-all duration-300 hover:scale-105" style={{ padding: '9px', background: '#d97706', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>💳 Receive Pay & Issue OR</button>
                      ) : (
                        <button onClick={() => handleOpenReleaseModal(req)} className="transition-all duration-300 hover:scale-105" style={{ padding: '9px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>📦 Validate OR & Release</button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No documents currently in printing or payment queue.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Cashier Payment & OR Generation Modal */}
      {showPaymentModal && selectedPaymentReq && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '420px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '20px' }}>💳 Cashier - Process Payment</h3>
            <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '13px' }}>Collect payment from the resident and issue an Official Receipt (OR) number.</p>
            
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ color: '#64748b' }}>Resident:</span>
                <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{selectedPaymentReq.first_name} {selectedPaymentReq.last_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ color: '#64748b' }}>Document:</span>
                <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{selectedPaymentReq.doc_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', borderTop: '1px dashed #cbd5e1', paddingTop: '8px', marginTop: '8px' }}>
                <span style={{ color: '#0f172a', fontWeight: 'bold' }}>AMOUNT TO PAY:</span>
                <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '18px' }}>₱{selectedPaymentReq.base_fee || 0}</span>
              </div>
            </div>

            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Official Receipt (OR) Number</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input 
                type="text" 
                value={paymentOrInput}
                onChange={(e) => setPaymentOrInput(e.target.value)}
                style={{ flex: 1, padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', color: '#0f172a', letterSpacing: '1px' }}
                placeholder="e.g. OR-123456"
              />
              <button 
                type="button" 
                onClick={() => setPaymentOrInput(createRandomORCode())} 
                style={{ padding: '10px 14px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                title="Generate another code"
              >
                🔄 Randomize
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowPaymentModal(false)} style={{ padding: '10px 18px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
              <button onClick={handleConfirmPayment} disabled={isProcessingPayment} style={{ padding: '10px 20px', background: '#d97706', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                {isProcessingPayment ? 'Processing...' : 'Confirm Pay & Issue OR'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Releasing Validation Modal */}
      {showValidateModal && selectedReleaseReq && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '420px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '20px' }}>📦 Validate OR & Release</h3>
            <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '13px' }}>
              Enter the Official Receipt (OR) Number from the resident's payment receipt to validate and finalize document release.
            </p>
            
            <div style={{ background: '#f0fdf4', padding: '12px 16px', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '18px' }}>
              <span style={{ fontSize: '13px', color: '#166534', fontWeight: 'bold' }}>
                Resident: {selectedReleaseReq.first_name} {selectedReleaseReq.last_name} ({selectedReleaseReq.doc_name})
              </span>
            </div>

            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Enter OR Number</label>
            <input 
              type="text" 
              placeholder="e.g. OR-123456" 
              value={validateOrInput}
              onChange={(e) => setValidateOrInput(e.target.value)}
              style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '20px', fontSize: '16px', boxSizing: 'border-box', fontWeight: 'bold' }}
              autoFocus
            />
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowValidateModal(false)} style={{ padding: '10px 18px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
              <button onClick={handleValidateOR} style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Validate & Preview</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Official Receipt Preview & Final Release Modal */}
      <ReceiptModal 
        isOpen={showReceiptPreview}
        onClose={() => setShowReceiptPreview(false)}
        orNumber={previewOrNumber}
        requestId={previewRequestId}
        onFinalize={handleFinalizeRelease}
        mode="preview"
      />
    </div>
  );
}