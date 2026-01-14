import React, { useState } from 'react';
import { Plus, Search, Filter, Save, Trash2, Edit3, ChevronRight, Settings2, Info } from 'lucide-react';
import api from '../api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '../utils/cn';

const NodeConfig = () => {
    const [selectedNode, setSelectedNode] = useState(null);
    const [formData, setFormData] = useState(null);
    const queryClient = useQueryClient();

    // Fetch Nodes from DB
    const { data: nodes = [], isLoading } = useQuery({
        queryKey: ['nodes'],
        queryFn: async () => {
            const resp = await api.get('/nodes');
            return resp.data;
        }
    });

    // Save Mutation (Handles both Create and Update)
    const saveMutation = useMutation({
        mutationFn: async (data) => {
            if (data.id) {
                return await api.put(`/nodes/${data.id}`, data);
            } else {
                return await api.post('/nodes', data);
            }
        },
        onSuccess: (resp) => {
            queryClient.invalidateQueries(['nodes']);
            setSelectedNode(resp.data);
            setFormData({
                ...resp.data,
                source_config: { ...(resp.data.source_config || {}) }
            });
            alert('Node saved successfully!');
        },
        onError: (err) => {
            alert('Failed to save node: ' + (err.response?.data?.detail || err.message));
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            return await api.delete(`/nodes/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['nodes']);
            setSelectedNode(null);
            setFormData(null);
            alert('Node deleted successfully!');
        },
        onError: (err) => {
            alert('Failed to delete node: ' + (err.response?.data?.detail || err.message));
        }
    });

    const handleAddNewNode = () => {
        const newNode = {
            name: 'New Node',
            node_id: 'ns=1;s=NewNode',
            data_type: 'Float',
            access_level: 'CurrentRead',
            source_type: 'manual',
            source_config: {},
            update_interval_ms: 1000,
            enabled: true,
            description: ''
        };
        setSelectedNode({ id: 'new' }); // Temporary ID to show the form
        setFormData(newNode);
    };

    const handleNodeSelect = (node) => {
        setSelectedNode(node);
        // Initialize form data with deep copy of source_config
        setFormData({
            ...node,
            source_config: { ...(node.source_config || {}) }
        });
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSourceConfigChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            source_config: { ...prev.source_config, [field]: value }
        }));
    };

    const handleSave = () => {
        saveMutation.mutate(formData);
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-surface-900">Node Configuration</h1>
                    <p className="text-surface-500 mt-1">Manage dynamic OPC UA nodes and their data sources</p>
                </div>
                <button
                    onClick={handleAddNewNode}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus size={20} />
                    <span>Add New Node</span>
                </button>
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* Node List */}
                <div className="lg:col-span-1 card flex flex-col p-0 overflow-hidden">
                    <div className="p-4 border-b border-surface-100 flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search nodes..."
                                className="w-full pl-10 pr-4 py-2 bg-surface-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <button className="p-2 bg-surface-50 text-surface-600 rounded-lg hover:bg-surface-100 transition-colors">
                            <Filter size={18} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto divide-y divide-surface-50">
                        {nodes.map((node) => (
                            <button
                                key={node.id}
                                onClick={() => handleNodeSelect(node)}
                                className={cn(
                                    "w-full p-4 flex items-center justify-between text-left transition-colors",
                                    selectedNode?.id === node.id ? "bg-primary-50" : "hover:bg-surface-50"
                                )}
                            >
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-surface-900 truncate">{node.name}</h4>
                                    <p className="text-xs text-surface-400 font-mono mt-0.5">{node.node_id}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={cn(
                                        "w-2 h-2 rounded-full",
                                        node.enabled ? "bg-emerald-500" : "bg-surface-300"
                                    )} />
                                    <ChevronRight size={16} className="text-surface-300" />
                                </div>
                            </button>
                        ))}
                        {nodes.length === 0 && !isLoading && (
                            <div className="p-8 text-center text-surface-400 text-sm">
                                No nodes configured yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Node Details/Editor */}
                <div className="lg:col-span-2 card flex flex-col p-0">
                    {formData ? (
                        <div className="flex flex-col h-full">
                            <div className="p-6 border-b border-surface-100 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                                        <Edit3 size={20} />
                                    </div>
                                    <h3 className="text-xl font-bold">Node Settings</h3>
                                </div>
                                <div className="flex gap-3">
                                    {formData.id && formData.id !== 'new' && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Are you sure you want to delete this node?')) {
                                                    deleteMutation.mutate(formData.id);
                                                }
                                            }}
                                            disabled={deleteMutation.isLoading}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                    <button
                                        onClick={handleSave}
                                        disabled={saveMutation.isLoading}
                                        className="btn btn-primary flex items-center gap-2"
                                    >
                                        {saveMutation.isLoading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Save size={18} />
                                        )}
                                        <span>{saveMutation.isLoading ? 'Saving...' : 'Save Changes'}</span>
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto p-8 space-y-8">
                                <section className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-surface-700">Display Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            className="input-field"
                                        />
                                        {formData.source_type === 'gpio' && (
                                            <p className="text-[10px] text-primary-600 font-medium ml-1 flex items-center gap-1">
                                                <Info size={12} /> This will be shown as the Signal Name in the Monitor
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-surface-700">Node ID</label>
                                        <input
                                            type="text"
                                            value={formData.node_id}
                                            onChange={(e) => handleInputChange('node_id', e.target.value)}
                                            className="input-field font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-surface-700">Data Type</label>
                                        <select
                                            className="input-field"
                                            value={formData.data_type}
                                            onChange={(e) => handleInputChange('data_type', e.target.value)}
                                        >
                                            <option value="Boolean">Boolean</option>
                                            <option value="Int32">Int32</option>
                                            <option value="Float">Float</option>
                                            <option value="String">String</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-surface-700">Access Level</label>
                                        <select
                                            className="input-field"
                                            value={formData.access_level}
                                            onChange={(e) => handleInputChange('access_level', e.target.value)}
                                        >
                                            <option value="CurrentRead">CurrentRead</option>
                                            <option value="CurrentWrite">CurrentWrite</option>
                                            <option value="CurrentRead/CurrentWrite">CurrentRead/CurrentWrite</option>
                                        </select>
                                    </div>
                                </section>

                                <hr className="border-surface-100" />

                                <section className="space-y-6">
                                    <h4 className="font-bold text-lg">DataSource Configuration</h4>
                                    <div className="space-y-4 bg-surface-50 p-6 rounded-xl border border-surface-100">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-surface-700">Source Type</label>
                                            <select
                                                className="input-field"
                                                value={formData.source_type}
                                                onChange={(e) => handleInputChange('source_type', e.target.value)}
                                            >
                                                <option value="manual">manual</option>
                                                <option value="simulation">simulation</option>
                                                <option value="gpio">gpio</option>
                                                <option value="analog">analog input</option>
                                            </select>
                                        </div>

                                        {/* GPIO Specific Fields */}
                                        {formData.source_type === 'gpio' && (
                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-surface-700">BCM Pin Number</label>
                                                    <input
                                                        type="number"
                                                        value={formData.source_config?.pin || ''}
                                                        onChange={(e) => handleSourceConfigChange('pin', parseInt(e.target.value))}
                                                        className="input-field font-mono"
                                                        placeholder="e.g. 17"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-surface-700">IO Mode</label>
                                                    <select
                                                        className="input-field"
                                                        value={formData.source_config?.mode || 'input'}
                                                        onChange={(e) => handleSourceConfigChange('mode', e.target.value)}
                                                    >
                                                        <option value="input">Input (Digital In)</option>
                                                        <option value="output">Output (Digital Out)</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        {/* Analog Specific Fields */}
                                        {formData.source_type === 'analog' && (
                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-surface-700">ADC Device</label>
                                                    <select
                                                        className="input-field"
                                                        value={formData.source_config?.adc_device || 'ads1115'}
                                                        onChange={(e) => handleSourceConfigChange('adc_device', e.target.value)}
                                                    >
                                                        <option value="ads1115">ADS1115 (I2C)</option>
                                                        <option value="mcp3008">MCP3008 (SPI, 10-bit)</option>
                                                        <option value="mcp3208">MCP3208 (SPI, 12-bit)</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-surface-700">Channel</label>
                                                    <input
                                                        type="number"
                                                        value={formData.source_config?.channel ?? 0}
                                                        onChange={(e) => handleSourceConfigChange('channel', parseInt(e.target.value))}
                                                        className="input-field font-mono"
                                                        min="0"
                                                        max="7"
                                                    />
                                                    <p className="text-[10px] text-surface-400">0-3 for ADS1115, 0-7 for MCP3008/MCP3208</p>
                                                </div>

                                                {/* ADS1115 Specifics */}
                                                {(formData.source_config?.adc_device === 'ads1115' || !formData.source_config?.adc_device) && (
                                                    <>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-semibold text-surface-700">Gain</label>
                                                            <select
                                                                className="input-field"
                                                                value={formData.source_config?.gain || 1}
                                                                onChange={(e) => handleSourceConfigChange('gain', parseInt(e.target.value))}
                                                            >
                                                                <option value="1">1 (+/- 4.096V)</option>
                                                                <option value="2">2 (+/- 2.048V)</option>
                                                                <option value="4">4 (+/- 1.024V)</option>
                                                                <option value="8">8 (+/- 0.512V)</option>
                                                                <option value="16">16 (+/- 0.256V)</option>
                                                                <option value="2/3">2/3 (+/- 6.144V)</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-semibold text-surface-700">I2C Address</label>
                                                            <input
                                                                type="text"
                                                                value={formData.source_config?.i2c_address || '0x48'}
                                                                onChange={(e) => handleSourceConfigChange('i2c_address', e.target.value)}
                                                                className="input-field font-mono"
                                                                placeholder="0x48"
                                                            />
                                                        </div>
                                                    </>
                                                )}

                                                {/* MCP3008/MCP3208 Specifics */}
                                                {(formData.source_config?.adc_device === 'mcp3008' || formData.source_config?.adc_device === 'mcp3208') && (
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-semibold text-surface-700">CS Pin (SPI CE)</label>
                                                        <input
                                                            type="number"
                                                            value={formData.source_config?.cs_pin || 8}
                                                            onChange={(e) => handleSourceConfigChange('cs_pin', parseInt(e.target.value))}
                                                            className="input-field font-mono"
                                                            placeholder="8 (CE0)"
                                                        />
                                                    </div>
                                                )}

                                                {/* Scaling Configuration */}
                                                <div className="col-span-2 mt-4 p-4 bg-white rounded-lg border border-surface-200">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <input
                                                            type="checkbox"
                                                            id="scale_enabled"
                                                            checked={formData.scale_enabled || false}
                                                            onChange={(e) => handleInputChange('scale_enabled', e.target.checked)}
                                                            className="w-4 h-4 accent-primary-600 rounded cursor-pointer"
                                                        />
                                                        <label htmlFor="scale_enabled" className="text-sm font-bold text-surface-700 cursor-pointer">
                                                            Enable Scaling (Convert to Engineering Units)
                                                        </label>
                                                    </div>

                                                    {formData.scale_enabled && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <label className="text-sm font-semibold text-surface-700">Voltage Min</label>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={formData.voltage_min || '0'}
                                                                    onChange={(e) => handleInputChange('voltage_min', e.target.value)}
                                                                    className="input-field font-mono"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-sm font-semibold text-surface-700">Voltage Max</label>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={formData.voltage_max || '3.3'}
                                                                    onChange={(e) => handleInputChange('voltage_max', e.target.value)}
                                                                    className="input-field font-mono"
                                                                    placeholder="3.3"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-sm font-semibold text-surface-700">Engineering Min</label>
                                                                <input
                                                                    type="number"
                                                                    step="0.1"
                                                                    value={formData.scale_min || ''}
                                                                    onChange={(e) => handleInputChange('scale_min', e.target.value)}
                                                                    className="input-field font-mono"
                                                                    placeholder="e.g., 10"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-sm font-semibold text-surface-700">Engineering Max</label>
                                                                <input
                                                                    type="number"
                                                                    step="0.1"
                                                                    value={formData.scale_max || ''}
                                                                    onChange={(e) => handleInputChange('scale_max', e.target.value)}
                                                                    className="input-field font-mono"
                                                                    placeholder="e.g., 100"
                                                                />
                                                            </div>
                                                            <div className="col-span-2 space-y-2">
                                                                <label className="text-sm font-semibold text-surface-700">Unit</label>
                                                                <input
                                                                    type="text"
                                                                    value={formData.scale_unit || ''}
                                                                    onChange={(e) => handleInputChange('scale_unit', e.target.value)}
                                                                    className="input-field"
                                                                    placeholder="e.g., bar, °C, psi, %"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Simulation Specific Fields */}
                                        {formData.source_type === 'simulation' && (
                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-surface-700">Sim Type</label>
                                                    <select
                                                        className="input-field"
                                                        value={formData.source_config?.sim_type || 'random'}
                                                        onChange={(e) => handleSourceConfigChange('sim_type', e.target.value)}
                                                    >
                                                        <option value="random">Random</option>
                                                        <option value="sine">Sine Wave</option>
                                                        <option value="incremental">Incremental</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-surface-700">Min Value</label>
                                                    <input
                                                        type="number"
                                                        value={formData.source_config?.min || 0}
                                                        onChange={(e) => handleSourceConfigChange('min', parseFloat(e.target.value))}
                                                        className="input-field"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-surface-700">Max Value</label>
                                                    <input
                                                        type="number"
                                                        value={formData.source_config?.max || 100}
                                                        onChange={(e) => handleSourceConfigChange('max', parseFloat(e.target.value))}
                                                        className="input-field"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-surface-700">Step</label>
                                                    <input
                                                        type="number"
                                                        value={formData.source_config?.step || 1}
                                                        onChange={(e) => handleSourceConfigChange('step', parseFloat(e.target.value))}
                                                        className="input-field"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4 pt-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-surface-700">Update Interval (ms)</label>
                                                <input
                                                    type="number"
                                                    value={formData.update_interval_ms}
                                                    onChange={(e) => handleInputChange('update_interval_ms', parseInt(e.target.value))}
                                                    className="input-field"
                                                />
                                            </div>
                                            <div className="flex items-center gap-3 pt-8">
                                                <input
                                                    type="checkbox"
                                                    id="enabled"
                                                    checked={formData.enabled}
                                                    onChange={(e) => handleInputChange('enabled', e.target.checked)}
                                                    className="w-5 h-5 accent-primary-600 rounded cursor-pointer"
                                                />
                                                <label htmlFor="enabled" className="text-sm font-semibold text-surface-700 cursor-pointer">Enabled</label>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-surface-400 space-y-4">
                            <div className="p-4 bg-surface-50 rounded-full">
                                <Settings2 size={48} className="opacity-20" />
                            </div>
                            <p className="font-medium">Select a node to view or edit its configuration</p>
                        </div>
                    )}
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
                `
            }} />
        </div>
    );
};



export default NodeConfig;
