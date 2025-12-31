import React from 'react';
import { Shield, Key, Users, History, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '../utils/cn';
import api from '../api/client';

const SecuritySettings = () => {
    // Fetch Users
    const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
        queryKey: ['security', 'users'],
        queryFn: async () => {
            const res = await api.get('/security/users');
            return res.data;
        }
    });

    // Fetch Certificates
    const { data: certificates, isLoading: certsLoading, error: certsError } = useQuery({
        queryKey: ['security', 'certificates'],
        queryFn: async () => {
            const res = await api.get('/security/certificates');
            return res.data;
        }
    });

    // Fetch Audit Logs
    const { data: auditLogs, isLoading: logsLoading, error: logsError } = useQuery({
        queryKey: ['security', 'audit-logs'],
        queryFn: async () => {
            const res = await api.get('/security/audit-logs');
            return res.data;
        }
    });

    const isLoading = usersLoading || certsLoading || logsLoading;
    const hasError = usersError || certsError || logsError;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                <p className="text-surface-500 animate-pulse">Loading security data...</p>
            </div>
        );
    }

    if (hasError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
                <div className="p-4 bg-red-50 text-red-500 rounded-full">
                    <AlertCircle size={32} />
                </div>
                <div className="max-w-md">
                    <h3 className="text-xl font-bold text-surface-900">Connection Error</h3>
                    <p className="text-surface-500 mt-2">
                        Unable to fetch security settings. Please ensure the backend is running and you have sufficient permissions.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn btn-primary mt-6"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

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
                            <button className="text-primary-600 font-semibold text-sm hover:underline">+ Add User</button>
                        </div>
                        <div className="divide-y divide-surface-100">
                            {users?.length > 0 ? (
                                users.map((user) => (
                                    <div key={user.id} className="py-4 flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-surface-900">{user.username}</p>
                                            <p className="text-xs text-surface-400">{user.role}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={cn(
                                                "text-xs font-semibold px-2 py-1 rounded-md",
                                                user.enabled ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"
                                            )}>
                                                {user.enabled ? "Enabled" : "Disabled"}
                                            </span>
                                            <button className="text-surface-400 hover:text-primary-600 font-medium text-xs">Edit</button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="py-6 text-center text-surface-400 text-sm italic">No users found</p>
                            )}
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
                        <div className="space-y-4">
                            {certificates?.length > 0 ? (
                                certificates.map((cert) => (
                                    <div key={cert.id} className="bg-surface-50 p-4 rounded-xl flex items-center gap-4 border border-surface-100">
                                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-surface-900">{cert.name}</p>
                                            <p className="text-xs text-surface-500">
                                                Expires: {new Date(cert.valid_to).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <button className="text-primary-600 text-sm font-semibold hover:underline">Download</button>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center border-2 border-dashed border-surface-100 rounded-xl">
                                    <p className="text-surface-400 text-sm">No certificates configured</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Access History */}
                <div className="card h-fit max-h-[600px] overflow-hidden flex flex-col">
                    <div className="flex items-center gap-3 mb-6 shrink-0">
                        <History size={20} className="text-primary-600" />
                        <h2 className="text-xl font-bold">Recent Auth</h2>
                    </div>
                    <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                        {auditLogs?.length > 0 ? (
                            auditLogs.map((event, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className={cn(
                                        "mt-1 p-1 rounded-full shrink-0",
                                        event.success ? "text-emerald-500" : "text-red-500"
                                    )}>
                                        {event.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {event.event_type} {event.success ? "Success" : "Failed"}
                                        </p>
                                        <p className="text-xs text-surface-400 mt-0.5">
                                            {event.user} • {new Date(event.timestamp).toLocaleTimeString()}
                                        </p>
                                        {event.ip_address && (
                                            <p className="text-[10px] text-surface-300 font-mono mt-1">{event.ip_address}</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-surface-400 text-xs italic py-4">No recent activity</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecuritySettings;
