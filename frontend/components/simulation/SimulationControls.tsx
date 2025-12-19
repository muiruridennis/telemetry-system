'use client';

import { useState } from 'react';
import { PlayIcon, StopIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { Device, SimulationConfig } from '@/types/device';

interface SimulationControlsProps {
  isRunning: boolean;
  onStart: (action: 'start', config?: SimulationConfig) => void;
  onStop: () => void;
  devices: Device[];
}

export default function SimulationControls({ 
  isRunning, 
  onStart, 
  onStop,
  devices 
}: SimulationControlsProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<Partial<SimulationConfig>>({
    intervalMinutes: 5,
    anomalyChance: 0.1,
    powerOutageChance: 0.05,
    deviceIds: devices.filter(d => d.isActive).map(d => d.deviceId),
  });

  const handleStart = () => {
    onStart('start', {
      deviceIds: config.deviceIds || [],
      intervalMinutes: config.intervalMinutes || 5,
      anomalyChance: config.anomalyChance || 0.1,
      powerOutageChance: config.powerOutageChance || 0.05,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Simulation Control</h3>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="p-2 text-gray-500 hover:text-gray-700"
        >
          <Cog6ToothIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlayIcon className="h-5 w-5" />
            Start Simulation
          </button>
        ) : (
          <button
            onClick={onStop}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <StopIcon className="h-5 w-5" />
            Stop Simulation
          </button>
        )}

        {showConfig && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interval (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={config.intervalMinutes}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  intervalMinutes: parseInt(e.target.value) 
                }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anomaly Chance ({config.anomalyChance ? (config.anomalyChance * 100).toFixed(0) : 0}%)
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={config.anomalyChance}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  anomalyChance: parseFloat(e.target.value) 
                }))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Power Outage Chance ({config.powerOutageChance ? (config.powerOutageChance * 100).toFixed(0) : 0}%)
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={config.powerOutageChance}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  powerOutageChance: parseFloat(e.target.value) 
                }))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Devices to Simulate
              </label>
              <div className="max-h-32 overflow-y-auto">
                {devices.map(device => (
                  <label key={device._id} className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={config.deviceIds?.includes(device.deviceId) || false}
                      onChange={(e) => {
                        const newDeviceIds = e.target.checked
                          ? [...(config.deviceIds || []), device.deviceId]
                          : (config.deviceIds || []).filter(id => id !== device.deviceId);
                        setConfig(prev => ({ ...prev, deviceIds: newDeviceIds }));
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{device.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t">
        <p className="text-sm text-gray-600">Rules:</p>
        <ul className="text-xs text-gray-500 space-y-1 mt-2">
          <li>• Alert when temperature &gt; 40°C</li>
          <li>• Alert when flow rate &gt; 12 m³/h AND temp &gt; 40°C</li>
          <li>• Alert when power = 0 (No power at site)</li>
          <li>• No duplicate alerts while state persists</li>
        </ul>
      </div>
    </div>
  );
}