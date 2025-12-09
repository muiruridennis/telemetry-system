'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
type Telemetry = {
  id: string;
  deviceId: string;
  temperature: number;
  voltage: number;
  flowRate: number;
  power: number;
  createdAt: string;
};

export default function AdminPage() {
  const [telemetry, setTelemetry] = useState<Telemetry[]>([]);
  const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate=useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');

    if (!token) {
        setError('Not authenticated');
        navigate.push('/login');
      setLoading(false);
      return;
    }

    fetch('http://localhost:3000/telemetry', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch telemetry');
        return res.json();
      })
      .then((data) => {
        setTelemetry(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Error loading telemetry');
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="p-6">Loading telemetry...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Telemetry Dashboard</h1>

      <div className="overflow-auto border rounded-lg">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Device</th>
              <th className="p-2 border">Temp (°C)</th>
              <th className="p-2 border">Voltage</th>
              <th className="p-2 border">Flow</th>
              <th className="p-2 border">Power</th>
              <th className="p-2 border">Time</th>
            </tr>
          </thead>
          <tbody>
            {telemetry.map((t) => (
              <tr key={t.id} className="text-center hover:bg-gray-50">
                <td className="p-2 border">{t.deviceId}</td>
                <td className="p-2 border">{t.temperature}</td>
                <td className="p-2 border">{t.voltage}</td>
                <td className="p-2 border">{t.flowRate}</td>
                <td className="p-2 border">{t.power}</td>
                <td className="p-2 border">
                  {new Date(t.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
