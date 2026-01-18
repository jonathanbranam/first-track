/**
 * QuickLogContext - Provides global access to the quick-log modal
 * Allows any screen to trigger the behavior quick-log interface
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { QuickLogModal } from '@/components/behaviors/quick-log-modal';

interface QuickLogContextType {
  showQuickLog: () => void;
  hideQuickLog: () => void;
  isVisible: boolean;
}

const QuickLogContext = createContext<QuickLogContextType | undefined>(undefined);

export function QuickLogProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  const showQuickLog = () => setIsVisible(true);
  const hideQuickLog = () => setIsVisible(false);

  return (
    <QuickLogContext.Provider value={{ showQuickLog, hideQuickLog, isVisible }}>
      {children}
      <QuickLogModal visible={isVisible} onClose={hideQuickLog} />
    </QuickLogContext.Provider>
  );
}

export function useQuickLog() {
  const context = useContext(QuickLogContext);
  if (!context) {
    throw new Error('useQuickLog must be used within a QuickLogProvider');
  }
  return context;
}
