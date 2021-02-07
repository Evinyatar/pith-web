import {ChangeEvent} from "react";
import {BaseStateManager, StateManager} from "./stateManager";

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
