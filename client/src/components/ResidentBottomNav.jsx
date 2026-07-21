import { useNavigate, useLocation } from 'react-router-dom';

export default function ResidentBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const NavItem = ({ to, icon, label, onClick }) => {
    const isActive = to && path === to;
    return (
      <div 
        onClick={onClick || (() => navigate(to))} 
        className={`flex flex-col items-center justify-center w-full h-full cursor-pointer transition-colors ${isActive ? 'text-[#3b82f6]' : 'text-[#64748b] hover:text-[#3b82f6]'}`}
      >
        <span className="text-xl mb-1">{icon}</span>
        <span className="text-[10px] font-bold">{label}</span>
      </div>
    );
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-[#e2e8f0] h-[65px] flex justify-around items-center z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-safe">
      <NavItem to="/resident-dashboard" icon="🏠" label="Home" />
      <NavItem to="/document-request" icon="📄" label="Apply" />
      <NavItem to="/profile" icon="👤" label="Profile" />
      {/* Divider */}
      <div className="w-px h-8 bg-slate-200" />
      <NavItem icon="🚪" label="Logout" onClick={handleLogout} />
    </div>
  );
}
