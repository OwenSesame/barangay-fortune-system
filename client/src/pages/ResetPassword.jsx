import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !email) {
      setStatusMessage({ type: 'error', text: "Invalid or missing password reset link." });
    }
  }, [token, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage('');

    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: "Passwords do not match." });
      return;
    }
    if (newPassword.length < 6) {
      setStatusMessage({ type: 'error', text: "Password must be at least 6 characters long." });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/reset-password', { 
        email, 
        token, 
        newPassword 
      });
      
      setStatusMessage({ type: 'success', text: response.data.message || "Password updated successfully! Redirecting..." });
      
      // Automatically redirect to login after success
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setStatusMessage({ type: 'error', text: err.response.data.error });
      } else {
        setStatusMessage({ type: 'error', text: "Failed to reset password. The link might be expired." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', fontFamily: '"Segoe UI", Tahoma, sans-serif' }}>
      <div style={{ background: 'white', padding: '40px 50px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px', border: '1px solid #e2e8f0' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: '0', color: '#0f172a', fontSize: '26px', fontWeight: '800' }}>Create New Password</h1>
          <p style={{ color: '#64748b', margin: '5px 0 0 0', fontSize: '14px', fontWeight: '500' }}>{email ? `For ${email}` : 'Enter your new password below'}</p>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>New Password</label>
            <input 
              type="password" 
              placeholder="Enter new password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              required 
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>Confirm Password</label>
            <input 
              type="password" 
              placeholder="Confirm new password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading || !token || !email || statusMessage.type === 'success'}
            style={{ 
              width: '100%', padding: '14px', 
              backgroundColor: (isLoading || !token || !email || statusMessage.type === 'success') ? '#94a3b8' : '#10b981', 
              color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', 
              cursor: (isLoading || !token || !email || statusMessage.type === 'success') ? 'not-allowed' : 'pointer', marginTop: '10px', transition: 'background 0.2s', 
              boxShadow: (isLoading || !token || !email || statusMessage.type === 'success') ? 'none' : '0 4px 6px rgba(16, 185, 129, 0.2)' 
            }}
          >
            {isLoading ? 'Updating...' : 'Save Password'}
          </button>
        </form>

      </div>
    </div>
  );
}
