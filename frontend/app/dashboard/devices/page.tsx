'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusIcon, 
  PlayIcon, 
  StopIcon,
  EyeIcon,
  ChartBarIcon,
  BeakerIcon 
} from '@heroicons/react/24/outline';
import { apiService } from '@/lib/services/api';
import { Device, DeviceSimulationState } from '@/types/device';

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [simulationState, setSimulationState] = useState<DeviceSimulationState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [devicesData, simulationStateData] = await Promise.all([
        apiService.getDevices(),
        apiService.getSimulationState(),
      ]);
      setDevices(devicesData);
      setSimulationState(simulationStateData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSimulationToggle = async () => {
    try {
      if (simulationState?.isRunning) {
        await apiService.stopSimulation();
        console.log('Simulation stopped');
      } else {
        await apiService.startSimulation();
      }
      setTimeout(fetchData, 1000);
    } catch (error) {
      console.error('Error toggling simulation:', error);
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
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Devices</h1>
          <p className="text-gray-600">Manage your IoT devices and simulations</p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/devices/simulation"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <BeakerIcon className="h-5 w-5" />
            Simulation Dashboard
          </Link>
          <button
            onClick={handleSimulationToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              simulationState?.isRunning
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {simulationState?.isRunning ? (
              <>
                <StopIcon className="h-5 w-5" />
                Stop Simulation
              </>
            ) : (
              <>
                <PlayIcon className="h-5 w-5" />
                Start Simulation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Devices</p>
              <p className="text-2xl font-bold">{devices.length}</p>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
              <ChartBarIcon className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Online</p>
              <p className="text-2xl font-bold text-green-600">
                {devices.filter(d => d.status === 'online').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 text-green-600 rounded-full">
              <div className="h-6 w-6 bg-green-500 rounded-full" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Simulating</p>
              <p className="text-2xl font-bold text-purple-600">
                {simulationState?.activeDevices.length || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
              <PlayIcon className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Alerts</p>
              <Link 
                href="/alerts" 
                className="text-2xl font-bold text-red-600 hover:text-red-700"
              >
                View All
              </Link>
            </div>
            <div className="p-3 bg-red-100 text-red-600 rounded-full">
              <BeakerIcon className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Devices Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Device List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Simulation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {devices.map((device) => (
                <tr key={device.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{device.name}</div>
                      <div className="text-sm text-gray-500">{device.deviceId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                      {device.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      device.status === 'online'
                        ? 'bg-green-100 text-green-800'
                        : device.status === 'warning'
                        ? 'bg-yellow-100 text-yellow-800'
                        : device.status === 'offline'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {device.status || 'unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {device.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {simulationState?.activeDevices.includes(device.deviceId) ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/devices/${device.id}`}
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                    >
                      <EyeIcon className="h-4 w-4" />
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulation Status */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Simulation Status</h3>
        <div className="flex items-center gap-4">
          <div className={`h-3 w-3 rounded-full ${simulationState?.isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
          <span>
            Simulation is currently{' '}
            <span className="font-semibold">
              {simulationState?.isRunning ? 'RUNNING' : 'STOPPED'}
            </span>
          </span>
          {simulationState?.isRunning && (
            <span className="text-sm text-gray-500">
              Simulating {simulationState.activeDevices.length} devices every 5 minutes
            </span>
          )}
        </div>
      </div>
    </div>
  );
}