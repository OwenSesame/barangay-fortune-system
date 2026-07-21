import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import ResidentBottomNav from '../components/ResidentBottomNav';

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    first_name: '', last_name: '', email_address: '', 
    contact_number: '', addres_street: '', civil_status: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const myId = localStorage.getItem('userId');
        if (!myId) return navigate('/');

        const response = await axios.get(`http://localhost:5000/api/auth/profile/${myId}`);
        setProfile(response.data);
      } catch (error) {
        console.error("Failed to load profile", error);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const myId = localStorage.getItem('userId');
      await axios.put(`http://localhost:5000/api/auth/profile/update/${myId}`, {
        contact_number: profile.contact_number,
        addres_street: profile.addres_street
      });
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile.");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("New passwords do not match!");
    }
    
    try {
      const myId = localStorage.getItem('userId');
      const response = await axios.put(`http://localhost:5000/api/auth/profile/change-password/${myId}`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success(response.data.message || "Password updated successfully!");
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Failed to update password.");
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#f4f7f6] font-sans pb-[65px] md:pb-0">
      
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-[260px] bg-[#1e3a8a] text-white p-[30px_20px] sticky top-0 h-screen overflow-y-auto">
        <h2 style={{ fontSize: '20px', margin: '0 0 40px 0', borderBottom: '1px solid #3b82f6', paddingBottom: '15px' }}>🏛️ Brgy. Fortune</h2>
        <div style={{ flex: 1 }}>
          <p onClick={() => navigate('/resident-dashboard')} className="transition-all duration-300 hover:translate-x-2 hover:bg-[#2563eb] hover:text-white" style={{ padding: '8px 16px', borderRadius: '8px', margin: '15px 0', cursor: 'pointer', color: '#93c5fd' }}>📄 My Dashboard</p>
          <p onClick={() => navigate('/document-request')} className="transition-all duration-300 hover:translate-x-2 hover:bg-[#2563eb] hover:text-white" style={{ padding: '8px 16px', borderRadius: '8px', margin: '15px 0', cursor: 'pointer', color: '#93c5fd' }}>➕ Request Document</p>
          <p className="transition-all duration-300 hover:translate-x-2 hover:bg-[#2563eb] hover:text-white" style={{ padding: '8px 16px', borderRadius: '8px', margin: '15px 0', cursor: 'pointer', fontWeight: 'bold' }}>👤 Profile Settings</p>
        </div>
        <button onClick={handleLogout} className="transition-all duration-300 bg-transparent text-[#fca5a5] hover:bg-[#ef4444] hover:text-white hover:border-[#ef4444]" style={{ padding: '10px', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-5 md:p-[40px] flex justify-center overflow-y-auto w-full overflow-x-hidden">
        <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', w: '100%', maxWidth: '600px', height: 'fit-content', marginBottom: '40px' }}>
          
          <h2 style={{ margin: '0 0 5px 0', color: '#1f2937' }}>Account Profile</h2>
          <p style={{ color: '#6b7280', marginBottom: '30px', fontSize: '14px' }}>Keep your contact information up to date so the Barangay can reach you.</p>
          
          {/* Read-Only Official Information */}
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#334155', textTransform: 'uppercase', fontSize: '12px' }}>Official Records (Uneditable)</h4>
            <div className="flex flex-col md:grid md:grid-cols-2 gap-[15px]">
              <div>
                <label style={{ fontSize: '12px', color: '#64748b' }}>Full Name</label>
                <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{profile.first_name} {profile.last_name}</div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#64748b' }}>Civil Status</label>
                <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{profile.civil_status}</div>
              </div>
              <div className="md:col-span-2">
                <label style={{ fontSize: '12px', color: '#64748b' }}>Registered Email</label>
                <div className="break-all" style={{ fontWeight: 'bold', color: '#0f172a' }}>{profile.email_address}</div>
              </div>
            </div>
          </div>

          {/* Editable Form */}
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: '500', fontSize: '14px' }}>Contact Number</label>
              <input 
                type="text" 
                value={profile.contact_number} 
                onChange={(e) => setProfile({...profile, contact_number: e.target.value})} 
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: '500', fontSize: '14px' }}>Complete Address</label>
              <input 
                type="text" 
                value={profile.addres_street} 
                onChange={(e) => setProfile({...profile, addres_street: e.target.value})} 
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px' }}
              />
            </div>

            <button type="submit" style={{ width: '100%', padding: '14px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
              💾 Save Updates
            </button>
          </form>

          {/* Change Password Form */}
          <h3 style={{ margin: '0 0 15px 0', color: '#1f2937', borderTop: '1px solid #e2e8f0', paddingTop: '30px' }}>Change Password</h3>
          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: '500', fontSize: '14px' }}>Current Password</label>
              <input 
                type="password" 
                value={passwordForm.currentPassword} 
                onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})} 
                required
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: '500', fontSize: '14px' }}>New Password</label>
              <input 
                type="password" 
                value={passwordForm.newPassword} 
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} 
                required
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: '500', fontSize: '14px' }}>Confirm New Password</label>
              <input 
                type="password" 
                value={passwordForm.confirmPassword} 
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} 
                required
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }}
              />
            </div>

            <button type="submit" style={{ width: '100%', padding: '14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
              🔒 Update Password
            </button>
          </form>

        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <ResidentBottomNav />
    </div>
  );
}