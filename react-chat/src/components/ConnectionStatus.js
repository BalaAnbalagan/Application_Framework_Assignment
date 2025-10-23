/**
 * CONNECTION STATUS COMPONENT (View)
 *
 * Shows current connection state.
 *
 * REACT MAGIC: When isConnected prop changes, React automatically
 * re-renders this component with the new state!
 */

import React from 'react';

function ConnectionStatus({ isConnected }) {
  return (
    <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
      {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  );
}

export default ConnectionStatus;
