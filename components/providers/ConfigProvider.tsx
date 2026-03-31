"use client";

import React, { createContext, useContext, ReactNode } from "react";

type ConfigContextType = Record<string, string | null>;

const ConfigContext = createContext<ConfigContextType>({});

export function ConfigProvider({
  configs,
  children,
}: {
  configs: ConfigContextType;
  children: ReactNode;
}) {
  return (
    <ConfigContext.Provider value={configs}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  
  return {
    configs: context,
    get: (key: string, defaultValue?: string) => {
      const value = context[key];
      if (value === undefined || value === null) {
        return defaultValue || "";
      }
      return value;
    }
  };
}
