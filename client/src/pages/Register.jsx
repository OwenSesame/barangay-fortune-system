import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

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

    const loadingToast = toast.loading('Submitting registration...');
    try {
      await axios.post('http://localhost:5000/api/auth/register', dataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Registration successful! It can be up to a week before official email confirmation is sent.', { id: loadingToast, duration: 5000 });
      navigate('/');
    } catch (error) {
      toast.error('Error registering account. Email might already exist.', { id: loadingToast });
    }
  };

  const inputClass = "w-full p-3 rounded-lg border border-[rgba(255,255,255,0.1)] text-sm outline-none focus:border-[var(--neon-cyan)] focus:shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all bg-[rgba(15,23,42,0.6)] text-[var(--text-main)] placeholder-slate-500";
  const labelClass = "block mb-2 text-[var(--text-muted)] font-semibold text-xs uppercase tracking-wider";

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent', fontFamily: '"Segoe UI", Tahoma, sans-serif' }}>
      
      {/* Left Column: Register Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', overflowY: 'auto' }}>
        <div className="glass-card" style={{ width: '100%', maxWidth: '600px', padding: '40px' }}>
          
          <div style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-cyan)', fontSize: '20px', boxShadow: '0 0 10px rgba(6,182,212,0.2)' }}>
                🏛️
              </div>
              <h1 style={{ margin: '0', color: 'var(--text-main)', fontSize: '28px', fontWeight: '800' }}>Resident Registration</h1>
            </div>
            <p style={{ color: 'var(--text-muted)', margin: '0', fontSize: '15px' }}>Fill in your official details to access Barangay services.</p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            <div className="col-span-1 md:col-span-2">
              <h3 className="border-b border-[rgba(255,255,255,0.05)] pb-2 m-0 text-white text-base font-bold mt-2">Personal Information</h3>
            </div>

            <div>
              <label className={labelClass}>First Name</label>
              <input type="text" name="firstName" onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Last Name</label>
              <input type="text" name="lastName" onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Middle Name</label>
              <input type="text" name="middleName" onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Date of Birth</label>
              <input type="date" name="dateOfBirth" onChange={handleChange} required className={inputClass} style={{ colorScheme: 'dark' }} />
            </div>
            <div>
              <label className={labelClass}>Civil Status</label>
              <select name="civilStatus" onChange={handleChange} className={inputClass + " cursor-pointer"}>
                <option value="Single" style={{background: '#0f172a'}}>Single</option>
                <option value="Married" style={{background: '#0f172a'}}>Married</option>
                <option value="Widowed" style={{background: '#0f172a'}}>Widowed</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Contact Number</label>
              <input type="text" name="contactNumber" onChange={handleChange} required className={inputClass} />
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <label className={labelClass}>Complete Street Address</label>
              <input type="text" name="address" onChange={handleChange} required className={inputClass} />
            </div>

            <div className="col-span-1 md:col-span-2 mt-4">
              <h3 className="border-b border-[rgba(255,255,255,0.05)] pb-2 m-0 text-white text-base font-bold">Account Security & Verification</h3>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className={labelClass}>Email Address</label>
              <input type="email" name="email" onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input type="password" name="password" onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Confirm Password</label>
              <input type="password" required className={inputClass} />
            </div>

            <div className="col-span-1 md:col-span-2 bg-[rgba(255,255,255,0.02)] p-5 rounded-xl border border-dashed border-[rgba(255,255,255,0.1)] mt-2">
              <label className={labelClass + " text-[var(--neon-cyan)]"}>Upload Valid ID (Image)</label>
              <p className="text-xs text-[var(--text-muted)] mt-0 mb-3 font-medium">Please provide a clear picture of your ID for verification purposes.</p>
              <input type="file" accept="image/*" onChange={handleFileChange} required className="w-full text-sm text-[var(--text-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[rgba(6,182,212,0.1)] file:text-[var(--neon-cyan)] hover:file:bg-[rgba(6,182,212,0.2)] transition-colors cursor-pointer" />
            </div>

            <div className="col-span-1 md:col-span-2 mt-4">
              <button type="submit" className="transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:-translate-y-0.5 active:translate-y-0" style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-blue))', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                Submit Registration
              </button>
            </div>
          </form>

          <div className="text-center mt-8">
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
              Already have an account?{' '}
              <span onClick={() => navigate('/')} className="hover:underline transition-colors" style={{ color: 'var(--neon-cyan)', fontWeight: 'bold', cursor: 'pointer' }}>
                Sign in here
              </span>
            </p>
          </div>

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
              e.target.src = 'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
            }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0) 60%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '40px', color: 'white' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Join Your Community</h2>
            <p style={{ fontSize: '16px', color: '#cbd5e1', margin: 0, maxWidth: '400px', lineHeight: '1.5' }}>
              Create an account to quickly apply for clearances, certificates, and more, all from the comfort of your home.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}