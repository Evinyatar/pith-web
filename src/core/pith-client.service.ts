import {BehaviorSubject, EMPTY, Observable, Subject} from 'rxjs';

import {catchError, finalize, map} from 'rxjs/operators';
import {PithEventsService} from './pith-events.service';
import {HttpClient, HttpParams} from "./HttpClient";

export interface CacheOptions {
    noRefresh?: boolean
}

export interface Icon {
    local?: boolean
    url: string
}

export type IconMap = { [size: string]: Icon }

abstract class RestModule {
    constructor(private pith: PithClientService, private readonly root: string[]) {
    }

    protected get<T = Object>(...args: any[]) {
        let query: any;
        if (typeof args[args.length - 1] === 'object') {
            query = args[args.length - 1];
            args = args.slice(0, -1);
        }
        return this.pith.get<T>(`${this.root.concat(args).map(encodeURIComponent).join('/')}`, query);
    }

    protected put(...args: any[]) {
        const body = args.pop();
        return this.pith.put(`${this.root.concat(args).map(encodeURIComponent).join('/')}`, body);
    }

    protected on(event: string, callback: (any)) {
        this.pith.on(event).subscribe(args => callback.apply(null, args));
    }
}

export class PlayerStatus {
    private timestamp: Date;
    actions: { play: boolean, stop: boolean, pause: boolean };
    position?: { title?: string, time?: number, duration?: number };

    constructor(obj: any) {
        this.actions = {play: false, stop: false, pause: false};
        Object.assign(this, obj);
        this.timestamp = new Date();
    }
}

export interface Player {
    readonly id: string;
    readonly icons: IconMap;
    readonly friendlyName: string;
    readonly status: Observable<PlayerStatus>;

    load(channel: Channel, item: ChannelItem, seekTime?: number): void;

    play(): void;

    pause(): void;

    stop(): void;

    seek(time: number): void;
}

export class RemotePlayer extends RestModule implements Player {
    readonly id: string;
    readonly icons: IconMap;
    readonly friendlyName: string;
    private statusSubject: Subject<PlayerStatus> = new BehaviorSubject<PlayerStatus>(new PlayerStatus({}));

    constructor(pith: PithClientService, {id, friendlyName, icons}: { id: string, friendlyName: string, icons: IconMap }) {
        super(pith, ['player', id]);

        this.id = id;
        this.friendlyName = friendlyName;
        this.icons = icons;

        this.on('playerstatechange', (event: any) => {
            if (event.player.id === this.id) {
                this.statusSubject.next(new PlayerStatus(event.status));
            }
        });
    }

    load(channel: Channel, item: ChannelItem, seekTime?: number) {
        this.get('load', channel.id, item.id, seekTime !== null ? {time: seekTime} : {}).subscribe();
    }

    play() {
        this.get('play').subscribe();
    }

    pause() {
        this.get('pause').subscribe();
    }

    stop() {
        this.get('stop').subscribe();
    }

    seek(time: number) {
        this.get('seek', {time: Math.floor(time)}).subscribe();
    }

    get status() {
        return this.statusSubject.asObservable();
    }
}

export interface PlayState {
    id?: string,
    time?: number,
    duration?: number,
    status: "watched" | "inprogress" | "none";
}

export interface ChannelItem {
    id: string;
    path?: { id: string, title: string }[];
    preferredView?: 'poster' | 'details';
    still?: string;
    poster?: string;
    backdrop?: string;
    banner?: string;
    title: string;
    airDate: string;
    mediatype: string;
    playState: PlayState;
    sortableFields: string[];
    tagline: string;
    rating: string;
    genres: string[];
    plot: string;
    overview: string;
    hasNew: boolean;
    unavailable: boolean;
    type: 'file'|'container';
    year: string;
    playable: boolean;
    imdbId: string;
    tmdbId: string;

    showname: string;
    episode: number;
    season: number;
    duration?: number;
}

export interface Episode extends ChannelItem {
    season: number;
    episode: number;
    showname: string;
}

export interface Season extends ChannelItem {
    season: number;
}

export interface Show extends ChannelItem {
    seasons: Season[];
    episodes: Episode[];
}

export interface Stream {
    url: string;
    mimetype: string;
    seekable: boolean;
    duration: number;
    format?: {
        container: string,
        streams: {
            resolution?: { width: number, height: number };
            language: string;
            index: number,
            type: 'video' | 'audio' | 'subtitle'
            codec: string,
            profile: number,
            pixelFormat: string,
            channels: string,
            layout: string
        }[]
    },
    streams?: {}[],
    keyframes?: {}[]
}

export class Channel extends RestModule {
    id: string;
    title: string;

