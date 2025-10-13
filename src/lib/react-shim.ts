// This file provides React hook exports for React 18
// It allows components to import hooks consistently

// Import React for direct re-export
import * as React from 'react';

// Re-export hooks directly from React
// In React 18, hooks are available directly from the 'react' package
export const useState = React.useState;
export const useEffect = React.useEffect;
export const useContext = React.useContext;
export const useReducer = React.useReducer;
export const useCallback = React.useCallback;
export const useMemo = React.useMemo;
export const useRef = React.useRef;
export const useImperativeHandle = React.useImperativeHandle;
export const useLayoutEffect = React.useLayoutEffect;
export const useDebugValue = React.useDebugValue;
export const useDeferredValue = React.useDeferredValue;
export const useTransition = React.useTransition;
export const useId = React.useId;
export const useSyncExternalStore = React.useSyncExternalStore;
export const useInsertionEffect = React.useInsertionEffect;
