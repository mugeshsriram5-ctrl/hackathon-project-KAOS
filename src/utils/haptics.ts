export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'quest' | 'xp' = 'light') {
  if (typeof window === 'undefined' || !navigator.vibrate) return;

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(15);
        break;
      case 'medium':
        navigator.vibrate(30);
        break;
      case 'heavy':
        navigator.vibrate(50);
        break;
      case 'success':
      case 'xp':
        navigator.vibrate([40, 60, 40]);
        break;
      case 'quest':
        navigator.vibrate([50, 80, 50, 80, 120]);
        break;
      default:
        navigator.vibrate(20);
        break;
    }
  } catch (err) {
    // Ignore vibration failures on unsupported devices/browsers
  }
}
