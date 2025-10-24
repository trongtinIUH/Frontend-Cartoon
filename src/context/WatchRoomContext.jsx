/**
 * WatchRoomContext - Global state for Watch Together
 * @author Senior FE Developer
 * @version 1.0
 */

import React, { createContext, useContext } from 'react';

const WatchRoomContext = createContext(null);

/**
 * Provider component
 */
export function WatchRoomProvider({ children, value }) {
  return (
    <WatchRoomContext.Provider value={value}>
      {children}
    </WatchRoomContext.Provider>
  );
}

/**
 * Hook to access watch room context
 */
export function useWatchRoomContext() {
  const context = useContext(WatchRoomContext);
  
  if (!context) {
    throw new Error(
      'useWatchRoomContext must be used within WatchRoomProvider'
    );
  }
  
  return context;
}

export default WatchRoomContext;
