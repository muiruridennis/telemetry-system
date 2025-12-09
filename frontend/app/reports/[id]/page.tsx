'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { id: deviceId } = useParams();

  const handleDownload = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/reports/generate/${deviceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deviceId }), // optional filter
      });

      if (!res.ok) {
        setError('Failed to generate report');
        setLoading(false);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${deviceId || 'all'}.csv`; // change extension if needed
      document.body.appendChild(a);
      a.click();
      a.remove();
      setSuccess('Report downloaded successfully!');
      setLoading(false);
    } catch (err) {
      setError('Server error');
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Generate Report</h1>

      {error && <p className="text-red-600 mb-2">{error}</p>}
      {success && <p className="text-green-600 mb-2">{success}</p>}

      <input
        type="text"
        placeholder="Device ID (optional)"
        value={deviceId}
        onChange={(e) => setDeviceId(e.target.value)}
        className="w-full border p-2 mb-3"
      />

      <button
        onClick={handleDownload}
        disabled={loading}
        className="w-full bg-black text-white p-2 rounded"
      >
        {loading ? 'Generating...' : 'Download Report'}
      </button>
    </div>
  );
}