    constructor(pith: PithClientService, {id, title}: { id: string, title: string }) {
        super(pith, ['channel', id]);
        this.id = id;
        this.title = title;
    }

    listContents(path?: string, cacheOptions?: CacheOptions): Observable<ChannelItem[]> {
        return this.get(null, 'list', path || '', {includePlayStates: true}) as Observable<ChannelItem[]>;
    }

    getDetails(path: string, cacheOptions?: CacheOptions): Observable<ChannelItem> {
        return this.get(cacheOptions, 'detail', path || '') as Observable<ChannelItem>;
    }

    togglePlayState(item: ChannelItem) {
        if (item.playState && item.playState.status === 'watched') {
            item.playState = {status: 'none'};
        } else {
            item.playState = {status: 'watched'};
        }
        this.setPlayState(item.id, item.playState);
    }

    setPlayState(path: string, playstate: PlayState) {
        this.put('playstate', path, playstate).subscribe();
    }

    stream(path: string, options: any = {}): Observable<{ item: ChannelItem, stream: Stream }> {
        return this.get<{ item: ChannelItem, stream: Stream }>('stream', path || '', options);
    }
}

export interface PithSettings {
    apiContext: string;
    bindAddress: string;
    couchpotato: {
        enabled: boolean,
        url: string,
        apikey: string
    };
    upnpsharing: {
        enabled: boolean,
        port?: number
    };
    dbEngine: string;
    files: {
        rootDir: string,
        excludeExtensions: string[],
        showHiddenFiles: boolean
    };
    httpPort: number;
    library: {
        folders: [{
            channelId: string,
            containerId: string | null,
            contains: string,
            scanAutomatically: boolean
        }],
        scanInterval: number
    };
    maxAgeForNew: number;
    mongoUrl: string;
    pithContext: string;
    server: string;
    sonarr: {
        enabled: boolean,
        url: string,
        apikey: string
    };
}

export class PithError {
    message?: string;
    code?: string;
    error?: string;

    constructor(e: Partial<PithError>) {
        Object.assign(this, e);
    }
}

export class PithClientService {
    private root: string;
    private _errors: Subject<PithError> = new Subject();
    private _progress: Subject<{ loading: boolean }> = new BehaviorSubject<{ loading: boolean }>({loading: false});
    private loadingCounter = 0;

    constructor(
        private httpClient: HttpClient,
        private eventService: PithEventsService
    ) {
        this.root = '/rest';
    }

    get<T = object>(url: string, query?: { [key: string]: string }): Observable<T> {
        const options: any = {};
        if (query) {
            options['params'] = Object.keys(query).reduce((pp, k) => pp.append(k, query[k]), new HttpParams());
        }
        this.reportProgress({
            loading: true
        });
        let finalized = false;
        return this.httpClient.get(`${this.root}/${url}`, options).pipe(catchError((e, c) => {
            this.throw(new PithError(e.error));
            return EMPTY;
        }), finalize(() => {
            if (finalized) {
                return;
            }
            finalized = true;
            this.reportProgress({
                loading: false
            });
        })) as Observable<T>;
    }

    put(url: string, body: object) {
        let finalized = false;
        return this.httpClient.put(`${this.root}/${url}`, body).pipe(catchError((e, c) => {
            this.throw(new PithError(e.error));
            return EMPTY;
        }), finalize(() => {
            if (finalized) {
                return;
            }
            finalized = true;
            this.reportProgress({
                loading: false
            });
        }));
    }

    queryChannels() {
        return (this.get('channels') as Observable<{ id: string, title: string }[]>).pipe(map(p => p.map(pp => new Channel(this, pp))));
    }

    queryPlayers(): Observable<RemotePlayer[]> {
        return (this.get('players') as Observable<object[]>).pipe(map(p => {
            return p.map(pp => new RemotePlayer(this, pp as { id: string, friendlyName: string, icons: IconMap }));
        }));
    }

    getChannel(id: string): Observable<Channel | undefined> {
        return this.queryChannels().pipe(map((channels => channels.find(channel => channel.id === id))));
    }

    get errors() {
        return this._errors.asObservable();
    }

    throw(error: PithError) {
        this._errors.next(error);
    }

    private reportProgress(progress: { loading: boolean }) {
        if (progress.loading) {
            this.loadingCounter++;
        } else {
            this.loadingCounter--;
        }
        progress.loading = this.loadingCounter > 0;
        this._progress.next(progress);
    }

    get progress() {
        return this._progress.asObservable();
    }

    on(event: string) {
        return this.eventService.listenFor(event);
    }

    loadSettings() {
        return (this.get('settings') as Observable<PithSettings>);
    }

    storeSettings(settings: PithSettings) {
        return this.put('settings', settings).subscribe();
    }
}

