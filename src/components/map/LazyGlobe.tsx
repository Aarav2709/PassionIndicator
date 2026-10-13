import { Component, Suspense, lazy } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import type GlobeComponent from './Globe3D';
import { markWebGLBroken } from '@/lib/webgl';

// the 3d engine and its land data load on first use so the app itself opens fast
const Globe = lazy(() => import('./Globe3D'));

// if the 3d globe cannot start, show the flat map instead of breaking the whole screen
class GlobeBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('3d globe failed, using the flat map', error);
    markWebGLBroken();
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

type LazyGlobeProps = ComponentProps<typeof GlobeComponent> & { fallback: ReactNode };

const LazyGlobe = ({ fallback, ...props }: LazyGlobeProps) => (
  <GlobeBoundary fallback={fallback}>
    <Suspense fallback={null}>
      <Globe {...props} />
    </Suspense>
  </GlobeBoundary>
);

export default LazyGlobe;
