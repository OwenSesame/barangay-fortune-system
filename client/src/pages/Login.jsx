import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [role, setRole] = useState('Resident');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', { role, identifier, password });
      
      const userRole = response.data.role;
      const userId = response.data.id;

      // Store basic auth info
      localStorage.setItem('userId', userId);
      localStorage.setItem('userRole', userRole);

      // Store permissions if they are a staff member
      if (response.data.can_review !== undefined) {
        localStorage.setItem('canReview', response.data.can_review);
      }

      // Navigate based on exact role from backend
      if (userRole === 'Resident') {
          navigate('/resident-dashboard');
      } else if (userRole === 'Staff') {
          navigate('/staff-home');
      } else if (userRole === 'Admin') {
          navigate('/admin-dashboard');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        alert(err.response.data.error);
      } else {
        alert("Invalid credentials or server error");
      }
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', fontFamily: '"Segoe UI", Tahoma, sans-serif' }}>
      <div style={{ background: 'white', padding: '40px 50px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px', border: '1px solid #e2e8f0' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: '0', color: '#0f172a', fontSize: '26px', fontWeight: '800' }}>🏛️ Brgy. Fortune</h1>
          <p style={{ color: '#64748b', margin: '5px 0 0 0', fontSize: '14px', fontWeight: '500' }}>E-Services Portal</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>Account Type</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', backgroundColor: '#f8fafc', color: '#0f172a', outline: 'none', cursor: 'pointer' }}
            >
              {/* FIX: Values must exactly match the Database ENUM ('Resident', 'Staff', 'Admin') */}
              <option value="Resident">Resident</option>
              <option value="Staff">Barangay Staff</option>
              <option value="Admin">Administrator</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>
              {role === 'Resident' ? 'Email Address' : 'Username'}
            </label>
            <input 
              type={role === 'Resident' ? "email" : "text"} 
              placeholder={role === 'Resident' ? 'Enter your email' : 'Enter your username'} 
              value={identifier} 
              onChange={(e) => setIdentifier(e.target.value)} 
              required 
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>Password</label>
            <input 
              type="password" 
              placeholder="Enter your password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', transition: 'background 0.2s', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)' }}>
            Sign In
          </button>
        </form>

        {/* Only show Register link for Residents */}
        {role === 'Resident' && (
          <div style={{ textAlign: 'center', marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Don't have an account?{' '}
              <span onClick={() => navigate('/register')} style={{ color: '#2563eb', fontWeight: '600', cursor: 'pointer', textDecoration: 'none' }}>
                Register Here
              </span>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}