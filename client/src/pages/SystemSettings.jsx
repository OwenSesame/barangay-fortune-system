import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';

export default function SystemSettings() {
  const navigate = useNavigate();
  const [limits, setLimits] = useState({
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check Admin auth
    const role = localStorage.getItem('userRole');
    if (role !== 'Admin') {
      navigate('/');
      return;
    }

    const fetchLimits = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/settings/weekly-limits');
        setLimits(response.data.limits);
      } catch (err) {
        console.error("Error fetching limits", err);
      }
    };
    fetchLimits();
  }, [navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage('');

    try {
      const adminId = localStorage.getItem('userId');
      await axios.put('http://localhost:5000/api/settings/weekly-limits', { 
        limits,
        adminId
      });
      setMessage({ type: 'success', text: 'Weekly configuration updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update configuration.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChange = (day, value) => {
    setLimits(prev => ({ ...prev, [day]: parseInt(value) || 0 }));
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#f8fafc' }}>
      
      <AdminSidebar />

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '40px' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ margin: 0, color: '#0f172a', fontSize: '28px' }}>System Settings</h1>
          <p style={{ color: '#64748b', marginTop: '5px' }}>Configure global rules and limits for the Barangay Fortune system.</p>
        </div>

        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', maxWidth: '600px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📅 Weekly Configuration Matrix
          </h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '25px', lineHeight: '1.5' }}>
            Set the maximum number of document requests the staff can process per day. When a specific day reaches its limit, residents will be forced to schedule for the next available day. <b>Set to 0 for unlimited.</b>
          </p>

          <div style={{ padding: '12px', marginBottom: '25px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#b91c1c', fontSize: '14px', fontWeight: '600', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🚫</span> Sunday operations are automatically closed and hidden from residents.
          </div>

          {message && (
            <div style={{ 
              padding: '12px', 
              marginBottom: '20px', 
              borderRadius: '8px', 
              backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2', 
              color: message.type === 'success' ? '#166534' : '#b91c1c',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                <div key={day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', backgroundColor: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ color: '#334155', fontWeight: '600', fontSize: '15px' }}>{day}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>LIMIT:</span>
                    <input 
                      type="number" 
                      min="0"
                      value={limits[day]} 
                      onChange={(e) => handleChange(day, e.target.value)} 
                      required 
                      style={{ width: '80px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px', textAlign: 'center', outline: 'none' }}
                    />
                  </div>
                </div>
            ))}

            <button 
              type="submit" 
              disabled={isUpdating}
              style={{ 
                padding: '14px', 
                backgroundColor: isUpdating ? '#94a3b8' : '#2563eb', 
                color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', 
                cursor: isUpdating ? 'not-allowed' : 'pointer', marginTop: '10px', transition: 'background 0.2s' 
              }}
            >
              {isUpdating ? 'Saving Configuration...' : 'Update Weekly Matrix'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
