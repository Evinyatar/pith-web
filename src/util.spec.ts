import {classNames} from "./util";

test('Classnames', () => {
    const c = classNames("alwaysThere", {
        "conditionallyThere": true,
        "notThere": false
    });
    expect(c).toBe("alwaysThere conditionallyThere");
});
