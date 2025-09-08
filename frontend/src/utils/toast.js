// Simple toast utility for Chakra UI v3 compatibility
export const createToast = (options) => {
  const { title, description, status = "info", duration = 5000 } = options;

  // Create a simple toast notification
  const toastElement = document.createElement("div");
  toastElement.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${
      status === "error"
        ? "#f56565"
        : status === "success"
        ? "#48bb78"
        : status === "warning"
        ? "#ed8936"
        : "#4299e1"
    };
    color: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    max-width: 400px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  toastElement.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
    ${
      description
        ? `<div style="font-size: 14px; opacity: 0.9;">${description}</div>`
        : ""
    }
  `;

  document.body.appendChild(toastElement);

  // Auto remove after duration
  setTimeout(() => {
    if (toastElement.parentNode) {
      toastElement.parentNode.removeChild(toastElement);
    }
  }, duration);

  return {
    close: () => {
      if (toastElement.parentNode) {
        toastElement.parentNode.removeChild(toastElement);
      }
    },
  };
};

// Hook-like function for compatibility
export const useToast = () => {
  return {
    create: createToast,
    success: (options) => createToast({ ...options, status: "success" }),
    error: (options) => createToast({ ...options, status: "error" }),
    warning: (options) => createToast({ ...options, status: "warning" }),
    info: (options) => createToast({ ...options, status: "info" }),
  };
};
