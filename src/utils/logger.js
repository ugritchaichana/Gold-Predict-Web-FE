/**
 * Logger utility for conditional logging based on environment
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  error: (...args) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  
  table: (...args) => {
    if (isDevelopment) {
      console.table(...args);
    }
  },
  
  group: (label) => {
    if (isDevelopment) {
      console.group(label);
    }
  },
  
  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  }
};

export default logger;
