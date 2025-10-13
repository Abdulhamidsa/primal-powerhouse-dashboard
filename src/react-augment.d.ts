import 'react';

// Augment the React module to ensure hooks are available
declare module 'react' {
  // Basic Hooks
  export function useState<S>(initialState: S | (() => S)): [S, React.Dispatch<React.SetStateAction<S>>];
  export function useEffect(effect: React.EffectCallback, deps?: React.DependencyList): void;
  export function useContext<T>(context: React.Context<T>): T;

  // Additional Hooks
  export function useReducer<R extends React.Reducer<any, any>, I>(
    reducer: R,
    initialArg: I,
    init?: (arg: I) => React.ReducerState<R>
  ): [React.ReducerState<R>, React.Dispatch<React.ReducerAction<R>>];

  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: React.DependencyList): T;
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
  export function useTransition(): [boolean, (callback: () => void) => void];
  export function useId(): string;
  export function useSyncExternalStore<Snapshot>(
    subscribe: (onStoreChange: () => void) => () => void,
    getSnapshot: () => Snapshot,
    getServerSnapshot?: () => Snapshot
  ): Snapshot;
  export function useInsertionEffect(effect: React.EffectCallback, deps?: React.DependencyList): void;

  // Augment React with forwardRef and other types
  export function forwardRef<T, P = {}>(
    render: (props: P, ref: React.Ref<T>) => React.ReactElement | null
  ): (props: P & { ref?: React.Ref<T> }) => React.ReactElement | null;

  export type ElementRef<C extends React.ElementType> =
    C extends React.ComponentType<any>
      ? InstanceType<C>
      : C extends keyof JSX.IntrinsicElements
        ? JSX.IntrinsicElements[C] extends React.DetailedHTMLProps<React.HTMLAttributes<infer E>, any>
          ? E
          : never
        : never;

  export type ComponentPropsWithoutRef<C extends React.ElementType> = React.PropsWithoutRef<React.ComponentProps<C>>;
}
