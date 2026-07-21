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

  const inputClass = "w-full p-3 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
  const labelClass = "block mb-2 text-slate-700 font-semibold text-xs uppercase tracking-wider";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans p-4 md:p-8">
      <div className="bg-white p-8 md:p-10 rounded-lg shadow-xl w-full max-w-2xl border border-slate-200 transform transition-all">
        
        <div className="text-center mb-8">
          <h2 className="m-0 text-blue-900 text-2xl md:text-3xl font-extrabold tracking-tight">Resident Registration</h2>
          <p className="text-slate-500 mt-2 text-sm font-medium">Fill in your official details to access Barangay services.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          <div className="col-span-1 md:col-span-2">
            <h3 className="border-b border-slate-200 pb-2 m-0 text-slate-900 text-base font-bold">Personal Information</h3>
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
            <input type="date" name="dateOfBirth" onChange={handleChange} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Civil Status</label>
            <select name="civilStatus" onChange={handleChange} className={inputClass + " bg-slate-50 cursor-pointer"}>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Widowed">Widowed</option>
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
            <h3 className="border-b border-slate-200 pb-2 m-0 text-slate-900 text-base font-bold">Account Security & Verification</h3>
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

          <div className="col-span-1 md:col-span-2 bg-slate-50 p-5 rounded-lg border border-dashed border-slate-300 mt-2">
            <label className={labelClass + " text-blue-900"}>Upload Valid ID (Image)</label>
            <p className="text-xs text-slate-500 mt-0 mb-3 font-medium">Please provide a clear picture of your ID for verification purposes.</p>
            <input type="file" accept="image/*" onChange={handleFileChange} required className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors" />
          </div>

          <div className="col-span-1 md:col-span-2 mt-4">
            <button type="submit" className="w-full p-3.5 bg-emerald-500 text-white rounded-lg text-base font-bold cursor-pointer shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 hover:shadow-emerald-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
              Submit Registration
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <button onClick={() => navigate('/')} className="bg-transparent border-none text-slate-500 cursor-pointer text-sm font-semibold hover:text-slate-800 transition-colors">
            ← Back to Login
          </button>
        </div>

      </div>
    </div>
  );
}