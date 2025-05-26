// API Service for handling different LLM providers

class APIService {
    constructor(apiKeys) {
      this.apiKeys = apiKeys;
    }
  
    async callOpenAI(messages, model, systemPrompt = '') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKeys.openai}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API error');
      }
  
      const data = await response.json();
      return data.choices[0].message.content;
    }
  
    async callAnthropic(messages, model, systemPrompt = '') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKeys.anthropic,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 1000,
          system: systemPrompt || undefined,
          messages: messages.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
          }))
        })
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Anthropic API error');
      }
  
      const data = await response.json();
      return data.content[0].text;
    }
  
    async callGoogle(messages, model, systemPrompt = '') {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKeys.google}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            ...(systemPrompt ? [{
              parts: [{ text: systemPrompt }],
              role: 'user'
            }, {
              parts: [{ text: 'I understand.' }],
              role: 'model'
            }] : []),
            ...messages.map(msg => ({
              parts: [{ text: msg.content }],
              role: msg.role === 'user' ? 'user' : 'model'
            }))
          ],
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7
          }
        })
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Google API error');
      }
  
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    }
  
    async callGrok(messages, model, systemPrompt = '') {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKeys.grok}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Grok API error');
      }
  
      const data = await response.json();
      return data.choices[0].message.content;
    }
  
    async callMistral(messages, model, systemPrompt = '') {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKeys.mistral}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Mistral API error');
      }
  
      const data = await response.json();
      return data.choices[0].message.content;
    }
  
    async callCohere(messages, model, systemPrompt = '') {
      // Cohere uses a different format - we need to format the conversation
      const chatHistory = messages.slice(0, -1).map(msg => ({
        role: msg.role === 'user' ? 'USER' : 'CHATBOT',
        message: msg.content
      }));
  
      const lastMessage = messages[messages.length - 1];
  
      const response = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKeys.cohere}`
        },
        body: JSON.stringify({
          model: model,
          message: lastMessage.content,
          chat_history: chatHistory,
          preamble: systemPrompt || undefined,
          max_tokens: 1000,
          temperature: 0.7
        })
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Cohere API error');
      }
  
      const data = await response.json();
      return data.text;
    }
  
    async callLLM(messages, provider, model, systemPrompt = '') {
      if (!this.apiKeys[provider]) {
        throw new Error(`API key for ${provider} not provided`);
      }
  
      switch (provider) {
        case 'openai':
          return await this.callOpenAI(messages, model, systemPrompt);
        case 'anthropic':
          return await this.callAnthropic(messages, model, systemPrompt);
        case 'google':
          return await this.callGoogle(messages, model, systemPrompt);
        case 'grok':
          return await this.callGrok(messages, model, systemPrompt);
        case 'mistral':
          return await this.callMistral(messages, model, systemPrompt);
        case 'cohere':
          return await this.callCohere(messages, model, systemPrompt);
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    }
  }
  
export default APIService;