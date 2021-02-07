import {memoize} from "./memoize";

test('Memoize doesn\'t call factory more than once', () => {
    const instance = {};
    const factory = jest.fn().mockReturnValue(instance);
    const m = memoize();

    expect(m("something", factory)).toBe(instance);
    expect(factory).toBeCalledTimes(1);

    factory.mockClear();

    expect(m("something", factory)).toBe(instance);

    expect(factory).not.toBeCalled();
})

test('Memoize doesn\'t mix up keys', () => {
    const m = memoize();
    expect(m('a', () => 3)).toEqual(3);
    expect(m('a', () => 5)).toEqual(3);
    expect(m('b', () => 8)).toEqual(8);
});
