import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    alert("Logged out successfully");
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: '200px', background: '#ffebee', padding: '20px' }}>
        <h3>Admin Menu</h3>
        <ul style={{ listStyleType: 'none', padding: 0, lineHeight: '2' }}>
          <li><a href="#">Account Management</a></li>
          <li><a href="#">Pending Review</a></li>
          <li><a href="#">Ready to Print</a></li>
        </ul>
      </div>

      {/* Main Content */}
      <div style={{ padding: '20px', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2>Admin Command Center</h2>
          <button onClick={handleLogout}>LOGOUT</button>
        </div>
        
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
          <div style={{ padding: '20px', border: '1px solid black', flex: 1 }}>
            <h4>Total Registered Residents</h4>
            <p>Placeholder: 150</p>
          </div>
          <div style={{ padding: '20px', border: '1px solid black', flex: 1 }}>
            <h4>Currently in Queue</h4>
            <p>Placeholder: 12</p>
          </div>
          <div style={{ padding: '20px', border: '1px solid black', flex: 1 }}>
            <h4>Awaiting Approval</h4>
            <p>Placeholder: 4</p>
          </div>
        </div>

        {/* Chart Placeholders */}
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
            <div style={{ padding: '50px 20px', border: '1px dashed grey', flex: 1, textAlign: 'center' }}>
                [Placeholder: Donut Chart - Top Reasons for Requests]
            </div>
            <div style={{ padding: '50px 20px', border: '1px dashed grey', flex: 1, textAlign: 'center' }}>
                [Placeholder: Bar Chart - Most Frequent Document Requests]
            </div>
        </div>
      </div>
    </div>
  );
}