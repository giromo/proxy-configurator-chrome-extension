import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Info, CircleCheck, CircleX, CircleDot, RefreshCw } from '../icons';

type ProxyType = "SOCKS4" | "SOCKS5";
type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface ProxySettings {
  host: string;
  port: string;
  username: string;
  password: string;
  type: ProxyType;
}

export default function ProxyConfigurator() {
  const [settings, setSettings] = useState<ProxySettings>({
    host: "",
    port: "",
    username: "",
    password: "",
    type: "SOCKS5",
  });
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved settings on mount
  useEffect(() => {
    loadSavedSettings();
    getCurrentStatus();
  }, []);

  // Auto-clear messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
    if (savedMessage) {
      const timer = setTimeout(() => setSavedMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error, savedMessage]);

  const loadSavedSettings = () => {
    chrome.storage.local.get(['proxyConfig'], (result) => {
      if (result.proxyConfig) {
        setSettings(result.proxyConfig);
      }
    });
  };

  const getCurrentStatus = () => {
    chrome.storage.local.get(['proxyStatus'], (result) => {
      const proxyStatus = result.proxyStatus || 'disconnected';
      setStatus(proxyStatus as ConnectionStatus);
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleTypeChange = (value: ProxyType) => {
    setSettings((prev) => ({ ...prev, type: value }));
    if (error) setError(null);
  };

  const validateInputs = (): boolean => {
    if (!settings.host.trim()) {
      setError("Host is required");
      return false;
    }

    // Basic host validation
    const hostRegex = /^(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\d{1,3}\.){3}\d{1,3})$/;
    if (!hostRegex.test(settings.host.trim())) {
      setError("Invalid host format (use domain or IP address)");
      return false;
    }

    if (!settings.port.trim()) {
      setError("Port is required");
      return false;
    }

    const portNum = parseInt(settings.port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      setError("Port must be a number between 1 and 65535");
      return false;
    }

    setError(null);
    return true;
  };

  const sendMessageToBackground = (action: string, data?: any) => {
    return new Promise<any>((resolve) => {
      chrome.runtime.sendMessage({ action, ...data }, resolve);
    });
  };

  const handleConnect = async () => {
    if (!validateInputs()) return;

    setIsConnecting(true);
    setError(null);
    setStatus("connecting");

    try {
      const response = await sendMessageToBackground('connectProxy', { config: settings });
      
      if (response.success) {
        setStatus("connected");
        handleSave(); // Auto-save on successful connection
      } else {
        setStatus("error");
        setError(response.error || "Failed to connect to proxy server");
      }
    } catch (err) {
      setStatus("error");
      setError(err?.message || "Connection failed");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsConnecting(true);
    setStatus("connecting");

    try {
      const response = await sendMessageToBackground('disconnectProxy');
      
      if (response.success) {
        setStatus("disconnected");
      } else {
        setStatus("error");
        setError(response.error || "Failed to disconnect");
      }
    } catch (err) {
      setStatus("error");
      setError(err?.message || "Disconnection failed");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSave = async () => {
    if (!validateInputs()) return;

    setIsSaving(true);
    try {
      chrome.storage.local.set({ proxyConfig: settings }, () => {
        setSavedMessage("Settings saved successfully!");
        setIsSaving(false);
      });
    } catch (err) {
      setError("Failed to save settings");
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const resetSettings: ProxySettings = {
      host: "",
      port: "",
      username: "",
      password: "",
      type: "SOCKS5",
    };
    
    setSettings(resetSettings);
    setStatus("disconnected");
    setError(null);
    
    // Clear stored settings
    chrome.storage.local.set({ 
      proxyConfig: null,
      proxyStatus: "disconnected"
    });
    
    setSavedMessage("Settings have been reset");
  };

  const getStatusIcon = () => {
    switch (status) {
      case "connected":
        return <CircleCheck className="h-4 w-4 text-green-500" />;
      case "connecting":
        return <CircleDot className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case "error":
        return <CircleX className="h-4 w-4 text-red-500" />;
      default:
        return <CircleX className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "error":
        return "Connection Error";
      default:
        return "Disconnected";
    }
  };

  const getConnectButtonText = () => {
    if (isConnecting) return "Connecting...";
    return status === "connected" ? "Reconnect" : "Connect";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Proxy Type */}
      <div className="space-y-2">
        <Label htmlFor="type">Proxy Type</Label>
        <Select
          value={settings.type}
          onValueChange={(value: ProxyType) => handleTypeChange(value)}
          disabled={isConnecting}
        >
          <SelectTrigger id="type">
            <SelectValue placeholder="Select proxy type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SOCKS4">SOCKS4</SelectItem>
            <SelectItem value="SOCKS5">SOCKS5</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Host */}
      <div className="space-y-2">
        <Label htmlFor="host">Host <span className="text-red-500">*</span></Label>
        <Input
          id="host"
          name="host"
          placeholder="proxy.example.com or 192.168.1.1"
          value={settings.host}
          onChange={handleChange}
          disabled={isConnecting}
          className={error?.includes('host') ? 'border-red-500' : ''}
        />
      </div>

      {/* Port */}
      <div className="space-y-2">
        <Label htmlFor="port">Port <span className="text-red-500">*</span></Label>
        <Input
          id="port"
          name="port"
          type="number"
          placeholder="1080"
          value={settings.port}
          onChange={handleChange}
          min={1}
          max={65535}
          disabled={isConnecting}
          className={error?.includes('port') ? 'border-red-500' : ''}
        />
      </div>

      {/* Username */}
      <div className="space-y-2">
        <Label htmlFor="username">Username (Optional)</Label>
        <Input
          id="username"
          name="username"
          placeholder="username"
          value={settings.username}
          onChange={handleChange}
          disabled={isConnecting}
        />
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">Password (Optional)</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="password"
          value={settings.password}
          onChange={handleChange}
          disabled={isConnecting}
        />
        {settings.password && (
          <p className="text-xs text-yellow-600 flex items-center gap-1">
            <Info className="h-3 w-3" />
            Passwords are stored encrypted in Chrome storage
          </p>
        )}
      </div>

      {/* Status Indicator */}
      <div className="flex items-center justify-between p-3 bg-muted rounded-md">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium capitalize">{getStatusText()}</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={getCurrentStatus}
          disabled={isConnecting}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="border-red-200">
          <CircleX className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {savedMessage && (
        <Alert className="border-green-200">
          <CircleCheck className="h-4 w-4" />
          <AlertDescription>{savedMessage}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <CardFooter className="p-0 pt-4 border-t flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={isConnecting || isSaving}
          className="flex-1"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isConnecting || isSaving || !validateInputs()}
            className="flex-1 sm:flex-none"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="outline"
            onClick={handleDisconnect}
            disabled={status !== "connected" || isConnecting}
            className="flex-1 sm:flex-none"
          >
            Disconnect
          </Button>
          <Button
            onClick={handleConnect}
            disabled={isConnecting || status === "connecting"}
            className="flex-1 sm:flex-none bg-primary hover:bg-primary/90"
          >
            {getConnectButtonText()}
          </Button>
        </div>
      </CardFooter>

      {/* Info Section */}
      <div className="text-xs text-center text-muted-foreground pt-4 border-t">
        <p>⚠️ Only use trusted proxy servers. Your traffic will be routed through the proxy.</p>
        <p className="mt-1">Support: SOCKS4 & SOCKS5 • Authentication: Optional</p>
      </div>
    </div>
  );
}
