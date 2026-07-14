const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'client/src/pages/ReadyToPrint.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Insert handleNoShow function
const handleReleaseStr = "const handleRelease = async (requestId) => {";
const handleNoShowStr = 
  // FEATURE 5: Mark as No-Show
  const handleNoShow = async (requestId) => {
    if (!window.confirm("WARNING: Mark this resident as a No-Show? This will forfeit their document and clear the queue slot.")) return;
    try {
      const adminId = localStorage.getItem('userId');
      await axios.put(\http://localhost:5000/api/staff/no-show/\\, { official_id: adminId });
      alert("Document forfeited due to No-Show.");
      fetchPrintQueue();
    } catch (error) {
      alert("Error updating document status.");
    }
  };

  const handleRelease = async (requestId) => {;

content = content.replace(handleReleaseStr, handleNoShowStr);

// Insert No-Show button
const buttonStr = "✅ Release</button>";
const newButtonStr = "✅ Release</button>\n                      <button onClick={() => handleNoShow(req.request_id)} style={{ padding: '8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', flex: 1 }}>❌ No-Show</button>";

content = content.replace(buttonStr, newButtonStr);

fs.writeFileSync(filePath, content, 'utf8');
console.log('ReadyToPrint.jsx updated safely');
