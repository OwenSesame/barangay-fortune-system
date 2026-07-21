import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function DocumentRecords() {
  const navigate = useNavigate();
  const staffId = localStorage.getItem('userId');
  
  const [canReview, setCanReview] = useState(localStorage.getItem('canReview') === '1');
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // FIX: Added the counts state!
  const [counts, setCounts] = useState({ pending: 0, ready: 0 });

  useEffect(() => {
    const fetchDataAndSync = async () => {
      try {
        // 1. Sync permissions silently
        const profileRes = await axios.get(`http://localhost:5000/api/staff/profile/${staffId}`);
        const currentPermission = Number(profileRes.data.can_review) === 1;
        setCanReview(currentPermission);
        localStorage.setItem('canReview', profileRes.data.can_review);

        // 2. Fetch Records Data
        const recordsRes = await axios.get('http://localhost:5000/api/staff/document-records');
        setRecords(recordsRes.data);

        // 3. Fetch Notifications Count
        const requestsRes = await axios.get('http://localhost:5000/api/staff/pending-requests');
        setCounts({
          pending: requestsRes.data.filter(req => req.status === 'Pending').length,
          ready: requestsRes.data.filter(req => req.status === 'Ready to Print').length
        });
      } catch (error) {
        console.error("Failed to fetch data", error);
      }
    };

    fetchDataAndSync();
    const interval = setInterval(fetchDataAndSync, 5000);
    return () => clearInterval(interval);
  }, [staffId]);

  const filteredRecords = records.filter(rec => 
    rec.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.doc_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.request_id.toString().includes(searchTerm)
  );

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Segoe UI", Tahoma, sans-serif', backgroundColor: '#f8fafc', overflowY: 'scroll' }}>
      
      {/* FIX: Added Notification CSS */}
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

      <div style={{ width: '280px', background: '#0f172a', color: 'white', padding: '30px 25px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '24px', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          👨‍💼 Front Desk System
        </h2>
        <hr style={{ border: '0', borderTop: '1px solid #334155', marginBottom: '40px', width: '100%' }} />
        
        <div style={{ flex: 1 }}>
          <p onClick={() => navigate('/staff-home')} style={{ margin: '25px 0', cursor: 'pointer', fontWeight: 'normal', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
            🏠 Home Dashboard
          </p>
          
          {canReview && (
            <p onClick={() => navigate('/staff-pending')} style={{ margin: '25px 0', cursor: 'pointer', fontWeight: 'normal', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
              📋 Pending Review 
              {counts.pending > 0 && <span className="notification-dot">{counts.pending}</span>}
            </p>
          )}

          <p onClick={() => navigate('/staff-ready')} style={{ margin: '25px 0', cursor: 'pointer', fontWeight: 'normal', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
            🔖 Ready to Print 
            {counts.ready > 0 && <span className="notification-dot">{counts.ready}</span>}
          </p>
          
          <p style={{ margin: '25px 0', cursor: 'default', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center' }}>
            📁 Document Records
          </p>
        </div>
        <button onClick={handleLogout} className="transition-all duration-300 bg-[#334155] text-white hover:bg-red-500 hover:text-white" style={{ padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Logout</button>
      </div>

      <div style={{ flex: 1, padding: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
          <div>
            <h1 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '28px' }}>Transaction History</h1>
            <p style={{ color: '#64748b', margin: 0 }}>Search and view all completed or rejected document requests.</p>
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '25px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0' }}>
          <input 
            type="text" 
            placeholder="🔍 Search by resident name, document type, or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }}
          />
        </div>

        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '15px 25px' }}>Date</th>
                <th style={{ padding: '15px 25px' }}>Resident</th>
                <th style={{ padding: '15px 25px' }}>Document Type</th>
                <th style={{ padding: '15px 25px' }}>Status</th>
                <th style={{ padding: '15px 25px' }}>OR Number</th>
                <th style={{ padding: '15px 25px' }}>Processed By</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? filteredRecords.map((rec) => (
                <tr key={rec.request_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '15px 25px', color: '#64748b', fontSize: '14px' }}>{new Date(rec.date_requested).toLocaleDateString()}</td>
                  <td style={{ padding: '15px 25px', fontWeight: '600', color: '#0f172a' }}>{rec.first_name} {rec.last_name}</td>
                  <td style={{ padding: '15px 25px', color: '#1e3a8a', fontWeight: '500' }}>{rec.doc_name}</td>
                  <td style={{ padding: '15px 25px' }}>
                    <span style={{ 
                      padding: '6px 12px', 
                      borderRadius: '20px', 
                      fontSize: '11px', 
                      fontWeight: 'bold',
                      background: rec.status === 'Released' ? '#dcfce7' : '#fee2e2',
                      color: rec.status === 'Released' ? '#166534' : '#991b1b'
                    }}>
                      {rec.status}
                    </span>
                  </td>
                  <td style={{ padding: '15px 25px', color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>
                    {rec.or_number ? `OR# ${rec.or_number}` : '-'}
                  </td>
                  <td style={{ padding: '15px 25px', color: '#64748b', fontSize: '13px' }}>ID: #{rec.processed_by || 'N/A'}</td>
                </tr>
              )) : (
                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No records found matching your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}