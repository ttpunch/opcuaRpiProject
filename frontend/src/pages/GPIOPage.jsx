import React from 'react';
import { Activity, CircuitBoard, Info, Plus } from 'lucide-react';
import api from '../api/client';
import { useQuery } from '@tanstack/react-query';
import GPIOStatus from '../components/GPIOStatus';
import AnalogStatus from '../components/AnalogStatus';
import { Link } from 'react-router-dom';

const GPIOPage = () => {
    // Fetch Live Node Values
    const { data: nodeValues, isLoading } = useQuery({
        queryKey: ['node-values'],
        queryFn: async () => {
            const resp = await api.get('/nodes/live/values');
            return resp.data;
        },
        refetchInterval: 2000
    });

    const gpioNodes = nodeValues?.filter(n => n.type === 'gpio') || [];
    const analogNodes = nodeValues?.filter(n => n.type === 'analog') || [];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-surface-900 flex items-center gap-3">
                        <CircuitBoard className="text-primary-600" size={32} />
                        Signals Monitor
                    </h1>
                    <p className="text-surface-500 mt-1">Real-time status of physical inputs (GPIO & Analog)</p>
                </div>
                <Link to="/nodes" className="btn btn-primary flex items-center gap-2">
                    <Plus size={20} />
                    <span>Add Signal</span>
                </Link>
            </header>

            {/* Status Legend */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-surface-100 shadow-sm">
                    <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200" />
                    <span className="text-sm font-semibold text-surface-700">Active (High Signal)</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-surface-100 shadow-sm">
                    <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-lg shadow-yellow-200" />
                    <span className="text-sm font-semibold text-surface-700">Free (No Signal)</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-surface-100 shadow-sm">
                    <div className="w-4 h-4 rounded-full bg-red-500 shadow-lg shadow-red-200" />
                    <span className="text-sm font-semibold text-surface-700">Fault / Hardware Error</span>
                </div>
            </div>

            {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                </div>
            ) : (gpioNodes.length > 0 || analogNodes.length > 0) ? (
                <div className="space-y-8">
                    {/* Analog Signals Section */}
                    {analogNodes.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-surface-700 flex items-center gap-2">
                                <Activity size={18} /> Analog Inputs
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                        </div>
                    )}

                    {/* GPIO Signals Section */}
                    {gpioNodes.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-surface-700 flex items-center gap-2">
                                <CircuitBoard size={18} /> GPIO Pins
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                        </div>
                    )}
                </div>
            ) : (
                <div className="card h-96 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="p-6 bg-surface-50 rounded-full text-surface-300">
                        <CircuitBoard size={64} />
                    </div>
                    <div className="max-w-md space-y-2">
                        <h3 className="text-xl font-bold text-surface-900">No GPIO Signals Configured</h3>
                        <p className="text-surface-500 text-sm">
                            Configure your Raspberry Pi pins in the Node Configuration section to start monitoring signals.
                        </p>
                    </div>
                    <Link to="/nodes" className="btn btn-primary py-3 px-8">
                        Configure Nodes
                    </Link>
                </div>
            )}

            {/* Hardware Help / Pin Map */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-primary-50 border border-primary-100 p-6 rounded-2xl flex gap-4 items-start h-fit">
                    <div className="p-2 bg-white rounded-lg text-primary-600 shadow-sm">
                        <Info size={20} />
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-bold text-primary-900">How hardware detection works</h4>
                        <p className="text-sm text-primary-700 leading-relaxed">
                            We use the <strong>RPi.GPIO</strong> library at the BCM level. When the system is running on your Pi, the backend continuously polls the physical state of the pins.
                        </p>
                        <ul className="text-xs text-primary-600 space-y-2 list-disc ml-4">
                            <li><strong>3.3V Signal</strong>: Detected as HIGH (1) - Indicator turns 🟢 Green.</li>
                            <li><strong>0V / Ground</strong>: Detected as LOW (0) - Indicator turns 🟡 Yellow.</li>
                            <li><strong>Open Circuit</strong>: May float; always use pull-up/down resistors for stable readings.</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-white border border-surface-200 p-6 rounded-2xl space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-surface-900">Common Pi 4 BCM-Physical Map</h4>
                        <span className="text-[10px] bg-surface-100 px-2 py-1 rounded font-mono">Pi 4 Header Reference</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
                        <div className="flex justify-between border-b border-surface-50 pb-1">
                            <span className="text-surface-400">BCM 17</span>
                            <span className="font-bold">Physical Pin 11</span>
                        </div>
                        <div className="flex justify-between border-b border-surface-50 pb-1">
                            <span className="text-surface-400">BCM 27</span>
                            <span className="font-bold">Physical Pin 13</span>
                        </div>
                        <div className="flex justify-between border-b border-surface-50 pb-1">
                            <span className="text-surface-400">BCM 22</span>
                            <span className="font-bold">Physical Pin 15</span>
                        </div>
                        <div className="flex justify-between border-b border-surface-50 pb-1">
                            <span className="text-surface-400">BCM 23</span>
                            <span className="font-bold">Physical Pin 16</span>
                        </div>
                        <div className="flex justify-between border-b border-surface-50 pb-1">
                            <span className="text-surface-400">BCM 24</span>
                            <span className="font-bold">Physical Pin 18</span>
                        </div>
                        <div className="flex justify-between border-b border-surface-50 pb-1">
                            <span className="text-surface-400">BCM 25</span>
                            <span className="font-bold">Physical Pin 22</span>
                        </div>
                    </div>
                    <p className="text-[10px] text-surface-400 italic">
                        * Refer to official Pinout.xyz for full 40-pin documentation.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GPIOPage;
