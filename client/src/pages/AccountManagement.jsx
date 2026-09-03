import AdminSidebar from '../components/AdminSidebar';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function AccountManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Staff'); 
  
  const [staffList, setStaffList] = useState([]);
  const [residentList, setResidentList] = useState([]);
  const [badgeCounts, setBadgeCounts] = useState({ pending: 0, ready: 0, residentApprovals: 0 });
  
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ full_name: '', username: '', password: '', email_address: '' });
  
  // UPDATED: Edit Modal state now holds all specific profile fields
  const [editModal, setEditModal] = useState({ 
    isOpen: false, id: null, type: '', 
    full_name: '', username: '', 
    first_name: '', last_name: '', contact_number: '', email_address: '' 
  });

  const fetchData = async () => {
    try {
      // Toggle Feature Staff List
      const staffRes = await axios.get('http://localhost:5000/api/admin/staff-list');
      
      // Main Unified Accounts List
      const accountsRes = await axios.get('http://localhost:5000/api/admin/accounts');
      
      const officialsOnly = accountsRes.data.filter(acc => acc.account_type === 'official' && acc.role === 'Staff');
      const residentsOnly = accountsRes.data.filter(acc => acc.account_type === 'resident');
      
      // Merge the toggle permissions with the full profile data
      const mergedStaff = officialsOnly.map(official => {
        const toggleData = staffRes.data.find(s => s.user_id === official.id);
        return { ...official, can_review: toggleData ? toggleData.can_review : 0 };
      });

      setStaffList(mergedStaff);
      setResidentList(residentsOnly);
    } catch (error) {
      console.error("Failed to fetch accounts", error);
    }
  };

  // Fetch Notification Counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [requestsRes, residentsRes] = await Promise.all([
            axios.get('http://localhost:5000/api/staff/pending-requests'),
            axios.get('http://localhost:5000/api/admin/pending-residents')
        ]);
        const pending = requestsRes.data.filter(req => req.status === 'Pending').length;
        const ready = requestsRes.data.filter(req => req.status === 'Ready to Print').length;
        const residentApprovals = residentsRes.data.length;
        setBadgeCounts({ pending, ready, residentApprovals });
      } catch (error) {
        console.error("Failed to fetch notification counts", error);
      }
    };
    
    fetchData();
    fetchCounts();
    const interval = setInterval(fetchCounts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/admin/create-staff', newStaff);
      setIsAddStaffOpen(false);
      setNewStaff({ full_name: '', username: '', password: '', email_address: '' });
      fetchData();
      toast.success("New Staff Account Successfully Created!");
    } catch (error) { toast.error("Error creating staff account. Username might be taken."); }
  };

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    try {
      await axios.put('http://localhost:5000/api/admin/accounts/update', {
        id: editModal.id,
        account_type: editModal.type,
        full_name: editModal.full_name,
        username: editModal.username,
        first_name: editModal.first_name,
        last_name: editModal.last_name,
        contact_number: editModal.contact_number,
        email_address: editModal.email_address
      });
      setEditModal({ isOpen: false, id: null, type: '', full_name: '', username: '', first_name: '', last_name: '', contact_number: '', email_address: '' });
      fetchData();
      toast.success("Account information updated successfully!");
    } catch (error) { toast.error("Error updating account details."); }
  };

  const handleToggleAccess = async (staffId, currentAccess) => {
    try {
      const newAccess = currentAccess === 1 ? 0 : 1; 
      await axios.put(`http://localhost:5000/api/admin/staff/${staffId}/toggle-access`, { can_review: newAccess });
      fetchData();
    } catch (error) { toast.error("Error updating permissions."); }
  };

  const handleToggleStaffStatus = async (staffId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active'; 
      if (newStatus === 'Suspended' && !window.confirm("Are you sure you want to suspend this staff account? They will not be able to log in.")) return;
      await axios.put(`http://localhost:5000/api/admin/staff/${staffId}/toggle-status`, { status: newStatus });
      fetchData();
      toast.success(`Staff account marked as ${newStatus}.`);
    } catch (error) { toast.error("Error updating account status."); }
  };


  const handleDeleteAccount = async (id, type) => {
    if (!window.confirm(`WARNING: Are you sure you want to permanently delete this ${type} account?`)) return;
    try {
      await axios.put('http://localhost:5000/api/admin/accounts/archive', { id, account_type: type });
      fetchData();
    } catch (error) { toast.error("Cannot delete account. They may have active records."); }
  };

  // Open the edit modal and populate the specific fields
  const openEditModal = (user) => {
    setEditModal({
      isOpen: true,
      id: user.id,
      type: user.account_type,
      full_name: user.full_name || '',
      username: user.username || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      contact_number: user.contact_number || '',
      email_address: user.email_address || ''
    });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#f1f5f9' }}>
      
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
          .ui-tab {
            padding: 10px 24px; border-radius: 30px; font-weight: bold; font-size: 14px; cursor: pointer;
            transition: all 0.3s ease; border: none; outline: none;
          }
          .ui-tab.active { background: #1e1b4b; color: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .ui-tab.inactive { background: transparent; color: #64748b; }
          .ui-tab.inactive:hover { background: #e2e8f0; color: #334155; }
          .custom-table th { padding: 16px 24px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; }
          .custom-table td { padding: 16px 24px; vertical-align: middle; border-bottom: 1px solid #f1f5f9; }
          .custom-table tr:hover { background-color: #f8fafc; }
          .btn-action { padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: 0.2s; }
          .btn-edit { background: #f1f5f9; color: #3b82f6; border: 1px solid #cbd5e1; }
          .btn-edit:hover { background: #e0f2fe; border-color: #7dd3fc; }
          .btn-delete { background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; }
          .btn-delete:hover { background: #fee2e2; border-color: #fca5a5; }
          .btn-action.btn-suspend { background: #fee2e2; color: #991b1b; }
          .btn-action.btn-suspend:hover { background: #fca5a5; }
          .btn-action.btn-captain { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }
          .btn-action.btn-captain:hover { background: #fef08a; }
        `}
      </style>

      {/* Admin Sidebar */}
      <AdminSidebar badgeCounts={badgeCounts} />

      <div style={{ flex: 1, padding: '40px 50px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '32px', letterSpacing: '-0.5px' }}>Account Management</h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>Control system access, update profiles, and manage permissions.</p>
          </div>
          {activeTab === 'Staff' && (
            <button onClick={() => setIsAddStaffOpen(true)} style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
              + Add Front Desk Staff
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', background: '#e2e8f0', padding: '6px', borderRadius: '40px', width: 'fit-content' }}>
          <button onClick={() => setActiveTab('Staff')} className={`ui-tab ${activeTab === 'Staff' ? 'active' : 'inactive'}`}>👨‍💼 Front Desk Team</button>
          <button onClick={() => setActiveTab('Residents')} className={`ui-tab ${activeTab === 'Residents' ? 'active' : 'inactive'}`}>🏘️ Registered Residents</button>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th>Profile Name</th>
                <th>System Role</th>
                {activeTab === 'Staff' && <th>Pending Review Access</th>}
                <th style={{ textAlign: 'right' }}>Management Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeTab === 'Staff' ? (
                staffList.length > 0 ? staffList.map((staff) => (
                  <tr key={staff.id}>
                  <td>
                    <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>{staff.name}</div>
                    <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>@{staff.username}</div>
                    </td>
                    <td>
                      <span style={{ padding: '6px 12px', background: '#f1f5f9', color: '#475569', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #cbd5e1' }}>
                        Front Desk Staff
                      </span>
                    </td>
                    <td>
                      <button onClick={() => handleToggleAccess(staff.id, staff.can_review)} style={{ padding: '8px 16px', borderRadius: '30px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s', background: staff.can_review === 1 ? '#dcfce7' : '#f1f5f9', color: staff.can_review === 1 ? '#166534' : '#64748b' }}>
                        {staff.can_review === 1 ? '🟢 Access Granted' : '🔒 Access Revoked'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleToggleStaffStatus(staff.id, staff.account_status)} 
                          className={`btn-action ${staff.account_status === 'Active' ? 'btn-suspend' : 'btn-edit'}`}
                          style={staff.account_status !== 'Active' ? { background: '#10b981', color: 'white' } : {}}
                        >
                          {staff.account_status === 'Active' ? 'Suspend' : 'Activate'}
                        </button>
                        <button onClick={() => openEditModal(staff)} className="btn-action btn-edit">Edit</button>
                        <button onClick={() => handleDeleteAccount(staff.id, 'official')} className="btn-action btn-delete">Delete</button>
                      </div>
                    </td>
                  </tr>
                )) : <tr><td colSpan="4" style={{ padding: '50px', textAlign: 'center', color: '#94a3b8' }}>No staff members found.</td></tr>
              ) : (
                residentList.length > 0 ? residentList.map((res) => (
                  <tr key={res.id}>
                    <td>
                      <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>{res.first_name} {res.last_name}</div>
                      <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>{res.email_address} | {res.contact_number}</div>
                    </td>
                    <td><span style={{ padding: '6px 12px', background: '#eff6ff', color: '#1d4ed8', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #bfdbfe' }}>Resident</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => openEditModal(res)} className="btn-action btn-edit">Edit Profile</button>
                        <button onClick={() => handleDeleteAccount(res.id, 'resident')} className="btn-action btn-delete">Remove</button>
                      </div>
                    </td>
                  </tr>
                )) : <tr><td colSpan="3" style={{ padding: '50px', textAlign: 'center', color: '#94a3b8' }}>No registered residents found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD NEW STAFF MODAL --- */}
      {isAddStaffOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '40px', borderRadius: '20px', width: '420px' }}>
            <h2 style={{ margin: '0 0 25px 0', color: '#0f172a', fontSize: '24px' }}>Register New Staff</h2>
            <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>Full Name</label>
                <input type="text" value={newStaff.full_name} onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', background: '#f8fafc', outline: 'none' }} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>Username</label>
                <input type="text" value={newStaff.username} onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', background: '#f8fafc', outline: 'none' }} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>Password</label>
                <input type="password" value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', background: '#f8fafc', outline: 'none' }} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>Email Address (for password reset)</label>
                <input type="email" value={newStaff.email_address} onChange={(e) => setNewStaff({ ...newStaff, email_address: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', background: '#f8fafc', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsAddStaffOpen(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DYNAMIC EDIT ACCOUNT MODAL --- */}
      {editModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '40px', borderRadius: '20px', width: '450px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
              <span style={{ fontSize: '24px' }}>✏️</span>
              <h2 style={{ margin: 0, color: '#0f172a', fontSize: '24px' }}>Edit {editModal.type === 'official' ? 'Staff' : 'Resident'} Profile</h2>
            </div>
            
            <form onSubmit={handleUpdateAccount} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              {/* STAFF FIELDS */}
              {editModal.type === 'official' && (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>Full Name</label>
                    <input type="text" value={editModal.full_name} onChange={(e) => setEditModal({ ...editModal, full_name: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>Username</label>
                    <input type="text" value={editModal.username} onChange={(e) => setEditModal({ ...editModal, username: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} required />
                  </div>
                </>
              )}

              {/* RESIDENT FIELDS */}
              {editModal.type === 'resident' && (
                <>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>First Name</label>
                      <input type="text" value={editModal.first_name} onChange={(e) => setEditModal({ ...editModal, first_name: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} required />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>Last Name</label>
                      <input type="text" value={editModal.last_name} onChange={(e) => setEditModal({ ...editModal, last_name: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} required />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>Contact Number</label>
                    <input type="text" value={editModal.contact_number} onChange={(e) => setEditModal({ ...editModal, contact_number: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>Email Address</label>
                    <input type="email" value={editModal.email_address} onChange={(e) => setEditModal({ ...editModal, email_address: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} required />
                  </div>
                </>
              )}
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '15px' }}>
                <button type="button" onClick={() => setEditModal({ isOpen: false, id: null, type: '', full_name: '', username: '', first_name: '', last_name: '', contact_number: '', email_address: '' })} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}