import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AdminBottomNav({ badgeCounts = { pending: 0, ready: 0, residentApprovals: 0 } }) {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const role = localStorage.getItem('userRole');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const NavItem = ({ to, icon, label, badgeCount }) => {
    const isActive = path === to;
    return (
      <div 
        onClick={() => {
          navigate(to);
          setIsMenuOpen(false);
        }} 
        className={`flex flex-col items-center justify-center w-full h-full cursor-pointer transition-colors relative ${isActive ? 'text-[#3b82f6]' : 'text-[#64748b] hover:text-[#3b82f6]'}`}
      >
        <span className="text-[22px] mb-1 leading-none">{icon}</span>
        <span className="text-[10px] font-bold">{label}</span>
        {badgeCount > 0 && (
          <span className="absolute top-1 right-[20%] w-[16px] h-[16px] bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold border-2 border-white">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </div>
    );
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // Define links based on role
  const isAdmin = role === 'Admin';
  
  const allLinks = isAdmin ? [
    { to: "/admin-dashboard", icon: "🏠", label: "Home" },
    { to: "/resident-approvals", icon: "👥", label: "Residents", badgeCount: badgeCounts.residentApprovals },
    { to: "/account-management", icon: "👤", label: "Accounts" },
    { to: "/document-management", icon: "📄", label: "Templates" },
    { to: "/pending-review", icon: "📋", label: "Pending", badgeCount: badgeCounts.pending },
    { to: "/ready-to-print", icon: "🔖", label: "Printing", badgeCount: badgeCounts.ready },
    { to: "/audit-logs", icon: "🔒", label: "Audit" },
    { to: "/system-settings", icon: "⚙️", label: "Settings" }
  ] : [
    { to: "/staff-home", icon: "🏠", label: "Home" },
    { to: "/staff-pending", icon: "📋", label: "Pending", badgeCount: badgeCounts.pending },
    { to: "/staff-ready", icon: "🔖", label: "Printing", badgeCount: badgeCounts.ready },
    { to: "/document-records", icon: "📁", label: "Records" }
  ];

  // Pick the top 3 to show on the bottom bar, the rest go to "More"
  const topLinks = isAdmin ? [
    { to: "/admin-dashboard", icon: "🏠", label: "Home" },
    { to: "/resident-approvals", icon: "👥", label: "Users", badgeCount: badgeCounts.residentApprovals },
    { to: "/pending-review", icon: "📋", label: "Queue", badgeCount: badgeCounts.pending },
  ] : [
    { to: "/staff-home", icon: "🏠", label: "Home" },
    { to: "/staff-pending", icon: "📋", label: "Pending", badgeCount: badgeCounts.pending },
    { to: "/staff-ready", icon: "🔖", label: "Printing", badgeCount: badgeCounts.ready }
  ];

  const totalBadges = badgeCounts.pending + badgeCounts.ready + badgeCounts.residentApprovals;

  return (
    <>
      {/* Full Screen Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-[60] flex flex-col pt-12 pb-[80px] animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="px-6 pb-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-2xl font-extrabold text-slate-800 m-0">All Menu</h2>
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border-none"
            >
              ✕
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-2">
            {allLinks.map((link, idx) => {
              const isActive = path === link.to;
              return (
                <div 
                  key={idx}
                  onClick={() => { navigate(link.to); setIsMenuOpen(false); }}
                  className={`flex items-center p-4 rounded-xl cursor-pointer ${isActive ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                >
                  <span className="text-2xl mr-4">{link.icon}</span>
                  <span className={`flex-1 text-[16px] ${isActive ? 'font-bold text-blue-600' : 'font-semibold text-slate-700'}`}>{link.label}</span>
                  {link.badgeCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{link.badgeCount}</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-6 border-t border-slate-100">
            <button 
              onClick={handleLogout}
              className="w-full py-4 bg-red-50 text-red-600 rounded-xl font-bold text-[16px] border border-red-100"
            >
              Log Out
            </button>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 h-[70px] flex justify-around items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-safe">
        {topLinks.map((link, idx) => (
          <NavItem key={idx} {...link} />
        ))}
        
        {/* "More" Button */}
        <div 
          onClick={() => setIsMenuOpen(true)} 
          className={`flex flex-col items-center justify-center w-full h-full cursor-pointer transition-colors relative ${isMenuOpen ? 'text-[#3b82f6]' : 'text-[#64748b] hover:text-[#3b82f6]'}`}
        >
          <span className="text-[22px] mb-1 leading-none">☰</span>
          <span className="text-[10px] font-bold">More</span>
          {!isMenuOpen && totalBadges > 0 && (
            <span className="absolute top-1 right-[20%] w-[10px] h-[10px] bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </div>
      </div>
    </>
  );
}
