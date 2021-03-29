import {EventEmitter, Subscription} from "./event";
import {memoize} from "./memoize";
import {PropertyPath} from "./validation";

type Decorator<X> = <T>(stateManager: StateManager<T, any>) => StateManager<T, X>;

export type StateManagerProducer<T, X = {}> = () => StateManager<T, X>

export type StateManagerProxy<T, X = {}> = T extends undefined ? undefined : T extends Array<any> ? ArrayStateManagerProxy<T[0], X> : T extends object ? ObjectStateManagerProxy<T, keyof T, X> : StateManagerProducer<T, X>

export type ArrayStateManagerProxy<V, X> = {
    [idx: number]: StateManagerProxy<V, X>
    map<R>(consumer: (stateManager: StateManagerProxy<V, X>, idx: number) => R): R[]
    filter(predicate: (value: V, idx: number) => boolean): ReadonlyArray<StateManagerProxy<V, X>>
    push(value: V): void
    pop(): void
    slice(startIdx: number, endIdx?: number): ReadonlyArray<StateManagerProxy<V, X>>
    splice(startIdx: number, length: number, ...insert: V[]): void

} & StateManagerProducer<V[], X>

export type ObjectStateManagerProxy<T, K extends keyof T = keyof T, X = {}> = {
    [P in K]: StateManagerProxy<T[P], X>
} & StateManagerProducer<T, X>;

export type StateManager<T, X = {}> = T extends Array<any> ? ArrayStateManager<T, X> : T extends object ? ObjectStateManager<T, X> : BaseStateManager<T, X>;

export type BaseStateManager<T, X = {}> = {
    get(): T
    set(t: T): void
    transform<V>(t: Transformer<T, V>): StateManager<V, X>
    proxy(): StateManagerProxy<T, X>
    subscribe(handler: (newValue: T, oldValue: T) => void): Subscription
    path(): PropertyPath
} & X

export type ObjectStateManager<T, X> = BaseStateManager<T, X> & {
    atKey<K extends keyof T>(key: K): StateManager<T[K], X>
}

export type ArrayStateManager<T extends Array<any>, X> = BaseStateManager<T, X> & {
    map<R>(cb: (mgr: StateManager<T[0], X>) => R): R[]
    atIndex(idx: number): StateManager<T[0], X>
    replace(idx: number, value: T): void
    filter(predicate: (value: T[0], idx: number) => boolean): StateManager<T[0], X>[]
    push(value: T[0]): void
    pop(): void
    slice(startIdx: number, endIdx?: number): ReadonlyArray<StateManager<T[0], X>>
    splice(startIdx: number, length: number, ...insert: T): void
}

export interface Transformer<S, V> {
    toView(source: S): V

    fromView(view: V): S
}

export function NumberTransformer(): Transformer<number, string> {
    return {
        toView(source: number): string {
            return source?.toString();
        },
        fromView(view: string): number {
            return parseInt(view);
        }
    };
}

export function Scale(factor: number): Transformer<number, number> {
    return {
        toView(source: number): number {
            return source / factor;
        },
        fromView(source: number): number {
            return source * factor;
        }
    };
}

