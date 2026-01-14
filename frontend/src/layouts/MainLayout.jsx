import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
    LayoutDashboard,
    Settings2,
    Activity,
    ShieldCheck,
    Settings,
    LogOut,
    Cpu,
    CircuitBoard
} from 'lucide-react';
import { cn } from '../utils/cn';

const MainLayout = () => {
    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Nodes', path: '/nodes', icon: Settings2 },
        { name: 'GPIO Monitor', path: '/gpio', icon: CircuitBoard },
        { name: 'Health', path: '/health', icon: Activity },
        { name: 'Security', path: '/security', icon: ShieldCheck },
        { name: 'Settings', path: '/settings', icon: Settings },
    ];

    const handleLogout = () => {
        localStorage.removeItem('opcua_token');
        window.location.href = '/login';
    };

    return (
        <div className="flex h-screen bg-surface-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-surface-200 flex flex-col">
                <div className="p-6 flex items-center gap-3">
                    <div className="p-2 bg-primary-600 rounded-lg text-white">
                        <Cpu size={24} />
                    </div>
                    <span className="font-bold text-xl tracking-tight">OPC UA Pi</span>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-primary-50 text-primary-600 font-semibold"
                                    : "text-surface-600 hover:bg-surface-100"
                            )}
                        >
                            <item.icon size={20} className={cn(
                                "transition-colors",
                                "group-hover:text-primary-600"
                            )} />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-surface-200">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-surface-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
