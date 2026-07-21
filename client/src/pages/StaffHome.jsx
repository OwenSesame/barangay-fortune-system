import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function StaffHome() {
  const navigate = useNavigate();
  const staffId = localStorage.getItem('userId');
  
  const [stats, setStats] = useState({ pending: 0, ready: 0, released: 0 });
  const [canReview, setCanReview] = useState(localStorage.getItem('canReview') === '1');
  
  // FIX: Added the counts state to track the notifications on the Home page
  const [counts, setCounts] = useState({ pending: 0, ready: 0 });

  useEffect(() => {
    const fetchDataAndSync = async () => {
      try {
        // 1. Sync Permissions silently
        const profileRes = await axios.get(`http://localhost:5000/api/staff/profile/${staffId}`);
        const currentPermission = profileRes.data.can_review === 1;
        setCanReview(currentPermission);
        localStorage.setItem('canReview', profileRes.data.can_review);

        // 2. Fetch Dashboard Totals (for the big cards)
        const statsRes = await axios.get('http://localhost:5000/api/staff/dashboard-stats');
        setStats(statsRes.data);

        // 3. Fetch specific queue counts (for the red notification dots)
        const requestsRes = await axios.get('http://localhost:5000/api/staff/pending-requests');
        setCounts({
          pending: requestsRes.data.filter(req => req.status === 'Pending').length,
          ready: requestsRes.data.filter(req => req.status === 'Ready to Print').length
        });
      } catch (error) {
        console.error("Sync failed", error);
      }
    };

    fetchDataAndSync();
    const interval = setInterval(fetchDataAndSync, 5000);
    return () => clearInterval(interval);
  }, [staffId]);

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

      {/* Sidebar - EXACT MATCH to the other pages */}
      <div style={{ width: '280px', background: '#0f172a', color: 'white', padding: '30px 25px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '24px', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          👨‍💼 Front Desk System
        </h2>
        <hr style={{ border: '0', borderTop: '1px solid #334155', marginBottom: '40px', width: '100%' }} />
        
        <div style={{ flex: 1 }}>
          <p style={{ margin: '25px 0', cursor: 'default', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center' }}>
            🏠 Home Dashboard
          </p>
          
          {canReview && (
            <p onClick={() => navigate('/staff-pending')} className="transition-all duration-300 hover:translate-x-2 hover:opacity-80" style={{ margin: '25px 0', cursor: 'pointer', fontWeight: 'normal', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
              📋 Pending Review 
              {counts.pending > 0 && <span className="notification-dot">{counts.pending}</span>}
            </p>
          )}

          <p onClick={() => navigate('/staff-ready')} className="transition-all duration-300 hover:translate-x-2 hover:opacity-80" style={{ margin: '25px 0', cursor: 'pointer', fontWeight: 'normal', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
            🔖 Ready to Print 
            {counts.ready > 0 && <span className="notification-dot">{counts.ready}</span>}
          </p>
          
          <p onClick={() => navigate('/document-records')} className="transition-all duration-300 hover:translate-x-2 hover:opacity-80" style={{ margin: '25px 0', cursor: 'pointer', fontWeight: 'normal', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
            📁 Document Records
          </p>
        </div>

        <button onClick={handleLogout} className="transition-all duration-300 bg-[#334155] text-white hover:bg-red-500 hover:text-white" style={{ padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '40px' }}>
        <h1 style={{ color: '#0f172a', marginBottom: '10px' }}>Welcome back, Staff!</h1>
        <p style={{ color: '#64748b', marginBottom: '30px' }}>Here is the current status of document requests for Barangay Fortune.</p>

        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Card 1: Pending (Only shown if they have access) */}
          {canReview ? (
            <div style={{ flex: 1, background: 'white', padding: '25px', borderRadius: '12px', borderLeft: '5px solid #f59e0b', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>AWAITING VALIDATION</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0', color: '#0f172a' }}>{stats.pending}</p>
              <button onClick={() => navigate('/staff-pending')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>View Queue →</button>
            </div>
          ) : (
            <div style={{ flex: 1, background: '#f8fafc', padding: '25px', borderRadius: '12px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', fontWeight: 'bold' }}>Validation Access Locked by Admin</p>
            </div>
          )}

          {/* Card 2: Ready to Print */}
          <div style={{ flex: 1, background: 'white', padding: '25px', borderRadius: '12px', borderLeft: '5px solid #10b981', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>READY TO PRINT</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0', color: '#0f172a' }}>{stats.ready}</p>
            <button onClick={() => navigate('/staff-ready')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>Open Printing Queue →</button>
          </div>

          {/* Card 3: Total Released */}
          <div style={{ flex: 1, background: 'white', padding: '25px', borderRadius: '12px', borderLeft: '5px solid #3b82f6', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>COMPLETED TODAY</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0', color: '#0f172a' }}>{stats.released}</p>
            <button onClick={() => navigate('/document-records')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>View History →</button>
          </div>
        </div>

        {/* System Notice Section */}
        <div style={{ marginTop: '40px', background: '#eff6ff', padding: '20px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#1e40af' }}>📢 System Information</h4>
          <p style={{ margin: 0, color: '#1e3a8a', fontSize: '14px' }}>
            Current Role: <b>{localStorage.getItem('userRole') || 'Front Desk Staff'}</b> | 
            Review Access: <b>{canReview ? "ENABLED" : "DISABLED"}</b>
          </p>
          {!canReview && (
            <p style={{ marginTop: '10px', color: '#b91c1c', fontSize: '13px', fontWeight: 'bold' }}>
              Note: You cannot approve new document requests until the Admin grants you permission.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}