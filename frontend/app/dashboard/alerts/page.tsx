'use client';

import { useState, useEffect } from 'react';
import AlertPanel from '@/components/alerts/AlertPanel';
import { apiService } from '@/lib/services/api';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchData();
    const user = apiService.getcurrentUser();
    setIsAdmin(user?.role === 'admin');
  }, []);

  const fetchData = async () => {
    try {
      const [alertsData, devicesData] = await Promise.all([
        apiService.getAlerts(), // This will get active alerts
        apiService.getDevices(),
      ]);
      
      // Handle both array response and paginated response
      const alertsArray = Array.isArray(alertsData) 
        ? alertsData
        : alertsData || [];
      
      setAlerts(alertsArray);
      setDevices(devicesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveAlert = async (alertId: string, note?: string) => {
    try {
      await apiService.resolveAlert(alertId, note);
      // Refresh alerts
      fetchData();
    } catch (error) {
      console.error('Error resolving alert:', error);
      alert('Failed to resolve alert. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Alerts Dashboard</h1>
      <p className="text-gray-600 mb-8">Monitor and manage device alerts</p>
      
      <AlertPanel
        alerts={alerts}
        devices={devices}
        onResolveAlert={handleResolveAlert}
        showDeviceFilter={true}
        isAdmin={isAdmin}
      />
    </div>
  );
}