import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, X, Moon, Sun, Copy, Trash2, Settings, Key, AlertCircle } from 'lucide-react';
import APIService from './services/apiService';
import APIKeysModal from './components/APIKeysModal';

const LLM_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    color: 'bg-green-500'
  },
  anthropic: {
    name: 'Anthropic',
    models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    color: 'bg-yellow-500'
  },
  google: {
    name: 'Google',
    models: ['gemini-1.5-pro-latest', 'gemini-1.5-flash-latest', 'gemini-pro-vision'],
    color: 'bg-blue-500'
  },
  mistral: {
    name: 'Mistral',
    models: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest', 'open-mistral-nemo', 'codestral-latest'],
    color: 'bg-purple-500'
  },
  cohere: {
    name: 'Cohere',
    models: ['command-a-03-2025', 'command-r-plus', 'command-r', 'embed-v4.0', 'rerank-v3.5'],
    color: 'bg-pink-500'
  },
  xai: {
    name: 'xAI (Grok)',
    models: ['grok-3', 'grok-3-mini'],
    color: 'bg-gray-400'
  },
  groqcloud: {
    name: 'GroqCloud (Open Models)',
    models: ['llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it'],
    color: 'bg-indigo-500'
  }
};

const MultiLLMChat = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [chatbots, setChatbots] = useState([
    {
      id: 1,
      provider: 'openai',
      model: LLM_PROVIDERS.openai.models[0],
      messages: [],
      isLoading: false,
      systemPrompt: '',
      isApiKeyInvalid: false
    },
    {
      id: 2,
      provider: 'anthropic',
      model: LLM_PROVIDERS.anthropic.models[0],
      messages: [],
      isLoading: false,
      systemPrompt: '',
      isApiKeyInvalid: false
    }
  ]);
  const [globalMessage, setGlobalMessage] = useState('');
  const [sendMode, setSendMode] = useState('individual');
  const [nextId, setNextId] = useState(3);
  const [apiKeys, setApiKeys] = useState({});
  const [showApiKeysModal, setShowApiKeysModal] = useState(false);
  const [apiService, setApiService] = useState(null);
  const messagesEndRef = useRef({});

  // Load API keys from localStorage on component mount
  useEffect(() => {
    const savedKeys = localStorage.getItem('llm-api-keys');
    if (savedKeys) {
      try {
        const keys = JSON.parse(savedKeys);
        setApiKeys(keys);
        setApiService(new APIService(keys));
      } catch (error) {
        console.error('Error loading API keys:', error);
      }
    }
  }, []);

  const scrollToBottom = (chatbotId) => {
    messagesEndRef.current[chatbotId]?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    chatbots.forEach(chatbot => {
      scrollToBottom(chatbot.id);
    });
  }, [chatbots]);

  const addChatbot = () => {
    if (chatbots.length >= 8) return;
    
    const allProviderKeys = Object.keys(LLM_PROVIDERS);
    const usedProviderKeys = chatbots.map(cb => cb.provider);
    let defaultProvider = allProviderKeys.find(pKey => !usedProviderKeys.includes(pKey)) || 'openai';

    const newChatbot = {
      id: nextId,
      provider: defaultProvider,
      model: LLM_PROVIDERS[defaultProvider].models[0],
      messages: [],
      isLoading: false,
      systemPrompt: '',
      isApiKeyInvalid: false
    };
    
    setChatbots([...chatbots, newChatbot]);
    setNextId(nextId + 1);
  };

  const removeChatbot = (id) => {
    if (chatbots.length <= 1) return;
    setChatbots(chatbots.filter(bot => bot.id !== id));
  };

  const updateChatbot = (id, updates) => {
    setChatbots(chatbots.map(bot => 
      bot.id === id ? { ...bot, ...updates } : bot
    ));
  };

  const saveApiKeys = (keys) => {
    setApiKeys(keys);
    setApiService(new APIService(keys));
    localStorage.setItem('llm-api-keys', JSON.stringify(keys));
    setChatbots(prevChatbots => 
      prevChatbots.map(bot => 
        keys[bot.provider] ? { ...bot, isApiKeyInvalid: false } : bot
      )
    );
  };

  const sendMessage = async (chatbotId, message) => {
    if (!message.trim()) return;

    const chatbot = chatbots.find(bot => bot.id === chatbotId);
    if (!chatbot) return;

    // Check if API key is available for this provider
    if (!apiKeys[chatbot.provider]) {
      const errorMessage = { 
        role: 'assistant', 
        content: `API key for ${LLM_PROVIDERS[chatbot.provider].name} is not configured. Please add your API key in the settings.`,
        timestamp: new Date()
      };
      const userMessageObj = { role: 'user', content: message, timestamp: new Date() };
      updateChatbot(chatbotId, {
        messages: [...chatbot.messages, userMessageObj, errorMessage]
      });
      return;
    }

    // Add user message and set loading state
    const userMessageObj = { role: 'user', content: message, timestamp: new Date() };
    updateChatbot(chatbotId, {
      messages: [...chatbot.messages, userMessageObj],
      isLoading: true
    });

    try {
      // Call the actual API
      const response = await apiService.callLLM(
        [...chatbot.messages, userMessageObj],
        chatbot.provider,
        chatbot.model,
        chatbot.systemPrompt
      );

      const assistantMessage = { 
        role: 'assistant', 
        content: response, 
        timestamp: new Date() 
      };
      
      updateChatbot(chatbotId, {
        messages: [...chatbot.messages, userMessageObj, assistantMessage],
        isLoading: false,
        isApiKeyInvalid: false
      });
    } catch (error) {
      console.error('API Error:', error);
      let errorMessageContent = `Error: ${error.message}. Please check your API key and try again.`;
      let apiKeyInvalid = false;
      if (error.message.toLowerCase().includes('api key') || 
          error.message.includes('401') || 
          error.message.includes('403') || 
          error.message.toLowerCase().includes('authentication')){
        errorMessageContent = `API key for ${LLM_PROVIDERS[chatbot.provider].name} appears to be invalid or missing permissions. Please check your API key in settings.`;
        apiKeyInvalid = true;
      }

      const errorMessage = { 
        role: 'assistant', 
        content: errorMessageContent,
        timestamp: new Date() 
      };
      
      updateChatbot(chatbotId, {
        messages: [...chatbot.messages, userMessageObj, errorMessage],
        isLoading: false,
        isApiKeyInvalid: apiKeyInvalid
      });
    }
  };

  const sendGlobalMessage = () => {
    if (!globalMessage.trim()) return;
    
    if (sendMode === 'broadcast') {
      chatbots.forEach(chatbot => {
        sendMessage(chatbot.id, globalMessage);
      });
    }
    
    setGlobalMessage('');
  };

  const clearChat = (chatbotId) => {
    updateChatbot(chatbotId, { messages: [] });
  };

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
  };

  const getGridColumns = () => {
    const count = chatbots.length;
    if (count <= 2) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 4) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2';
    if (count <= 6) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
  };

  const hasAnyApiKeys = Object.values(apiKeys).some(key => key && key.trim() !== '');

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Multi-LLM Chat
            </h1>
            
            <div className="flex items-center space-x-4">
              {/* API Keys Status */}
              {!hasAnyApiKeys && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm">
                  <AlertCircle size={16} />
                  <span>Configure API keys to start chatting</span>
                </div>
              )}

              {/* API Keys Button */}
              <button
                onClick={() => setShowApiKeysModal(true)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  hasAnyApiKeys
                    ? darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                }`}
              >
                <Key size={18} />
                <span>API Keys</span>
              </button>

              {/* Send Mode Toggle */}
              <div className="flex items-center space-x-2">
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Send Mode:</span>
                <select
                  value={sendMode}
                  onChange={(e) => setSendMode(e.target.value)}
                  className={`px-3 py-1 rounded text-sm ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'} border`}
                >
                  <option value="individual">Individual</option>
                  <option value="broadcast">Broadcast</option>
                </select>
              </div>

              {/* Add Chatbot Button */}
              <button
                onClick={addChatbot}
                disabled={chatbots.length >= 8}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  chatbots.length >= 8 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <Plus size={20} />
                <span>Add Bot ({chatbots.length}/8)</span>
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>

          {/* Global Message Input (for broadcast mode) */}
          {sendMode === 'broadcast' && (
            <div className="mt-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={globalMessage}
                  onChange={(e) => setGlobalMessage(e.target.value)}
                  placeholder="Send message to all chatbots..."
                  className={`flex-1 px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 placeholder-gray-500'}`}
                  onKeyPress={(e) => e.key === 'Enter' && sendGlobalMessage()}
                />
                <button
                  onClick={sendGlobalMessage}
                  disabled={!globalMessage.trim()}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chatbots Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className={`grid gap-6 ${getGridColumns()}`}>
          {chatbots.map((chatbot) => (
            <ChatbotCard
              key={chatbot.id}
              chatbot={chatbot}
              darkMode={darkMode}
              sendMode={sendMode}
              hasApiKey={!!apiKeys[chatbot.provider]}
              onUpdate={(updates) => updateChatbot(chatbot.id, updates)}
              onRemove={() => removeChatbot(chatbot.id)}
              onSendMessage={(message) => sendMessage(chatbot.id, message)}
              onClearChat={() => clearChat(chatbot.id)}
              onCopyMessage={copyMessage}
              canRemove={chatbots.length > 1}
              messagesEndRef={messagesEndRef}
            />
          ))}
        </div>
      </div>

      {/* API Keys Modal */}
      <APIKeysModal
        isOpen={showApiKeysModal}
        onClose={() => setShowApiKeysModal(false)}
        apiKeys={apiKeys}
        onSaveKeys={saveApiKeys}
        darkMode={darkMode}
      />
    </div>
  );
};

