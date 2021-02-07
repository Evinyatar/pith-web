import {withValidation} from "./validation";

test("Test full validation", () => {
    const state = {
        someValue: 0,
        anotherValue: 1
    };

    const validation = withValidation({value: state, validationResults: []}, (opts, value) => {
        opts.ensure(value.someValue).min(1);
        opts.ensure(value.anotherValue).max(11);
    }, () => {
    });

    const result = validation.validate();
    expect(result).toEqual([{
            property: ".someValue",
            message: ".someValue should be minimum 1"
        }]
    );
});

test("Incremental validation: making one field invalid returns a validation result", () => {
    const state = {
        someValue: 0,
        anotherValue: 1
    };

    const onChange = jest.fn();

    const validation = withValidation({value: state, validationResults: []}, (opts, value) => {
        opts.ensure(value.someValue).min(1);
        opts.ensure(value.anotherValue).max(10);
    }, onChange);

    validation.stateManager().proxy().anotherValue().set(11);

    expect(onChange).toBeCalledWith({
        value: {
            someValue: 0,
            anotherValue: 11
        },
        validationResults: [
            {
                property: ".anotherValue",
                message: '.anotherValue should be maximum 10'
            }
        ]
    });
});

test("Incremental validation: keeping all fields valid returns a empty validation result", () => {
    const state = {
        someValue: 0,
        anotherValue: 1
    };

    const onChange = jest.fn();

    const validation = withValidation({value: state, validationResults: []}, (opts, value) => {
        opts.ensure(value.someValue).min(0);
        opts.ensure(value.anotherValue).max(10);
    }, onChange);

    validation.stateManager().proxy().anotherValue().set(9);

    expect(onChange).toBeCalledWith({
        value: {
            someValue: 0,
            anotherValue: 9
        },
        validationResults: []
    });
});

test("Incremental validation: making an invalid field valid clears the validation result", () => {
    const state = {
        someValue: 0,
        anotherValue: 11
    };

    const onChange = jest.fn();

    const validation = withValidation({
        value: state, validationResults: [
            {
                property: ".anotherValue",
                message: '.anotherValue should be lower than 10'
            }
        ]
    }, (opts, value) => {
        opts.ensure(value.someValue).min(0);
        opts.ensure(value.anotherValue).max(10);
    }, onChange);

    validation.stateManager().proxy().anotherValue().set(9);

    expect(onChange).toBeCalledWith({
        value: {
            someValue: 0,
            anotherValue: 9
        },
        validationResults: []
    });
});

test("Incremental validation: making second field invalid adds a validation error", () => {
    const state = {
        someValue: 1,
        anotherValue: 11
    };

    const onChange = jest.fn();

    const validation = withValidation({
        value: state, validationResults: [
            {
                property: ".anotherValue",
                message: '.anotherValue should be maximum 10'
            }
        ]
    }, (opts, value) => {
        opts.ensure(value.someValue).min(1);
        opts.ensure(value.anotherValue).max(10);
    }, onChange);

    validation.stateManager().proxy().someValue().set(0);

    expect(onChange).toBeCalledWith({
        value: {
            someValue: 0,
            anotherValue: 11
        },
        validationResults: [
            {
                property: ".anotherValue",
                message: '.anotherValue should be maximum 10'
            },
            {
                property: ".someValue",
                message: ".someValue should be minimum 1"
            }
        ]
    });
});

test("Displayname", () => {
    let v = withValidation({value: {someValue: 1}}, ({ensure}, value) => {
        ensure(value.someValue).displayName("Some Value").min(10);
    }, () => {});

    expect(v.validate()).toEqual([{
        property: ".someValue",
        message: "Some Value should be minimum 10"
    }]);
})

test("withMessasge", () => {
    let v = withValidation({value: {someValue: 1}}, ({ensure}, value) => {
        ensure(value.someValue).min(10).withMessage("Make some value > 10, or else...");
    }, () => {});

    expect(v.validate()).toEqual([{
        property: ".someValue",
        message: "Make some value > 10, or else..."
    }]);
})
