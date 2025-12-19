import {
  Device,
  TelemetryData,
  Alert,
  SimulationConfig,
  DeviceSimulationState,
  ScenarioTrigger,
} from "@/types/device";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

class ApiService {
  private headers = {
    "Content-Type": "application/json",
  };
  private baseFetch(input: string, init: RequestInit = {}) {
    return fetch(`${API_BASE_URL}${input}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
      credentials: 'include', // ✅ THIS IS THE KEY
    });
  }

  // Devices API
  async getDevices(): Promise<Device[]> {
    const response = await this.baseFetch(`/devices`, {
      headers: this.headers,
    });
    return response.json();
  }

  async getDevice(id: string): Promise<Device> {
    const response = await this.baseFetch(`/devices/${id}`, {
      headers: this.headers,
    });
    return response.json();
  }

  async updateDevice(id: string, data: Partial<Device>): Promise<Device> {
    const response = await this.baseFetch(`/devices/${id}`, {
      method: "PUT",
      headers: this.headers,
      body: JSON.stringify(data),
    });
    return response.json();
  }

  // Telemetry API
  async getDeviceTelemetry(
    deviceId: string,
    limit: number = 100
  ): Promise<TelemetryData[]> {
    const response = await this.baseFetch(
      `/telemetry/device/${deviceId}?limit=${limit}`,
      { headers: this.headers }
    );
    return response.json();
  }

  async getLatestTelemetry(deviceId: string): Promise<TelemetryData> {
    const response = await this.baseFetch(
      `/telemetry/device/${deviceId}/latest`,
      { headers: this.headers }
    );
    return response.json();
  }

  // Alerts API
  async getAlerts(deviceId?: string): Promise<Alert[]> {
    const url = deviceId
      ? `/alerts/device/${deviceId}`
      : `/alerts/active`;

    const response = await this.baseFetch(url, { headers: this.headers });
    return response.json();
  }

  async getActiveAlerts(): Promise<Alert[]> {
    const response = await this.baseFetch(`/alerts/active`, {
      headers: this.headers,
    });
    return response.json();
  }
  async getcurrentUser () {
    const response = await this.baseFetch(`/auth/currentuser`, {
      headers: this.headers,
    });
    return response.json();
  }

  async resolveAlert(alertId: string, note?: string): Promise<Alert> {
    const response = await this.baseFetch(`/alerts/${alertId}/resolve`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ note }),
    });
    return response.json();
  }

  // Simulation API
  async startSimulation(
    config?: Partial<SimulationConfig>
  ): Promise<{ success: boolean }> {
    const response = await this.baseFetch(`/simulation/start`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(config),
    });
    return response.json();
  }

  async stopSimulation(): Promise<{ success: boolean }> {
    const response = await this.baseFetch(`/simulation/stop`, {
      method: "POST",
      headers: this.headers,
    });
    return response.json();
  }

  async getSimulationState(): Promise<DeviceSimulationState> {
    const response = await this.baseFetch(`/simulation/status`, {
      headers: this.headers,
    });
    return response.json();
  }

  async triggerScenario(data: ScenarioTrigger): Promise<{ success: boolean }> {
    const response = await this.baseFetch(
      `/simulation/trigger-scenario`,
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(data),
      }
    );
    return response.json();
  }

  // Reports API
  async generateDeviceReport(deviceId: string): Promise<Blob> {
    const response = await this.baseFetch(`/reports/device/${deviceId}`, {
      headers: this.headers,
    });
    return response.blob();
  }

  async generateAlertReport(startDate?: Date, endDate?: Date): Promise<Blob> {
    const params = new URLSearchParams();
    if (startDate) params.append("start", startDate.toISOString());
    if (endDate) params.append("end", endDate.toISOString());

    const response = await this.baseFetch(
      `/reports/alerts?${params.toString()}`,
      { headers: this.headers }
    );
    return response.blob();
  }
}

export const apiService = new ApiService();