const ChatbotCard = ({ 
  chatbot, 
  darkMode, 
  sendMode,
  hasApiKey,
  onUpdate, 
  onRemove, 
  onSendMessage, 
  onClearChat, 
  onCopyMessage,
  canRemove,
  messagesEndRef
}) => {
  const [message, setMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const chatContainerRef = useRef(null);

  const handleSend = () => {
    if (!message.trim() || chatbot.isApiKeyInvalid) return;
    onSendMessage(message);
    setMessage('');
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = chatContainerRef.current;
      if (chatbot.messages.length <= 2 || scrollHeight - scrollTop - clientHeight < 100) {
         messagesEndRef.current[chatbot.id]?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [chatbot.messages, chatbot.id, messagesEndRef, chatContainerRef]);

  const isSendDisabled = !hasApiKey || chatbot.isApiKeyInvalid;
  let placeholderText = "Type your message...";
  if (!hasApiKey) {
    placeholderText = "Configure API key first...";
  } else if (chatbot.isApiKeyInvalid) {
    placeholderText = "API Key is invalid. Check settings.";
  }

  return (
    <div className={`rounded-lg border h-96 flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${LLM_PROVIDERS[chatbot.provider]?.color || 'bg-gray-400'} ${isSendDisabled ? 'opacity-50' : ''}`}></div>
          <div>
            <select
              value={chatbot.provider}
              onChange={(e) => {
                const newProvider = e.target.value;
                onUpdate({ 
                  provider: newProvider, 
                  model: LLM_PROVIDERS[newProvider].models[0],
                  isApiKeyInvalid: false
                });
              }}
              className={`font-medium ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} border-none text-sm`}
            >
              {Object.entries(LLM_PROVIDERS).map(([key, provider]) => (
                <option key={key} value={key}>{provider.name}</option>
              ))}
            </select>
            <select
              value={chatbot.model}
              onChange={(e) => onUpdate({ model: e.target.value })}
              className={`block text-xs ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'} border-none`}
            >
              {LLM_PROVIDERS[chatbot.provider]?.models.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
          {isSendDisabled && (
            <div className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">
              {chatbot.isApiKeyInvalid ? 'Invalid API Key' : 'No API Key'}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1 rounded hover:bg-opacity-20 hover:bg-gray-500 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            <Settings size={16} />
          </button>
          <button
            onClick={onClearChat}
            className={`p-1 rounded hover:bg-opacity-20 hover:bg-gray-500 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            <Trash2 size={16} />
          </button>
          {canRemove && (
            <button
              onClick={onRemove}
              className="p-1 rounded hover:bg-red-100 text-red-500"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
          <textarea
            value={chatbot.systemPrompt}
            onChange={(e) => onUpdate({ systemPrompt: e.target.value })}
            placeholder="System prompt (optional)..."
            className={`w-full h-20 p-2 text-sm rounded border resize-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 placeholder-gray-500'}`}
          />
        </div>
      )}

      {/* Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatbot.messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] group relative`}>
              <div className={`p-3 rounded-lg ${ msg.content.startsWith('API key for') || msg.content.startsWith('Error:') || msg.content.startsWith('API Key for')
                ? (darkMode ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-700') 
                : msg.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : darkMode 
                    ? 'bg-gray-700 text-white' 
                    : 'bg-gray-100 text-gray-900'
              }
              `}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
              <button
                onClick={() => onCopyMessage(msg.content)}
                className={`absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-gray-600 text-white hover:bg-gray-700 transition-opacity`}
              >
                <Copy size={12} />
              </button>
            </div>
          </div>
        ))}
        
        {chatbot.isLoading && (
          <div className="flex justify-start">
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex space-x-1">
                <div className={`w-2 h-2 rounded-full animate-bounce ${darkMode ? 'bg-gray-400' : 'bg-gray-500'}`} style={{animationDelay: '0ms'}}></div>
                <div className={`w-2 h-2 rounded-full animate-bounce ${darkMode ? 'bg-gray-400' : 'bg-gray-500'}`} style={{animationDelay: '150ms'}}></div>
                <div className={`w-2 h-2 rounded-full animate-bounce ${darkMode ? 'bg-gray-400' : 'bg-gray-500'}`} style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={el => messagesEndRef.current[chatbot.id] = el} />
      </div>

      {/* Input (only show in individual mode) */}
      {sendMode === 'individual' && (
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={placeholderText}
              disabled={isSendDisabled}
              className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                isSendDisabled 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed placeholder-gray-400 dark:placeholder-gray-500'
                  : darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 placeholder-gray-500'
              }`}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={!message.trim() || chatbot.isLoading || isSendDisabled}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <MultiLLMChat />
    </div>
  );
}

export default App;