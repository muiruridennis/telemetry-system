import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { DevicesService } from '../devices/devices.service';
import { TelemetryService } from '../telemetry/telemetry.service';
import { AlertsService } from '../alerts/alerts.service';

@Injectable()
export class ReportsService {
    constructor(
        private telemetryService: TelemetryService,
        private deviceService: DevicesService,
        private alertsService: AlertsService
    ) { }
    
    async generatePdf(deviceId) {
        const device = await this.deviceService.findByDeviceId(deviceId);
        const telemetry = await this.telemetryService.findByDeviceIAd(deviceId);
        const alerts = await this.alertsService.findByDeviceIAd(deviceId);

        const doc = new PDFDocument();
        const chunks: Uint8Array[] = [];

        doc.on('data', (chunk) => {
            chunks.push(chunk);
        });
        const logoPath = path.resolve(__dirname, '../../assets/logo.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 50, { width: 100 });
        }
        doc.fontSize(20).text(
            `Telemetry Report : ${device.name} || ${device.deviceId}`,
            {
                align: 'center',
                underline: true,
                
            });
        doc.moveDown();

        doc.fontSize(12).text(
            `telemetry Data: }`,{
                align: 'center',
                underline: true,
            });
        doc.moveDown(0.5);

        doc.fontSize(11);
            telemetry.slice(0, 20).forEach((t) => {
                doc.text(`
                Temperature: ${t.temperature} °C
                Humidity: ${t.humidity} %
                Cumulative Power: ${t.cumulativePower}
                Current: ${t.current}
                Status: ${t.status}
                Timestamp: ${t.createdAt}
                `);
            })
        doc.addPage();

        doc.fontSize(12).text(
            `Alerts Data: }`,{
                align: 'center',
                underline: true,
            });
        doc.moveDown(0.5);
        alerts.slice(0, 20).forEach((a) => {
            doc.text(`
            Alert Type: ${a.type}
            Alert Message: ${a.message}
            Alert Timestamp: ${a.createdAt}
                Resolved: ${a.resolved ? "Yes" : "No"}
                Severity: ${a.severity}
            `);
        })

        doc.end();
        return Buffer.concat(chunks);

        

    }
}
