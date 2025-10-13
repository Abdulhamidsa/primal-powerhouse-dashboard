declare module 'react/hooks' {
  // Basic Hooks
  export function useState<T>(initialState: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>];
  export function useEffect(effect: React.EffectCallback, deps?: React.DependencyList): void;
  export function useContext<T>(context: React.Context<T>): T;

  // Additional Hooks
  export function useReducer<R extends React.Reducer<any, any>, I>(
    reducer: R,
    initialArg: I,
    init?: (arg: I) => React.ReducerState<R>
  ): [React.ReducerState<R>, React.Dispatch<React.ReducerAction<R>>];

  export function useCallback<T extends Function>(callback: T, deps: React.DependencyList): T;
  export function useMemo<T>(factory: () => T, deps: React.DependencyList | undefined): T;
  export function useRef<T>(initialValue: T): React.MutableRefObject<T>;
  export function useImperativeHandle<T, R extends T>(
    ref: React.Ref<T> | undefined,
    init: () => R,
    deps?: React.DependencyList
  ): void;
  export function useLayoutEffect(effect: React.EffectCallback, deps?: React.DependencyList): void;
  export function useDebugValue<T>(value: T, format?: (value: T) => any): void;
  export function useDeferredValue<T>(value: T): T;
  export function useTransition(): [boolean, React.TransitionStartFunction];
  export function useId(): string;
  export function useSyncExternalStore<Snapshot>(
    subscribe: (onStoreChange: () => void) => () => void,
    getSnapshot: () => Snapshot,
    getServerSnapshot?: () => Snapshot
  ): Snapshot;
  export function useInsertionEffect(effect: React.EffectCallback, deps?: React.DependencyList): void;
}
