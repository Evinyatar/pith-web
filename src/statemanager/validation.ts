import {StateManager, StateManagerProducer, StateManagerProxy} from "./stateManager";

export interface ValidationResult<V> {
    message: string;
}

export interface ValidationResultWithRef<V> extends ValidationResult<V> {
    stateManager: StateManager<V>
}

export interface ValidationResults extends Array<ValidationResultWithRef<any>> {

}

export interface Expectation<V> {
    toSatisfy(condition: (value: V) => boolean): void;
}

export interface ValidatorContext<T> {
    expect<TT>(accessor: StateManagerProxy<TT>, message: string): Expectation<TT>;
}

export function withValidation<T>(stateManager: StateManager<T>, validator: (context: ValidatorContext<T>, value: StateManagerProxy<T>) => void) {
    const conditions: Array<(results: ValidationResults) => void> = [];

    const addValidator = <V>(accessor: StateManager<V>, validator: (value: V) => ValidationResult<V> | null) => {
        conditions.push((results: ValidationResults) => {
            const v = accessor.get();
            const result = validator(v);
            if (result) {
                results.push({
                    ...result,
                    stateManager: accessor
                });
            }
        });
    };

    validator({
        expect<V>(accessor: StateManagerProxy<V>, message: string) {
            return {
                toSatisfy(condition: (value: V) => boolean) {
                    addValidator((accessor as StateManagerProducer<V>)(), (value: V) => {
                        if(!condition(value)) {
                            return {
                                message
                            }
                        } else {
                            return null;
                        }
                    });
                }
            };
        }
    }, stateManager.proxy());

    return {
        validate() {
            const results : ValidationResults = [];
            conditions.forEach(c => c(results));
            return results;
        }
    };
}
