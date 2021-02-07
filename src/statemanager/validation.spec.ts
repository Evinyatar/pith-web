import {createStateManager} from "./stateManager";
import {withValidation} from "./validation";

test("Test full validation", () => {
    const state = {
        someValue: 0,
        anotherValue: 1
    };

    const manager = createStateManager(state, () => {});

    const validation = withValidation(manager, (opts, value) => {
        opts.expect(value.someValue, 'someValue should be higher than 0').toSatisfy(v => v > 0);
        opts.expect(value.anotherValue, 'anotherValue should be lower than 10').toSatisfy(v => v < 10);
    });

    const result = validation.validate();
    expect(result.length).toEqual(1);
    expect(result[0].stateManager).toBe(manager.atKey("someValue"));
    expect(result[0].message).toEqual("someValue should be higher than 0");
})
