# React State Manager

The State Manager intends to make it easier to make forms around deeply
nested data structures, while maintaining type safety and code legibility (somewhat)

## Concept

A state manager allows deep manipulation of a state, without affecting the original object.
`createStateManager(state, callback)` returns a state manager around the given state that invokes the callback
whenever an update to the state is required. It does not apply any changes to the given state object, but passes
a new state object reflecting the changes to the callback.

At its core, a State Manager holds a value and a callback, and provides methods to invoke the callback, and
create state managers for nested properties or array children that bubble the changes up.

```typescript
import {createStateManager} from "./stateManager";

createStateManager({prop: 4}, (newState) => console.log(newState)).atKey("prop").set(5);
// prints {prop: 5}

createStateManager({nested: {prop: 4}}, (newState) => console.log(newState)).atKey("nested").atKey("prop").set(5)
// prints {nested: {prop: 5}}

createStateManager(['a', 'b', 'c'], (newState) => console.log(newState)).atIndex(1).set('x')
// prints ['a', 'x', 'c']
```

## State Manager Proxy

Because `atKey` and `atIndex` doesn't promote code legibility, there's a `proxy()` method that makes navigation a
bit easier. It returns an object with the same keys as the state manager subject, but each property value is a
State Manager Proxy. A State Manager Proxy is basically a function that returns the State Manager, but with some
additional candy on top of it; for objects it also exposes the properties of the object. For arrays it exposes some
array manipulation functions.

```typescript
import {createStateManager} from "./stateManager";

const mgr = createStateManager({nested: {props: [{x: 'a'}, {x: 'b'}]}}, (newState) => console.log(newState)).proxy();
mgr.nested.props[1].x().set('bar')

// prints {nested: {props: [{x: 'a'}, {x: 'bar'}]}}
```

## Transformations

State Managers allow applying a bi-directional transformation. That comes in handy when for example you want
to access a number as if it were a string (e.g. because that's what your control expects).

```typescript
import {createStateManager, NumberTransformer} from "./stateManager";

const mgr = createStateManager(5, newState => console.log(newState)).transform(NumberTransformer);
mgr.get() // returns "5"
mgr.set("4") // prints 4 (as a number)
```

## Validation

The validation framework leverages the State Manager to make it easy to define validation rules in a declarative and
typesafe way. It takes a state object consisting of a `value` and pre-existing `validationResults`, a function that is
used to define the validation rules, and a change handler.

```typescript
const v = withValidation({ value: { someField: 5}, validationResults: [] }, ({ensure}, value) => {
    ensure(value.someField).displayName("Some field").min(1);
}, (newState, validationResults) => {
    console.log(newState, validationResults);
});

v.proxy().someField().set(0); // prints {someField: 0}, [{ property: ".someField", message: "Some field should be minimum 1"}]
```

## Form Building

The `bindInput` and its variants return the necessary properties to assign to a react node to "bind" that node
to a state manager.

```tsx
import {bindInput, createStateManager, NumberTransformer} from "./stateManager";
import {Component} from "react";

class MyForm extends Component<{}, {
    folders: {
        contains: 'movies' | 'shows',
        path: string,
        scan: boolean
    }[],
    files: {
        rootDir: string
    },
    library: {
        scanInterval: number
    }
}> {

    render() {
        const mgr = createStateManager(this.state, (s) => this.setState(s)).proxy();

        return (
            <form>
                <input type="text" {...bindInput(mgr.files.rootDir())} />
                <input type="number" {...bindInput(mgr.library.scanInterval().transform(NumberTransformer))} />
                
                {
                    mgr.folders.map(folder => 
                        <input type="text" {...bindInput(folder())} />
                    )
                }
            </form>
        )
    }
}
```
