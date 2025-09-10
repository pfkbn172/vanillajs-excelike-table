/**
 * Perfect Event Bus for V2 Architecture
 * Clean event-driven architecture with error isolation
 */

class EventBus {
  constructor() {
    // Import dependencies
    const v2 = window.ConditionalFormattingV2;
    this.constants = v2;
    
    this.listeners = new Map();
    this.globalListeners = [];
    this.eventHistory = [];
    this.maxHistorySize = 100;
    this.errorHandlers = new Map();
    
    // Performance monitoring
    this.stats = {
      totalEvents: 0,
      errorCount: 0,
      listenerCount: 0
    };
    
    // Configuration
    this.config = {
      enableHistory: true,
      enableErrorIsolation: true,
      logErrors: true
    };
  }
  
  /**
   * Add event listener
   */
  on(eventType, listener, options = {}) {
    this._validateEventType(eventType);
    this._validateListener(listener);
    
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    
    const listenerEntry = {
      id: this._generateListenerId(),
      fn: listener,
      once: options.once || false,
      priority: options.priority || 0,
      context: options.context || null,
      created: new Date()
    };
    
    // Insert based on priority (higher priority first)
    const listeners = this.listeners.get(eventType);
    const insertIndex = listeners.findIndex(l => l.priority < listenerEntry.priority);
    
    if (insertIndex === -1) {
      listeners.push(listenerEntry);
    } else {
      listeners.splice(insertIndex, 0, listenerEntry);
    }
    
    this.stats.listenerCount++;
    
    return listenerEntry.id;
  }
  
  /**
   * Add one-time event listener
   */
  once(eventType, listener, options = {}) {
    return this.on(eventType, listener, { ...options, once: true });
  }
  
  /**
   * Remove event listener
   */
  off(eventType, listenerId) {
    if (!eventType || !listenerId) {
      return false;
    }
    
    const listeners = this.listeners.get(eventType);
    if (!listeners) {
      return false;
    }
    
    const index = listeners.findIndex(l => l.id === listenerId);
    if (index === -1) {
      return false;
    }
    
    listeners.splice(index, 1);
    this.stats.listenerCount--;
    
    // Clean up empty arrays
    if (listeners.length === 0) {
      this.listeners.delete(eventType);
    }
    
    return true;
  }
  
  /**
   * Remove all listeners for event type
   */
  removeAllListeners(eventType) {
    if (!eventType) {
      // Remove all listeners
      const totalRemoved = Array.from(this.listeners.values())
        .reduce((sum, listeners) => sum + listeners.length, 0);
      
      this.listeners.clear();
      this.globalListeners = [];
      this.stats.listenerCount = 0;
      
      return totalRemoved;
    }
    
    const listeners = this.listeners.get(eventType);
    if (!listeners) {
      return 0;
    }
    
    const removedCount = listeners.length;
    this.listeners.delete(eventType);
    this.stats.listenerCount -= removedCount;
    
    return removedCount;
  }
  
  /**
   * Emit event to all listeners
   */
  emit(eventType, data = null, options = {}) {
    this._validateEventType(eventType);
    
    const event = {
      id: this._generateEventId(),
      type: eventType,
      data: data,
      timestamp: new Date(),
      source: options.source || 'unknown',
      async: options.async || false
    };
    
    // Add to history
    if (this.config.enableHistory) {
      this._addToHistory(event);
    }
    
    this.stats.totalEvents++;
    
    // Handle async events
    if (event.async) {
      setImmediate(() => this._emitSync(event));
    } else {
      this._emitSync(event);
    }
    
    return event.id;
  }
  
  /**
   * Emit event asynchronously
   */
  emitAsync(eventType, data = null, options = {}) {
    return this.emit(eventType, data, { ...options, async: true });
  }
  
  /**
   * Internal synchronous emit
   */
  _emitSync(event) {
    const listeners = this.listeners.get(event.type) || [];
    const toRemove = [];
    
    // Execute type-specific listeners
    for (const listener of listeners) {
      try {
        this._executeListener(listener, event);
        
        // Mark for removal if once-only
        if (listener.once) {
          toRemove.push(listener.id);
        }
        
      } catch (error) {
        this._handleListenerError(error, listener, event);
      }
    }
    
    // Execute global listeners
    for (const listener of this.globalListeners) {
      try {
        this._executeListener(listener, event);
      } catch (error) {
        this._handleListenerError(error, listener, event);
      }
    }
    
    // Remove once-only listeners
    toRemove.forEach(id => this.off(event.type, id));
  }
  
  /**
   * Execute individual listener
   */
  _executeListener(listener, event) {
    if (listener.context) {
      listener.fn.call(listener.context, event);
    } else {
      listener.fn(event);
    }
  }
  
  /**
   * Handle listener execution errors
   */
  _handleListenerError(error, listener, event) {
    this.stats.errorCount++;
    
    if (this.config.logErrors) {
      console.error('[EventBus] Listener error:', {
        error: error.message,
        event: event.type,
        listenerId: listener.id,
        stack: error.stack
      });
    }
    
    // Try error handlers
    const errorHandlers = this.errorHandlers.get(event.type) || [];
    for (const handler of errorHandlers) {
      try {
        handler({
          error,
          listener,
          event,
          handled: false
        });
      } catch (handlerError) {
        console.error('[EventBus] Error handler failed:', handlerError);
      }
    }
    
    // Emit error event if error isolation is disabled
    if (!this.config.enableErrorIsolation) {
      throw error;
    }
  }
  
