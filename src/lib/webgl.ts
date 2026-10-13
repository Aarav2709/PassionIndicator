let supported: boolean | null = null;

// three.js needs webgl2, which is missing when graphics acceleration is turned off or the gpu is blocked
export function supportsWebGL(): boolean {
  if (supported !== null) return supported;
  try {
    supported = !!document.createElement('canvas').getContext('webgl2');
  } catch {
    supported = false;
  }
  return supported;
}

// called when the 3d globe fails to start so every view falls back to the flat map
export function markWebGLBroken(): void {
  supported = false;
}

const isFirefox = typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent);

// firefox and chromium browsers fix this in different places
export const WEBGL_HELP = isFirefox
  ? 'Firefox could not start 3D graphics on this computer. Open about:config, set webgl.disable-angle to true and restart Firefox. If that does not help, set it back and set webgl.angle.force-warp to true instead.'
  : 'The 3D globe needs graphics acceleration. Turn on "Use graphics acceleration when available" in your browser settings, restart the browser and reload.';
