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

  const neonColors = ['#06b6d4', '#10b981', '#3b82f6', '#8b5cf6', '#f43f5e'];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent' }}>
      
      {/* Dynamic Auto-Highlighting Sidebar */}
      <AdminSidebar badgeCounts={badgeCounts} />

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: 0, color: 'var(--text-main)', fontSize: '28px', fontWeight: 'bold' }}>Dashboard Overview</h1>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div className="glass-panel" style={{ padding: '10px 20px', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '14px' }}>
               {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
          
          {/* Card 1 */}
          <div className="glass-card" style={{ flex: 1, padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' }}>Total Registered</p>
              <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '32px', fontWeight: 'bold' }}>{stats.totalResidents}</h3>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--neon-cyan)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              👥
            </div>
          </div>
          
          {/* Card 2 */}
          <div className="glass-card" style={{ flex: 1, padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' }}>Active Queue</p>
              <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '32px', fontWeight: 'bold' }}>{stats.activeQueue}</h3>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--neon-blue)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              ⏱️
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-card" style={{ flex: 1, padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' }}>Awaiting Approval</p>
              <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '32px', fontWeight: 'bold' }}>{stats.awaitingApproval}</h3>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--neon-green)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              📋
            </div>
          </div>
        </div>

        {/* Data Visualization Charts */}
        <div style={{ display: 'flex', gap: '20px' }}>
          
          {/* Bar Chart */}
          <div className="glass-card" style={{ flex: 2, padding: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
              <span style={{ color: 'var(--neon-blue)', fontSize: '20px', marginRight: '10px' }}>📊</span>
              <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '18px', fontWeight: '600' }}>Request Types Comparison</h4>
            </div>
            <div style={{ height: '350px' }}>
              {stats.frequentDocs.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.frequentDocs} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" tick={{fontSize: 12, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 12, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {stats.frequentDocs.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={neonColors[index % neonColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Waiting for request data...</div>
              )}
            </div>
          </div>

          {/* Donut Chart */}
          <div className="glass-card" style={{ flex: 1, padding: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
              <span style={{ color: 'var(--neon-green)', fontSize: '20px', marginRight: '10px' }}>⭕</span>
              <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '18px', fontWeight: '600' }}>Request Analytics</h4>
            </div>
            <div style={{ height: '350px' }}>
              {stats.topReasons.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.topReasons} innerRadius={90} outerRadius={120} paddingAngle={2} dataKey="value" stroke="none">
                      {stats.topReasons.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={neonColors[index % neonColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Waiting for data...</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}