  /**
   * Add global listener (receives all events)
   */
  addGlobalListener(listener, options = {}) {
    this._validateListener(listener);
    
    const listenerEntry = {
      id: this._generateListenerId(),
      fn: listener,
      priority: options.priority || 0,
      context: options.context || null,
      created: new Date()
    };
    
    // Insert based on priority
    const insertIndex = this.globalListeners.findIndex(l => l.priority < listenerEntry.priority);
    
    if (insertIndex === -1) {
      this.globalListeners.push(listenerEntry);
    } else {
      this.globalListeners.splice(insertIndex, 0, listenerEntry);
    }
    
    return listenerEntry.id;
  }
  
  /**
   * Remove global listener
   */
  removeGlobalListener(listenerId) {
    const index = this.globalListeners.findIndex(l => l.id === listenerId);
    if (index === -1) {
      return false;
    }
    
    this.globalListeners.splice(index, 1);
    return true;
  }
  
  /**
   * Add error handler for specific event type
   */
  addErrorHandler(eventType, handler) {
    this._validateEventType(eventType);
    this._validateListener(handler);
    
    if (!this.errorHandlers.has(eventType)) {
      this.errorHandlers.set(eventType, []);
    }
    
    this.errorHandlers.get(eventType).push(handler);
  }
  
  /**
   * Get event history
   */
  getHistory(eventType = null, limit = null) {
    let history = this.eventHistory;
    
    if (eventType) {
      history = history.filter(event => event.type === eventType);
    }
    
    if (limit && limit > 0) {
      history = history.slice(-limit);
    }
    
    return [...history]; // Return copy
  }
  
  /**
   * Clear event history
   */
  clearHistory() {
    this.eventHistory = [];
  }
  
  /**
   * Get listener count for event type
   */
  getListenerCount(eventType = null) {
    if (eventType) {
      const listeners = this.listeners.get(eventType);
      return listeners ? listeners.length : 0;
    }
    
    return this.stats.listenerCount;
  }
  
  /**
   * Get all event types that have listeners
   */
  getEventTypes() {
    return Array.from(this.listeners.keys());
  }
  
  /**
   * Check if event type has listeners
   */
  hasListeners(eventType) {
    const listeners = this.listeners.get(eventType);
    return listeners && listeners.length > 0;
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      eventTypes: this.listeners.size,
      globalListeners: this.globalListeners.length,
      historySize: this.eventHistory.length,
      memoryUsage: this._estimateMemoryUsage()
    };
  }
  
  /**
   * Add event to history
   */
  _addToHistory(event) {
    this.eventHistory.push(event);
    
    // Maintain history size limit
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }
  
  /**
   * Generate unique listener ID
   */
  _generateListenerId() {
    return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Generate unique event ID
   */
  _generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Validate event type
   */
  _validateEventType(eventType) {
    if (typeof eventType !== 'string' || eventType.trim() === '') {
      throw new Error('Event type must be a non-empty string');
    }
  }
  
  /**
   * Validate listener function
   */
  _validateListener(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function');
    }
  }
  
  /**
   * Estimate memory usage (simplified)
   */
  _estimateMemoryUsage() {
    const listenerSize = Array.from(this.listeners.values())
      .reduce((sum, listeners) => sum + listeners.length, 0);
    
    return {
      listeners: listenerSize,
      history: this.eventHistory.length,
      estimated: `${Math.round((listenerSize + this.eventHistory.length) * 0.5)}KB`
    };
  }
  
  /**
   * Configure event bus
   */
  configure(options) {
    if (options.enableHistory !== undefined) {
      this.config.enableHistory = options.enableHistory;
    }
    
    if (options.enableErrorIsolation !== undefined) {
      this.config.enableErrorIsolation = options.enableErrorIsolation;
    }
    
    if (options.logErrors !== undefined) {
      this.config.logErrors = options.logErrors;
    }
    
    if (options.maxHistorySize !== undefined) {
      this.maxHistorySize = options.maxHistorySize;
    }
  }
  
  /**
   * Create convenience methods for standard events
   */
  onRuleAdded(listener, options) {
    return this.on(this.constants.EVENT_TYPES.RULE_ADDED, listener, options);
  }
  
  onRuleUpdated(listener, options) {
    return this.on(this.constants.EVENT_TYPES.RULE_UPDATED, listener, options);
  }
  
  onRuleDeleted(listener, options) {
    return this.on(this.constants.EVENT_TYPES.RULE_DELETED, listener, options);
  }
  
  onCellEvaluated(listener, options) {
    return this.on(this.constants.EVENT_TYPES.CELL_EVALUATED, listener, options);
  }
  
  onFormatApplied(listener, options) {
    return this.on(this.constants.EVENT_TYPES.FORMAT_APPLIED, listener, options);
  }
  
  onError(listener, options) {
    return this.on(this.constants.EVENT_TYPES.ERROR_OCCURRED, listener, options);
  }
  
  onPerformanceWarning(listener, options) {
    return this.on(this.constants.EVENT_TYPES.PERFORMANCE_WARNING, listener, options);
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EventBus;
}

if (typeof window !== 'undefined') {
  window.ConditionalFormattingV2 = window.ConditionalFormattingV2 || {};
  window.ConditionalFormattingV2.EventBus = EventBus;
}