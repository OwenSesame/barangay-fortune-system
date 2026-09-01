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

  const NavItem = ({ to, icon, label, badgeCount }) => {
    const isActive = location.pathname === to;
    return (
      <p 
        onClick={() => navigate(to)} 
        className={`transition-all duration-300 flex items-center px-4 py-3 rounded-xl cursor-pointer ${isActive ? 'bg-[rgba(16,185,129,0.15)] text-[var(--neon-green)] font-bold shadow-[inset_0_0_12px_rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)]' : 'text-slate-400 hover:bg-[rgba(255,255,255,0.05)] hover:text-white'}`}
        style={{ margin: '8px 0' }}
      >
        <span style={{ marginRight: '12px', fontSize: '18px', filter: isActive ? 'drop-shadow(0 0 4px rgba(16,185,129,0.5))' : 'none' }}>{icon}</span>
        {label}
        {badgeCount > 0 && <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(244,63,94,0.2)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.4)', borderRadius: '50%',
            minWidth: '22px', height: '22px', fontSize: '12px', fontWeight: 'bold',
            marginLeft: 'auto'
        }}>{badgeCount}</span>}
      </p>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent', overflowY: 'hidden' }}>
      
      {/* Sidebar for Staff */}
      <div className="glass-panel hidden md:flex" style={{ width: '280px', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '30px 20px', flexDirection: 'column', zIndex: 10, background: 'rgba(15, 23, 42, 0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px', padding: '0 10px' }}>
          <div style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', boxShadow: '0 0 15px rgba(16,185,129,0.2)' }}>
            <span style={{ color: 'var(--neon-green)', fontSize: '18px' }}>👨‍💼</span>
          </div>
          <div>
             <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 'bold', color: 'white', letterSpacing: '0.5px' }}>Staff Portal</h2>
             <p style={{ margin: 0, fontSize: '12px', color: 'var(--neon-green)', textTransform: 'uppercase', letterSpacing: '1px' }}>Operations</p>
          </div>
        </div>
        
        <div style={{ flex: 1 }}>
          <NavItem to="/staff-home" icon="📊" label="Dashboard Overview" />
          {canReview && (
            <NavItem to="/staff-pending" icon="📋" label="Review Applications" badgeCount={counts.pending} />
          )}
          <NavItem to="/staff-ready" icon="🔖" label="Ready to Release" badgeCount={counts.ready} />
          <NavItem to="/document-records" icon="📄" label="Document Records" />
        </div>

        <button onClick={handleLogout} className="transition-all duration-300 flex items-center px-4 py-3 rounded-xl cursor-pointer text-slate-400 hover:bg-[rgba(244,63,94,0.15)] hover:text-[#f43f5e] hover:border hover:border-[rgba(244,63,94,0.3)] w-full mt-4" style={{ border: '1px solid transparent', outline: 'none', background: 'transparent' }}>
          <span style={{ marginRight: '12px', fontSize: '18px' }}>🚪</span>
          <span style={{ fontWeight: 'bold' }}>Logout</span>
        </button>
      </div>

      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: 0, color: 'var(--text-main)', fontSize: '28px', fontWeight: 'bold' }}>Dashboard Overview</h1>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div className="glass-panel" style={{ padding: '10px 20px', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '14px' }}>
               {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
          
          <div className="glass-card" style={{ flex: 1, minWidth: '200px', padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/staff-pending')}>
            <div>
              <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' }}>Active Pending</p>
              <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '32px', fontWeight: 'bold' }}>{stats.pending}</h3>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--neon-blue)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              📋
            </div>
          </div>
          
          <div className="glass-card" style={{ flex: 1, minWidth: '200px', padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/staff-ready')}>
            <div>
              <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' }}>Ready for Pickup</p>
              <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '32px', fontWeight: 'bold' }}>{stats.ready}</h3>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--neon-green)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              🔖
            </div>
          </div>

          <div className="glass-card" style={{ flex: 1, minWidth: '200px', padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/document-records')}>
            <div>
              <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' }}>Completed Today</p>
              <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '32px', fontWeight: 'bold' }}>{stats.released}</h3>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--neon-cyan)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              ✅
            </div>
          </div>
        </div>

        {/* System Notice Section */}
        <div className="glass-card" style={{ padding: '25px', display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
          <div style={{ fontSize: '24px', filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.4))' }}>ℹ️</div>
          <div>
            <h4 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '16px', fontWeight: '600' }}>System Information</h4>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
              Current Role: <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{localStorage.getItem('userRole') || 'Front Desk Staff'}</span> | 
              Review Access: <span style={{ fontWeight: 'bold', color: canReview ? 'var(--neon-green)' : '#ea580c' }}>{canReview ? " ENABLED" : " DISABLED"}</span>
            </p>
            {!canReview && (
              <p style={{ margin: '10px 0 0 0', color: '#f43f5e', fontSize: '13px', fontWeight: '600' }}>
                * You cannot approve new document requests until the Admin grants you permission.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}