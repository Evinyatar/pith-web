import {createStateManager, StateManager, StateManagerProducer, StateManagerProxy} from "./stateManager";

export type PropertyPath = string;

export interface ValidationResult<V> {
    message: string;
}

export interface ValidationResultWithRef<V> extends ValidationResult<V> {
    property: PropertyPath;
}

export interface ValidationResults extends Array<ValidationResultWithRef<any>> {

}

export interface Expectation<V> {
    withMessage(message: string): Expectation<V>;
}

export type ValidatedStateManager<T> = StateManager<T, {validationResults: ValidationResults}>;
export type ValidatedStateManagerProxy<T> = StateManagerProxy<T, {validationResults: ValidationResults}>;

export interface FieldValidator<V> {
    satisfies(condition: (value: V) => boolean): Expectation<V>;
    min(value: V): Expectation<V>
    max(value: V): Expectation<V>
    between(min: V, max: V): Expectation<V>
    range(min: V, max: V): Expectation<V>
    displayName(displayName: string): FieldValidator<V>;
}

export interface ValidatorContext<T> {
    ensure<TT>(accessor: StateManagerProducer<TT>): FieldValidator<TT>;
}

export function withValidation<T>({
                                      value,
                                      validationResults
                                  }: { value: T, validationResults?: ValidationResults }, validator: (context: ValidatorContext<T>, value: StateManagerProxy<T>) => void, onChange: (e: {
    value: T,
    validationResults: ValidationResults
}) => void) {
    const conditions: Array<{ stateManager: StateManager<any>, handler: (results: ValidationResults, value?: any) => ValidationResults, message: string }> = [];
    let incrementalValidationResults: ValidationResults = [...validationResults ?? []];

    const stateManager = createStateManager(value, value => {
        onChange({
            value,
            validationResults: incrementalValidationResults
        });
    }, "", (stateManager) => {
        return {
            ...stateManager,
            get validationResults() : ValidationResults {
                return incrementalValidationResults.filter(r => r.property === this.path());
            }
        }
    });

    const addValidator = <V>(accessor: StateManager<V>, validator: (value: V) => boolean, message: string) : Expectation<V> => {
        if(conditions.findIndex(c => c.stateManager === accessor) === -1) {
            accessor.subscribe((newValue) => {
                incrementalValidationResults = conditions.filter(c => c.stateManager === accessor)
                    .reduce((r, c) => c.handler(r, newValue),
                        incrementalValidationResults.filter(r => r.property !== accessor.path()));
            });
        }

        let condition = {
            stateManager: accessor,
            message: message,
            handler(results: ValidationResults, value = accessor.get()) : ValidationResults {
                const isValid = validator(value);
                if (!isValid) {
                    const result = {
                        property: accessor.path(),
                        message: this.message
                    }
                    return [
                        ...results,
                        result
                    ];
                } else {
                    return results;
                }
            }
        };
        conditions.push(condition);

        return {
            withMessage(message: string) {
                condition.message = message;
                return this;
            }
        }
    };

    const rule = <V>(accessor: StateManager<V>, name: string = accessor.path()) : FieldValidator<V> => {
        return {
            satisfies(condition: (value: V) => boolean) {
                return addValidator(accessor, condition, "");
            },
            min(min: any) {
                return addValidator(accessor, v => v >= min, `${name} should be minimum ${min}`);
            },
            max(max: any) {
                return addValidator(accessor, v => v <= max, `${name} should be maximum ${max}`);
            },
            range(min: any, max: any) {
                return addValidator(accessor, v => v >= min && v <= max, `${name} should be in range ${min} - ${max}`);
            },
            between(min: any, max:any) {
                return addValidator(accessor, v => v > min && v < max, `${name} should be between ${min} and ${max}`);
            },
            displayName(displayName: string) {
                return rule(accessor, displayName);
            }
        };
    }

    validator({
        ensure<V>(accessor: StateManagerProducer<V>) {
            return rule(accessor());
        }
    }, stateManager.proxy());

    return {
        validate() : ValidationResults {
            return conditions.reduce((r, c) => c.handler(r), [] as ValidationResults);
        },
        proxy() : ValidatedStateManagerProxy<T> {
            return stateManager.proxy()
        },
        stateManager() : ValidatedStateManager<T> {
            return stateManager;
        }
    };
}
