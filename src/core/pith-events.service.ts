import {Observable, Subject} from "rxjs";

var retryInterval = 3000;

export class PithEventsService {
    private ws: WebSocket | undefined;
    private url: string;
    private events: Map<string, Subject<any>> = new Map();
    private ready: boolean = false;

    constructor() {
        this.url = (document.location.protocol === "http:" ? "ws" : "wss") + "://" + document.location.host + "/events";
    }

    listenFor(event: string): Observable<any> {
        if (!this.events.has(event)) {
            if (this.ready) {
                this.registerEvent(event);
            }
            this.events.set(event, new Subject());
        }
        return this.events.get(event)!.asObservable();
    }

    private registerEvent(event: string) {
        this.ws!.send(JSON.stringify({action: 'on', event: event}));
    }

    public connect() {
        this.ws?.close();

        console.log("Trying to connect to event server: " + this.url);
        const ws = this.ws = new WebSocket(this.url);
        ws.onopen = () => {
            console.log("Event server connection successful!");
            this.ready = true;
            this.trigger("connectionChanged", {connected: true});
            this.events.forEach((subject, event) => {
                this.registerEvent(event);
            });
        };

        ws.onmessage = (data) => {
            const evt = JSON.parse(data.data);
            this.trigger(evt.event, evt.arguments);
        };

        ws.onclose = () => {
            console.log("Connection to event server lost");
            this.trigger("connectionChanged", {connected: false});
            this.ready = false;
            setTimeout(() => {
                this.connect();
            }, retryInterval);
        };

        ws.onerror = (error) => {
            console.log("Connection to event server errored", error);
        }
    }

    public close() {
        this.ws?.close();
    }

    private trigger(event: string, args: any) {
        if (this.events.has(event)) {
            this.events.get(event)!.next(args);
        }
    }
}
