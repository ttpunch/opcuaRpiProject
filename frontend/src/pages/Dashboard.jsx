import React, { useEffect, useState } from 'react';
import {
    Terminal,
    Activity,
    Cpu,
    HardDrive,
    Thermometer,
    ShieldAlert,
    Wifi
} from 'lucide-react';
import api from '../api/client';
import { useQuery } from '@tanstack/react-query';
import GPIOStatus from '../components/GPIOStatus';
import AnalogStatus from '../components/AnalogStatus';
import { cn } from '../utils/cn';

const Dashboard = () => {
    // Fetch System Health
    const { data: health, isLoading: healthLoading } = useQuery({
        queryKey: ['system-health'],
        queryFn: async () => {
            const resp = await api.get('/health/system');
            return resp.data;
        },
        refetchInterval: 3000
    });

    // Fetch Server Status
    const { data: serverStatus } = useQuery({
        queryKey: ['server-status'],
        queryFn: async () => {
            const resp = await api.get('/server/status');
            return resp.data;
        },
        refetchInterval: 5000
    });

    // Fetch Live Node Values
    const { data: nodeValues } = useQuery({
        queryKey: ['node-values'],
        queryFn: async () => {
            const resp = await api.get('/nodes/live/values');
            return resp.data;
        },
        refetchInterval: 2000
    });

    // Fetch Security Events (Audit Logs)
    const { data: securityEvents } = useQuery({
        queryKey: ['dashboard-security-events'],
        queryFn: async () => {
            const resp = await api.get('/security/audit-logs');
            return resp.data.slice(0, 5); // Just show recent 5
        },
        refetchInterval: 10000
    });

    const gpioNodes = nodeValues?.filter(n => n.type === 'gpio') || [];
    const analogNodes = nodeValues?.filter(n => n.type === 'analog') || [];

    const stats = [
        {
            label: 'CPU Usage',
            value: health?.cpu_percent ? `${health.cpu_percent}%` : '--',
            icon: Cpu, color: 'text-blue-600', bg: 'bg-blue-50'
        },
        {
            label: 'RAM Usage',
            value: health?.memory_percent ? `${health.memory_percent}%` : '--',
            icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50'
        },
        {
            label: 'Temp',
            value: health?.temperature ? `${health.temperature}°C` : '--',
            icon: Thermometer, color: 'text-orange-600', bg: 'bg-orange-50'
        },
        {
            label: 'Disk',
            value: health?.disk_percent ? `${health.disk_percent}%` : '--',
            icon: HardDrive, color: 'text-purple-600', bg: 'bg-purple-50'
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-surface-900">System Overview</h1>
                    <p className="text-surface-500 mt-1">Live monitoring of your Raspberry Pi OPC UA Server</p>
                </div>
                <div className={cn(
                    "flex gap-2 px-4 py-2 rounded-full border items-center font-medium",
                    serverStatus?.state === 'Running'
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-red-50 text-red-700 border-red-100"
                )}>
                    <div className={cn(
                        "w-2 h-2 rounded-full",
                        serverStatus?.state === 'Running' ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                    )} />
                    Server {serverStatus?.state || 'Offline'}
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="card hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-surface-500 text-sm font-medium">{stat.label}</p>
                                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                            </div>
                            <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
                                <stat.icon size={24} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Analog Signal Monitor */}
            {analogNodes.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <Activity size={20} className="text-secondary-600" />
                        <h2 className="text-xl font-bold text-surface-900">Analog Signal Monitor</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {analogNodes.map((node) => (
                            <AnalogStatus
                                key={node.node_id}
                                name={node.name}
                                value={node.value}
                                raw_value={node.raw_value}
                                error={node.error}
                                scale_enabled={node.scale_enabled}
                                scale_unit={node.scale_unit}
                                channel={node.channel}
                                adc_device={node.adc_device}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* GPIO Signal Monitor */}
            {gpioNodes.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <Activity size={20} className="text-primary-600" />
                        <h2 className="text-xl font-bold text-surface-900">GPIO Signal Monitor</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {gpioNodes.map((node) => (
                            <GPIOStatus
                                key={node.node_id}
                                name={node.name}
                                value={node.value}
                                error={node.error}
                                pin={node.pin}
                            />
                        ))}
                    </div>
                </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Connection Status */}
                <div className="lg:col-span-2 card">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Active Connections</h2>
                        <a href="/settings" className="text-primary-600 hover:text-primary-700 font-medium text-sm">Manage Settings</a>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-surface-400 text-sm font-medium border-b border-surface-100">
                                    <th className="pb-4">Client Name</th>
                                    <th className="pb-4">Endpoint</th>
                                    <th className="pb-4">Connected Since</th>
                                    <th className="pb-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {serverStatus?.connections?.length > 0 ? (
                                    serverStatus.connections.map((conn, i) => (
                                        <tr key={i} className="border-b border-surface-50 last:border-0 hover:bg-surface-50 transition-colors">
                                            <td className="py-4 font-medium">{conn.username}</td>
                                            <td className="py-4 font-mono text-surface-500 text-xs">{conn.ip}</td>
                                            <td className="py-4 text-surface-500">{conn.connected_since}</td>
                                            <td className="py-4">
                                                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">Active</span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="py-8 text-center text-surface-400">No active sessions found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Events */}
                <div className="card">
                    <h2 className="text-xl font-bold mb-6">Security Events</h2>
                    <div className="space-y-6">
                        {securityEvents?.length > 0 ? (
                            securityEvents.map((event, i) => (
                                <div key={i} className="flex gap-4 items-start">
                                    <div className={cn(
                                        "p-2 rounded-lg",
                                        !event.success ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                                    )}>
                                        {!event.success ? <ShieldAlert size={18} /> : <Terminal size={18} />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-surface-900 truncate">
                                            {event.event_type} {event.success ? "Success" : "Failed"}
                                        </p>
                                        <p className="text-xs text-surface-400 mt-1">
                                            {new Date(event.timestamp).toLocaleTimeString()} • {event.user || 'system'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-surface-400 text-sm italic py-4">No recent events</p>
                        )}
                    </div>
                    <a
                        href="/security"
                        className="block text-center w-full mt-8 py-3 border border-surface-200 rounded-xl text-surface-600 font-medium hover:bg-surface-50 transition-colors"
                    >
                        View All logs
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
