// /app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import {
  DeviceTabletIcon,
  BellAlertIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalDevices: 0,
    activeAlerts: 0,
    totalAlerts: 0,
    onlineDevices: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch alerts summary
      const alertSummary = await api.get('/alerts/summary');
      
      // Fetch recent alerts
      const alerts = await api.get('/alerts/recent?hours=24');
      
      // Fetch devices
      const devicesData = await api.get('/devices');
      
      setStats({
        totalDevices: devicesData.length,
        activeAlerts: alertSummary.byStatus?.active || 0,
        totalAlerts: alertSummary.total || 0,
        onlineDevices: devicesData.filter((d: any) => d.status === 'online').length,
      });
      
      setRecentAlerts(alerts.alerts.slice(0, 5));
      setDevices(devicesData.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="text-gray-600">Here's what's happening with your telemetry system.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Devices"
          value={stats.totalDevices}
          icon={DeviceTabletIcon}
          iconColor="text-blue-500"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Active Alerts"
          value={stats.activeAlerts}
          icon={BellAlertIcon}
          iconColor="text-red-500"
          bgColor="bg-red-50"
        />
        <StatCard
          title="Online Devices"
          value={stats.onlineDevices}
          icon={CheckCircleIcon}
          iconColor="text-green-500"
          bgColor="bg-green-50"
        />
        <StatCard
          title="Total Alerts (24h)"
          value={stats.totalAlerts}
          icon={ChartBarIcon}
          iconColor="text-purple-500"
          bgColor="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
            <a href="/dashboard/alerts" className="text-sm text-cyan-600 hover:text-cyan-700">
              View all
            </a>
          </div>
          <div className="space-y-4">
            {recentAlerts.length > 0 ? (
              recentAlerts.map((alert: any) => (
                <AlertItem key={alert.id} alert={alert} />
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent alerts</p>
            )}
          </div>
        </div>

        {/* Device Status */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Device Status</h2>
            <a href="/dashboard/devices" className="text-sm text-cyan-600 hover:text-cyan-700">
              View all
            </a>
          </div>
          <div className="space-y-4">
            {devices.length > 0 ? (
              devices.map((device: any) => (
                <DeviceItem key={device.id} device={device} />
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No devices found</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            title="Start Simulation"
            description="Begin device data simulation"
            href="/dashboard/simulation"
            icon={Cog6ToothIcon}
          />
          <QuickActionCard
            title="Generate Report"
            description="Create PDF/CSV report"
            href="/dashboard/reports"
            icon={ChartBarIcon}
          />
          <QuickActionCard
            title="View Alerts"
            description="Check all active alerts"
            href="/dashboard/alerts"
            icon={BellAlertIcon}
          />
          <QuickActionCard
            title="Add Device"
            description="Register new IoT device"
            href="/dashboard/devices/new"
            icon={DeviceTabletIcon}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, iconColor, bgColor }: any) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center">
        <div className={`${bgColor} p-3 rounded-lg`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function AlertItem({ alert }: { alert: any }) {
  const severityColors: any = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
      <div className="flex items-center">
        <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-3" />
        <div>
          <p className="font-medium text-gray-900">{alert.type}</p>
          <p className="text-sm text-gray-500">{alert.deviceId}</p>
        </div>
      </div>
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${severityColors[alert.severity]}`}>
        {alert.severity}
      </span>
    </div>
  );
}

function DeviceItem({ device }: { device: any }) {
  const isOnline = device.status === 'online';
  
  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
      <div className="flex items-center">
        <div className={`h-3 w-3 rounded-full mr-3 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
        <div>
          <p className="font-medium text-gray-900">{device.name}</p>
          <p className="text-sm text-gray-500">{device.type} • {device.location}</p>
        </div>
      </div>
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
}

function QuickActionCard({ title, description, href, icon: Icon }: any) {
  return (
    <a
      href={href}
      className="block p-4 border border-gray-200 rounded-lg hover:border-cyan-300 hover:bg-cyan-50 transition-colors"
    >
      <Icon className="h-8 w-8 text-cyan-600 mb-2" />
      <h3 className="font-medium text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </a>
  );
}