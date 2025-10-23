"use client";

import React, { useState, useEffect } from 'react';
import ProxyConfigurator from './components/ProxyConfigurator';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';

export default function Popup() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Ensure DOM is ready
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-[400px] min-w-[350px] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[400px] min-w-[350px] bg-background">
      <Card className="w-full h-full flex flex-col">
        <CardHeader className="flex flex-col space-y-1.5">
          <CardTitle className="text-2xl font-bold tracking-tight text-center">
            🔌 Proxy Configurator
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ProxyConfigurator />
        </CardContent>
      </Card>
    </div>
  );
}
