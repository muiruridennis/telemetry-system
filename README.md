# Telemetry System

A full-stack telemetry system to monitor devices, generate alerts, and create downloadable reports.  
Built with **NestJS** for the backend and **Next.js** for the frontend.

---

## **Project Overview**

This system allows:

- Devices to send telemetry data (temperature, voltage, flow, power).  
- Backend to evaluate telemetry against predefined rules.  
- Automatic generation of alerts when rules are violated.  
- Reports to be generated and downloaded for monitoring and analysis.  
- Admin dashboard to view telemetry, alerts, and manage devices and users.

---

## **Features**

- Device registration and authentication  
- Telemetry data collection and storage  
- Alerts generation based on rules (temperature, voltage, flow, power)  
- Report generation and download (CSV/PDF)  
- User/Admin authentication (JWT)  
- Responsive Next.js frontend dashboard

---

## **Tech Stack**

- **Backend:** NestJS, TypeORM, PostgreSQL/MySQL  
- **Frontend:** Next.js 13+, Tailwind CSS, React  
- **Authentication:** JWT  
- **Dev Tools:** Git, VS Code  

---

## **Installation**

### Clone repository

```bash
git clone https://github.com/muiruridennis/telemetry-system.git
cd telemetry-system


## **Workflows**

### **1. Device to Backend**

[Device]
|
v
[Telemetry Module] -> stores data in DB -> triggers [Alerts Module] if rules violated

markdown
Copy code

### **2. Admin Dashboard**

[Admin/User Login] -> [JWT Token]
|
v
[Frontend Admin Page]
|---> View Telemetry
|---> Generate/Download Reports
|---> View Alerts
|---> Manage Devices/Users

markdown
Copy code

### **3. Alert Workflow**

[Telemetry Data Received]
|
v
[Alerts Module Evaluates Rules]
|
v
[Trigger Alert] -> [Save Alert in DB] -> [Notify Admin via dashboard]

markdown
Copy code

### **4. Reports Workflow**

[Admin Requests Report]
|
v
[Reports Module Fetches Telemetry & Alerts]
|
v
[Generate CSV/PDF] -> [Send to Frontend for Download]