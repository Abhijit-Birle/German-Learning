export function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message || 'Copied!';
  toast.style.position = 'fixed';
  toast.style.bottom = '80px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = 'var(--ink)';
  toast.style.color = 'var(--app-bg)';
  toast.style.padding = '8px 16px';
  toast.style.borderRadius = '20px';
  toast.style.fontSize = '13px';
  toast.style.fontWeight = '700';
  toast.style.zIndex = '9999';
  toast.style.opacity = '0';
  toast.style.pointerEvents = 'none';
  toast.style.transition = 'opacity 0.2s ease';
  toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  
  document.body.appendChild(toast);
  
  // Trigger reflow
  toast.offsetHeight;
  toast.style.opacity = '1';
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 200);
  }, 1500);
}
