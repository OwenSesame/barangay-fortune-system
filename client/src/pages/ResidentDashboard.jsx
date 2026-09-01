import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import ResidentBottomNav from '../components/ResidentBottomNav';

export default function ResidentDashboard() {
  const navigate = useNavigate();
  
  const [queueInfo, setQueueInfo] = useState({ queueNumber: '--', status: 'Pending', scheduledDate: null, or_number: null, base_fee: 0, doc_name: '' });
  const [history, setHistory] = useState([]);

  // --- UPGRADED: Translation with Fail-Safes ---
  const getDisplayStatus = (dbStatus, orNumber) => {
    // If the database sends "undefined" or nothing, default to Pending
    if (!dbStatus || dbStatus === 'undefined') return 'Pending'; 
    if (dbStatus === 'Waiting for Printing') return 'Waiting for Printing';
    if (dbStatus === 'Ready for Pickup') {
      return orNumber ? 'Ready for Pickup (Paid)' : 'Ready for Pickup (Unpaid)';
    }
    if (dbStatus === 'Released') return 'Completed / Picked Up';
    return dbStatus;
  };

  const fetchMyData = useCallback(async () => {
    try {
      const myId = localStorage.getItem('userId');
      if (!myId) return navigate('/');

      const queueResponse = await axios.get(`http://localhost:5000/api/requests/latest/${myId}`);
      if (queueResponse.data && queueResponse.data.daily_sequence_no) {
        setQueueInfo({
          queueNumber: queueResponse.data.daily_sequence_no,
          status: queueResponse.data.request_status || 'Pending',
          scheduledDate: queueResponse.data.scheduled_date,
          requestId: queueResponse.data.request_id,
          or_number: queueResponse.data.or_number,
          base_fee: queueResponse.data.base_fee,
          doc_name: queueResponse.data.doc_name
        });
      }

      const historyResponse = await axios.get(`http://localhost:5000/api/requests/history/${myId}`);
      setHistory(historyResponse.data);

    } catch (error) {
      console.error("Dashboard sync error:", error);
    }
  }, [navigate]);

  useEffect(() => {
    fetchMyData();
    const interval = setInterval(fetchMyData, 5000); 
    return () => clearInterval(interval);
  }, [fetchMyData]);

  const handleCancel = async (requestId) => {
    if (!window.confirm("Are you sure you want to cancel this request?")) return;

    try {
      await axios.put(`http://localhost:5000/api/requests/cancel/${requestId}`);
      toast.success("Application Cancelled Successfully.");
      fetchMyData(); // Refresh the table
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Error cancelling request.";
      toast.error(errorMsg);
    }
  };
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen font-sans pb-[65px] md:pb-0" style={{ background: 'transparent' }}>
      
      {/* Sidebar (Hidden on Mobile) */}
      <div className="glass-panel hidden md:flex flex-col w-[280px] p-[30px_20px] sticky top-0 h-screen overflow-y-auto z-10" style={{ borderRight: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15, 23, 42, 0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px', padding: '0 10px' }}>
          <div style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', boxShadow: '0 0 15px rgba(59,130,246,0.2)' }}>
            <span style={{ color: 'var(--neon-blue)', fontSize: '18px' }}>🏘️</span>
          </div>
          <div>
             <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 'bold', color: 'white', letterSpacing: '0.5px' }}>Resident Portal</h2>
             <p style={{ margin: 0, fontSize: '12px', color: 'var(--neon-blue)', textTransform: 'uppercase', letterSpacing: '1px' }}>E-Services</p>
          </div>
        </div>
        
        <div style={{ flex: 1 }}>
          <NavItem to="/resident-dashboard" icon="📊" label="Dashboard" />
          <NavItem to="/document-request" icon="📄" label="Request Document" />
          <NavItem to="/request-history" icon="🕒" label="Request History" badgeCount={history.length} />
          <NavItem to="/profile" icon="👤" label="Profile Settings" />
        </div>
        <button onClick={handleLogout} className="transition-all duration-300 flex items-center px-4 py-3 rounded-xl cursor-pointer text-slate-400 hover:bg-[rgba(244,63,94,0.15)] hover:text-[#f43f5e] hover:border hover:border-[rgba(244,63,94,0.3)] w-full mt-4" style={{ border: '1px solid transparent', outline: 'none', background: 'transparent' }}>
          <span style={{ marginRight: '12px', fontSize: '18px' }}>🚪</span>
          <span style={{ fontWeight: 'bold' }}>Logout</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-5 md:p-[40px] w-full overflow-x-hidden">
        
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
             <h1 style={{ margin: '0 0 5px 0', color: 'var(--text-main)', fontSize: '28px', fontWeight: 'bold' }}>Resident Portal</h1>
             <p style={{ margin: 0, color: 'var(--text-muted)' }}>Welcome back. Track and manage your document requests below.</p>
          </div>
          <div className="hidden md:flex gap-[15px]">
            <div className="glass-panel" style={{ padding: '10px 20px', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '14px' }}>
               {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
        
        {/* Top Cards (Bento Grid) */}
        <div className="flex flex-col md:flex-row gap-[20px] mt-[20px] mb-[40px]">
          
          <div className="glass-card" style={{ flex: 1, padding: '25px', display: 'flex', flexDirection: 'column', justifyItems: 'center', justifyContent: 'center' }}>
            <h4 style={{ color: 'var(--text-muted)', margin: '0 0 5px 0', textTransform: 'uppercase', fontSize: '14px', fontWeight: '600' }}>Your Latest Queue</h4>
            <p style={{ fontSize: '38px', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>{queueInfo.queueNumber}</p>
            {queueInfo.scheduledDate && (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '5px 0 0 0', fontWeight: '500' }}>
                For: {new Date(queueInfo.scheduledDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            )}
          </div>
          
          <div className="glass-card" style={{ flex: 1.2, padding: '25px', display: 'flex', flexDirection: 'column', justifyItems: 'center', justifyContent: 'center' }}>
            <h4 style={{ color: 'var(--text-muted)', margin: '0 0 5px 0', textTransform: 'uppercase', fontSize: '14px', fontWeight: '600' }}>Latest Status</h4>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0', 
              color: queueInfo.status === 'Ready for Pickup' ? 'var(--neon-green)' : queueInfo.status === 'Released' ? 'var(--neon-blue)' : queueInfo.status === 'Cancelled' ? '#f43f5e' : queueInfo.status === 'Waiting for Printing' ? '#fbbf24' : '#fbbf24' }}>
              {getDisplayStatus(queueInfo.status, queueInfo.or_number)}
            </h2>

            {/* If Ready for Pickup & NOT paid yet */}
            {queueInfo.status === 'Ready for Pickup' && !queueInfo.or_number && (
              <div style={{ marginTop: '15px', padding: '12px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px', border: '1px solid rgba(251,191,36,0.3)' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: 'bold', color: '#fbbf24' }}>💳 Payment Required</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#fef3c7' }}>
                  Please proceed to the Barangay Hall Cashier with your Queue Number (<b>{queueInfo.queueNumber}</b>) to pay the fee (<b>₱{queueInfo.base_fee || 0}</b>).
                </p>
              </div>
            )}

            {/* If Ready for Pickup & ALREADY paid */}
            {queueInfo.status === 'Ready for Pickup' && queueInfo.or_number && (
              <div style={{ marginTop: '15px', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)', textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: 'var(--neon-green)', textTransform: 'uppercase', fontWeight: 'bold' }}>Official Receipt Issued</p>
                <p style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: 'white', letterSpacing: '1px' }}>{queueInfo.or_number}</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '11px', color: '#a7f3d0' }}>Present this OR code to the releasing officer.</p>
              </div>
            )}
          </div>
          
          <div onClick={() => navigate('/document-request')} className="glass-card transition-all duration-300 hover:scale-105 cursor-pointer" style={{ flex: 1, padding: '25px', display: 'flex', flexDirection: 'column', justifyItems: 'center', justifyContent: 'center', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', color: 'var(--text-main)' }}>➕</div>
            <h4 style={{ color: 'var(--text-main)', margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold' }}>New Application</h4>
            <p style={{ color: 'var(--neon-cyan)', margin: 0, fontSize: '13px' }}>Click here to apply for a new Document ➔</p>
          </div>
        </div>

        {/* Transaction History Table */}
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px 25px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '18px', fontWeight: '600' }}>My Request History</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-muted)', textAlign: 'left', fontSize: '13px', textTransform: 'uppercase' }}>
                <th style={{ padding: '15px 25px', fontWeight: '600' }}>Requested</th>
                <th style={{ padding: '15px 25px', fontWeight: '600' }}>Pick-up Date</th>
                <th style={{ padding: '15px 25px', fontWeight: '600' }}>Document Type</th>
                <th style={{ padding: '15px 25px', fontWeight: '600' }}>Payment / OR #</th>
                <th style={{ padding: '15px 25px', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '15px 25px', fontWeight: '600' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((req) => {
                  const safeDocName = req.doc_name === 'undefined' ? 'Official Document' : req.doc_name;
                  const rawStatus = (!req.status || req.status === 'undefined') ? 'Pending' : req.status;

                  return (
                    <tr key={req.request_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors duration-150">
                      <td style={{ padding: '15px 25px', color: 'var(--text-muted)', fontSize: '14px' }}>{new Date(req.date_requested).toLocaleDateString()}</td>
                      <td style={{ padding: '15px 25px', color: 'var(--text-main)', fontSize: '14px', fontWeight: '600' }}>{req.pick_up_date ? new Date(req.pick_up_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</td>
                      <td style={{ padding: '15px 25px', fontWeight: '500', color: 'var(--text-main)' }}>
                        {safeDocName}
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Fee: ₱{req.base_fee || 0}</div>
                      </td>
                      <td style={{ padding: '15px 25px' }}>
                        {req.or_number ? (
                          <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', background: 'rgba(16,185,129,0.1)', color: 'var(--neon-green)', border: '1px solid rgba(16,185,129,0.2)' }}>
                            OR: {req.or_number}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>--</span>
                        )}
                      </td>
                      <td style={{ padding: '15px 25px' }}>
                      <span style={{
                        padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
                        background: rawStatus === 'Ready for Pickup' ? 'rgba(16,185,129,0.1)' : rawStatus === 'Released' ? 'rgba(59,130,246,0.1)' : rawStatus === 'Cancelled' || rawStatus === 'Rejected' ? 'rgba(244,63,94,0.1)' : 'rgba(251,191,36,0.1)',
                        color: rawStatus === 'Ready for Pickup' ? 'var(--neon-green)' : rawStatus === 'Released' ? 'var(--neon-blue)' : rawStatus === 'Cancelled' || rawStatus === 'Rejected' ? '#f43f5e' : '#fbbf24',
                        border: `1px solid ${rawStatus === 'Ready for Pickup' ? 'rgba(16,185,129,0.2)' : rawStatus === 'Released' ? 'rgba(59,130,246,0.2)' : rawStatus === 'Cancelled' || rawStatus === 'Rejected' ? 'rgba(244,63,94,0.2)' : 'rgba(251,191,36,0.2)'}`
                      }}>
                        {getDisplayStatus(rawStatus, req.or_number)}
                      </span>
                      
                      {/* Display the Staff's reason for rejection */}
                      {rawStatus === 'Rejected' && req.remarks && (
                        <div style={{ color: '#f43f5e', fontSize: '12px', marginTop: '6px', fontWeight: '500' }}>
                          Reason: {req.remarks}
                        </div>
                      )}
                    </td>
                      <td style={{ padding: '15px 25px' }}>
                        {rawStatus === 'Pending' ? (
                          <button onClick={() => handleCancel(req.request_id)} className="transition-colors hover:bg-[rgba(244,63,94,0.1)] hover:border-[#f43f5e]" style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid rgba(244,63,94,0.5)', background: 'transparent', color: '#f43f5e', cursor: 'pointer', fontWeight: '600' }}>
                            Cancel
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>--</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>You have no past requests.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

      </div>
      
      {/* Mobile Bottom Navigation */}
      <ResidentBottomNav />
    </div>
  );
}