import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState('Resident');
  const [identifier, setIdentifier] = useState(''); // Email or Username
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', { role, identifier, password });
      
      // Check the role returned from the backend and redirect
      const userRole = response.data.role;
      if (userRole === 'Resident') {
          navigate('/resident-dashboard');
      } else if (userRole === 'Staff') {
          navigate('/staff-dashboard');
      } else if (userRole === 'Admin') {
          navigate('/admin-dashboard');
      }

    } catch (err) {
      alert("Invalid credentials. Please try again.");
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
      <h2>Barangay System Login</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        <label>Login As:</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="Resident">Resident</option>
          <option value="Staff">Barangay Staff</option>
          <option value="Admin">Admin</option>
        </select>

        <input 
          type={role === 'Resident' ? "email" : "text"} 
          placeholder={role === 'Resident' ? "Email Address" : "Username"} 
          onChange={(e) => setIdentifier(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Password" 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        
        <button type="submit">Login</button>
      </form>
      
      {role === 'Resident' && (
        <p style={{ marginTop: '10px', cursor: 'pointer', color: 'blue' }} onClick={() => navigate('/register')}>
          Not Registered? Click Here
        </p>
      )}
    </div>
  );
}