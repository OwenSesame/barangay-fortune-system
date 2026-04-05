import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AccountManagement() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // States for the Modals
  const [updateModal, setUpdateModal] = useState({ isOpen: false, data: null });

  const fetchAccounts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/accounts');
      setAccounts(response.data);
    } catch (error) {
      console.error("Failed to fetch accounts", error);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // --- DELETE FUNCTION ---
  const handleDelete = async (id, account_type) => {
    // Official System Safeguard per documentation
    if (!window.confirm("Are you sure to Delete this?")) return;

    try {
      await axios.delete('http://localhost:5000/api/admin/accounts/delete', {
        data: { id, account_type }
      });
      alert("Account Deleted.");
      fetchAccounts();
    } catch (error) {
      alert("Error: Cannot delete this user because they have active document records linked to their account.");
    }
  };

  // --- UPDATE SUBMIT FUNCTION ---
  const submitUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put('http://localhost:5000/api/admin/accounts/update', {
        id: updateModal.data.id,
        account_type: updateModal.data.account_type,
        name: updateModal.data.name,
        role: updateModal.data.role
      });
      alert("Account updated successfully!");
      setUpdateModal({ isOpen: false, data: null });
      fetchAccounts();
    } catch (error) {
      alert("Failed to update account.");
    }
  };

  // Live Search Filter
  const filteredAccounts = accounts.filter(acc => 
    acc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    acc.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#f8fafc' }}>
      
      {/* Administrator Sidebar */}
      <div style={{ width: '260px', background: '#1e1b4b', color: 'white', padding: '30px 20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '22px', margin: '0 0 40px 0', borderBottom: '1px solid #3730a3', paddingBottom: '15px' }}>Barangay Fortune</h2>
        <div style={{ flex: 1 }}>
          <p onClick={() => navigate('/admin-dashboard')} style={{ margin: '15px 0', cursor: 'pointer', color: '#a5b4fc' }}>🏠 Home</p>
          <p style={{ margin: '15px 0', cursor: 'pointer', fontWeight: 'bold', color: 'white' }}>👤 Account Management</p>
          <p onClick={() => navigate('/pending-review')} style={{ margin: '15px 0', cursor: 'pointer', color: '#a5b4fc' }}>📋 Pending Review</p>
          <p onClick={() => navigate('/ready-to-print')} style={{ margin: '15px 0', cursor: 'pointer', color: '#a5b4fc' }}>🔖 Ready to Print</p>
          <p onClick={() => navigate('/document-management')} style={{ margin: '15px 0', cursor: 'pointer', color: '#a5b4fc' }}>📄 Document Templates</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '10px', background: 'white', color: '#1e1b4b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: 0, color: '#0f172a', fontSize: '28px' }}>Account Management</h1>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          
          {/* Top Bar with Search */}
          <div style={{ padding: '20px 25px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#334155' }}>System Users ({filteredAccounts.length})</h3>
            <input 
              type="text" 
              placeholder="🔍 Search Users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '10px 15px', width: '300px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left', fontSize: '14px', textTransform: 'uppercase' }}>
                <th style={{ padding: '15px 25px' }}>No.</th>
                <th style={{ padding: '15px 25px' }}>Name</th>
                <th style={{ padding: '15px 25px' }}>Role</th>
                <th style={{ padding: '15px 25px', width: '200px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length > 0 ? (
                filteredAccounts.map((acc, index) => (
                  <tr key={`${acc.account_type}-${acc.id}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '15px 25px', color: '#64748b', fontWeight: 'bold' }}>{index + 1}</td>
                    <td style={{ padding: '15px 25px', color: '#0f172a', fontWeight: '500' }}>{acc.name}</td>
                    <td style={{ padding: '15px 25px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: acc.role === 'Admin' ? '#fef08a' : acc.role === 'Staff' ? '#dbeafe' : '#f1f5f9', color: acc.role === 'Admin' ? '#854d0e' : acc.role === 'Staff' ? '#1e40af' : '#475569' }}>
                        {acc.role}
                      </span>
                    </td>
                    <td style={{ padding: '15px 25px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setUpdateModal({ isOpen: true, data: { ...acc } })} style={{ padding: '6px 12px', background: '#334155', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                          Update
                        </button>
                        <button onClick={() => handleDelete(acc.id, acc.account_type)} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No matching accounts found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- UPDATE USER MODAL --- */}
      {updateModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '400px' }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#0f172a' }}>Update Account</h2>
            
            <form onSubmit={submitUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#475569', fontWeight: 'bold' }}>Full Name</label>
                <input 
                  type="text" 
                  value={updateModal.data.name} 
                  onChange={(e) => setUpdateModal({ ...updateModal, data: { ...updateModal.data, name: e.target.value } })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  required
                />
              </div>

              {/* Only let them change roles for Officials, Residents are strictly Residents */}
              {updateModal.data.account_type === 'official' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#475569', fontWeight: 'bold' }}>System Role</label>
                  <select 
                    value={updateModal.data.role} 
                    onChange={(e) => setUpdateModal({ ...updateModal, data: { ...updateModal.data, role: e.target.value } })} 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '10px', background: '#334155', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Update
                </button>
                <button type="button" onClick={() => setUpdateModal({ isOpen: false, data: null })} style={{ flex: 1, padding: '10px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}