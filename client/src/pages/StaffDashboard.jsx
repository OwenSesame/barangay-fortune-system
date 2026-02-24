import { useNavigate } from 'react-router-dom';

export default function StaffDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    alert("Logged out successfully");
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: '200px', background: '#e8f5e9', padding: '20px' }}>
        <h3>Staff Menu</h3>
        <ul style={{ listStyleType: 'none', padding: 0, lineHeight: '2' }}>
          <li><a href="#">Home</a></li>
          <li><a href="#">Total Queue</a></li>
          <li><a href="#">Pending Review</a></li>
          <li><a href="#">Ready to Print</a></li>
        </ul>
      </div>

      {/* Main Content */}
      <div style={{ padding: '20px', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2>Staff Dashboard</h2>
          <button onClick={handleLogout}>LOGOUT</button>
        </div>
        
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
          <div style={{ padding: '20px', border: '1px solid black', flex: 1 }}>
            <h4>Total Queue</h4>
            <p>Placeholder: 12 Requests</p>
          </div>
          <div style={{ padding: '20px', border: '1px solid black', flex: 1 }}>
            <h4>Pending Review</h4>
            <p>Placeholder: 4 Items</p>
          </div>
          <div style={{ padding: '20px', border: '1px solid black', flex: 1 }}>
            <h4>Ready to Print</h4>
            <p>Placeholder: 2 Documents</p>
          </div>
        </div>
      </div>
    </div>
  );
}