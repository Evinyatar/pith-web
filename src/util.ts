export function classNames(...input: ({ [classname: string]: boolean } | string)[]): string {
    return input.map(entry => {
        if (typeof entry === 'string') {
            return entry;
        } else {
            return Object.entries(entry)
                .filter(([classname, present]) => present)
                .map(([classname]) => classname).join(' ');
        }
    }).join(' ');
}
