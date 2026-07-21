import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      setStatusMessage({ type: 'success', text: response.data.message || "Reset link sent to your email." });
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setStatusMessage({ type: 'error', text: err.response.data.error });
      } else {
        setStatusMessage({ type: 'error', text: "Failed to send reset link. Please try again." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', fontFamily: '"Segoe UI", Tahoma, sans-serif' }}>
      <div style={{ background: 'white', padding: '40px 50px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px', border: '1px solid #e2e8f0' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: '0', color: '#0f172a', fontSize: '26px', fontWeight: '800' }}>Forgot Password</h1>
          <p style={{ color: '#64748b', margin: '5px 0 0 0', fontSize: '14px', fontWeight: '500' }}>Enter your registered email to receive a reset link</p>
        </div>

        {statusMessage && (
          <div style={{ 
            padding: '12px', 
            marginBottom: '20px', 
            borderRadius: '8px', 
            backgroundColor: statusMessage.type === 'success' ? '#dcfce7' : '#fee2e2', 
            color: statusMessage.type === 'success' ? '#166534' : '#b91c1c',
            fontSize: '14px',
            textAlign: 'center',
            fontWeight: '600'
          }}>
            {statusMessage.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>Email Address</label>
            <input 
              type="email" 
              placeholder="Enter your email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              width: '100%', padding: '14px', backgroundColor: isLoading ? '#94a3b8' : '#2563eb', 
              color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', 
              cursor: isLoading ? 'not-allowed' : 'pointer', marginTop: '10px', transition: 'background 0.2s', 
              boxShadow: isLoading ? 'none' : '0 4px 6px rgba(37, 99, 235, 0.2)' 
            }}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            Remember your password?{' '}
            <span onClick={() => navigate('/')} style={{ color: '#2563eb', fontWeight: '600', cursor: 'pointer', textDecoration: 'none' }}>
              Back to Login
            </span>
          </p>
        </div>

      </div>
    </div>
  );
}
