import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function DocumentRecords() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/staff/document-records');
        setRecords(response.data);
      } catch (error) {
        console.error("Failed to fetch records", error);
      }
    };
    fetchRecords();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // NEW: The Live Search Filter!
  // This filters the table based on what the staff types in the search box
  const filteredRecords = records.filter(record => {
    const fullName = `${record.first_name} ${record.last_name}`.toLowerCase();
    const docName = record.doc_name.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || docName.includes(search) || record.status.toLowerCase().includes(search);
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#f8fafc' }}>
      
      {/* Sidebar */}
      <div style={{ width: '260px', background: '#0f172a', color: 'white', padding: '30px 20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '20px', margin: '0 0 40px 0', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
          👨‍💼 Front Desk System
        </h2>
        <div style={{ flex: 1 }}>
          <p onClick={() => navigate('/staff-dashboard')} style={{ margin: '15px 0', cursor: 'pointer', color: '#94a3b8' }}>📥 Queue Management</p>
          <p style={{ margin: '15px 0', cursor: 'pointer', fontWeight: 'bold', color: 'white' }}>🗂️ Document Records</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '10px', background: '#334155', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Logout</button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '40px' }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '28px' }}>Archived Transactions</h1>
        <p style={{ color: '#64748b', marginBottom: '30px' }}>View and search all completed, rejected, and cancelled document requests.</p>

        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          
          {/* Top Bar with Search */}
          <div style={{ padding: '20px 25px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#334155' }}>Record History ({filteredRecords.length})</h3>
            <input 
              type="text" 
              placeholder="🔍 Search by Name, Document, or Status..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '10px 15px', width: '300px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left', fontSize: '14px', textTransform: 'uppercase' }}>
                <th style={{ padding: '15px 25px' }}>Date</th>
                <th style={{ padding: '15px 25px' }}>Resident Name</th>
                <th style={{ padding: '15px 25px' }}>Document Type</th>
                <th style={{ padding: '15px 25px' }}>Status</th>
                <th style={{ padding: '15px 25px' }}>Remarks / Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((req) => (
                  <tr key={req.request_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '15px 25px', color: '#64748b', fontSize: '14px' }}>{new Date(req.date_requested).toLocaleDateString()}</td>
                    <td style={{ padding: '15px 25px', color: '#0f172a', fontWeight: '500' }}>{req.first_name} {req.last_name}</td>
                    <td style={{ padding: '15px 25px', color: '#334155' }}>{req.doc_name}</td>
                    <td style={{ padding: '15px 25px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                        background: req.status === 'Released' ? '#dbeafe' : '#fee2e2',
                        color: req.status === 'Released' ? '#1e40af' : '#991b1b'
                      }}>
                        {req.status}
                      </span>
                    </td>
                    <td style={{ padding: '15px 25px', color: '#64748b', fontSize: '13px', fontStyle: req.remarks ? 'normal' : 'italic' }}>
                      {req.remarks || 'No notes provided'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No matching records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}