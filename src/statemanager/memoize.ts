export function memoize<K, V>() {
    const m = new Map<K, V>();
    return (key: K, factory: () => V): V => {
        if(m.has(key)) {
            return m.get(key)!;
        } else {
            const instance = factory();
            m.set(key, instance);
            return instance;
        }
    }
}
