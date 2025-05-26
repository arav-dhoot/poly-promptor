import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, X, Moon, Sun, Copy, Trash2, Settings } from 'lucide-react';

const LLM_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    color: 'bg-green-500'
  },
  anthropic: {
    name: 'Anthropic',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    color: 'bg-orange-500'
  },
  google: {
    name: 'Google',
    models: ['gemini-pro', 'gemini-pro-vision', 'palm-2'],
    color: 'bg-blue-500'
  },
  grok: {
    name: 'Grok',
    models: ['grok-1', 'grok-1.5'],
    color: 'bg-purple-500'
  },
  mistral: {
    name: 'Mistral',
    models: ['mistral-large', 'mistral-medium', 'mistral-small'],
    color: 'bg-red-500'
  },
  cohere: {
    name: 'Cohere',
    models: ['command', 'command-light'],
    color: 'bg-indigo-500'
  }
};

const MultiLLMChat = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [chatbots, setChatbots] = useState([
    {
      id: 1,
      provider: 'openai',
      model: 'gpt-4',
      messages: [],
      isLoading: false,
      systemPrompt: ''
    },
    {
      id: 2,
      provider: 'anthropic',
      model: 'claude-3-sonnet',
      messages: [],
      isLoading: false,
      systemPrompt: ''
    }
  ]);
  const [globalMessage, setGlobalMessage] = useState('');
  const [sendMode, setSendMode] = useState('individual'); // 'individual' or 'broadcast'
  const [nextId, setNextId] = useState(3);
  const messagesEndRef = useRef({});

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
    
    const newChatbot = {
      id: nextId,
      provider: 'openai',
      model: 'gpt-4',
      messages: [],
      isLoading: false,
      systemPrompt: ''
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

  const simulateAPICall = async (message, provider, model) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Mock responses based on provider
    const responses = {
      openai: `OpenAI ${model} response: I understand you're asking about "${message}". As an AI assistant, I can help you with various tasks including analysis, creative writing, and problem-solving.`,
      anthropic: `Claude ${model} here! Regarding "${message}" - I'm designed to be helpful, harmless, and honest. I can assist with research, writing, coding, and thoughtful conversation.`,
      google: `Google ${model} response: Thank you for your question about "${message}". I can provide information, analysis, and creative assistance across many domains.`,
      grok: `Grok ${model} here with some wit: About "${message}" - I'm designed to be both helpful and entertaining, with a touch of humor and rebellion.`,
      mistral: `Mistral ${model} response: Concerning "${message}" - I'm a powerful language model focused on providing accurate and helpful responses.`,
      cohere: `Cohere ${model} here: Your query "${message}" is interesting. I specialize in understanding and generating human-like text.`
    };
    
    return responses[provider] || `${provider} ${model}: Response to "${message}"`;
  };

  const sendMessage = async (chatbotId, message) => {
    if (!message.trim()) return;

    const chatbot = chatbots.find(bot => bot.id === chatbotId);
    if (!chatbot) return;

    // Add user message
    const userMessage = { role: 'user', content: message, timestamp: new Date() };
    updateChatbot(chatbotId, {
      messages: [...chatbot.messages, userMessage],
      isLoading: true
    });

    try {
      const response = await simulateAPICall(message, chatbot.provider, chatbot.model);
      const assistantMessage = { role: 'assistant', content: response, timestamp: new Date() };
      
      updateChatbot(chatbotId, {
        messages: [...chatbot.messages, userMessage, assistantMessage],
        isLoading: false
      });
    } catch (error) {
      const errorMessage = { role: 'assistant', content: 'Sorry, there was an error processing your request.', timestamp: new Date() };
      updateChatbot(chatbotId, {
        messages: [...chatbot.messages, userMessage, errorMessage],
        isLoading: false
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
    </div>
  );
};

const ChatbotCard = ({ 
  chatbot, 
  darkMode, 
  sendMode,
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

  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage(message);
    setMessage('');
  };

  return (
    <div className={`rounded-lg border h-96 flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${LLM_PROVIDERS[chatbot.provider]?.color || 'bg-gray-400'}`}></div>
          <div>
            <select
              value={chatbot.provider}
              onChange={(e) => onUpdate({ provider: e.target.value, model: LLM_PROVIDERS[e.target.value].models[0] })}
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatbot.messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] group relative`}>
              <div className={`p-3 rounded-lg ${
                msg.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : darkMode 
                    ? 'bg-gray-700 text-white' 
                    : 'bg-gray-100 text-gray-900'
              }`}>
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
              placeholder="Type your message..."
              className={`flex-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 placeholder-gray-500'}`}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={!message.trim() || chatbot.isLoading}
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