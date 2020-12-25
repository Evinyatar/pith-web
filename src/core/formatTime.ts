import {sprintf} from "sprintf-js";

export function formatTime(value: number | undefined): string {
    if (value === undefined) {
        return "-:--";
    } else {
        return sprintf("%d:%02d:%02d", value / 3600, (value / 60) % 60, value % 60);
    }
}

export function formatDate(date: string | undefined): string | undefined {
    if(date !== undefined) {
        return new Date(Date.parse(date)).toLocaleDateString();
    }
    return undefined;
}
