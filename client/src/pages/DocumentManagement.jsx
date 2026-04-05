import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function DocumentManagement() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  
  // Modal State for adding a new document
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDoc, setNewDoc] = useState({ doc_name: '', base_fee: '' });

  const fetchDocuments = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/document-templates');
      setDocuments(response.data);
    } catch (error) {
      console.error("Failed to fetch documents", error);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Submit a new document to the database
  const handleAddDocument = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/admin/document-templates', newDoc);
      alert("New Document Successfully Added!");
      setIsModalOpen(false);
      setNewDoc({ doc_name: '', base_fee: '' });
      fetchDocuments(); // Refresh the table
    } catch (error) {
      alert("Error adding document.");
    }
  };

  // Turn a document ON or OFF
  const handleToggle = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      await axios.put(`http://localhost:5000/api/admin/document-templates/${id}/toggle`, { available: newStatus });
      fetchDocuments();
    } catch (error) {
      alert("Error updating document status.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#f8fafc' }}>
      
      {/* Administrator Sidebar */}
      <div style={{ width: '260px', background: '#1e1b4b', color: 'white', padding: '30px 20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '22px', margin: '0 0 40px 0', borderBottom: '1px solid #3730a3', paddingBottom: '15px' }}>Barangay Fortune</h2>
        <div style={{ flex: 1 }}>
          <p onClick={() => navigate('/admin-dashboard')} style={{ margin: '15px 0', cursor: 'pointer', color: '#a5b4fc' }}>🏠 Home</p>
          <p onClick={() => navigate('/account-management')} style={{ margin: '15px 0', cursor: 'pointer', color: '#a5b4fc' }}>👤 Account Management</p>
          <p onClick={() => navigate('/pending-review')} style={{ margin: '15px 0', cursor: 'pointer', color: '#a5b4fc' }}>📋 Pending Review</p>
          <p onClick={() => navigate('/ready-to-print')} style={{ margin: '15px 0', cursor: 'pointer', color: '#a5b4fc' }}>🔖 Ready to Print</p>
          <p style={{ margin: '15px 0', cursor: 'pointer', fontWeight: 'bold', color: 'white' }}>📄 Document Templates</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '10px', background: 'white', color: '#1e1b4b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#0f172a', fontSize: '28px' }}>Document Templates</h1>
            <p style={{ color: '#64748b', marginTop: '5px' }}>Manage the types of documents residents can request and set their fees.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} style={{ padding: '12px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)' }}>
            + Create New Document
          </button>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left', fontSize: '14px', textTransform: 'uppercase' }}>
                <th style={{ padding: '15px 25px' }}>ID</th>
                <th style={{ padding: '15px 25px' }}>Document Name</th>
                <th style={{ padding: '15px 25px' }}>Base Fee</th>
                <th style={{ padding: '15px 25px' }}>Status</th>
                <th style={{ padding: '15px 25px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <tr key={doc.doc_type_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '15px 25px', color: '#64748b', fontWeight: 'bold' }}>{doc.doc_type_id}</td>
                    <td style={{ padding: '15px 25px', color: '#0f172a', fontWeight: '500' }}>{doc.doc_name}</td>
                    <td style={{ padding: '15px 25px', color: '#16a34a', fontWeight: 'bold' }}>₱{doc.base_fee}</td>
                    <td style={{ padding: '15px 25px' }}>
                      <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: doc.available === 1 ? '#dcfce7' : '#fee2e2', color: doc.available === 1 ? '#166534' : '#991b1b' }}>
                        {doc.available === 1 ? 'Active / Visible' : 'Hidden'}
                      </span>
                    </td>
                    <td style={{ padding: '15px 25px' }}>
                      <button onClick={() => handleToggle(doc.doc_type_id, doc.available)} style={{ padding: '8px 12px', background: doc.available === 1 ? '#f59e0b' : '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                        {doc.available === 1 ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No documents found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD DOCUMENT MODAL --- */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '400px' }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#0f172a' }}>Add New Document</h2>
            
            <form onSubmit={handleAddDocument} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#475569', fontWeight: 'bold' }}>Document Name</label>
                <input 
                  type="text" 
                  placeholder="e.g., Business Permit"
                  value={newDoc.doc_name} 
                  onChange={(e) => setNewDoc({ ...newDoc, doc_name: e.target.value })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#475569', fontWeight: 'bold' }}>Base Fee (₱)</label>
                <input 
                  type="number" 
                  placeholder="e.g., 150"
                  value={newDoc.base_fee} 
                  onChange={(e) => setNewDoc({ ...newDoc, base_fee: e.target.value })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Save Document
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '10px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}