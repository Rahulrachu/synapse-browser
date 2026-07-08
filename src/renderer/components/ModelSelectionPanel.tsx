import React, { useEffect, useState } from 'react';
import { Settings, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useIPC } from '../hooks/useIPC';
import { AIProviderConfig, AIModel } from '../../common/types/ai';
import './ModelSelectionPanel.css';

export default function ModelSelectionPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const { invoke } = useIPC();

  const [providers, setProviders] = useState<AIProviderConfig[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [models, setModels] = useState<AIModel[]>([]);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [newProvider, setNewProvider] = useState<Partial<AIProviderConfig>>({});
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<any[]>([]);

  useEffect(() => {
    loadProviders();
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      const usageData = await invoke('ai:get-usage');
      setUsage(usageData || []);
    } catch (error) {
      console.error('Failed to load usage:', error);
    }
  };

  const loadProviders = async () => {
    try {
      const providersData = await invoke('ai:get-providers');
      setProviders(providersData || []);
      if (providersData && providersData.length > 0) {
        setSelectedProvider(providersData[0].id);
        loadModels(providersData[0].id);
      }
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  };

  const loadModels = async (providerId: string) => {
    try {
      const modelsData = await invoke('ai:get-models', providerId);
      setModels(modelsData || []);
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId);
    loadModels(providerId);
  };

  const handleApiKeyChange = (providerId: string, key: string) => {
    setApiKeys({ ...apiKeys, [providerId]: key });
  };

  const handleSaveApiKey = async (providerId: string) => {
    try {
      await invoke('ai:set-config', providerId, { apiKey: apiKeys[providerId] });
      alert('API key saved successfully');
    } catch (error) {
      console.error('Failed to save API key:', error);
    }
  };

  const handleAddProvider = async () => {
    if (!newProvider.name || !newProvider.type) {
      alert('Please fill in all fields');
      return;
    }
    try {
      setLoading(true);
      await invoke('ai:add-provider', newProvider);
      setNewProvider({});
      loadProviders();
    } catch (error) {
      console.error('Failed to add provider:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`model-selection-panel ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="panel-header">
        <h2>AI Model Selection</h2>
        <Settings size={20} />
      </div>

      <div className="panel-content">
        {/* Providers List */}
        <div className="providers-section">
          <h3>Providers</h3>
          <div className="providers-list">
            {providers.map(provider => (
              <div
                key={provider.id}
                className={`provider-item ${selectedProvider === provider.id ? 'selected' : ''}`}
                onClick={() => handleProviderSelect(provider.id)}
              >
                <div className="provider-info">
                  <span className="provider-name">{provider.name}</span>
                  <span className={`provider-type ${provider.type}`}>{provider.type}</span>
                </div>
                <div className={`status-indicator ${provider.enabled ? 'enabled' : 'disabled'}`}></div>
              </div>
            ))}
          </div>
        </div>

        {/* Usage Stats Section */}
        <div className="usage-section">
          <h3>Token Usage & Costs</h3>
          <div className="usage-list">
            {usage.length === 0 ? (
              <p className="empty-state">No usage data available</p>
            ) : (
              usage.map(u => (
                <div key={u.providerId} className="usage-item">
                  <div className="usage-provider">{u.providerId}</div>
                  <div className="usage-details">
                    <span>Tokens: {u.totalTokens.toLocaleString()}</span>
                    <span>Cost: ${u.cost.toFixed(4)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Provider Details */}
        {selectedProvider && (
          <div className="provider-details">
            <h3>Provider Configuration</h3>
            {providers.find(p => p.id === selectedProvider) && (
              <div className="config-section">
                <div className="config-field">
                  <label>API Key</label>
                  <div className="api-key-input">
                    <input
                      type={showApiKey[selectedProvider] ? 'text' : 'password'}
                      value={apiKeys[selectedProvider] || ''}
                      onChange={(e) => handleApiKeyChange(selectedProvider, e.target.value)}
                      placeholder="Enter API key"
                    />
                    <button
                      onClick={() => setShowApiKey({ ...showApiKey, [selectedProvider]: !showApiKey[selectedProvider] })}
                      className="toggle-btn"
                    >
                      {showApiKey[selectedProvider] ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <button
                    onClick={() => handleSaveApiKey(selectedProvider)}
                    className="save-btn"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Models List */}
            <div className="models-section">
              <h4>Available Models</h4>
              <div className="models-list">
                {models.length === 0 ? (
                  <p className="empty-state">No models available</p>
                ) : (
                  models.map(model => (
                    <div key={model.id} className="model-item">
                      <div className="model-info">
                        <span className="model-name">{model.name}</span>
                        <span className="model-context">Context: {model.contextWindow}K</span>
                      </div>
                      <div className="model-capabilities">
                        {model.capabilities.map(cap => (
                          <span key={cap} className="capability-badge">{cap}</span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add New Provider */}
        <div className="add-provider-section">
          <h3>Add New Provider</h3>
          <div className="form-group">
            <input
              type="text"
              placeholder="Provider Name"
              value={newProvider.name || ''}
              onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
            />
            <select
              value={newProvider.type || ''}
              onChange={(e) => setNewProvider({ ...newProvider, type: e.target.value as any })}
            >
              <option value="">Select Type</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google Gemini</option>
              <option value="ollama">Ollama</option>
            </select>
            <button
              onClick={handleAddProvider}
              disabled={loading}
              className="add-btn"
            >
              <Plus size={18} /> Add Provider
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
