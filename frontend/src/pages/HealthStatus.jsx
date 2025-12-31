import React, { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { Activity, Clock, Server, Monitor } from 'lucide-react';
import api from '../api/client';
import { useQuery } from '@tanstack/react-query';

const HealthStatus = () => {
    const [history, setHistory] = useState([]);

    // Fetch current metrics
    const { data: metrics } = useQuery({
        queryKey: ['system-metrics'],
        queryFn: async () => {
            const resp = await api.get('/health/system');
            return resp.data;
        },
        refetchInterval: 3000
    });

    // Accumulate history for charts
    useEffect(() => {
        if (metrics) {
            setHistory(prev => {
                const newEntry = {
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    cpu: metrics.cpu_percent,
                    memory: metrics.memory_percent,
                    temp: metrics.temperature || 45
                };
                const next = [...prev, newEntry];
                return next.slice(-20); // Keep last 20 data points
            });
        }
    }, [metrics]);

    return (
        <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header>
                <h1 className="text-3xl font-bold text-surface-900">Health Monitoring</h1>
                <p className="text-surface-500 mt-1">Detailed system performance and historical trends</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* CPU & Memory Chart */}
                <div className="card">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Monitor size={20} />
                            </div>
                            <h3 className="font-bold text-lg">System Resources</h3>
                        </div>
                        <div className="flex gap-4 text-xs font-semibold">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-sm" /> CPU (%)
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-emerald-500 rounded-sm" /> Memory (%)
                            </div>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history}>
                                <defs>
                                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" />
                                <Area type="monotone" dataKey="memory" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorMem)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Temperature Chart */}
                <div className="card">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                <Activity size={20} />
                            </div>
                            <h3 className="font-bold text-lg">Thermal Status</h3>
                        </div>
                        <span className="text-orange-600 font-bold text-2xl">{metrics?.temperature || '--'}°C</span>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} domain={['auto', 'auto']} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Line type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'white' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="card lg:col-span-1">
                    <h3 className="font-bold text-lg mb-6">Device Uptime</h3>
                    <div className="space-y-6">
                        <MetricItem
                            label="System Uptime"
                            value={metrics?.uptime ? `${Math.floor(metrics.uptime / 3600)}h ${Math.floor((metrics.uptime % 3600) / 60)}m` : '--'}
                            icon={Clock}
                            color="text-blue-600"
                        />
                        <MetricItem label="Load Average" value={metrics?.load_avg?.join(', ') || '--'} icon={Activity} color="text-emerald-600" />
                        <MetricItem label="Process Count" value={metrics?.process_count || '--'} icon={Server} color="text-purple-600" />
                    </div>
                </div>

                <div className="card lg:col-span-2">
                    <h3 className="font-bold text-lg mb-6">Hardware Info</h3>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-1">
                            <p className="text-surface-400 text-sm">Processor</p>
                            <p className="font-bold">ARM Cortex-A72 (RPi 4)</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-surface-400 text-sm">Memory</p>
                            <p className="font-bold">4GB LPDDR4</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-surface-400 text-sm">Storage (Root)</p>
                            <p className="font-bold">{metrics?.disk_percent || '--'}% Used</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricItem = ({ label, value, icon: Icon, color }) => (
    <div className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
        <div className="flex items-center gap-3">
            <Icon size={18} className={color} />
            <span className="text-surface-600 font-medium">{label}</span>
        </div>
        <span className="font-bold text-surface-900">{value}</span>
    </div>
);

export default HealthStatus;
