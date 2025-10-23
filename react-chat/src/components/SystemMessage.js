/**
 * SYSTEM MESSAGE COMPONENT (View)
 *
 * Another reusable component!
 * Notice how clean and simple it is.
 */

import React from 'react';

function SystemMessage({ text }) {
  return (
    <div className="system-message">
      {text}
    </div>
  );
}

export default SystemMessage;
