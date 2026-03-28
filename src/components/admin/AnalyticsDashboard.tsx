// src/components/admin/AnalyticsDashboard.tsx
import React, { useState, useEffect } from 'react';

export default function AnalyticsDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') { // Hardcoded password
      setIsAuthenticated(true);
    } else {
      setError('Incorrect password');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      // Adjust this URL if your API route is mounted differently (e.g., /api/analytics)
      fetch('/analytics')
        .then((res) => res.json())
        .then((data) => {
          setAnalyticsData(data.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError('Failed to fetch analytics data. Ensure the API route is correct.');
          setLoading(false);
        });
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div style={styles.container}>
        <div style={styles.loginBox}>
          <h2>Admin Analytics</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              autoFocus
            />
            {error && <span style={{ color: '#ff6b6b', fontSize: '14px' }}>{error}</span>}
            <button type="submit" style={styles.button}>View Data</button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) return <div style={styles.container}>Loading analytics data...</div>;
  if (!analyticsData) return <div style={styles.container}>No data available. {error}</div>;

  return (
    <div style={styles.dashboard}>
      <h1 style={{ marginBottom: '20px' }}>Server Analytics Dashboard</h1>
      
      <div style={styles.grid}>
        {/* Node Performance Table */}
        {analyticsData.node_performance && (
          <DataTable 
            title="Node Performance (24h)" 
            data={analyticsData.node_performance.data} 
            columns={[
              { key: 'node', label: 'Node' },
              { key: 'total_attempts', label: 'Attempts' },
              { key: 'successes', label: 'Successes' },
              { key: 'failures', label: 'Failures' },
              { key: 'success_rate_pct', label: 'Success %' },
              { key: 'avg_ms', label: 'Avg Latency (ms)' },
              { key: 'race_wins', label: 'Race Wins' },
            ]}
          />
        )}

        {/* Hourly Traffic Table */}
        {analyticsData.hourly_traffic && (
          <DataTable 
            title="Hourly Traffic" 
            data={analyticsData.hourly_traffic.data} 
            columns={[
              { key: 'hour', label: 'Hour' },
              { key: 'attempts', label: 'Attempts' },
              { key: 'successes', label: 'Successes' },
              { key: 'failures', label: 'Failures' },
            ]}
          />
        )}

        {/* Format Breakdown */}
        {analyticsData.format_breakdown && (
          <DataTable 
            title="Format Breakdown" 
            data={analyticsData.format_breakdown.data} 
            columns={[
              { key: 'format', label: 'Format' },
              { key: 'attempts', label: 'Attempts' },
              { key: 'successes', label: 'Successes' },
              { key: 'avg_ms', label: 'Avg Latency (ms)' },
            ]}
          />
        )}

        {/* Colo Breakdown */}
        {analyticsData.colo_breakdown && (
          <DataTable 
            title="Colo (Datacenter) Breakdown" 
            data={analyticsData.colo_breakdown.data} 
            columns={[
              { key: 'colo', label: 'Colo' },
              { key: 'attempts', label: 'Attempts' },
              { key: 'successes', label: 'Successes' },
              { key: 'avg_ms', label: 'Avg Latency (ms)' },
            ]}
          />
        )}
      </div>

      {/* Recent Failures Table - Full Width */}
      {analyticsData.recent_failures && (
        <div style={{ marginTop: '20px' }}>
          <DataTable 
            title="Recent Failures (Last 20)" 
            data={analyticsData.recent_failures.data.slice(0, 20)} 
            columns={[
              { key: 'timestamp', label: 'Timestamp' },
              { key: 'node', label: 'Node' },
              { key: 'error', label: 'Error Message' },
              { key: 'status_code', label: 'Status' },
            ]}
          />
        </div>
      )}
    </div>
  );
}

// Reusable Table Component
const DataTable = ({ title, data, columns }: { title: string, data: any[], columns: any[] }) => (
  <div style={styles.card}>
    <h3 style={styles.cardTitle}>{title}</h3>
    <div style={{ overflowX: 'auto' }}>
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={styles.th}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c.key} style={styles.td}>
                  {row[c.key] !== null ? String(row[c.key]) : 'N/A'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Inline styles to ensure it looks neat regardless of existing CSS configs
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    fontFamily: 'system-ui, sans-serif'
  },
  dashboard: {
    padding: '40px',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    minHeight: '100vh',
    fontFamily: 'system-ui, sans-serif'
  },
  loginBox: {
    backgroundColor: '#1e293b',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
    textAlign: 'center',
    width: '100%',
    maxWidth: '400px'
  },
  input: {
    padding: '12px',
    borderRadius: '4px',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: '#fff',
    outline: 'none'
  },
  button: {
    padding: '12px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px'
  },
  card: {
    backgroundColor: '#1e293b',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
  },
  cardTitle: {
    marginTop: 0,
    marginBottom: '15px',
    borderBottom: '1px solid #334155',
    paddingBottom: '10px',
    fontSize: '18px'
  },
  table: {
    width: '100%',
    textAlign: 'left',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  th: {
    padding: '10px 8px',
    borderBottom: '2px solid #334155',
    color: '#94a3b8',
    whiteSpace: 'nowrap'
  },
  td: {
    padding: '10px 8px',
    borderBottom: '1px solid #334155',
    whiteSpace: 'nowrap'
  }
};