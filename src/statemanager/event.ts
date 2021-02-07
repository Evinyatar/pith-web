export interface Subscription {
    unsubscribe(): void;
}

type Handler<T extends Array<any>> = (...args: T) => void;

export class EventEmitter<T extends Array<any>> {
    private handlers: Handler<T>[] = [];

    subscribe(handler: Handler<T>): Subscription {
        this.handlers.push(handler);
        return {
            unsubscribe: () => {
                const i = this.handlers.indexOf(handler);
                if(i >= 0) {
                    this.handlers.splice(i, 1);
                }
            }
        }
    }

    emit(...args: T) {
        this.handlers.forEach(h => h(...args));
    }
}
