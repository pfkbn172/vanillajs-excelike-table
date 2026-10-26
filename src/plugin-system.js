/**
 * Plugin System for ExceLike Table
 * Provides extensible architecture for third-party plugins
 */

const PluginSystem = {
  /**
   * Initialize plugin system
   * @param {Object} tableInstance - Table instance
   */
  init(tableInstance) {
    this.table = tableInstance;
    this.plugins = new Map();
    this.hooks = new Map();
    this.middlewares = new Map();
    this.eventListeners = new Map();
    
    // Initialize hook system
    this.initializeHooks();
    
    return this;
  },

  /**
   * Register a plugin
   * @param {string} name - Plugin name
   * @param {Object} plugin - Plugin object
   * @returns {boolean} Success status
   */
  registerPlugin(name, plugin) {
    if (this.plugins.has(name)) {
      return false;
    }

    // Validate plugin structure
    if (!this.validatePlugin(plugin)) {
      console.error(`Invalid plugin structure for "${name}"`);
      return false;
    }

    // Register plugin
    this.plugins.set(name, {
      ...plugin,
      name,
      enabled: true,
      initialized: false
    });

    // Initialize plugin if table is ready
    if (this.table) {
      this.initializePlugin(name);
    }

    return true;
  },

  /**
   * Unregister a plugin
   * @param {string} name - Plugin name
   * @returns {boolean} Success status
   */
  unregisterPlugin(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      console.warn(`Plugin "${name}" not found`);
      return false;
    }

    // Cleanup plugin
    this.cleanupPlugin(name);
    this.plugins.delete(name);

    return true;
  },

  /**
   * Enable a plugin
   * @param {string} name - Plugin name
   * @returns {boolean} Success status
   */
  enablePlugin(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      console.warn(`Plugin "${name}" not found`);
      return false;
    }

    plugin.enabled = true;
    
    if (!plugin.initialized) {
      this.initializePlugin(name);
    }

    return true;
  },

  /**
   * Disable a plugin
   * @param {string} name - Plugin name
   * @returns {boolean} Success status
   */
  disablePlugin(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      console.warn(`Plugin "${name}" not found`);
      return false;
    }

    plugin.enabled = false;
    this.cleanupPlugin(name);

    return true;
  },

  /**
   * Initialize plugin
   * @param {string} name - Plugin name
   */
  initializePlugin(name) {
    const plugin = this.plugins.get(name);
    if (!plugin || !plugin.enabled || plugin.initialized) {
      return;
    }

    try {
      // Call plugin initialization
      if (plugin.init && typeof plugin.init === 'function') {
        plugin.init(this.table, this.getPluginAPI());
      }

      // Register plugin hooks
      if (plugin.hooks) {
        Object.entries(plugin.hooks).forEach(([hookName, handler]) => {
          this.registerHook(hookName, handler, name);
        });
      }

      // Register plugin event listeners
      if (plugin.events) {
        Object.entries(plugin.events).forEach(([event, handler]) => {
          this.registerEventListener(event, handler, name);
        });
      }

      // Register plugin middlewares
      if (plugin.middlewares) {
        Object.entries(plugin.middlewares).forEach(([middleware, handler]) => {
          this.registerMiddleware(middleware, handler, name);
        });
      }

      plugin.initialized = true;
      
      // Emit plugin loaded event
      this.emitHook('plugin:loaded', { plugin: name });
      
    } catch (error) {
      console.error(`Failed to initialize plugin "${name}":`, error);
      plugin.enabled = false;
    }
  },

  /**
   * Cleanup plugin
   * @param {string} name - Plugin name
   */
  cleanupPlugin(name) {
    const plugin = this.plugins.get(name);
    if (!plugin || !plugin.initialized) {
      return;
    }

    try {
      // Call plugin cleanup
      if (plugin.destroy && typeof plugin.destroy === 'function') {
        plugin.destroy();
      }

      // Unregister hooks
      this.unregisterPluginHooks(name);
      
      // Unregister event listeners
      this.unregisterPluginEventListeners(name);
      
      // Unregister middlewares
      this.unregisterPluginMiddlewares(name);

      plugin.initialized = false;
      
      // Emit plugin unloaded event
      this.emitHook('plugin:unloaded', { plugin: name });
      
    } catch (error) {
      console.error(`Failed to cleanup plugin "${name}":`, error);
    }
  },

  /**
   * Validate plugin structure
   * @param {Object} plugin - Plugin object
   * @returns {boolean} Is valid
   */
  validatePlugin(plugin) {
    if (!plugin || typeof plugin !== 'object') {
      return false;
    }

    // Required properties
    const requiredProps = ['version'];
    for (const prop of requiredProps) {
      if (!(prop in plugin)) {
        console.error(`Plugin missing required property: ${prop}`);
        return false;
      }
    }

    // Optional but validated properties
    if (plugin.init && typeof plugin.init !== 'function') {
      console.error('Plugin init must be a function');
      return false;
    }

    if (plugin.destroy && typeof plugin.destroy !== 'function') {
      console.error('Plugin destroy must be a function');
      return false;
    }

    if (plugin.hooks && typeof plugin.hooks !== 'object') {
      console.error('Plugin hooks must be an object');
      return false;
    }

    return true;
  },

  /**
   * Get plugin API for plugins to interact with table
   * @returns {Object} Plugin API
   */
  getPluginAPI() {
    return {
      // Table access
      table: this.table,
      
      // Hook system
      registerHook: (name, handler, pluginName) => this.registerHook(name, handler, pluginName),
      unregisterHook: (name, pluginName) => this.unregisterHook(name, pluginName),
      emitHook: (name, data) => this.emitHook(name, data),
      
      // Event system
      addEventListener: (event, handler, pluginName) => this.registerEventListener(event, handler, pluginName),
      removeEventListener: (event, pluginName) => this.unregisterEventListener(event, pluginName),
      
      // Middleware system
      registerMiddleware: (name, handler, pluginName) => this.registerMiddleware(name, handler, pluginName),
      unregisterMiddleware: (name, pluginName) => this.unregisterMiddleware(name, pluginName),
      
      // Utility functions
      createElement: (tag, attrs, children) => this.createElement(tag, attrs, children),
      addCSS: (css, id) => this.addCSS(css, id),
      removeCSS: (id) => this.removeCSS(id),
      
      // Plugin management
      getPlugin: (name) => this.getPlugin(name),
      getPlugins: () => this.getPlugins(),
      
      // Storage
      setStorage: (key, value, pluginName) => this.setPluginStorage(key, value, pluginName),
      getStorage: (key, pluginName) => this.getPluginStorage(key, pluginName),
      removeStorage: (key, pluginName) => this.removePluginStorage(key, pluginName)
    };
  },

  /**
   * Initialize hook system
   */
  initializeHooks() {
    // Core hooks
    const coreHooks = [
      'table:beforeInit',
      'table:afterInit',
      'table:beforeDestroy',
      'table:afterDestroy',
      'data:beforeLoad',
      'data:afterLoad',
      'data:beforeFilter',
      'data:afterFilter',
      'data:beforeSort',
      'data:afterSort',
      'render:beforeRender',
      'render:afterRender',
      'cell:beforeEdit',
      'cell:afterEdit',
      'row:beforeSelect',
      'row:afterSelect',
      'plugin:loaded',
      'plugin:unloaded'
    ];

    coreHooks.forEach(hookName => {
      this.hooks.set(hookName, []);
    });
  },

  /**
   * Register hook
   * @param {string} name - Hook name
   * @param {Function} handler - Hook handler
   * @param {string} pluginName - Plugin name
   */
  registerHook(name, handler, pluginName) {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, []);
    }

    this.hooks.get(name).push({
      handler,
      plugin: pluginName,
      priority: handler.priority || 0
    });

    // Sort by priority (higher priority first)
    this.hooks.get(name).sort((a, b) => b.priority - a.priority);
  },

  /**
   * Unregister hook
   * @param {string} name - Hook name
   * @param {string} pluginName - Plugin name
   */
  unregisterHook(name, pluginName) {
    if (!this.hooks.has(name)) return;

    const hooks = this.hooks.get(name);
    const filtered = hooks.filter(hook => hook.plugin !== pluginName);
    this.hooks.set(name, filtered);
  },

  /**
   * Unregister all hooks for a plugin
   * @param {string} pluginName - Plugin name
   */
  unregisterPluginHooks(pluginName) {
    this.hooks.forEach((hooks, name) => {
      this.unregisterHook(name, pluginName);
    });
  },

  /**
   * Emit hook
   * @param {string} name - Hook name
   * @param {any} data - Hook data
   * @returns {any} Modified data
   */
  emitHook(name, data) {
    if (!this.hooks.has(name)) return data;

    const hooks = this.hooks.get(name);
    let result = data;

    for (const { handler, plugin } of hooks) {
      const pluginObj = this.plugins.get(plugin);
      if (!pluginObj || !pluginObj.enabled) continue;

      try {
        const hookResult = handler(result, this.table);
        if (hookResult !== undefined) {
          result = hookResult;
        }
      } catch (error) {
        console.error(`Hook "${name}" failed for plugin "${plugin}":`, error);
      }
    }

    return result;
  },

  /**
   * Register event listener
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @param {string} pluginName - Plugin name
   */
  registerEventListener(event, handler, pluginName) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }

    const listener = { handler, plugin: pluginName };
    this.eventListeners.get(event).push(listener);

    // Add DOM event listener if needed
    if (this.table.container) {
      this.table.container.addEventListener(event, handler);
    }
  },

  /**
   * Unregister event listener
   * @param {string} event - Event name
   * @param {string} pluginName - Plugin name
   */
  unregisterEventListener(event, pluginName) {
    if (!this.eventListeners.has(event)) return;

    const listeners = this.eventListeners.get(event);
    const filtered = listeners.filter(listener => {
      if (listener.plugin === pluginName) {
        // Remove DOM event listener
        if (this.table.container) {
          this.table.container.removeEventListener(event, listener.handler);
        }
        return false;
      }
      return true;
    });

    this.eventListeners.set(event, filtered);
  },

  /**
   * Unregister all event listeners for a plugin
   * @param {string} pluginName - Plugin name
   */
  unregisterPluginEventListeners(pluginName) {
    this.eventListeners.forEach((listeners, event) => {
      this.unregisterEventListener(event, pluginName);
    });
  },

  /**
   * Register middleware
   * @param {string} name - Middleware name
   * @param {Function} handler - Middleware handler
   * @param {string} pluginName - Plugin name
   */
  registerMiddleware(name, handler, pluginName) {
    if (!this.middlewares.has(name)) {
      this.middlewares.set(name, []);
    }

    this.middlewares.get(name).push({
      handler,
      plugin: pluginName,
      priority: handler.priority || 0
    });

    // Sort by priority
    this.middlewares.get(name).sort((a, b) => b.priority - a.priority);
  },

  /**
   * Unregister middleware
   * @param {string} name - Middleware name
   * @param {string} pluginName - Plugin name
   */
  unregisterMiddleware(name, pluginName) {
    if (!this.middlewares.has(name)) return;

    const middlewares = this.middlewares.get(name);
    const filtered = middlewares.filter(middleware => middleware.plugin !== pluginName);
    this.middlewares.set(name, filtered);
  },

  /**
   * Unregister all middlewares for a plugin
   * @param {string} pluginName - Plugin name
   */
  unregisterPluginMiddlewares(pluginName) {
    this.middlewares.forEach((middlewares, name) => {
      this.unregisterMiddleware(name, pluginName);
    });
  },

  /**
   * Apply middleware
   * @param {string} name - Middleware name
   * @param {any} data - Data to process
   * @param {Function} next - Next function
   * @returns {any} Processed data
   */
  applyMiddleware(name, data, next) {
    if (!this.middlewares.has(name)) {
      return next ? next(data) : data;
    }

    const middlewares = this.middlewares.get(name);
    let index = 0;

    const runNext = (currentData) => {
      if (index >= middlewares.length) {
        return next ? next(currentData) : currentData;
      }

      const { handler, plugin } = middlewares[index++];
      const pluginObj = this.plugins.get(plugin);
      
      if (!pluginObj || !pluginObj.enabled) {
        return runNext(currentData);
      }

      try {
        return handler(currentData, () => runNext(currentData));
      } catch (error) {
        console.error(`Middleware "${name}" failed for plugin "${plugin}":`, error);
        return runNext(currentData);
      }
    };

    return runNext(data);
  },

  /**
   * Create DOM element
   * @param {string} tag - Tag name
   * @param {Object} attrs - Attributes
   * @param {Array} children - Child elements
   * @returns {Element} Created element
   */
  createElement(tag, attrs = {}, children = []) {
    const element = document.createElement(tag);
    
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key.startsWith('data-')) {
        element.dataset[key.replace('data-', '')] = value;
      } else {
        element.setAttribute(key, value);
      }
    });

    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      }
    });

    return element;
  },

  /**
   * Add CSS styles
   * @param {string} css - CSS content
   * @param {string} id - Style ID
   */
  addCSS(css, id) {
    const existingStyle = document.getElementById(id);
    if (existingStyle) {
      existingStyle.textContent = css;
      return;
    }

    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
  },

  /**
   * Remove CSS styles
   * @param {string} id - Style ID
   */
  removeCSS(id) {
    const style = document.getElementById(id);
    if (style) {
      style.remove();
    }
  },

  /**
   * Set plugin storage
   * @param {string} key - Storage key
   * @param {any} value - Storage value
   * @param {string} pluginName - Plugin name
   */
  setPluginStorage(key, value, pluginName) {
    const storageKey = `table-plugin-${pluginName}-${key}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save plugin storage:', error);
    }
  },

  /**
   * Get plugin storage
   * @param {string} key - Storage key
   * @param {string} pluginName - Plugin name
   * @returns {any} Storage value
   */
  getPluginStorage(key, pluginName) {
    const storageKey = `table-plugin-${pluginName}-${key}`;
    try {
      const value = localStorage.getItem(storageKey);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn('Failed to load plugin storage:', error);
      return null;
    }
  },

  /**
   * Remove plugin storage
   * @param {string} key - Storage key
   * @param {string} pluginName - Plugin name
   */
  removePluginStorage(key, pluginName) {
    const storageKey = `table-plugin-${pluginName}-${key}`;
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to remove plugin storage:', error);
    }
  },

  /**
   * Get plugin
   * @param {string} name - Plugin name
   * @returns {Object|null} Plugin object
   */
  getPlugin(name) {
    return this.plugins.get(name) || null;
  },

  /**
   * Get all plugins
   * @returns {Array} Array of plugin objects
   */
  getPlugins() {
    return Array.from(this.plugins.values());
  },

  /**
   * Get enabled plugins
   * @returns {Array} Array of enabled plugin objects
   */
  getEnabledPlugins() {
    return Array.from(this.plugins.values()).filter(plugin => plugin.enabled);
  },

  /**
   * Get plugin info for UI
   * @returns {Array} Array of plugin info objects
   */
  getPluginList() {
    return Array.from(this.plugins.entries()).map(([name, plugin]) => ({
      name,
      version: plugin.version,
      description: plugin.description,
      author: plugin.author,
      enabled: plugin.enabled,
      initialized: plugin.initialized
    }));
  },

  /**
   * Load plugin from URL
   * @param {string} url - Plugin URL
   * @param {string} name - Plugin name
   * @returns {Promise<boolean>} Success status
   */
  async loadPluginFromURL(url, name) {
    try {
      // SSRF Protection: Validate URL before fetching
      if (!this.validatePluginURL(url)) {
        console.error(`Invalid or unsafe plugin URL: "${url}"`);
        return false;
      }

      const response = await fetch(url);
      const pluginCode = await response.text();
      
      // Create plugin from code
      const plugin = this.createPluginFromCode(pluginCode, name);
      if (plugin) {
        return this.registerPlugin(name, plugin);
      }
      
      return false;
    } catch (error) {
      console.error(`Failed to load plugin from URL "${url}":`, error);
      return false;
    }
  },

  /**
   * Validate plugin URL to prevent SSRF attacks
   * @param {string} url - URL to validate
   * @returns {boolean} True if URL is safe
   */
  validatePluginURL(url) {
    try {
      const parsedURL = new URL(url);

      // Block private/internal IP ranges (SSRF prevention)
      const blockedPatterns = [
        /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/,  // Private IPv4
        /^(127\.|169\.254\.)/,                                // Loopback and link-local
        /^(localhost|0\.0\.0\.0)/i,                          // Localhost variants
        /^(::1|fe80::|fc00::|fd00::)/i,                      // IPv6 loopback and private
        /^(metadata\.google\.internal)/i                     // Cloud metadata services
      ];

      // Check hostname against blocked patterns
      const hostname = parsedURL.hostname;
      for (const pattern of blockedPatterns) {
        if (pattern.test(hostname)) {
          return false;
        }
      }

      // Only allow HTTP/HTTPS protocols
      if (!['http:', 'https:'].includes(parsedURL.protocol)) {
        return false;
      }

      // Additional check: block non-standard ports for HTTP/HTTPS
      const port = parsedURL.port;
      if (port && !['80', '443', ''].includes(port)) {
        // Allow common alternative ports but log warning
        if (!['8080', '8443', '3000'].includes(port)) {
          console.warn(`Plugin URL uses non-standard port: ${port}`);
        }
      }

      return true;
    } catch (error) {
      // Invalid URL format
      return false;
    }
  },

  /**
   * Create plugin from code
   * @param {string} code - Plugin code
   * @param {string} name - Plugin name
   * @returns {Object|null} Plugin object
   */
  createPluginFromCode(code, name) {
    try {
      // Create isolated scope for plugin
      const pluginScope = {
        console: console,
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        setInterval: setInterval,
        clearInterval: clearInterval
      };

      // Execute plugin code in scope
      const pluginFunction = new Function(
        ...Object.keys(pluginScope),
        `${code}\nreturn typeof plugin !== 'undefined' ? plugin : null;`
      );

      const plugin = pluginFunction(...Object.values(pluginScope));
      return plugin;
    } catch (error) {
      console.error(`Failed to create plugin "${name}" from code:`, error);
      return null;
    }
  },

  /**
   * Create plugin manager UI
   * @param {Element} container - Container element
   * @returns {Element} Plugin manager element
   */
  createPluginManager(container) {
    const manager = this.createElement('div', {
      class: 'plugin-manager',
      style: {
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        background: '#fafafa'
      }
    });

    const title = this.createElement('h3', {}, ['Plugin Manager']);
    manager.appendChild(title);

    const pluginList = this.createElement('div', { class: 'plugin-list' });
    
    this.getPluginList().forEach(plugin => {
      const item = this.createElement('div', {
        class: 'plugin-item',
        style: {
          padding: '10px',
          margin: '5px 0',
          border: '1px solid #ddd',
          borderRadius: '3px',
          background: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }
      });

      const info = this.createElement('div', {}, [
        this.createElement('strong', {}, [plugin.name]),
        this.createElement('span', { style: { color: '#666', marginLeft: '10px' } }, [
          `v${plugin.version} - ${plugin.description || 'No description'}`
        ])
      ]);

      const controls = this.createElement('div', {});
      const toggleBtn = this.createElement('button', {
        style: {
          padding: '4px 8px',
          border: '1px solid #ddd',
          borderRadius: '3px',
          background: plugin.enabled ? '#52c41a' : '#f5222d',
          color: 'white',
          cursor: 'pointer'
        }
      }, [plugin.enabled ? 'Disable' : 'Enable']);

      toggleBtn.addEventListener('click', () => {
        if (plugin.enabled) {
          this.disablePlugin(plugin.name);
        } else {
          this.enablePlugin(plugin.name);
        }
        // Refresh UI
        container.innerHTML = '';
        this.createPluginManager(container);
      });

      controls.appendChild(toggleBtn);
      item.appendChild(info);
      item.appendChild(controls);
      pluginList.appendChild(item);
    });

    manager.appendChild(pluginList);

    if (container) {
      container.appendChild(manager);
    }

    return manager;
  },

  /**
   * Cleanup plugin system
   */
  destroy() {
    // Cleanup all plugins
    this.plugins.forEach((plugin, name) => {
      this.cleanupPlugin(name);
    });

    // Clear all data
    this.plugins.clear();
    this.hooks.clear();
    this.middlewares.clear();
    this.eventListeners.clear();
  }
};

export default PluginSystem;
