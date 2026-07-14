import AdminSidebar from '../components/AdminSidebar';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  // State to hold all our complex math from the backend
  const [stats, setStats] = useState({
    totalResidents: 0,
    activeQueue: 0,
    awaitingApproval: 0,
    topReasons: [],
    frequentDocs: []
  });

  // State to hold the live counts for the notification badges
  const [badgeCounts, setBadgeCounts] = useState({ pending: 0, ready: 0, residentApprovals: 0 });

  // The official color palette for the Donut Chart
  const COLORS = ['#f97316', '#22d3ee', '#38bdf8', '#818cf8', '#34d399'];

  // Fetch Dashboard Stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/admin/dashboard-stats');
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch admin stats", error);
      }
    };

    fetchStats();
    // Refresh the charts every 10 seconds to keep them "live"
    const interval = setInterval(fetchStats, 10000); 
    return () => clearInterval(interval);
  }, []);

  // Fetch Notification Counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [requestsRes, residentsRes] = await Promise.all([
            axios.get('http://localhost:5000/api/staff/pending-requests'),
            axios.get('http://localhost:5000/api/admin/pending-residents')
        ]);
        const pending = requestsRes.data.filter(req => req.status === 'Pending').length;
        const ready = requestsRes.data.filter(req => req.status === 'Ready to Print').length;
        const residentApprovals = residentsRes.data.length;
        setBadgeCounts({ pending, ready, residentApprovals });
      } catch (error) {
        console.error("Failed to fetch notification counts", error);
      }
    };
    
    fetchCounts();
    const interval = setInterval(fetchCounts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#f8fafc' }}>
      
      {/* CSS: The pulsing animation for the red dot */}
      <style>
        {`
          @keyframes pulse-red {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }
          .notification-dot {
            display: inline-flex; align-items: center; justify-content: center;
            background: #ef4444; color: white; border-radius: 50%;
            min-width: 20px; height: 20px; font-size: 11px; font-weight: bold;
            margin-left: 10px; animation: pulse-red 2s infinite;
          }
        `}
      </style>

      {/* Dynamic Auto-Highlighting Sidebar */}
      <AdminSidebar badgeCounts={badgeCounts} />

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: 0, color: '#0f172a', fontSize: '28px' }}>Welcome, Admin!</h1>
        </div>

        {/* Top Metric Cards */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
          <div style={{ flex: 1, background: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#334155', fontSize: '20px', fontWeight: 'normal' }}>Total<br/><b>Residents</b></h3>
            <div style={{ padding: '10px 15px', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontSize: '14px' }}>
              Total Registered Residents: <b>{stats.totalResidents}</b>
            </div>
          </div>
          
          <div style={{ flex: 1, background: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#334155', fontSize: '20px', fontWeight: 'normal' }}>Active<br/><b>Queue</b></h3>
            <div style={{ padding: '10px 15px', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontSize: '14px' }}>
              Currently in Queue: <b>{stats.activeQueue}</b>
            </div>
          </div>

          <div style={{ flex: 1, background: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#334155', fontSize: '20px', fontWeight: 'normal' }}>Pending<br/><b>Action</b></h3>
            <div style={{ padding: '10px 15px', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontSize: '14px' }}>
              Awaiting Approval: <b>{stats.awaitingApproval}</b>
            </div>
          </div>
        </div>

        {/* Data Visualization Charts */}
        <div style={{ display: 'flex', gap: '20px' }}>
          
          {/* Donut Chart */}
          <div style={{ flex: 1, background: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 20px 0', color: '#334155', textAlign: 'center' }}>Top Reasons for Barangay Document Requests</h4>
            <div style={{ height: '300px' }}>
              {stats.topReasons.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.topReasons} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                      {stats.topReasons.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Waiting for resident request data...</div>
              )}
            </div>
          </div>

          {/* Bar Chart */}
          <div style={{ flex: 1, background: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 20px 0', color: '#334155', textAlign: 'center' }}>Most Frequent Barangay Document Requests</h4>
            <div style={{ height: '300px' }}>
              {stats.frequentDocs.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.frequentDocs}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{fontSize: 12}} interval={0} />
                    <YAxis />
                    <Tooltip cursor={{fill: '#f1f5f9'}} />
                    <Bar dataKey="value" fill="#818cf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Waiting for resident request data...</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}