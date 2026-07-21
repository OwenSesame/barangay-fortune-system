import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import toast, { Toaster } from 'react-hot-toast';

export default function SystemSettings() {
  const navigate = useNavigate();

  // Default daily limit state
  const [defaultLimit, setDefaultLimit] = useState(10);
  const [isUpdating, setIsUpdating] = useState(false);

  // Date-specific exceptions state
  const [dateLimits, setDateLimits] = useState([]);
  const [newException, setNewException] = useState({ date: '', limit: 0, reason: '' });

  const fetchData = async () => {
    try {
      const [defaultRes, dateRes] = await Promise.all([
        axios.get('http://localhost:5000/api/settings/daily-limit'),
        axios.get('http://localhost:5000/api/settings/date-limits')
      ]);
      if (defaultRes.data && defaultRes.data.limit !== undefined) {
        setDefaultLimit(defaultRes.data.limit);
      }
      setDateLimits(dateRes.data || []);
    } catch (err) {
      console.error("Error fetching settings", err);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'Admin') { navigate('/'); return; }
    fetchData();
  }, [navigate]);

  const handleUpdateDefault = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const adminId = localStorage.getItem('userId');
      await axios.put('http://localhost:5000/api/settings/daily-limit', { limit: defaultLimit, adminId });
      toast.success('Default limit updated successfully!');
    } catch (err) {
      toast.error('Failed to update default limit.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddException = async (e) => {
    e.preventDefault();
    try {
      const adminId = localStorage.getItem('userId');
      await axios.post('http://localhost:5000/api/settings/date-limits', { 
        ...newException,
        adminId
      });
      toast.success('Date exception added successfully!');
      setNewException({ date: '', limit: 0, reason: '' });
      fetchData();
    } catch (err) {
      toast.error('Failed to add date exception.');
    }
  };

  const handleDeleteException = async (id) => {
    if (!window.confirm("Are you sure you want to delete this exception?")) return;
    try {
      const adminId = localStorage.getItem('userId');
      await axios.delete(`http://localhost:5000/api/settings/date-limits/${id}`, {
        data: { adminId }
      });
      toast.success('Exception removed successfully!');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete exception.');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#f8fafc' }}>
      <Toaster position="top-right" />

      <AdminSidebar />

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '40px' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ margin: 0, color: '#0f172a', fontSize: '28px' }}>System Settings</h1>
          <p style={{ color: '#64748b', marginTop: '5px' }}>Configure global rules and daily processing limits for the Barangay Fortune system.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '700px' }}>

          {/* ─── Section 1: Default Daily Limit ─── */}
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚙️ Default Daily Limit
            </h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '25px', lineHeight: '1.5', margin: '0 0 25px 0' }}>
              Set the default maximum number of documents the system can process per day.
              This applies to all standard days unless overridden by a date exception below.
            </p>

            <div style={{ padding: '12px', marginBottom: '25px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#b91c1c', fontSize: '14px', fontWeight: '600', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>🚫</span> Sunday operations are automatically closed and hidden from residents.
            </div>

            <form onSubmit={handleUpdateDefault} style={{ display: 'flex', alignItems: 'flex-end', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>DOCUMENTS PER DAY (DEFAULT)</label>
                <input 
                  type="number" 
                  min="1"
                  value={defaultLimit} 
                  onChange={(e) => setDefaultLimit(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '18px', fontWeight: 'bold', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <button 
                type="submit" 
                disabled={isUpdating}
                style={{ 
                  padding: '10px 24px', 
                  backgroundColor: isUpdating ? '#94a3b8' : '#2563eb', 
                  color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', 
                  cursor: isUpdating ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap'
                }}
              >
                {isUpdating ? 'Saving...' : 'Save Limit'}
              </button>
            </form>
          </div>

          {/* ─── Section 2: Date-Specific Exceptions ─── */}
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📅 Specific Date Exceptions
            </h3>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 25px 0', lineHeight: '1.5' }}>
              Override the default limit for specific dates — such as holidays, half-days, or special events.
              Setting a limit to <strong>0</strong> means the system is closed for that date.
            </p>

            {/* Add Exception Form */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '25px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#334155', fontSize: '14px', fontWeight: 'bold' }}>ADD NEW EXCEPTION</h4>
              <form onSubmit={handleAddException} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: '12px', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>DATE</label>
                  <input 
                    type="date" 
                    value={newException.date}
                    onChange={(e) => setNewException({...newException, date: e.target.value})}
                    required
                    style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>LIMIT (0 = CLOSED)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={newException.limit}
                    onChange={(e) => setNewException({...newException, limit: e.target.value})}
                    required
                    style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', fontSize: '13px', fontWeight: 'bold' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>REASON</label>
                  <input 
                    type="text" 
                    value={newException.reason}
                    onChange={(e) => setNewException({...newException, reason: e.target.value})}
                    required
                    placeholder="e.g. Holiday, Half-Day"
                    style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', fontSize: '13px' }}
                  />
                </div>
                <button type="submit" style={{ padding: '9px 18px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}>
                  + Add
                </button>
              </form>
            </div>

            {/* Exceptions Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>DATE</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>LIMIT</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>REASON</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {dateLimits.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No date exceptions configured.</td>
                    </tr>
                  ) : (
                    dateLimits.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>
                          {new Date(item.specific_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '14px' }}>
                          {item.document_limit === 0 
                            ? <span style={{ background: '#fef2f2', color: '#b91c1c', padding: '3px 10px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}>CLOSED (0)</span>
                            : <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{item.document_limit}</span>
                          }
                        </td>
                        <td style={{ padding: '14px 16px', color: '#475569', fontSize: '14px' }}>{item.reason}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <button 
                            onClick={() => handleDeleteException(item.id)}
                            style={{ padding: '5px 12px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