export function createStateManager<V, X>(state: V[], onChange: (newState: V[]) => void, name?: string, decorator?: Decorator<X>): ArrayStateManager<V[], X>
export function createStateManager<T, X>(state: T, onChange: (newState: T) => void, name?: string, decorator?: Decorator<X>): ObjectStateManager<T, X>
export function createStateManager<V, T extends object | Array<V>, X>(state: T, onChange: (newState: T) => void, name: string = "", decorator: Decorator<X> = t=>t): any {
    const emitter = new EventEmitter<[T, T]>();
    let stateManager;
    if (Array.isArray(state)) {
        const arrState = state as V[] & T;
        const m = memoize();
        stateManager = {
            get(): T {
                return state;
            },
            atIndex(idx: number): StateManager<V, X> {
                return m(idx, () => createStateManager(state[idx], v => this.replace(idx, v), `${name}[${idx}]`, decorator)) as StateManager<V, X>;
            },
            set(newValue: T) {
                emitter.emit(newValue, state);
                onChange(newValue);
            },
            subscribe(handler: (newValue: T, oldValue: T) => void) : Subscription {
                return emitter.subscribe(handler);
            },
            transform<V>(t: Transformer<T, V>): StateManager<V, X> {
                return createStateManager(t.toView(state), (v) => onChange(t.fromView(v)), name, decorator) as StateManager<V, X>;
            },
            proxy() {
                const base = () => this;
                Object.assign(base, {
                    map: <R>(cb: (m: StateManagerProxy<V, X>, idx: number) => R) => {
                        return this.map((m: StateManager<V, X>, idx: number) => cb(m.proxy(), idx));
                    },
                    filter: (predicate: (m: V, idx: number) => boolean): StateManagerProxy<V, X>[] => {
                        return this.filter(predicate).map((m: StateManager<V>) => m.proxy());
                    },
                    push: (v: V) => this.push(v),
                    pop: () => this.pop(),
                    slice: (startIdx: number, endIndex?: number) => this.slice(startIdx, endIndex).map((m: StateManager<V, X>) => m.proxy()),
                    splice: (startIdx: number, count: number, ...newValues: V[]) => this.splice(startIdx, count, ...newValues)
                });
                return new Proxy(base, {
                        get: (target: any, prop) => {
                            if (!isNaN(prop as number)) {
                                return this.atIndex((prop as number) * 1).proxy();
                            } else {
                                return target[prop];
                            }
                        }
                    }
                );
            },
            replace(index: number, value: V) {
                const newArray = [...arrState.slice(0, index), value, ...arrState.slice(index + 1)];
                this.set(newArray as T);
            },
            map<R>(cb: (mgr: StateManager<V>, idx: number) => R): R[] {
                return arrState.map((v, idx) => {
                    let mgr = createStateManager(v, (newV) => this.replace(idx, newV), `${name}[${idx}]`, decorator) as StateManager<V, X>;
                    return cb(mgr, idx);
                });
            },
            filter(predicate: (v: V, idx: number) => boolean): StateManager<V>[] {
                return this.map((m: StateManager<V, X>) => m).filter((m: StateManager<V, X>, idx: number) => predicate(m.get(), idx));
            },
            push(v: V) {
                this.set([...state as V[], v as V] as T);
            },
            pop() {
                this.set([...state.slice(0, state.length - 1)] as T);
            },
            slice(startIdx: number, endIndex?: number) {
                return this.map((m: StateManager<V, X>) => m).slice(startIdx, endIndex);
            },
            splice(startIdx: number, count: number, ...insert: V[]) {
                this.set([...arrState.slice(0, startIdx), ...insert, ...arrState.slice(startIdx + count)] as T);
            },
            path() {
                return name;
            }
        };
    } else {
        const m = memoize();
        stateManager = {
            get(): T {
                return state;
            },
            set(newValue: T) {
                emitter.emit(newValue, state);
                onChange(newValue);
            },
            subscribe(handler: (newValue: T, oldValue: T) => void) : Subscription {
                return emitter.subscribe(handler);
            },
            atKey<K extends keyof T>(key: K): StateManager<T[K]> {
                return m(key, () => createStateManager(state[key], (newState) => this.set({...state, [key]: newState}), `${name}.${key}`, decorator)) as StateManager<T[K]>;
            },
            transform<V>(t: Transformer<T, V>): StateManager<V, X> {
                return createStateManager(t.toView(state), (v) => onChange(t.fromView(v)), name, decorator) as StateManager<V, X>;
            },
            proxy() {
                const mgr = this;
                return new Proxy(() => this, {
                    get<P extends keyof T>(target: () => StateManager<T>, p: P): T[P] {
                        return mgr.atKey(p).proxy();
                    }
                }) as StateManagerProxy<T, X>;
            },
            path() {
                return name;
            }
        };
    }

    return decorator(stateManager);
}
