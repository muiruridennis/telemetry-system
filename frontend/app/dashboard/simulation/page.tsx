'use client';

import { useState, useEffect } from 'react';
import { 
  PlayIcon, 
  StopIcon, 
  PrinterIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  BoltIcon,
  SunIcon,
  CloudIcon,
  ArrowsRightLeftIcon,
  Cog6ToothIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import { apiService } from '@/lib/services/api';
import { 
  Device, 
  TelemetryData, 
  Alert,
  SimulationConfig,
  DeviceSimulationState 
} from '@/types/device';
import { format } from 'date-fns';
import SimulationControls from '@/components/simulation/SimulationControls';
import DeviceTelemetryCard from '@/components/devices/DeviceTelemetryCard';
import AlertPanel from '@/components/alerts/AlertPanel';
import TelemetryChart from '@/components/devices/TelemetryChart';
import ScenarioTester from '@/components/simulation/ScenarioTester';

export default function SimulationDashboard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryData[]>([]);
  const [latestTelemetry, setLatestTelemetry] = useState<TelemetryData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [simulationState, setSimulationState] = useState<DeviceSimulationState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10000); // 10 seconds

  // Fetch initial data
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [devicesData, simulationStateData, alertsData] = await Promise.all([
        apiService.getDevices(),
        apiService.getSimulationState(),
        apiService.getActiveAlerts(),
      ]);

      setDevices(devicesData);
      setSimulationState(simulationStateData);
      setAlerts(alertsData);

      if (devicesData.length > 0 && !selectedDevice) {
        setSelectedDevice(devicesData[0]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch telemetry for selected device
  useEffect(() => {
    if (selectedDevice) {
      fetchDeviceTelemetry();
    }
  }, [selectedDevice]);

  const fetchDeviceTelemetry = async () => {
    if (!selectedDevice) return;
    
    try {
      const [telemetryData, latestData] = await Promise.all([
        apiService.getDeviceTelemetry(selectedDevice.deviceId, 50),
        apiService.getLatestTelemetry(selectedDevice.deviceId),
      ]);
      
      setTelemetry(telemetryData);
      setLatestTelemetry(latestData);
    } catch (error) {
      console.error('Error fetching telemetry:', error);
    }
  };

  // Handle simulation control
  const handleSimulationControl = async (action: 'start' | 'stop', config?: SimulationConfig) => {
    try {
      if (action === 'start') {
        await apiService.startSimulation(config);
      } else {
        await apiService.stopSimulation();
      }
      await fetchData();
    } catch (error) {
      console.error('Error controlling simulation:', error);
    }
  };
  // Handle alert resolution
  const handleResolveAlert = async (alertId: string, note?: string) => {
    try {
      await apiService.resolveAlert(alertId, note);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  // Print report
  const printReport = async () => {
    if (!selectedDevice) return;
    
    try {
      const blob = await apiService.generateDeviceReport(selectedDevice.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `device-report-${selectedDevice.deviceId}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating report:', error);
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
          <h1 className="text-3xl font-bold text-gray-900">Device Simulation Dashboard</h1>
          <p className="text-gray-600">Monitor and control device simulations in real-time</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={printReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            disabled={!selectedDevice}
          >
            <PrinterIcon className="h-5 w-5" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Simulation Status Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`h-3 w-3 rounded-full ${simulationState?.isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
            <span className="font-medium">
              Simulation {simulationState?.isRunning ? 'Running' : 'Stopped'}
            </span>
            <span className="text-sm text-gray-500">
              {simulationState?.activeDevices?.length || 0} active devices
            </span>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {alerts.length} Active Alerts
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              {devices.filter(d => d.status === 'online').length} Online
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar - Devices & Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Simulation Controls */}
          <SimulationControls
            isRunning={simulationState?.isRunning || false}
            onStart={handleSimulationControl}
            onStop={() => handleSimulationControl('stop')}
            devices={devices}
          />

          {/* Scenario Tester */}
          <ScenarioTester
            devices={devices}
            onScenarioTriggered={fetchData}
          />

          {/* Device List */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-4">Active Devices</h3>
            <div className="space-y-3">
              {devices.map(device => (
                <button
                  key={device.id}
                  onClick={() => setSelectedDevice(device)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedDevice?.id === device.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{device.name}</p>
                      <p className="text-sm text-gray-500">{device?.deviceId}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        device.status === 'online' ? 'bg-green-100 text-green-800' :
                        device.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        device.status === 'offline' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {device.status || 'unknown'}
                      </span>
                      {simulationState?.activeDevices?.includes(device.deviceId) && (
                        <span className="mt-1 text-xs text-blue-600">Simulating</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          {/* Selected Device Telemetry */}
          {selectedDevice && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedDevice.name}</h2>
                    <p className="text-gray-600">{selectedDevice.location} • {selectedDevice.type}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={fetchDeviceTelemetry}
                      className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                {latestTelemetry ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                      {latestTelemetry.temperature !== undefined && (
                        <DeviceTelemetryCard
                          title="Temperature"
                          value={latestTelemetry.temperature}
                          unit="°C"
                          icon={<SunIcon className="h-6 w-6 text-orange-500" />}
                          alertCondition={latestTelemetry.temperature > 40}
                          alertMessage="> 40°C"
                        />
                      )}
                      
                      {latestTelemetry.humidity !== undefined && (
                        <DeviceTelemetryCard
                          title="Humidity"
                          value={latestTelemetry.humidity}
                          unit="%"
                          icon={<CloudIcon className="h-6 w-6 text-blue-500" />}
                        />
                      )}
                      
                      {latestTelemetry.flowRate !== undefined && (
                        <DeviceTelemetryCard
                          title="Flow Rate"
                          value={latestTelemetry.flowRate}
                          unit="m³/h"
                          icon={<ArrowsRightLeftIcon className="h-6 w-6 text-green-500" />}
                          alertCondition={latestTelemetry.flowRate > 12 && latestTelemetry.temperature && latestTelemetry.temperature > 40}
                          alertMessage="> 12 m³/h with temp > 40°C"
                        />
                      )}
                      
                      {latestTelemetry.power !== undefined && (
                        <DeviceTelemetryCard
                          title="Power"
                          value={latestTelemetry.power}
                          unit="kW"
                          icon={<BoltIcon className="h-6 w-6 text-yellow-500" />}
                          alertCondition={latestTelemetry.power === 0}
                          alertMessage="Power outage"
                        />
                      )}
                      
                      {latestTelemetry.current !== undefined && (
                        <DeviceTelemetryCard
                          title="Current"
                          value={latestTelemetry.current}
                          unit="A"
                          icon={<BoltIcon className="h-6 w-6 text-purple-500" />}
                        />
                      )}
                      
                      {latestTelemetry.cumulativePower !== undefined && (
                        <DeviceTelemetryCard
                          title="Cumulative Power"
                          value={latestTelemetry.cumulativePower}
                          unit="kWh"
                          icon={<ChartBarIcon className="h-6 w-6 text-indigo-500" />}
                        />
                      )}
                    </div>

                    {/* Telemetry Charts */}
                    {telemetry.length > 0 && (
                      <div className="mt-8">
                        <TelemetryChart
                          telemetryData={telemetry}
                          selectedMetrics={['temperature', 'flowRate', 'power']}
                        />
                      </div>
                    )}

                    {/* Tags & Metadata */}
                    <div className="mt-8 pt-6 border-t">
                      <h4 className="font-medium text-gray-700 mb-3">Simulation Info</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <p className="font-medium">{latestTelemetry.status}</p>
                        </div>
                        {latestTelemetry.tags && (
                          <div>
                            <p className="text-sm text-gray-500">Tags</p>
                            <div className="flex gap-2 mt-1">
                              {Object.entries(latestTelemetry.tags).map(([key, value]) => (
                                <span key={key} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                  {key}: {value}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No telemetry data available</p>
                    <p className="text-sm text-gray-400 mt-2">Start simulation to generate data</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Alerts Panel */}
          <div className="bg-white rounded-lg shadow p-6">
            <AlertPanel
              alerts={alerts}
              onResolveAlert={handleResolveAlert}
              showDeviceFilter={true}
              devices={devices}
            />
          </div>
        </div>
      </div>
    </div>
  );
}