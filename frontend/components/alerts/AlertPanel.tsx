'use client';

import { useState } from 'react';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  BellIcon,
  DevicePhoneMobileIcon,
  FireIcon,
  BoltIcon,
  WifiIcon
} from '@heroicons/react/24/outline';
import { Alert, Device } from '@/types/device';
import { format } from 'date-fns';

interface AlertPanelProps {
  alerts: Alert[];
  onResolveAlert: (alertId: string, note?: string) => void;
  showDeviceFilter?: boolean;
  devices?: Device[];
  isAdmin?: boolean;
}

export default function AlertPanel({ 
  alerts, 
  onResolveAlert,
  showDeviceFilter = false,
  devices = [],
  isAdmin = false
}: AlertPanelProps) {
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const [resolvingAlert, setResolvingAlert] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [showResolved, setShowResolved] = useState(false);
  console.log('alerts', alerts)

  // Transform backend alerts to frontend format
  const transformedAlerts: Alert[] = alerts.alerts.map(alert => ({
    ...alert,
    // Map fields for compatibility
    alertType: alert.type?.toLowerCase() || 'custom_rule',
    message: alert.description || alert.name,
    isResolved: alert.status === 'resolved',
    resolvedBy: alert.acknowledgedBy,
    resolvedNote: alert.silenceReason,
    dataSnapshot: alert.data?.currentValues,
    ruleId: alert.data?.ruleId,
  }));

  const filteredAlerts = transformedAlerts.filter(alert => {
    if (selectedDevice !== 'all' && alert.deviceId !== selectedDevice) {
      return false;
    }
    if (!showResolved && alert.status === 'resolved') {
      return false;
    }
    return true;
  });

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getAlertIcon = (alertType: string) => {
    const type = alertType.toLowerCase();
    if (type.includes('power') || type.includes('outage')) {
      return <BoltIcon className="h-5 w-5" />;
    }
    if (type.includes('temperature')) {
      return <FireIcon className="h-5 w-5" />;
    }
    if (type.includes('offline')) {
      return <DevicePhoneMobileIcon className="h-5 w-5" />;
    }
    if (type.includes('flow')) {
      return <WifiIcon className="h-5 w-5" />;
    }
    return <BellIcon className="h-5 w-5" />;
  };

  const getAlertTypeLabel = (alertType: string): string => {
    if (alertType.includes('Temperature')) return 'High Temperature';
    if (alertType.includes('Power Outage')) return 'Power Outage';
    if (alertType.includes('Flow')) return 'High Flow Rate';
    return alertType;
  };

  const handleResolve = (alertId: string) => {
    if (resolveNote.trim()) {
      onResolveAlert(alertId, resolveNote);
      setResolvingAlert(null);
      setResolveNote('');
    }
  };

  const activeAlerts = transformedAlerts.filter(a => a.status === 'active');
  const resolvedAlerts = transformedAlerts.filter(a => a.status === 'resolved');

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold">Alerts</h3>
          <div className="flex gap-2 mt-2">
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
              {activeAlerts.length} Active
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              {resolvedAlerts.length} Resolved
            </span>
          </div>
        </div>
        
        <div className="flex gap-4">
          {showDeviceFilter && (
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="border rounded-lg px-3 py-1 text-sm bg-white"
            >
              <option value="all">All Devices</option>
              {devices.map(device => (
                <option key={device.id} value={device.deviceId}>
                  {device.name}
                </option>
              ))}
            </select>
          )}
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600">Show resolved</span>
          </label>
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No alerts found</p>
          {!showResolved && (
            <p className="text-sm text-gray-400 mt-2">All clear!</p>
          )}
        </div>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {filteredAlerts.map(alert => {
            const isActive = alert.status === 'active';
            const currentValues = alert.data?.currentValues;
            
            return (
              <div
                key={alert.id}
                className={`border-l-4 p-4 rounded-lg shadow-sm ${
                  isActive 
                    ? getSeverityColor(alert.severity)
                    : 'bg-green-50 border-green-400'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      isActive 
                        ? 'bg-red-100 text-red-600'
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-gray-900">{alert.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          isActive 
                            ? getSeverityColor(alert.severity)
                            : 'bg-green-200 text-green-800'
                        }`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          {getAlertTypeLabel(alert.type)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Device:</span> {alert.deviceId}
                      </p>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        {alert.description}
                      </p>
                      
                      <p className="text-xs text-gray-500 mt-1">
                        Triggered: {format(new Date(alert.triggeredAt), 'PPpp')}
                      </p>

                      {/* Current Values Display */}
                      {currentValues && (
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                          {currentValues.temperature !== undefined && (
                            <div className="text-xs bg-gray-50 px-2 py-1 rounded border">
                              <span className="font-medium">Temp:</span> {currentValues.temperature.toFixed(1)}°C
                              {currentValues.temperature > 40 && (
                                <span className="ml-1 text-red-600">⚠️</span>
                              )}
                            </div>
                          )}
                          
                          {currentValues.flowRate !== undefined && (
                            <div className="text-xs bg-gray-50 px-2 py-1 rounded border">
                              <span className="font-medium">Flow:</span> {currentValues.flowRate.toFixed(1)} m³/h
                              {currentValues.flowRate > 12 && (
                                <span className="ml-1 text-orange-600">⚠️</span>
                              )}
                            </div>
                          )}
                          
                          {currentValues.power !== undefined && (
                            <div className="text-xs bg-gray-50 px-2 py-1 rounded border">
                              <span className="font-medium">Power:</span> {currentValues.power.toFixed(1)} kW
                              {currentValues.power === 0 && (
                                <span className="ml-1 text-red-600">🔌</span>
                              )}
                            </div>
                          )}
                          
                          {currentValues.humidity !== undefined && (
                            <div className="text-xs bg-gray-50 px-2 py-1 rounded border">
                              <span className="font-medium">Humidity:</span> {currentValues.humidity.toFixed(1)}%
                            </div>
                          )}
                          
                          {currentValues.current !== undefined && (
                            <div className="text-xs bg-gray-50 px-2 py-1 rounded border">
                              <span className="font-medium">Current:</span> {currentValues.current.toFixed(2)} A
                            </div>
                          )}
                          
                          {currentValues.cumulativePower !== undefined && (
                            <div className="text-xs bg-gray-50 px-2 py-1 rounded border">
                              <span className="font-medium">Cum. Power:</span> {currentValues.cumulativePower.toFixed(0)} kWh
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  {isActive && isAdmin && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setResolvingAlert(alert.id)}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Resolve
                      </button>
                    </div>
                  )}
                  
                  {!isActive && alert.resolvedAt && (
                    <div className="text-sm text-gray-500 min-w-[120px]">
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircleIcon className="h-4 w-4" />
                        <span>Resolved</span>
                      </div>
                      {alert.acknowledgedBy && (
                        <p className="text-xs mt-1">By: {alert.acknowledgedBy}</p>
                      )}
                      <p className="text-xs mt-1">
                        {format(new Date(alert.resolvedAt), 'PPpp')}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Resolve Alert Form (Admin only) */}
                {resolvingAlert === alert.id && isAdmin && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                    <h5 className="font-medium text-gray-700 mb-2">Resolve Alert</h5>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={resolveNote}
                        onChange={(e) => setResolveNote(e.target.value)}
                        placeholder="Add resolution note (optional)..."
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      />
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setResolvingAlert(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Alert Rules Summary */}
      <div className="mt-8 pt-6 border-t">
        <h4 className="font-medium text-gray-700 mb-3">Alert Rules Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <FireIcon className="h-4 w-4 text-red-600" />
              <span className="font-medium text-sm">Temperature Rule</span>
            </div>
            <p className="text-xs text-gray-600">Alert when temperature exceeds 45°C</p>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <BoltIcon className="h-4 w-4 text-red-600" />
              <span className="font-medium text-sm">Power Rule</span>
            </div>
            <p className="text-xs text-gray-600">Alert when power = 0 (No power at site)</p>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <WifiIcon className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-sm">Flow Rate Rule</span>
            </div>
            <p className="text-xs text-gray-600">Alert when flow rate &gt; 12 m³/h AND temperature &gt; 40°C</p>          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <BellIcon className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-sm">Alert Policy</span>
            </div>
            <p className="text-xs text-gray-600">No duplicate alerts while state persists</p>
          </div>
        </div>
      </div>
    </div>
  );
}