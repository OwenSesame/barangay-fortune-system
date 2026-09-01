import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Login() {
  const [role, setRole] = useState('Resident');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', { role, identifier, password });
      
      const userRole = response.data.role;
      const userId = response.data.id;

      // Store basic auth info
      localStorage.setItem('token', response.data.token);
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
        setError(err.response.data.error);
        toast.error(err.response.data.error);
      } else {
        setError("Invalid credentials or server error");
        toast.error("Invalid credentials or server error");
      }
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent', fontFamily: '"Segoe UI", Tahoma, sans-serif' }}>
      
      {/* Left Column: Login Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
          
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-cyan)', fontSize: '20px', boxShadow: '0 0 10px rgba(6,182,212,0.2)' }}>
                🏛️
              </div>
              <h1 style={{ margin: '0', color: 'var(--text-main)', fontSize: '28px', fontWeight: '800' }}>Brgy. Fortune</h1>
            </div>
            <p style={{ color: 'var(--text-muted)', margin: '0', fontSize: '15px' }}>Welcome back! Please enter your details to sign in.</p>
          </div>

          {error && (
            <div style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', marginBottom: '25px', borderLeft: '4px solid #f43f5e' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>Account Type</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '15px', backgroundColor: 'rgba(15,23,42,0.6)', color: 'var(--text-main)', outline: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                className="focus:border-[var(--neon-cyan)] focus:shadow-[0_0_10px_rgba(6,182,212,0.2)]"
              >
                <option value="Resident">Resident</option>
                <option value="Staff">Barangay Staff</option>
                <option value="Admin">Administrator</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>
                {role === 'Resident' ? 'Email Address' : 'Username'}
              </label>
              <input 
                type={role === 'Resident' ? "email" : "text"} 
                placeholder={role === 'Resident' ? 'Enter your email' : 'Enter your username'} 
                value={identifier} 
                onChange={(e) => setIdentifier(e.target.value)} 
                required 
                style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '15px', boxSizing: 'border-box', outline: 'none', backgroundColor: 'rgba(15,23,42,0.6)', color: 'var(--text-main)', transition: 'all 0.2s' }}
                className="focus:border-[var(--neon-cyan)] focus:shadow-[0_0_10px_rgba(6,182,212,0.2)] placeholder:text-slate-500"
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', margin: 0 }}>Password</label>
                {role === 'Resident' && (
                  <span onClick={() => navigate('/forgot-password')} className="hover:underline transition-colors" style={{ color: 'var(--neon-cyan)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    Forgot password?
                  </span>
                )}
              </div>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '15px', boxSizing: 'border-box', outline: 'none', backgroundColor: 'rgba(15,23,42,0.6)', color: 'var(--text-main)', transition: 'all 0.2s' }}
                className="focus:border-[var(--neon-cyan)] focus:shadow-[0_0_10px_rgba(6,182,212,0.2)] placeholder:text-slate-500"
              />
            </div>

            <button type="submit" className="transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]" style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-blue))', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
              Sign In
            </button>
          </form>

          {/* Only show Register link for Residents */}
          {role === 'Resident' && (
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                Don't have an account?{' '}
                <span onClick={() => navigate('/register')} className="hover:underline transition-colors" style={{ color: 'var(--neon-cyan)', fontWeight: 'bold', cursor: 'pointer' }}>
                  Sign up
                </span>
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Right Column: Hero Image (Hidden on mobile) */}
      <div className="hidden lg:flex" style={{ flex: 1.2, background: 'transparent', position: 'relative', overflow: 'hidden', padding: '20px' }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '24px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
          <img 
            src="/brgy_hero.jpg" 
            alt="Barangay Hall" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'; // Fallback modern city hall if local image fails
            }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0) 60%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '40px', color: 'white' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Barangay E-Services</h2>
            <p style={{ fontSize: '16px', color: '#cbd5e1', margin: 0, maxWidth: '400px', lineHeight: '1.5' }}>
              A faster, more convenient way to request barangay documents and certificates online.
            </p>
          </div>
        </div>
      </div>
      
    </div>
  );
}