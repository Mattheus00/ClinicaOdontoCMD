import { Component, type ErrorInfo, type ReactNode } from 'react';

export class ModelErrorBoundary extends Component<{
  children: ReactNode;
  fallback: ReactNode;
  onError: () => void;
}, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('Odontograma 3D indisponível:', error.message, info.componentStack);
    this.props.onError();
  }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
