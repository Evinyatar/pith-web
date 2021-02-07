import {ChangeEvent, memo} from "react";
import {EventEmitter, Subscription} from "./event";
import {memoize} from "./memoize";

export type StateManagerProducer<T> = () => StateManager<T>

export type StateManagerProxy<T> = T extends undefined ? undefined : T extends Array<any> ? ArrayStateManagerProxy<T[0]> : T extends object ? ObjectStateManagerProxy<T> : StateManagerProducer<T>

export type ArrayStateManagerProxy<V> = {
    [idx: number]: StateManagerProxy<V>
    map<R>(consumer: (stateManager: StateManagerProxy<V>, idx: number) => R): R[]
    filter(predicate: (value: V, idx: number) => boolean): ReadonlyArray<StateManagerProxy<V>>
    push(value: V): void
    pop(): void
    slice(startIdx: number, endIdx?: number): ReadonlyArray<StateManagerProxy<V>>
    splice(startIdx: number, length: number, ...insert: V[]): void

} & StateManagerProducer<V[]>

export type ObjectStateManagerProxy<T, K extends keyof T = keyof T> = {
    [P in K]: StateManagerProxy<T[P]>
} & StateManagerProducer<T>;

export type StateManager<T> = T extends Array<any> ? ArrayStateManager<T> : T extends object ? ObjectStateManager<T> : BaseStateManager<T>;

export interface BaseStateManager<T> {
    get(): T
    set(t: T): void
    transform<V>(t: Transformer<T, V>): StateManager<V>
    proxy(): StateManagerProxy<T>
    subscribe(handler: (newValue: T, oldValue: T) => void): Subscription;
}

export interface ObjectStateManager<T> extends BaseStateManager<T> {
    atKey<K extends keyof T>(key: K): StateManager<T[K]>
}

export interface ArrayStateManager<T extends Array<any>> extends BaseStateManager<T> {
    map<R>(cb: (mgr: StateManager<T[0]>) => R): R[]
    atIndex(idx: number): StateManager<T[0]>
    replace(idx: number, value: T): void
    filter(predicate: (value: T[0], idx: number) => boolean): StateManager<T[0]>[]
    push(value: T[0]): void
    pop(): void
    slice(startIdx: number, endIdx?: number): ReadonlyArray<StateManager<T[0]>>
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

export function createStateManager<V>(state: V[], onChange: (newState: V[]) => void): ArrayStateManager<V[]>
export function createStateManager<T>(state: T, onChange: (newState: T) => void): ObjectStateManager<T>
export function createStateManager<V, T extends object | Array<V>>(state: T, onChange: (newState: T) => void): any {
    const emitter = new EventEmitter<[T, T]>();
    if (Array.isArray(state)) {
        const arrState = state as V[] & T;
        const m = memoize();
        return {
            get(): T {
                return state;
            },
            atIndex(idx: number): StateManager<V> {
                return m(idx, () => createStateManager(state[idx], v => this.replace(idx, v))) as StateManager<V>;
            },
            set(newValue: T) {
                emitter.emit(newValue, state);
                onChange(newValue);
            },
            subscribe(handler: (newValue: T, oldValue: T) => void) : Subscription {
                return emitter.subscribe(handler);
            },
            transform<V>(t: Transformer<T, V>): StateManager<V> {
                return createStateManager(t.toView(state), (v) => onChange(t.fromView(v))) as StateManager<V>;
            },
            proxy() {
                const base = () => this;
                Object.assign(base, {
                    map: <R>(cb: (m: StateManagerProxy<V>, idx: number) => R) => {
                        return this.map((m: StateManager<V>, idx: number) => cb(m.proxy(), idx));
                    },
                    filter: (predicate: (m: V, idx: number) => boolean): StateManagerProxy<V>[] => {
                        return this.filter(predicate).map((m: StateManager<V>) => m.proxy());
                    },
                    push: (v: V) => this.push(v),
                    pop: () => this.pop(),
                    slice: (startIdx: number, endIndex?: number) => this.slice(startIdx, endIndex).map((m: StateManager<V>) => m.proxy()),
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
                    let mgr = createStateManager(v, (newV) => this.replace(idx, newV));
                    return cb(mgr as StateManager<V>, idx);
                });
            },
            filter(predicate: (v: V, idx: number) => boolean): StateManager<V>[] {
                return this.map((m: StateManager<V>) => m).filter((m: StateManager<V>, idx: number) => predicate(m.get(), idx));
            },
            push(v: V) {
                this.set([...state as V[], v as V] as T);
            },
            pop() {
                this.set([...state.slice(0, state.length - 1)] as T);
            },
            slice(startIdx: number, endIndex?: number) {
                return this.map((m: StateManager<V>) => m).slice(startIdx, endIndex);
            },
            splice(startIdx: number, count: number, ...insert: V[]) {
                this.set([...arrState.slice(0, startIdx), ...insert, ...arrState.slice(startIdx + count)] as T);
            }
        };
    } else {
        const m = memoize();
        return {
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
                return m(key, () => createStateManager(state[key], (newState) => this.set({...state, [key]: newState}))) as StateManager<T[K]>;
            },
            transform<V>(t: Transformer<T, V>): StateManager<V> {
                return createStateManager(t.toView(state), (v) => onChange(t.fromView(v))) as StateManager<V>;
            },
            proxy() {
                const mgr = this;
                return new Proxy(() => this, {
                    get<P extends keyof T>(target: () => StateManager<T>, p: P): T[P] {
                        return mgr.atKey(p).proxy();
                    }
                }) as StateManagerProxy<T>;
            }
        };
    }
}

export function bindInput<T>(p: StateManager<T>) {
    return {
        onChange(evt: ChangeEvent<Element & { value: T }>) {
            return p.set(evt.target.value);
        },
        value: p.get()
    };
}

export function bindCheckbox(p: BaseStateManager<boolean>) {
    return {
        onChange(evt: ChangeEvent<HTMLInputElement>) {
            return p.set(evt.target.checked);
        },
        checked: p.get()
    };
}
