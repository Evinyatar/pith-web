import {ChangeEvent} from "react";

export type StateManagerProducer<T> = () => StateManager<T>

export type StateManagerProxy<T, K extends keyof T = keyof T> = {
    [P in K]: StateManagerProxy<T[P], keyof T[P]>
} & StateManagerProducer<T>;

export type StateManager<T> = T extends Array<any> ? ArrayStateManager<T> : T extends object ? ObjectStateManager<T> : BaseStateManager<T>;

export interface BaseStateManager<T> {
    get(): T
    set(t: T): void
    transform<V>(t: Transformer<T, V>): StateManager<V>
}

export interface ObjectStateManager<T> extends BaseStateManager<T> {
    sub<K extends keyof T>(key: K): StateManager<T[K]>
    proxy(): StateManagerProxy<T>
}

export interface ArrayStateManager<T extends Array<any>> extends BaseStateManager<T> {
    map<R>(cb: (mgr: StateManager<T[0]>) => R) : R[]
    replace(idx: number, value: T): void
    proxy(): {
        map<R>(t: (m: StateManager<T[0]>) => R): R[]
    }
}

export interface Transformer<S, V> {
    toView(source: S): V
    fromView(view: V): S
}

export function NumberTransformer() : Transformer<number, string>{
    return {
        toView(source: number): string {
            return source?.toString();
        },
        fromView(view: string): number {
            return parseInt(view);
        }
    }
}

export function Scale(factor: number) : Transformer<number, number> {
    return {
        toView(source: number): number {
            return source / factor;
        },
        fromView(source: number): number {
            return source * factor;
        }
    }
}

export function createStateManager<V>(state: V[], onChange: (newState: V[]) => void) : ArrayStateManager<V[]>
export function createStateManager<T>(state: T, onChange: (newState: T) => void) : ObjectStateManager<T>
export function createStateManager<V, T extends object | Array<V>>(state: T, onChange: (newState: T) => void) : any {
    if(Array.isArray(state)) {
        const arrState = state as V[] & T;
        return {
            get() : T {
                return state;
            },
            set(newValue: T) {
                onChange(newValue)
            },
            transform<V>(t: Transformer<T, V>) : StateManager<V> {
                return createStateManager(t.toView(state), (v) => onChange(t.fromView(v))) as StateManager<V>;
            },
            proxy() {
                const base = () => this;
                base.map = <R>(cb: (m: StateManager<V>) => R) => {
                    return this.map(cb)
                }
                return base;
            },
            replace(index: number, value: V) {
                const newArray = [...arrState.slice(0, index), value, ...arrState.slice(index + 1)]
                onChange(newArray as T);
            },
            map<R>(cb: (mgr: StateManager<V>) => R) : R[] {
                return arrState.map((v, idx) => {
                    let mgr = createStateManager(v, (newV) => this.replace(idx, newV));
                    return cb(mgr as StateManager<V>);
                })
            }
        }
    } else {
        return {
            get() : T {
                return state;
            },
            set(newValue: T) {
                onChange(newValue)
            },
            sub<K extends keyof T>(key: K) : StateManager<T[K]> {
                return createStateManager(state[key], (newState) => this.set({...state, [key]: newState})) as StateManager<T[K]>;
            },
            transform<V>(t: Transformer<T, V>) : StateManager<V> {
                return createStateManager(t.toView(state), (v) => onChange(t.fromView(v))) as StateManager<V>;
            },
            proxy() {
                const mgr = this;
                return new Proxy(() => this, {
                    get(target: () => StateManager<T>, p: PropertyKey, receiver: any): any {
                        return mgr.sub(p as keyof T).proxy()
                    }
                }) as StateManagerProxy<T>;
            }
        };
    }
}

export function bindInput<T>(p: StateManager<T>) {
    return {
        onChange(evt: ChangeEvent<Element & {value: T}>) { return p.set(evt.target.value) },
        value: p.get()
    }
}

export function bindCheckbox(p: BaseStateManager<boolean>) {
    return {
        onChange(evt: ChangeEvent<HTMLInputElement>) { return p.set(evt.target.checked)},
        checked: p.get()
    }
}
