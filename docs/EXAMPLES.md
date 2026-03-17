# Examples

This document provides comprehensive examples of how to use the Aspectly framework in different scenarios.

## Table of Contents

- [Basic WebView Communication](#basic-webview-communication)
- [Web Iframe Communication](#web-iframe-communication)
- [Data Exchange Patterns](#data-exchange-patterns)
- [Error Handling Examples](#error-handling-examples)
- [Event Monitoring](#event-monitoring)
- [Real-world Use Cases](#real-world-use-cases)

## Basic WebView Communication

### React Native App with WebView

```tsx
import React, { useEffect, useState } from 'react';
import { View, Button, Text, StyleSheet } from 'react-native';
import { useAspectlyWebView } from '@aspectly/react-native';

function App() {
  const [messages, setMessages] = useState<string[]>([]);
  const [bridge, loaded, WebViewComponent] = useAspectlyWebView({
    url: 'https://your-web-app.com'
  });

  useEffect(() => {
    if (loaded) {
      bridge.init({
        // Handle user authentication
        authenticateUser: async (params) => {
          const { username, password } = params;
          // Simulate authentication
          if (username === 'admin' && password === 'password') {
            return { 
              success: true, 
              token: 'jwt-token-here',
              user: { id: 1, name: 'Admin User' }
            };
          }
          throw new Error('Invalid credentials');
        },

        // Handle navigation requests
        navigateTo: async (params) => {
          const { route, params: routeParams } = params;
          setMessages(prev => [...prev, `Navigate to: ${route}`]);
          return { success: true };
        },

        // Handle data requests
        getAppData: async (params) => {
          return {
            theme: 'dark',
            language: 'en',
            version: '1.0.0'
          };
        }
      });
    }
  }, [loaded, bridge]);

  const sendMessage = async () => {
    try {
      const result = await bridge.send('updateStatus', { 
        status: 'active',
        timestamp: Date.now()
      });
      setMessages(prev => [...prev, `Response: ${JSON.stringify(result)}`]);
    } catch (error) {
      setMessages(prev => [...prev, `Error: ${error.error_message}`]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>React Native App</Text>
        <Button title="Send Message" onPress={sendMessage} />
      </View>
      
      <View style={styles.messages}>
        {messages.map((msg, index) => (
          <Text key={index} style={styles.message}>{msg}</Text>
        ))}
      </View>
      
      <WebViewComponent style={styles.webview} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, backgroundColor: '#f0f0f0' },
  title: { fontSize: 18, fontWeight: 'bold' },
  messages: { flex: 1, padding: 10 },
  message: { marginBottom: 5, fontSize: 12 },
  webview: { flex: 2 }
});
```

### Web Application (Inside WebView)

```tsx
import React, { useEffect, useState } from 'react';
import { AspectlyBridge } from '@aspectly/core';

function WebApp() {
  const [user, setUser] = useState(null);
  const [appData, setAppData] = useState(null);
  const [messages, setMessages] = useState([]);

  const bridge = new AspectlyBridge();

  useEffect(() => {
    // Initialize bridge with handlers
    bridge.init({
      updateStatus: async (params) => {
        setMessages(prev => [...prev, `Status updated: ${params.status}`]);
        return { received: true, timestamp: Date.now() };
      },

      refreshData: async (params) => {
        // Simulate data refresh
        const newData = { lastUpdated: Date.now() };
        setAppData(newData);
        return newData;
      }
    });

    // Load initial data
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const data = await bridge.send('getAppData', {});
      setAppData(data);
    } catch (error) {
      console.error('Failed to load app data:', error);
    }
  };

  const authenticate = async () => {
    try {
      const result = await bridge.send('authenticateUser', {
        username: 'admin',
        password: 'password'
      });
      
      if (result.success) {
        setUser(result.user);
        setMessages(prev => [...prev, 'Authentication successful']);
      }
    } catch (error) {
      setMessages(prev => [...prev, `Auth failed: ${error.error_message}`]);
    }
  };

  const navigate = async () => {
    try {
      await bridge.send('navigateTo', {
        route: '/profile',
        params: { userId: user?.id }
      });
    } catch (error) {
      console.error('Navigation failed:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Web Application</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={authenticate}>Authenticate</button>
        <button onClick={navigate} disabled={!user}>Navigate to Profile</button>
      </div>

      {user && (
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#e0e0e0' }}>
          <h3>User: {user.name}</h3>
          <p>ID: {user.id}</p>
        </div>
      )}

      {appData && (
        <div style={{ marginBottom: '20px' }}>
          <h3>App Data</h3>
          <pre>{JSON.stringify(appData, null, 2)}</pre>
        </div>
      )}

      <div>
        <h3>Messages</h3>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: '5px' }}>{msg}</div>
        ))}
      </div>
    </div>
  );
}
```

## Web Iframe Communication

### Parent Window

```tsx
import React, { useEffect, useState } from 'react';
import { useAspectlyIframe } from '@aspectly/web';

function ParentApp() {
  const [notifications, setNotifications] = useState([]);
  const [bridge, loaded, IframeComponent] = useAspectlyIframe({
    url: 'https://your-iframe-content.com'
  });

  useEffect(() => {
    if (loaded) {
      bridge.init({
        showNotification: async (params) => {
          const notification = {
            id: Date.now(),
            message: params.message,
            type: params.type || 'info',
            timestamp: new Date().toISOString()
          };
          
          setNotifications(prev => [...prev, notification]);
          
          // Auto-remove after 5 seconds
          setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
          }, 5000);
          
          return { success: true, notificationId: notification.id };
        },

        updateParentData: async (params) => {
          // Handle data updates from iframe
          console.log('Data updated:', params);
          return { received: true };
        }
      });
    }
  }, [loaded, bridge]);

  const sendToIframe = async () => {
    try {
      const result = await bridge.send('updateContent', {
        title: 'New Title',
        content: 'Updated content from parent'
      });
      console.log('Iframe response:', result);
    } catch (error) {
      console.error('Failed to send to iframe:', error);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '20px', backgroundColor: '#f0f0f0' }}>
        <h1>Parent Application</h1>
        <button onClick={sendToIframe}>Send to Iframe</button>
      </header>

      <div style={{ position: 'relative', flex: 1 }}>
        <IframeComponent 
          style={{ width: '100%', height: '100%' }}
          onError={(error) => console.error('Iframe error:', error)}
        />
      </div>

      {/* Notification overlay */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000
      }}>
        {notifications.map(notification => (
          <div
            key={notification.id}
            style={{
              padding: '10px',
              marginBottom: '10px',
              backgroundColor: notification.type === 'error' ? '#ffebee' : '#e8f5e8',
              border: '1px solid #ccc',
              borderRadius: '4px',
              minWidth: '200px'
            }}
          >
            {notification.message}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Iframe Content

```tsx
import React, { useEffect, useState } from 'react';
import { AspectlyBridge } from '@aspectly/core';

function IframeContent() {
  const [content, setContent] = useState({ title: 'Default Title', content: 'Default content' });
  const [status, setStatus] = useState('idle');

  const bridge = new AspectlyBridge();

  useEffect(() => {
    bridge.init({
      updateContent: async (params) => {
        setContent(params);
        setStatus('updated');
        
        // Notify parent of successful update
        await bridge.send('updateParentData', {
          action: 'content_updated',
          timestamp: Date.now()
        });
        
        return { success: true };
      }
    });
  }, []);

  const showNotification = async () => {
    try {
      await bridge.send('showNotification', {
        message: 'Hello from iframe!',
        type: 'info'
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  };

  const showError = async () => {
    try {
      await bridge.send('showNotification', {
        message: 'This is an error message',
        type: 'error'
      });
    } catch (error) {
      console.error('Failed to show error:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>{content.title}</h1>
      <p>{content.content}</p>
      <p>Status: {status}</p>
      
      <div style={{ marginTop: '20px' }}>
        <button onClick={showNotification} style={{ marginRight: '10px' }}>
          Show Notification
        </button>
        <button onClick={showError}>
          Show Error
        </button>
      </div>
    </div>
  );
}
```

## Data Exchange Patterns

### File Upload from WebView to React Native

```tsx
// React Native side
bridge.init({
  uploadFile: async (params) => {
    const { fileName, fileData, fileType } = params;
    
    // Convert base64 to file
    const file = new File([fileData], fileName, { type: fileType });
    
    // Upload to server
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    return { success: true, fileUrl: result.url };
  }
});
```

```tsx
// Web side
const uploadFile = async (file) => {
  const reader = new FileReader();
  
  reader.onload = async () => {
    try {
      const result = await bridge.send('uploadFile', {
        fileName: file.name,
        fileData: reader.result,
        fileType: file.type
      });
      
      console.log('File uploaded:', result.fileUrl);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };
  
  reader.readAsDataURL(file);
};
```

### Bi-directional Data Synchronization

```tsx
// React Native side
const [syncData, setSyncData] = useState({});

bridge.init({
  syncData: async (params) => {
    // Update local data
    setSyncData(prev => ({ ...prev, ...params }));
    
    // Return current state
    return syncData;
  }
});

// Send data to webview
const sendSyncData = async () => {
  await bridge.send('updateSyncData', syncData);
};
```

```tsx
// Web side
const [syncData, setSyncData] = useState({});

bridge.init({
  updateSyncData: async (params) => {
    setSyncData(prev => ({ ...prev, ...params }));
    return { received: true };
  }
});

// Send data to React Native
const sendSyncData = async () => {
  const result = await bridge.send('syncData', syncData);
  setSyncData(result);
};
```

## Error Handling Examples

### Comprehensive Error Handling

```tsx
const handleBridgeCommunication = async () => {
  try {
    // Check if bridge is available
    if (!bridge.isAvailable()) {
      throw new Error('Bridge not available');
    }

    // Check if method is supported
    if (!bridge.supports('methodName')) {
      throw new Error('Method not supported');
    }

    // Send message with timeout handling
    const result = await Promise.race([
      bridge.send('methodName', { param: 'value' }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Custom timeout')), 5000)
      )
    ]);

    return result;
  } catch (error) {
    if (error.error_type) {
      // Bridge-specific error
      switch (error.error_type) {
        case 'UNSUPPORTED_METHOD':
          console.error('Method not supported on the other side');
          break;
        case 'METHOD_EXECUTION_TIMEOUT':
          console.error('Method execution timed out');
          break;
        case 'BRIDGE_NOT_AVAILABLE':
          console.error('Bridge is not ready');
          break;
        case 'REJECTED':
          console.error('Handler rejected:', error.error_message);
          break;
        default:
          console.error('Unknown bridge error:', error);
      }
    } else {
      // Custom or network error
      console.error('Communication error:', error.message);
    }
    
    throw error;
  }
};
```

### Retry Logic

```tsx
const sendWithRetry = async (method, params, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await bridge.send(method, params);
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};
```

## Event Monitoring

### Bridge Event Logger

```tsx
const useBridgeLogger = (bridge) => {
  useEffect(() => {
    const listener = (event) => {
      console.log('Bridge Event:', {
        timestamp: new Date().toISOString(),
        type: event.type,
        method: event.method,
        requestId: event.request_id,
        data: event.data
      });
    };

    const subscriptionId = bridge.subscribe(listener);
    
    return () => {
      bridge.unsubscribe(listener);
    };
  }, [bridge]);
};
```

### Performance Monitoring

```tsx
const useBridgePerformance = (bridge) => {
  const [metrics, setMetrics] = useState({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0
  });

  useEffect(() => {
    const startTimes = new Map();
    
    const originalSend = bridge.send;
    bridge.send = async (method, params) => {
      const startTime = Date.now();
      const requestId = `${method}_${startTime}`;
      startTimes.set(requestId, startTime);
      
      setMetrics(prev => ({ ...prev, totalRequests: prev.totalRequests + 1 }));
      
      try {
        const result = await originalSend.call(bridge, method, params);
        const responseTime = Date.now() - startTime;
        
        setMetrics(prev => ({
          ...prev,
          successfulRequests: prev.successfulRequests + 1,
          averageResponseTime: (prev.averageResponseTime + responseTime) / 2
        }));
        
        return result;
      } catch (error) {
        setMetrics(prev => ({ ...prev, failedRequests: prev.failedRequests + 1 }));
        throw error;
      } finally {
        startTimes.delete(requestId);
      }
    };
  }, [bridge]);

  return metrics;
};
```

## Real-world Use Cases

### E-commerce App with Web Checkout

```tsx
// React Native App
bridge.init({
  getPaymentMethods: async () => {
    return [
      { id: 'card', name: 'Credit Card', icon: '💳' },
      { id: 'paypal', name: 'PayPal', icon: '🅿️' },
      { id: 'apple_pay', name: 'Apple Pay', icon: '🍎' }
    ];
  },
  
  processPayment: async (params) => {
    const { method, amount, currency } = params;
    
    // Process payment with native payment SDK
    const result = await processNativePayment(method, amount, currency);
    
    return {
      success: result.success,
      transactionId: result.transactionId,
      receipt: result.receipt
    };
  },
  
  getShippingAddresses: async () => {
    return await getStoredAddresses();
  }
});
```

### Analytics Dashboard with Real-time Updates

```tsx
// Web Dashboard
bridge.init({
  getAnalyticsData: async (params) => {
    const { dateRange, metrics } = params;
    return await fetchAnalyticsData(dateRange, metrics);
  }
});

// Send real-time updates to React Native
const sendAnalyticsUpdate = async (data) => {
  await bridge.send('updateAnalytics', {
    timestamp: Date.now(),
    data: data
  });
};
```

### Document Viewer with Native Features

```tsx
// React Native App
bridge.init({
  saveDocument: async (params) => {
    const { content, fileName } = params;
    return await saveToDevice(content, fileName);
  },
  
  shareDocument: async (params) => {
    const { content, fileName } = params;
    return await shareNative(content, fileName);
  },
  
  printDocument: async (params) => {
    const { content } = params;
    return await printNative(content);
  }
});
```

### Dynamic Handler Registration

Handlers can be added or removed after initialization using `registerHandler()` and `unregisterHandler()`:

```tsx
const bridge = new AspectlyBridge();

// Initialize with initial handlers
await bridge.init({
  getStatus: async () => ({ online: true })
});

// Later, add new handlers dynamically
bridge.registerHandler('fetchProfile', async (params) => {
  return { name: 'Jane', id: params.userId };
});

// Remove a handler when no longer needed
bridge.unregisterHandler('fetchProfile');
```

These examples demonstrate the flexibility and power of the Aspectly framework for building sophisticated cross-platform applications with seamless communication between native and web components.
