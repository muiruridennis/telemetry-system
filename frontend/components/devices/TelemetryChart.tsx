'use client';

import { useState } from 'react';
import { BeakerIcon, BoltIcon, FireIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { Device } from '@/types/device';
import { apiService } from '@/lib/services/api';

interface ScenarioTesterProps {
  devices: Device[];
  onScenarioTriggered: () => void;
}

export default function ScenarioTester({ devices, onScenarioTriggered }: ScenarioTesterProps) {
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const scenarios = [
    { id: 'power_outage', name: 'Power Outage', icon: <BoltIcon className="h-5 w-5" /> },
    { id: 'high_temp', name: 'High Temperature', icon: <FireIcon className="h-5 w-5" /> },
    { id: 'high_flow', name: 'High Flow Rate', icon: <ArrowsRightLeftIcon className="h-5 w-5" /> },
  ];

  const handleTriggerScenario = async () => {
    if (!selectedDevice || !selectedScenario) return;

    setIsLoading(true);
    try {
      await apiService.triggerScenario({
        deviceId: selectedDevice,
        scenario: selectedScenario as any,
      });
      
      setTimeout(() => {
        onScenarioTriggered();
        setIsLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Error triggering scenario:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <BeakerIcon className="h-6 w-6 text-purple-600" />
        <h3 className="text-lg font-semibold">Test Scenarios</h3>
      </div>

      <div className="space-y-4">
        {/* Device Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Device
          </label>
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Choose a device</option>
            {devices.map(device => (
              <option key={device._id} value={device.deviceId}>
                {device.name}
              </option>
            ))}
          </select>
        </div>

        {/* Scenario Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Scenario
          </label>
          <div className="grid grid-cols-1 gap-2">
            {scenarios.map(scenario => (
              <button
                key={scenario.id}
                onClick={() => setSelectedScenario(scenario.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                  selectedScenario === scenario.id
                    ? 'bg-purple-50 border-purple-300'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="p-2 bg-purple-100 text-purple-600 rounded-full">
                  {scenario.icon}
                </div>
                <div>
                  <p className="font-medium">{scenario.name}</p>
                  <p className="text-xs text-gray-500">
                    {scenario.id === 'power_outage' && 'Triggers power = 0 alert'}
                    {scenario.id === 'high_temp' && 'Triggers temperature > 40°C alert'}
                    {scenario.id === 'high_flow' && 'Triggers flow rate > 12 m³/h alert'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Trigger Button */}
        <button
          onClick={handleTriggerScenario}
          disabled={!selectedDevice || !selectedScenario || isLoading}
          className={`w-full py-3 px-4 rounded-lg transition-colors ${
            !selectedDevice || !selectedScenario || isLoading
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {isLoading ? 'Triggering...' : 'Trigger Scenario'}
        </button>

        <div className="pt-4 border-t">
          <p className="text-sm text-gray-600 mb-2">What happens:</p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• Test scenarios trigger instant alerts</li>
            <li>• Alerts follow the same rules as simulation</li>
            <li>• No duplicate alerts for same condition</li>
            <li>• Admin can clear alerts from interface</li>
          </ul>
        </div>
      </div>
    </div>
  );
}