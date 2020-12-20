import {Channel, ChannelItem, PithClientService, Player, RemotePlayer} from './pith-client.service';
import {BehaviorSubject, Subject} from 'rxjs';

const SELECTED_PLAYER_STORAGE_ITEM = 'selectedPlayer';

export class PlayerService {
    private _activePlayer: Player | null = null;
    private _players: Player[] = [];

    readonly _activePlayerSubject: Subject<Player | null> = new BehaviorSubject<Player | null>(null);
    readonly _playersSubject: Subject<Player[]> = new BehaviorSubject<Player[]>([]);

    constructor(private pith: PithClientService) {
        this.pith.queryPlayers().subscribe(p => {
            this._players = p;
            this._playersSubject.next(p);
            if (this._activePlayer == null && p.length > 0) {
                let selectedPlayer = localStorage.getItem(SELECTED_PLAYER_STORAGE_ITEM);
                let player: Player | undefined;
                if (selectedPlayer) {
                    player = p.find(p => p.id === selectedPlayer);
                }
                if (!player) {
                    player = p[0];
                }
                this.selectPlayer(player);
            }
        });

        this.pith.on('playerregistered').subscribe(([event]) => {
            const player = new RemotePlayer(this.pith, event.player);
            this._players = this._players.concat([player]);
            this._playersSubject.next(this._players);
            if (!this._activePlayer) {
                this.selectPlayer(player);
            }
        });

        this.pith.on('playerdisappeared').subscribe(([event]) => {
            const player = event.player;
            this._players = this._players.filter((e) => e.id !== player.id);
            this._playersSubject.next(this._players);

            if (this._activePlayer && this._activePlayer.id === player.id) {
                if (this._players.length > 0) {
                    this.selectPlayer(this._players[0]);
                } else {
                    this.selectPlayer(null);
                }
            }
        });
    }

    selectPlayer(player: Player | null) {
        if (player) {
            localStorage.setItem(SELECTED_PLAYER_STORAGE_ITEM, player.id);
        } else {
            localStorage.removeItem(SELECTED_PLAYER_STORAGE_ITEM);
        }
        this._activePlayer = player;
        this._activePlayerSubject.next(player);
    }

    get players() {
        return this._playersSubject.asObservable();
    }

    get activePlayer() {
        return this._activePlayerSubject.asObservable();
    }

    play() {
        this._activePlayer?.play();
    }

    pause() {
        this._activePlayer?.pause();
    }

    stop() {
        this._activePlayer?.stop();
    }

    async load(channel: Channel, item: ChannelItem) {
        let seekTime = undefined;
        if (item.playState && item.playState.status === 'inprogress') {
            // const modal = this.ngbModalService.open(PlaybackModalComponent);
            // modal.componentInstance.item = item;
            // try {
            // const result = await modal.result;
            // if (result.resume) {
            //   seekTime = item.playState.time;
            // }
            // } catch (err) {
            //   return;
            // }
        }
        this._activePlayer!.load(channel, item, seekTime);
    }

    seek(time: number) {
        this._activePlayer!.seek(time);
    }

}
