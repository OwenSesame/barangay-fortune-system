import { useNavigate } from 'react-router-dom';

export default function ResidentDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    alert("Logged out successfully");
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: '200px', background: '#f4f4f4', padding: '20px' }}>
        <h3>Resident Menu</h3>
        <ul style={{ listStyleType: 'none', padding: 0, lineHeight: '2' }}>
          <li><a href="#">Home</a></li>
          <li><a href="#">My Documents</a></li>
          <li><a href="#">Queue</a></li>
          <li><a href="#">My Profile</a></li>
        </ul>
      </div>

      {/* Main Content */}
      <div style={{ padding: '20px', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2>Welcome To Your Dashboard</h2>
          <button onClick={handleLogout}>LOGOUT</button>
        </div>
        
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
          <div style={{ padding: '20px', border: '1px solid black', flex: 1 }}>
            <h4>Queue Position</h4>
            <p>Placeholder: 5th in line</p>
          </div>
          <div style={{ padding: '20px', border: '1px solid black', flex: 1 }}>
            <h4>Latest Update</h4>
            <p>Placeholder: Processing</p>
          </div>
          <div style={{ padding: '20px', border: '1px solid black', flex: 1, background: '#e0f7fa', cursor: 'pointer' }}>
            <h4>My Documents</h4>
            <p>Shortcut to request page ➔</p>
          </div>
        </div>
      </div>
    </div>
  );
}