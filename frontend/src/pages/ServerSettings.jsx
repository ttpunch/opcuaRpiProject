import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, Monitor, Bell, Cog, Loader2, Power } from 'lucide-react';
import api from '../api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const ServerSettings = () => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({});

    // Fetch Settings
    const { data: settings, isLoading } = useQuery({
        queryKey: ['server-settings'],
        queryFn: async () => {
            const resp = await api.get('/server/settings');
            return resp.data;
        }
    });

    // Initialize form when data loads
    useEffect(() => {
        if (settings) {
            setFormData(settings);
        }
    }, [settings]);

    // Save Mutation
    const saveMutation = useMutation({
        mutationFn: async (newData) => {
            return await api.put('/server/settings', newData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['server-settings']);
            alert('Settings saved successfully!');
        },
        onError: (err) => {
            alert('Failed to save settings: ' + (err.response?.data?.detail || err.message));
        }
    });

    const handleInputChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        saveMutation.mutate(formData);
    };

    const handleRestart = async () => {
        if (window.confirm('Restarting the server will temporarily disconnect all clients. Continue?')) {
            try {
                await api.post('/server/restart');
                alert('Server restart initiated. It should be back up in a few seconds.');
            } catch (err) {
                alert('Failed to restart server: ' + err.message);
            }
        }
    };

    const handleDiscard = () => {
        if (settings) {
            setFormData(settings);
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary-600" size={40} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-surface-900">Server Settings</h1>
                    <p className="text-surface-500 mt-1">Configure global parameters for the OPC UA server</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleRestart}
                        className="btn border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                        <Power size={18} />
                        <span>Restart Server</span>
                    </button>
                    <button
                        onClick={handleDiscard}
                        className="btn border border-surface-200 text-surface-600 flex items-center gap-2 hover:bg-surface-50"
                    >
                        <RotateCcw size={18} />
                        <span>Discard</span>
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saveMutation.isLoading}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        {saveMutation.isLoading ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <Save size={18} />
                        )}
                        <span>{saveMutation.isLoading ? 'Saving...' : 'Save Settings'}</span>
                    </button>
                </div>
            </header>

            <div className="space-y-6">
                {/* General Settings */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-8">
                        <Cog size={20} className="text-primary-600" />
                        <h2 className="text-xl font-bold">General Configuration</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <SettingField label="Server Name" description="Identify this server in the network">
                            <input
                                type="text"
                                value={formData.server_name || ''}
                                onChange={(e) => handleInputChange('server_name', e.target.value)}
                                className="input-field"
                                placeholder="e.g. My RPi Server"
                            />
                        </SettingField>
                        <SettingField label="Endpoint Port" description="Standard OPC UA port is 4840">
                            <input
                                type="number"
                                value={formData.port || ''}
                                onChange={(e) => handleInputChange('port', e.target.value)}
                                className="input-field"
                                placeholder="4840"
                            />
                        </SettingField>
                        <SettingField label="Namespace URI" description="External identification URI">
                            <input
                                type="text"
                                value={formData.namespace_uri || ''}
                                onChange={(e) => handleInputChange('namespace_uri', e.target.value)}
                                className="input-field font-mono text-xs"
                                placeholder="http://example.org"
                            />
                        </SettingField>
                        <SettingField label="Polling Rate (ms)" description="Global default refresh rate">
                            <input
                                type="number"
                                value={formData.polling_rate || ''}
                                onChange={(e) => handleInputChange('polling_rate', e.target.value)}
                                className="input-field"
                                placeholder="1000"
                            />
                        </SettingField>
                    </div>
                </div>

                {/* Monitoring & Alerts */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-8">
                        <Bell size={20} className="text-primary-600" />
                        <h2 className="text-xl font-bold">Alerts & Notifications</h2>
                    </div>
                    <div className="space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-surface-50 pb-6">
                            <div className="flex-1">
                                <p className="font-semibold text-surface-900">CPU Usage Alert</p>
                                <p className="text-sm text-surface-500">Notify when CPU usage exceeds threshold</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-surface-50 p-1 px-3 rounded-lg border border-surface-100">
                                    <span className="text-xs font-bold text-surface-400">Threshold:</span>
                                    <input
                                        type="number"
                                        value={formData.cpu_threshold || '90'}
                                        onChange={(e) => handleInputChange('cpu_threshold', e.target.value)}
                                        className="w-12 bg-transparent border-none text-sm font-bold text-primary-600 focus:ring-0 p-0"
                                    />
                                    <span className="text-xs font-bold text-surface-400">%</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={formData.alert_cpu === 'true'}
                                    onChange={(e) => handleInputChange('alert_cpu', String(e.target.checked))}
                                    className="w-6 h-6 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
                            <div className="flex-1">
                                <p className="font-semibold text-surface-900">Certificate Expiration Alert</p>
                                <p className="text-sm text-surface-500">Notify before server certificates expire</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-surface-50 p-1 px-3 rounded-lg border border-surface-100">
                                    <span className="text-xs font-bold text-surface-400">Warning:</span>
                                    <input
                                        type="number"
                                        value={formData.cert_expiry_days || '30'}
                                        onChange={(e) => handleInputChange('cert_expiry_days', e.target.value)}
                                        className="w-12 bg-transparent border-none text-sm font-bold text-primary-600 focus:ring-0 p-0"
                                    />
                                    <span className="text-xs font-bold text-surface-400">Days</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={formData.alert_cert === 'true'}
                                    onChange={(e) => handleInputChange('alert_cert', String(e.target.checked))}
                                    className="w-6 h-6 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .input-field {
          width: 100%;
          padding: 0.625rem 1rem;
          background-color: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
        }
        .input-field:focus {
          border-color: #0ea5e9;
          box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.1);
        }
      `}} />
        </div>
    );
};

const SettingField = ({ label, description, children }) => (
    <div className="space-y-2">
        <div className="mb-3">
            <label className="text-sm font-bold text-surface-900">{label}</label>
            <p className="text-xs text-surface-400">{description}</p>
        </div>
        {children}
    </div>
);

export default ServerSettings;
