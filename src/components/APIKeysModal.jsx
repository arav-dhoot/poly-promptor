import React, { useState } from 'react';
import { Key, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

const APIKeysModal = ({ isOpen, onClose, apiKeys, onSaveKeys, darkMode }) => {
  const [keys, setKeys] = useState(apiKeys);
  const [showKeys, setShowKeys] = useState({});
  const [testingKeys, setTestingKeys] = useState({});
  const [keyStatus, setKeyStatus] = useState({});

  const providers = {
    openai: {
      name: 'OpenAI',
      placeholder: 'sk-...',
      description: 'Required for GPT models',
      testEndpoint: 'https://api.openai.com/v1/models'
    },
    anthropic: {
      name: 'Anthropic',
      placeholder: 'sk-ant-...',
      description: 'Required for Claude models',
      testEndpoint: 'https://api.anthropic.com/v1/messages'
    },
    google: {
      name: 'Google',
      placeholder: 'AIza...',
      description: 'Required for Gemini models',
      testEndpoint: null // Google uses API key in URL, harder to test
    },
    grok: {
      name: 'Grok (X.AI)',
      placeholder: 'xai-...',
      description: 'Required for Grok models',
      testEndpoint: 'https://api.x.ai/v1/models'
    },
    mistral: {
      name: 'Mistral',
      placeholder: 'mistral-...',
      description: 'Required for Mistral models',
      testEndpoint: 'https://api.mistral.ai/v1/models'
    },
    cohere: {
      name: 'Cohere',
      placeholder: 'co-...',
      description: 'Required for Command models',
      testEndpoint: 'https://api.cohere.ai/v1/models'
    }
  };

  const handleKeyChange = (provider, value) => {
    setKeys(prev => ({
      ...prev,
      [provider]: value
    }));
    // Clear status when key changes
    setKeyStatus(prev => ({
      ...prev,
      [provider]: null
    }));
  };

  const toggleShowKey = (provider) => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const testApiKey = async (provider) => {
    const key = keys[provider];
    if (!key) return;

    setTestingKeys(prev => ({ ...prev, [provider]: true }));
    setKeyStatus(prev => ({ ...prev, [provider]: null }));

    try {
      let response;
      const providerInfo = providers[provider];

      if (provider === 'openai') {
        response = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${key}` }
        });
      } else if (provider === 'anthropic') {
        // Test with a minimal request
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'Hi' }]
          })
        });
      } else if (provider === 'google') {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      } else if (provider === 'grok') {
        response = await fetch('https://api.x.ai/v1/models', {
          headers: { 'Authorization': `Bearer ${key}` }
        });
      } else if (provider === 'mistral') {
        response = await fetch('https://api.mistral.ai/v1/models', {
          headers: { 'Authorization': `Bearer ${key}` }
        });
      } else if (provider === 'cohere') {
        response = await fetch('https://api.cohere.ai/v1/models', {
          headers: { 'Authorization': `Bearer ${key}` }
        });
      }

      if (response.ok) {
        setKeyStatus(prev => ({ ...prev, [provider]: 'valid' }));
      } else {
        setKeyStatus(prev => ({ ...prev, [provider]: 'invalid' }));
      }
    } catch (error) {
      setKeyStatus(prev => ({ ...prev, [provider]: 'error' }));
    } finally {
      setTestingKeys(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleSave = () => {
    onSaveKeys(keys);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
        darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        <div className={`sticky top-0 p-6 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Key className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold">API Keys Configuration</h2>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg hover:bg-opacity-20 hover:bg-gray-500 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              ✕
            </button>
          </div>
          <p className={`mt-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Enter your API keys to enable real LLM connections. Keys are stored locally in your browser.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {Object.entries(providers).map(([provider, info]) => (
            <div key={provider} className={`p-4 rounded-lg border ${
              darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-medium">{info.name}</h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {info.description}
                  </p>
                </div>
                {keyStatus[provider] && (
                  <div className="flex items-center space-x-1">
                    {keyStatus[provider] === 'valid' && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {(keyStatus[provider] === 'invalid' || keyStatus[provider] === 'error') && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    type={showKeys[provider] ? 'text' : 'password'}
                    value={keys[provider] || ''}
                    onChange={(e) => handleKeyChange(provider, e.target.value)}
                    placeholder={info.placeholder}
                    className={`w-full px-3 py-2 pr-10 rounded border text-sm ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 placeholder-gray-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey(provider)}
                    className={`absolute right-2 top-2 p-1 ${
                      darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {showKeys[provider] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                
                <button
                  onClick={() => testApiKey(provider)}
                  disabled={!keys[provider] || testingKeys[provider]}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    !keys[provider] || testingKeys[provider]
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {testingKeys[provider] ? 'Testing...' : 'Test'}
                </button>
              </div>

              {keyStatus[provider] === 'valid' && (
                <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                  ✓ API key is valid
                </p>
              )}
              {keyStatus[provider] === 'invalid' && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  ✗ Invalid API key
                </p>
              )}
              {keyStatus[provider] === 'error' && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  ✗ Error testing API key
                </p>
              )}
            </div>
          ))}

          <div className={`p-4 rounded-lg border ${
            darkMode ? 'border-yellow-700 bg-yellow-900 bg-opacity-20' : 'border-yellow-300 bg-yellow-50'
          }`}>
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-700 dark:text-yellow-400">Security Notice</h4>
                <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
                  API keys are stored locally in your browser and never sent to our servers. 
                  However, be cautious when using this on shared computers.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={`sticky bottom-0 p-6 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                darkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Save Keys
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIKeysModal;