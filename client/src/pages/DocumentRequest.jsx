import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function DocumentRequest() {
  const navigate = useNavigate();
  const [availableDocs, setAvailableDocs] = useState([]);
  
  // State variables to hold the form data
  const [docType, setDocType] = useState('');
  const [purpose, setPurpose] = useState('');
  const [requirementFile, setRequirementFile] = useState(null);

  useEffect(() => {
    // Check if logged in
    const myId = localStorage.getItem('userId');
    if (!myId) return navigate('/');

    // Fetch the EXACT list of active documents using the Resident route
    const fetchDocs = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/requests/documents');
        // The backend already filters for available=1, so we just set the data!
        setAvailableDocs(response.data);
      } catch (err) {
        console.error("Error fetching documents:", err);
      }
    };

    fetchDocs();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!docType) return alert("Please select a document type.");
    if (!requirementFile) return alert("Please upload the required document/ID.");

    const myId = localStorage.getItem('userId');
    
    // Because we are sending a FILE, we MUST use FormData
    const formData = new FormData();
    formData.append('resident_id', myId);
    formData.append('doc_type_id', docType);
    formData.append('purpose', purpose);
    formData.append('requirement_file', requirementFile);

    try {
      const response = await axios.post('http://localhost:5000/api/requests/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert(`Success! Your Queue Number is: ${response.data.queue_number}`);
      navigate('/resident-dashboard');
      
    } catch (error) {
      alert("Error submitting application. Please try again.");
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
          <p style={{ margin: '15px 0', cursor: 'pointer', fontWeight: 'bold' }}>➕ Request Document</p>
          <p onClick={() => navigate('/profile')} style={{ margin: '15px 0', cursor: 'pointer', color: '#93c5fd' }}>👤 Profile Settings</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '10px', background: 'transparent', color: '#fca5a5', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer' }}>Logout</button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', width: '100%', maxWidth: '600px', marginTop: '20px' }}>
          
          <h2 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>New Document Application</h2>
          <p style={{ color: '#6b7280', marginBottom: '30px', fontSize: '14px' }}>Fill out the details below and attach the necessary requirements.</p>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Dynamic Dropdown tied to Database */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: '500' }}>Document Type</label>
              <select 
                value={docType} 
                onChange={(e) => setDocType(e.target.value)} 
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px', backgroundColor: '#f8fafc' }}
                required
              >
                <option value="" disabled>-- Select a Document --</option>
                {availableDocs.map((doc) => (
                  <option key={doc.doc_type_id} value={doc.doc_type_id}>
                    {/* HERE IS THE PESO SIGN RESTORED! */}
                    {doc.doc_name} (Fee: ₱{doc.base_fee})
                  </option>
                ))}
              </select>
            </div>

            {/* Purpose Textbox */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: '500' }}>Purpose of Request</label>
              <input 
                type="text" 
                placeholder="e.g., Employment, School Requirement, Travel" 
                value={purpose} 
                onChange={(e) => setPurpose(e.target.value)} 
                required 
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }}
              />
            </div>

            {/* File Upload for Requirements */}
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#1e3a8a', fontWeight: '500' }}>Upload Requirement (Valid ID, Cedula, etc.)</label>
              <input 
                type="file" 
                accept="image/*,.pdf" 
                onChange={(e) => setRequirementFile(e.target.files[0])} 
                required 
                style={{ width: '100%', fontSize: '14px' }}
              />
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '10px', marginBottom: 0 }}>
                Please provide a clear picture or PDF of the specific requirement needed for this document.
              </p>
            </div>

            <button type="submit" style={{ width: '100%', padding: '14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginTop: '10px' }}>
              Submit Application
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}