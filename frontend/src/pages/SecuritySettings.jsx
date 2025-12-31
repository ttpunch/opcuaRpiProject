import React from 'react';
import { Shield, Key, Users, History, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../utils/cn';

const SecuritySettings = () => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header>
                <h1 className="text-3xl font-bold text-surface-900">Security Management</h1>
                <p className="text-surface-500 mt-1">Manage users, certificates, and view access logs</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* User Management */}
                    <div className="card">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <Users size={20} className="text-primary-600" />
                                <h2 className="text-xl font-bold">User Accounts</h2>
                            </div>
                            <button className="text-primary-600 font-semibold text-sm">+ Add User</button>
                        </div>
                        <div className="divide-y divide-surface-100">
                            {[
                                { name: 'admin', role: 'Administrator', status: 'Enabled' },
                                { name: 'operator_01', role: 'Operator', status: 'Enabled' },
                            ].map((user) => (
                                <div key={user.name} className="py-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-surface-900">{user.name}</p>
                                        <p className="text-xs text-surface-400">{user.role}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                                            {user.status}
                                        </span>
                                        <button className="text-surface-400 hover:text-primary-600 font-medium text-xs">Edit</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Certificate Management */}
                    <div className="card">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <Shield size={20} className="text-primary-600" />
                                <h2 className="text-xl font-bold">Server Certificates</h2>
                            </div>
                            <button className="btn btn-primary text-sm py-1.5 px-3">Renew Cert</button>
                        </div>
                        <div className="bg-surface-50 p-4 rounded-xl flex items-center gap-4 border border-surface-100">
                            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                                <CheckCircle2 size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-surface-900">server_cert.pem</p>
                                <p className="text-xs text-surface-500">Expires in 341 days (Dec 12, 2026)</p>
                            </div>
                            <button className="text-primary-600 text-sm font-semibold">Download</button>
                        </div>
                    </div>
                </div>

                {/* Access History */}
                <div className="card h-fit">
                    <div className="flex items-center gap-3 mb-6">
                        <History size={20} className="text-primary-600" />
                        <h2 className="text-xl font-bold">Recent Auth</h2>
                    </div>
                    <div className="space-y-6">
                        {[
                            { type: 'Login', user: 'admin', time: '5m ago', ip: '192.168.1.15', success: true },
                            { type: 'Login', user: 'admin', time: '1h ago', ip: '192.168.1.15', success: false },
                            { type: 'Login', user: 'system', time: '4h ago', ip: '127.0.0.1', success: true },
                        ].map((event, i) => (
                            <div key={i} className="flex gap-4">
                                <div className={cn(
                                    "mt-1 p-1 rounded-full",
                                    event.success ? "text-emerald-500" : "text-red-500"
                                )}>
                                    {event.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">
                                        {event.type} {event.success ? "Success" : "Failed"}
                                    </p>
                                    <p className="text-xs text-surface-400 mt-0.5">
                                        {event.user} • {event.time} • {event.ip}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};



export default SecuritySettings;
