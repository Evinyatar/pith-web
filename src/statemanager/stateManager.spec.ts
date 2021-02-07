import {createStateManager, StateManager} from "./stateManager";
import {create} from "domain";
import assert from "assert";

/**
 * Creates a manager for a given state, applies the mutation, and verifies the resulting state to match the expected state, as well
 * as checking whether the original state object is unchanged
 * @param originalStateProvider
 * @param mutation
 * @param expectedState
 */
function testMutation<V>(originalStateProvider: () => V, mutation: (stateManager: StateManager<V>) => void, expectedState: V) {
    let newState;
    const originalState = originalStateProvider();
    const stateManager = createStateManager(originalState, state => newState = state) as StateManager<V>;
    mutation(stateManager);
    expect(newState).toMatchObject(expectedState);
    expect(originalState).toMatchObject(originalStateProvider())
}

test('Nested property set', () => {
    testMutation(
        () => ({a:0, b:{c:1}}),
        (m)=>m.atKey('b').atKey('c').set(2),
        {a:0,b:{c:2}}
    );
})

test('Nested property set through proxy', () => {
    testMutation(
        () => ({a:0, b:{c:1}}),
        (m)=>m.proxy().b.c().set(2),
        {a:0,b:{c:2}}
    );
})

test('Array map', () => {
    testMutation(
        () => ({a:0, b: [{c:1}, {c:2}, {c:3}]}),
        m => {
            m.proxy().b.map((m, idx) => {
                if(idx === 1) m.c().set(4)
            })
        },
        {a:0, b: [{c:1}, {c:4}, {c:3}]}
    )
})

test('Array item property set', () => {
    testMutation(
        () => ({a:0, b: [{c:1}, {c:2}, {c:3}]}),
        m => {
            m.atKey('b').atIndex(1).atKey('c').set(4)
        },
        {a:0, b: [{c:1}, {c:4}, {c:3}]}
    )
})

test('Array item property set through proxy', () => {
    testMutation(
        () => ({a:0, b: [{c:1}, {c:2}, {c:3}]}),
        m => {
            m.proxy().b[1].c().set(4)
        },
        {a:0, b: [{c:1}, {c:4}, {c:3}]}
    )
})

test('Filtered array item property set', () => {
    testMutation(
        () => ([{c:1, d: false}, {c:2, d: true}, {c:3, d: true}]),
        m => {
            m.filter(({d}) => d)[0].atKey('c').set(4);
        },
        [{c:1, d:false}, {c: 4, d: true}, {c:3, d: true}]
    )
})

test('Filtered array item property set through proxy', () => {
    testMutation(
        () => ([{c:1, d: false}, {c:2, d: true}, {c:3, d: true}]),
        m => {
            m.proxy().filter(({d}) => d)[0].c().set(4)
        },
        [{c:1, d:false}, {c: 4, d: true}, {c:3, d: true}]
    )
})

test('Array pop', () => {
    testMutation(
        () => ([{c:1, d: false}, {c:2, d: true}, {c:3, d: true}]),
        m => {
            m.pop()
        },
        [{c:1, d:false}, {c: 2, d: true}]
    )
})

test('Array push', () => {
    testMutation<{c:number, d?:boolean}[]>(
        () => ([{c:1, d: false}, {c:2, d: true}, {c:3, d: true}]),
        m => {
            m.push({c:4})
        },
        [{c:1, d: false}, {c:2, d: true}, {c:3, d: true}, {c:4}]
    )
})

test('Array slice and set property', () => {
    testMutation<{c:number, d?:boolean}[]>(
        () => ([{c:1, d: false}, {c:2, d: true}, {c:3, d: true}]),
        m => {
            m.slice(1)[0].atKey('c').set(4)
        },
        [{c:1, d: false}, {c:4, d: true}, {c:3, d: true}]
    )
})

