import {EventEmitter} from "./event";

test('Event emission', () => {
    const emitter = new EventEmitter<[string, string]>();

    const handler = jest.fn();
    emitter.subscribe(handler);
    emitter.emit("new", "old");
    expect(handler).toHaveBeenCalledWith("new", "old");

    const handler2 = jest.fn();
    emitter.subscribe(handler2);
    emitter.emit("foo", "bar");
    expect(handler).toHaveBeenCalledWith("foo", "bar");
    expect(handler2).toHaveBeenCalledWith("foo", "bar");
});

test('Unsubscribe', () => {
    const emitter = new EventEmitter<[number]>();

    const handler = jest.fn();
    const subscription = emitter.subscribe(handler);
    emitter.emit(1);
    expect(handler).toHaveBeenCalledWith(1);

    subscription.unsubscribe();

    handler.mockClear();

    emitter.emit(2);
    expect(handler).not.toHaveBeenCalled()
})
