// Background script for proxy management
class ProxyManager {
  constructor() {
    this.initializeProxySettings();
    chrome.runtime.onMessage.addListener(this.handleMessages.bind(this));
  }

  initializeProxySettings() {
    chrome.storage.local.get(['proxyConfig', 'proxyStatus'], (result) => {
      if (result.proxyConfig) {
        this.applyProxySettings(result.proxyConfig);
      }
    });
  }

  handleMessages(request, sender, sendResponse) {
    switch (request.action) {
      case 'connectProxy':
        this.connectProxy(request.config, sendResponse);
        return true;
      case 'disconnectProxy':
        this.disconnectProxy(sendResponse);
        return true;
      case 'getStatus':
        this.getProxyStatus(sendResponse);
        return true;
      default:
        sendResponse({ error: 'Unknown action' });
    }
  }

  async connectProxy(config, sendResponse) {
    try {
      const proxyConfig = {
        mode: 'fixed_servers',
        rules: {
          singleProxy: {
            scheme: config.type.toLowerCase(),
            host: config.host,
            port: parseInt(config.port),
            ...(config.username && { username: config.username }),
            ...(config.password && { password: config.password })
          },
          bypassList: ['localhost', '127.0.0.1', '::1']
        }
      };

      await new Promise((resolve, reject) => {
        chrome.proxy.settings.set(
          { value: proxyConfig, scope: 'regular' },
          () => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve();
            }
          }
        );
      });

      // Save config
      chrome.storage.local.set({
        proxyConfig: config,
        proxyStatus: 'connected'
      });

      // Set up proxy error handling
      this.setupProxyErrorListener();

      sendResponse({ success: true, status: 'connected' });
    } catch (error) {
      chrome.storage.local.set({ proxyStatus: 'error' });
      sendResponse({ 
        success: false, 
        status: 'error',
        error: error.message 
      });
    }
  }

  disconnectProxy(sendResponse) {
    chrome.proxy.settings.clear({ scope: 'regular' }, () => {
      if (chrome.runtime.lastError) {
        sendResponse({ 
          success: false, 
          error: chrome.runtime.lastError.message 
        });
      } else {
        chrome.storage.local.set({ proxyStatus: 'disconnected' });
        sendResponse({ success: true, status: 'disconnected' });
      }
    });
  }

  getProxyStatus(sendResponse) {
    chrome.storage.local.get(['proxyStatus'], (result) => {
      sendResponse({ 
        status: result.proxyStatus || 'disconnected' 
      });
    });
  }

  setupProxyErrorListener() {
    chrome.proxy.onProxyError.addListener((details) => {
      console.error('Proxy Error:', details);
      chrome.storage.local.set({ proxyStatus: 'error' });
      
      // Notify popup if open
      chrome.runtime.sendMessage({
        action: 'proxyError',
        error: details.error
      });
    });
  }

  applyProxySettings(config) {
    if (config && config.host && config.port) {
      this.connectProxy(config, () => {});
    }
  }
}

// Initialize proxy manager
new ProxyManager();

// Handle extension installation/update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      proxyStatus: 'disconnected',
      proxyConfig: null
    });
  }
});
