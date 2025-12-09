import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-full blur-3xl"></div>
        </div>
        {/* Grid pattern */}

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl w-full">
        {/* Header with logo */}
        <div className="flex flex-col items-center mb-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl rotate-45"></div>
              <div className="absolute inset-2 bg-slate-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                DAVIS & SHIRTLIFF
              </span>
            </h1>
          </div>
        </div>

        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 mb-6">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-300">IoT PLATFORM v2.0</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              Smart Water & Energy
              <span className="block mt-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Management System
              </span>
            </h1>

            <p className="text-xl text-slate-300 mb-10 leading-relaxed">
              Monitor, analyze, and optimize your water pumps, solar systems, 
              and energy consumption across Africa with real-time telemetry 
              and intelligent alerts.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/dashboard"
                className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-semibold text-lg text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Launch Dashboard
                </span>
              </Link>

              <Link
                href="/login"
                className="px-8 py-4 border-2 border-slate-600 rounded-xl font-semibold text-lg text-slate-300 hover:border-slate-500 hover:bg-slate-800/30 transition-all duration-300"
              >
                Admin Login
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-16 pt-8 border-t border-slate-800">
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">10K+</div>
                <div className="text-sm text-slate-400">Devices Monitored</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">99.8%</div>
                <div className="text-sm text-slate-400">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">24/7</div>
                <div className="text-sm text-slate-400">Real-time Monitoring</div>
              </div>
            </div>
          </div>

          {/* Right Column - Dashboard Preview */}
          <div className="relative">
            {/* Floating Card Effect */}
            <div className="relative bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-2xl overflow-hidden">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-white">Live Dashboard Preview</h3>
                  <p className="text-slate-400 text-sm">Active devices monitoring</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-slate-300">Live</span>
                </div>
              </div>

              {/* Dashboard Mockup */}
              <div className="space-y-4">
                {/* Device Status Row */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: "Water Pump #1", status: "online", value: "45°C" },
                    { name: "Solar Inverter", status: "online", value: "230V" },
                    { name: "Tank Sensor", status: "warning", value: "85%" },
                    { name: "Energy Meter", status: "online", value: "1.2kW" },
                  ].map((device, idx) => (
                    <div key={idx} className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/30">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-300">{device.name}</span>
                        <div className={`w-2 h-2 rounded-full ${device.status === "online" ? "bg-green-400" : "bg-amber-400"}`}></div>
                      </div>
                      <div className="text-2xl font-bold text-white">{device.value}</div>
                      <div className="text-xs text-slate-400 mt-1">{device.status === "online" ? "Normal" : "Check needed"}</div>
                    </div>
                  ))}
                </div>

                {/* Chart Placeholder */}
                <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/30 h-48 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a4 4 0 01-4 4H8a4 4 0 01-4-4V4z"></path>
                    </svg>
                    <p className="text-slate-500">Real-time telemetry visualization</p>
                  </div>
                </div>
              </div>

              {/* Gradient Accent */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"></div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl rotate-12"></div>
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-xl"></div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 pt-16 border-t border-slate-800">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Platform Features
            </span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "⚡",
                title: "Real-time Monitoring",
                desc: "Live telemetry data from all connected devices",
              },
              {
                icon: "🔔",
                title: "Smart Alerts",
                desc: "Instant notifications for anomalies and failures",
              },
              {
                icon: "📊",
                title: "Advanced Analytics",
                desc: "Predictive maintenance and performance insights",
              },
            ].map((feature, idx) => (
              <div key={idx} className="group bg-slate-800/30 rounded-xl p-6 border border-slate-700/30 hover:border-cyan-500/30 transition-all duration-300 hover:scale-[1.02]">
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                <p className="text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-slate-800 text-center">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-slate-400">
              &copy; {new Date().getFullYear()} Davis & Shirtliff IoT Platform. All rights reserved.
            </div>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-slate-400 hover:text-cyan-400 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-slate-400 hover:text-cyan-400 transition-colors">
                Terms
              </Link>
              <Link href="/contact" className="text-slate-400 hover:text-cyan-400 transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}