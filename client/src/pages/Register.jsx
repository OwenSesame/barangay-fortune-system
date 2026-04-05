import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', middleName: '', dateOfBirth: '', 
    civilStatus: 'Single', address: '', contactNumber: '', email: '', password: ''
  });
  const [idProof, setIdProof] = useState(null);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setIdProof(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSend = new FormData();
    for (const key in formData) dataToSend.append(key, formData[key]);
    if (idProof) dataToSend.append('id_proof', idProof);

    try {
      await axios.post('http://localhost:5000/api/auth/register', dataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('Registration successful! You can now log in.');
      navigate('/');
    } catch (error) {
      alert('Error registering account. Email might already exist.');
    }
  };

  const inputStyle = { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', marginBottom: '8px', color: '#334155', fontWeight: '500', fontSize: '14px' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f4f8', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', padding: '40px 20px' }}>
      <div style={{ background: 'white', padding: '40px 50px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '600px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ margin: '0', color: '#1e3a8a', fontSize: '24px' }}>Resident Registration</h2>
          <p style={{ color: '#64748b', margin: '5px 0 0 0', fontSize: '14px' }}>Fill in your official details to access Barangay services.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          <div style={{ gridColumn: 'span 2' }}><h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', margin: '0', color: '#0f172a', fontSize: '16px' }}>Personal Information</h3></div>

          <div>
            <label style={labelStyle}>First Name</label>
            <input type="text" name="firstName" onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Last Name</label>
            <input type="text" name="lastName" onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Middle Name</label>
            <input type="text" name="middleName" onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Date of Birth</label>
            <input type="date" name="dateOfBirth" onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Civil Status</label>
            <select name="civilStatus" onChange={handleChange} style={inputStyle}>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Widowed">Widowed</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Contact Number</label>
            <input type="text" name="contactNumber" onChange={handleChange} required style={inputStyle} />
          </div>
          
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Complete Street Address</label>
            <input type="text" name="address" onChange={handleChange} required style={inputStyle} />
          </div>

          <div style={{ gridColumn: 'span 2', marginTop: '10px' }}><h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', margin: '0', color: '#0f172a', fontSize: '16px' }}>Account Security & Verification</h3></div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Email Address</label>
            <input type="email" name="email" onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input type="password" name="password" onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Confirm Password</label>
            <input type="password" required style={inputStyle} />
          </div>

          <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
            <label style={{ ...labelStyle, color: '#1e3a8a' }}>Upload Valid ID (Image)</label>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '0', marginBottom: '10px' }}>Please provide a clear picture of your ID for verification purposes.</p>
            <input type="file" accept="image/*" onChange={handleFileChange} required style={{ width: '100%', fontSize: '14px' }} />
          </div>

          <div style={{ gridColumn: 'span 2', marginTop: '10px' }}>
            <button type="submit" style={{ width: '100%', padding: '15px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}>
              Submit Registration
            </button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}>
            ← Back to Login
          </button>
        </div>

      </div>
    </div>
  );
}