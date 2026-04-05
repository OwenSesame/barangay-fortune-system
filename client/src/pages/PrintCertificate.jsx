import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function PrintCertificate() {
  const { id } = useParams(); // Grabs the request ID from the URL
  const navigate = useNavigate();
  const [docData, setDocData] = useState(null);

  useEffect(() => {
    const fetchDocData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/staff/print-data/${id}`);
        setDocData(response.data);
      } catch (error) {
        console.error("Error fetching document data", error);
        alert("Failed to load document data.");
      }
    };
    fetchDocData();
  }, [id]);

  if (!docData) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Document...</div>;

  const handlePrint = () => {
    window.print(); // Triggers the browser's native print dialog
  };

  // Get current date for the signature line
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ background: '#e2e8f0', minHeight: '100vh', padding: '40px 20px', fontFamily: '"Times New Roman", Times, serif' }}>
      
      {/* This is the floating control bar. 
        We use an inline <style> block specifically to hide this when printing! 
      */}
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; }
            .print-container { box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
          }
        `}
      </style>

      <div className="no-print" style={{ maxWidth: '800px', margin: '0 auto 20px auto', display: 'flex', justifyContent: 'space-between', background: 'white', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <button onClick={() => navigate('/staff-dashboard')} style={{ padding: '10px 20px', background: '#64748b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          ⬅ Back to Queue
        </button>
        <button onClick={handlePrint} style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
          🖨️ Print Official Document
        </button>
      </div>

      {/* The Actual A4 Document Paper */}
      <div className="print-container" style={{ background: 'white', maxWidth: '800px', margin: '0 auto', padding: '80px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', minHeight: '1122px', position: 'relative' }}>
        
        {/* Document Header */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <p style={{ margin: 0, fontSize: '16px' }}>Republic of the Philippines</p>
          <p style={{ margin: 0, fontSize: '16px' }}>Province of Bulacan</p>
          <p style={{ margin: 0, fontSize: '16px' }}>Municipality of Baliwag</p>
          <h2 style={{ margin: '15px 0 0 0', fontSize: '24px', textTransform: 'uppercase' }}>BARANGAY FORTUNE</h2>
          <hr style={{ borderTop: '2px solid black', margin: '20px 0' }} />
          <h1 style={{ margin: '30px 0', fontSize: '32px', textTransform: 'uppercase', letterSpacing: '2px', textDecoration: 'underline' }}>
            {docData.doc_name}
          </h1>
        </div>

        {/* Document Body */}
        <div style={{ fontSize: '18px', lineHeight: '2' }}>
          <p><strong>TO WHOM IT MAY CONCERN:</strong></p>
          
          <p style={{ textIndent: '40px', textAlign: 'justify' }}>
            This is to certify that <strong>{docData.first_name} {docData.middle_name ? docData.middle_name + ' ' : ''}{docData.last_name}</strong>, 
            of legal age, <strong>{docData.civil_status || 'Single'}</strong>, is a bonafide resident of 
            <strong> {docData.addres_street}</strong>, Barangay Fortune, Baliwag, Bulacan.
          </p>
          
          <p style={{ textIndent: '40px', textAlign: 'justify' }}>
            Based on the records of this office, the aforementioned individual has no derogatory record 
            and is known to be a person of good moral character in the community.
          </p>

          <p style={{ textIndent: '40px', textAlign: 'justify' }}>
            This certification is being issued upon the request of the interested party for <strong>{docData.purpose || 'whatever legal purpose it may serve'}</strong>.
          </p>

          <p style={{ textIndent: '40px', marginTop: '30px' }}>
            Issued this <strong>{today}</strong> at Barangay Fortune, Baliwag, Bulacan.
          </p>
        </div>

        {/* Signatures */}
        <div style={{ marginTop: '100px', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'center', width: '300px' }}>
            <div style={{ borderBottom: '1px solid black', height: '40px' }}></div>
            <p style={{ margin: '5px 0 0 0', fontWeight: 'bold', fontSize: '18px' }}>JUAN DELA CRUZ</p>
            <p style={{ margin: 0, fontSize: '14px' }}>Punong Barangay</p>
          </div>
        </div>

        {/* Footer / Dry Seal Placeholder */}
        <div style={{ position: 'absolute', bottom: '80px', left: '80px' }}>
          <p style={{ margin: 0, fontSize: '12px' }}>Fee Paid: ₱{docData.base_fee}</p>
          <p style={{ margin: 0, fontSize: '12px' }}>Not Valid Without Official Dry Seal</p>
        </div>

      </div>
    </div>
  );
}