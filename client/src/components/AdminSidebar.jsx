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
        style={{ 
          margin: '15px 0', 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          fontWeight: isActive ? 'bold' : 'normal', 
          color: isActive ? 'white' : '#a5b4fc',
          transition: 'color 0.2s'
        }}
      >
        <span style={{ marginRight: '8px' }}>{icon}</span>
        {label}
        {badgeCount > 0 && <span className="notification-dot" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: '#ef4444', color: 'white', borderRadius: '50%',
            minWidth: '20px', height: '20px', fontSize: '11px', fontWeight: 'bold',
            marginLeft: '10px'
        }}>{badgeCount}</span>}
      </p>
    );
  };

  return (
    <div style={{ width: '260px', background: '#1e1b4b', color: 'white', padding: '30px 20px', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
      <h2 style={{ fontSize: '22px', margin: '0 0 40px 0', borderBottom: '1px solid #3730a3', paddingBottom: '15px' }}>Barangay Fortune</h2>
      <div style={{ flex: 1 }}>
        <NavItem to="/admin-dashboard" icon="🏠" label="Home" />
        <NavItem to="/resident-approvals" icon="👥" label="Resident Approvals" badgeCount={badgeCounts.residentApprovals} />
        <NavItem to="/account-management" icon="👤" label="Account Management" />
        <NavItem to="/document-management" icon="📄" label="Document Templates" />
        <NavItem to="/pending-review" icon="📋" label="Pending Review" badgeCount={badgeCounts.pending} />
        <NavItem to="/ready-to-print" icon="🔖" label="Ready to Print" badgeCount={badgeCounts.ready} />
        <NavItem to="/audit-logs" icon="🔒" label="System Audit Logs" />
        <NavItem to="/system-settings" icon="⚙️" label="System Settings" />
      </div>
      <button 
        onClick={handleLogout} 
        style={{ padding: '10px', background: 'white', color: '#1e1b4b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '20px' }}
      >
        Logout
      </button>
    </div>
  );
}
