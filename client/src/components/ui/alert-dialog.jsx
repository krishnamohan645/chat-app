import React, { useState } from "react";

const AlertDialog = ({ open, onOpenChange, children }) => {
  return (
    <div className={`alert-dialog ${open ? "open" : ""}`}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { open, onOpenChange })
      )}
    </div>
  );
};

const AlertDialogTrigger = ({ children, onClick }) => {
  return React.cloneElement(children, { onClick });
};

const AlertDialogOverlay = ({ open, onOpenChange }) => {
  if (!open) return null;

  return (
    <div className="alert-dialog-overlay" onClick={() => onOpenChange(false)} />
  );
};

const AlertDialogContent = ({ children, open, onOpenChange }) => {
  if (!open) return null;

  return (
    <div className="alert-dialog-content">
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { open, onOpenChange })
      )}
    </div>
  );
};

const AlertDialogHeader = ({ children, className }) => (
  <div className={`alert-dialog-header ${className || ""}`}>{children}</div>
);

const AlertDialogFooter = ({ children, className }) => (
  <div className={`alert-dialog-footer ${className || ""}`}>{children}</div>
);

const AlertDialogTitle = ({ children, className }) => (
  <h2 className={`alert-dialog-title ${className || ""}`}>{children}</h2>
);

const AlertDialogDescription = ({ children, className }) => (
  <p className={`alert-dialog-description ${className || ""}`}>{children}</p>
);

const AlertDialogAction = ({ children, onClick, className }) => (
  <button
    className={`alert-dialog-action ${className || ""}`}
    onClick={onClick}
  >
    {children}
  </button>
);

const AlertDialogCancel = ({ children, onClick, className }) => (
  <button
    className={`alert-dialog-cancel ${className || ""}`}
    onClick={onClick}
  >
    {children}
  </button>
);

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
