import React from "react";
import PropTypes from "prop-types";

export const Tooltip = ({ content, children }) => {
  return (
    <span className="relative group">
      {children}
      <span className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:inline-block bg-gray-800 text-white text-xs rounded py-1 px-2 z-10 whitespace-nowrap">
        {content}
      </span>
    </span>
  );
};

Tooltip.propTypes = {
  content: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default Tooltip;
