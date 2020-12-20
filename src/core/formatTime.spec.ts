import {formatTime} from "./formatTime";

test('formatTime', () => {
    expect(formatTime(66)).toBe('0:01:06');
});
