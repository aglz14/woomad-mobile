/**
 * Utility function to generate a boxShadow style from shadow parameters
 * This helps migrate from the deprecated shadow* properties to boxShadow
 */
export function createBoxShadow(
  offsetX = 0,
  offsetY = 2,
  blurRadius = 4,
  opacity = 0.1
) {
  return {
    boxShadow: `${offsetX}px ${offsetY}px ${blurRadius}px rgba(0, 0, 0, ${opacity})`,
    // Keep elevation for Android
    elevation: Math.ceil(blurRadius / 2),
  };
}
