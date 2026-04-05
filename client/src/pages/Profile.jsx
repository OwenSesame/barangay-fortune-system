import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    first_name: '', last_name: '', email_address: '', 
    contact_number: '', addres_street: '', civil_status: ''
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
      alert("Profile updated successfully!");
    } catch (error) {
      alert("Failed to update profile.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#f4f7f6' }}>
      
      {/* Sidebar */}
      <div style={{ width: '260px', background: '#1e3a8a', color: 'white', padding: '30px 20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '20px', margin: '0 0 40px 0', borderBottom: '1px solid #3b82f6', paddingBottom: '15px' }}>🏛️ Brgy. Fortune</h2>
        <div style={{ flex: 1 }}>
          <p onClick={() => navigate('/resident-dashboard')} style={{ margin: '15px 0', cursor: 'pointer', color: '#93c5fd' }}>📄 My Dashboard</p>
          <p onClick={() => navigate('/document-request')} style={{ margin: '15px 0', cursor: 'pointer', color: '#93c5fd' }}>➕ Request Document</p>
          <p style={{ margin: '15px 0', cursor: 'pointer', fontWeight: 'bold' }}>👤 Profile Settings</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '10px', background: 'transparent', color: '#fca5a5', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer' }}>Logout</button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '40px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', width: '100%', maxWidth: '600px', height: 'fit-content' }}>
          
          <h2 style={{ margin: '0 0 5px 0', color: '#1f2937' }}>Account Profile</h2>
          <p style={{ color: '#6b7280', marginBottom: '30px', fontSize: '14px' }}>Keep your contact information up to date so the Barangay can reach you.</p>
          
          {/* Read-Only Official Information */}
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#334155', textTransform: 'uppercase', fontSize: '12px' }}>Official Records (Uneditable)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#64748b' }}>Full Name</label>
                <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{profile.first_name} {profile.last_name}</div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#64748b' }}>Civil Status</label>
                <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{profile.civil_status}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '12px', color: '#64748b' }}>Registered Email</label>
                <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{profile.email_address}</div>
              </div>
            </div>
          </div>

          {/* Editable Form */}
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

        </div>
      </div>
    </div>
  );
}