import React from 'react';

function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className="alert alert-danger py-2 px-3 my-2 small" role="alert">
      {message}
    </div>
  );
}

export default ErrorMessage;
