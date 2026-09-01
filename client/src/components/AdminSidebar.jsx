import { useNavigate, useLocation } from 'react-router-dom';

export default function AdminSidebar({ badgeCounts = { pending: 0, ready: 0, residentApprovals: 0 } }) {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const NavItem = ({ to, icon, label, badgeCount }) => {
    const isActive = path === to;
    return (
      <p 
        onClick={() => navigate(to)} 
        className={`transition-all duration-300 flex items-center px-4 py-3 rounded-xl cursor-pointer ${isActive ? 'bg-[rgba(6,182,212,0.15)] text-[var(--neon-cyan)] font-bold shadow-[inset_0_0_12px_rgba(6,182,212,0.1)] border border-[rgba(6,182,212,0.2)]' : 'text-slate-400 hover:bg-[rgba(255,255,255,0.05)] hover:text-white'}`}
        style={{ margin: '8px 0' }}
      >
        <span style={{ marginRight: '12px', fontSize: '18px', filter: isActive ? 'drop-shadow(0 0 4px rgba(6,182,212,0.5))' : 'none' }}>{icon}</span>
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
    <div className="glass-panel" style={{ width: '280px', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '30px 20px', display: 'flex', flexDirection: 'column', zIndex: 10, background: 'rgba(15, 23, 42, 0.6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px', padding: '0 10px' }}>
        <div style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', boxShadow: '0 0 15px rgba(6,182,212,0.2)' }}>
          <span style={{ color: 'var(--neon-cyan)', fontSize: '18px' }}>🛡️</span>
        </div>
        <div>
           <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 'bold', color: 'white', letterSpacing: '0.5px' }}>Admin Portal</h2>
           <p style={{ margin: 0, fontSize: '12px', color: 'var(--neon-cyan)', textTransform: 'uppercase', letterSpacing: '1px' }}>System Control</p>
        </div>
      </div>
      
      <div style={{ flex: 1 }}>
        <NavItem to="/admin-dashboard" icon="📊" label="Dashboard" />
        <NavItem to="/resident-approvals" icon="👥" label="Resident Approvals" badgeCount={badgeCounts.residentApprovals} />
        <NavItem to="/account-management" icon="👤" label="User Management" />
        <NavItem to="/document-management" icon="📄" label="Document Templates" />
        <NavItem to="/pending-review" icon="📋" label="Pending Review" badgeCount={badgeCounts.pending} />
        <NavItem to="/ready-to-print" icon="🔖" label="Ready to Print" badgeCount={badgeCounts.ready} />
        <NavItem to="/audit-logs" icon="🔒" label="Audit Logs" />
        <NavItem to="/system-settings" icon="⚙️" label="System Settings" />
      </div>
      
      <button 
        onClick={handleLogout} 
        className="transition-all duration-300 flex items-center px-4 py-3 rounded-xl cursor-pointer text-slate-400 hover:bg-[rgba(244,63,94,0.15)] hover:text-[#f43f5e] hover:border hover:border-[rgba(244,63,94,0.3)] w-full mt-4"
        style={{ border: '1px solid transparent', outline: 'none', background: 'transparent' }}
      >
        <span style={{ marginRight: '12px', fontSize: '18px' }}>🚪</span>
        <span style={{ fontWeight: 'bold' }}>Logout</span>
      </button>
    </div>
  );
}
