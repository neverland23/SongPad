import React from 'react';

function Loader({ label = 'Loading...' }) {
  return <div className="text-slate-300 small">{label}</div>;
}

export default Loader;
