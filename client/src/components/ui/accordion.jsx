import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const Accordion = ({ children, ...props }) => {
  return (
    <div className="accordion" {...props}>
      {children}
    </div>
  );
};

const AccordionItem = ({ children, className, ...props }) => {
  return (
    <div className={`accordion-item ${className || ""}`} {...props}>
      {children}
    </div>
  );
};

const AccordionTrigger = ({ children, className, onClick, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    setIsOpen(!isOpen);
    if (onClick) onClick();
  };

  return (
    <button
      className={`accordion-trigger ${isOpen ? "open" : ""} ${className || ""}`}
      onClick={handleClick}
      {...props}
    >
      <span className="accordion-trigger-content">{children}</span>
      <ChevronDown className={`accordion-icon ${isOpen ? "rotate" : ""}`} />
    </button>
  );
};

const AccordionContent = ({ children, className, ...props }) => {
  return (
    <div className="accordion-content-wrapper" {...props}>
      <div className={`accordion-content ${className || ""}`}>{children}</div>
    </div>
  );
};

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