test('Array splice', () => {
    testMutation<{c:number, d?:boolean}[]>(
        () => ([{c:1, d: false}, {c:2, d: true}, {c:3, d: true}]),
        m => {
            m.splice(1,2,{c:4})
        },
        [{c:1, d: false}, {c:4}]
    )
})

test('Array proxy pop', () => {
    testMutation(
        () => ([{c:1, d: false}, {c:2, d: true}, {c:3, d: true}]),
        m => {
            m.proxy().pop()
        },
        [{c:1, d:false}, {c: 2, d: true}]
    )
})

test('Array proxy push', () => {
    testMutation<{c:number, d?:boolean}[]>(
        () => ([{c:1, d: false}, {c:2, d: true}, {c:3, d: true}]),
        m => {
            m.proxy().push({c:4})
        },
        [{c:1, d: false}, {c:2, d: true}, {c:3, d: true}, {c:4}]
    )
})

test('Array proxy slice and set property', () => {
    testMutation<{c:number, d?:boolean}[]>(
        () => ([{c:1, d: false}, {c:2, d: true}, {c:3, d: true}]),
        m => {
            m.proxy().slice(1)[0].c().set(4)
        },
        [{c:1, d: false}, {c:4, d: true}, {c:3, d: true}]
    )
})

test('Array proxy splice', () => {
    testMutation<{c:number, d?:boolean}[]>(
        () => ([{c:1, d: false}, {c:2, d: true}, {c:3, d: true}]),
        m => {
            m.proxy().splice(1,2,{c:4})
        },
        [{c:1, d: false}, {c:4}]
    )
})

test('Event handling on objects', () => {
    const onChange = jest.fn();
    const handler = jest.fn();
    const handler2 = jest.fn();

    const mgr = createStateManager({
        x: {y: 0}
    }, onChange);

    mgr.subscribe(handler);
    mgr.proxy().x.y().subscribe(handler2);

    mgr.proxy().x.y().set(2);

    expect(onChange).toBeCalledWith({
        x: {y: 2}
    });
    expect(onChange).toBeCalledTimes(1);

    expect(handler).toBeCalledWith({
        x: {y: 2}
    }, {
        x: {y: 0}
    });
    expect(handler).toBeCalledTimes(1);

    expect(handler2).toBeCalledWith(2, 0);
    expect(handler2).toBeCalledTimes(1);
})

test('Event handling on arrays', () => {
    const onChange = jest.fn();
    const handler = jest.fn();
    const handler2 = jest.fn();

    const mgr = createStateManager([[1]], onChange);

    mgr.subscribe(handler);
    mgr.proxy()[0][0]().subscribe(handler2);

    mgr.atIndex(0).atIndex(0).set(2);

    expect(onChange).toBeCalledWith([[2]]);
    expect(onChange).toBeCalledTimes(1);

    expect(handler).toBeCalledWith([[2]], [[1]]);
    expect(handler).toBeCalledTimes(1);

    expect(handler2).toBeCalledWith(2, 1);
    expect(handler2).toBeCalledTimes(1);
})

test('path() returns property path', () => {
    const mgr = createStateManager({
        someObject: {
            someArray: [
                0
            ]
        }
    }, () => {}).proxy();

    expect(mgr.someObject().path()).toEqual(".someObject");
    expect(mgr.someObject.someArray().path()).toEqual(".someObject.someArray");
    expect(mgr.someObject.someArray[0]().path()).toEqual(".someObject.someArray[0]");
})

test("Decorator", () => {
    const decorator = jest.fn().mockImplementation(x => x);
    const mgr = createStateManager({
        someObject: {
            someArray: [
                0
            ]
        }
    }, () => {}, "root", decorator);

    mgr.proxy().someObject.someArray();

    expect(decorator).toBeCalledWith(mgr.atKey("someObject"));
    expect(decorator).toBeCalledWith(mgr.atKey("someObject").atKey("someArray"));
})
