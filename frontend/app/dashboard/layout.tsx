'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  HomeIcon,
  DeviceTabletIcon,
  BellAlertIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightEndOnRectangleIcon,
} from '@heroicons/react/24/outline';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const res = await fetch('http://localhost:3000/auth/currentuser', {
          credentials: 'include',
        });
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const userData = await res.json();
        console.log("User data:", userData);
        setUser(userData);
      } catch (error) {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await fetch('http://localhost:3000/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    router.push('/login');
  };

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: HomeIcon },
    { name: 'Devices', href: '/dashboard/devices', icon: DeviceTabletIcon },
    { name: 'Alerts', href: '/dashboard/alerts', icon: BellAlertIcon },
    { name: 'Reports', href: '/dashboard/reports', icon: ChartBarIcon },
    { name: 'Simulation', href: '/dashboard/simulation', icon: Cog6ToothIcon },
  ];

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64">
          <div className="relative flex w-full max-w-xs flex-col bg-gray-900 pt-5 pb-4">
            <div className="flex items-center px-4">
              <button
                type="button"
                className="ml-auto -mx-1.5 -my-1.5 rounded-md p-1.5 text-gray-400 hover:text-white focus:outline-none"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="mt-8 h-0 flex-1 overflow-y-auto">
              <NavItems items={navItems} />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-gray-900">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500" />
              <span className="ml-3 text-xl font-bold text-white">Telemetry Pro</span>
            </div>
            <nav className="mt-8 flex-1 space-y-1 px-2">
              <NavItems items={navItems} />
            </nav>
          </div>
          <div className="flex flex-shrink-0 border-t border-gray-800 p-4">
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs font-medium text-gray-400">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-auto text-gray-400 hover:text-white"
                title="Logout"
              >
                <ArrowRightEndOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <div className="sticky top-0 z-10 bg-white shadow">
          <div className="flex h-16 items-center px-4">
            <button
              type="button"
              className="px-4 text-gray-500 focus:outline-none lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="flex flex-1 justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
              <div className="flex items-center space-x-4">
                {/* Alert notification badge */}
                <button className="relative p-2 text-gray-600 hover:text-gray-900">
                  <BellAlertIcon className="h-6 w-6" />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavItems({ items }: { items: any[] }) {
  const pathname = usePathname();
  
  return (
    <>
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md ${
              isActive
                ? 'bg-gray-800 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <item.icon
              className={`mr-3 h-6 w-6 flex-shrink-0 ${
                isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
              }`}
            />
            {item.name}
          </Link>
        );
      })}
    </>
  );
}