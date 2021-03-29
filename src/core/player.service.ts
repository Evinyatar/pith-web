import {Channel, ChannelItem, PithClientService, Player, RemotePlayer} from './pith-client.service';
import {BehaviorSubject} from 'rxjs';

const SELECTED_PLAYER_STORAGE_ITEM = 'selectedPlayer';

export class PlayerService {
    readonly activePlayerSubject: BehaviorSubject<Player | null> = new BehaviorSubject<Player | null>(null);
    readonly playersSubject: BehaviorSubject<Player[]> = new BehaviorSubject<Player[]>([]);

    constructor(private pith: PithClientService) {
        this.pith.queryPlayers().subscribe(p => {
            this.playersSubject.next(p);
            if (this.activePlayerSubject.getValue() == null && p.length > 0) {
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
            let players = this.playersSubject.getValue().concat([player]);
            this.playersSubject.next(players);
            if (!this.activePlayerSubject.getValue()) {
                this.selectPlayer(player);
            }
        });

        this.pith.on('playerdisappeared').subscribe(([event]) => {
            const player = event.player;
            let players = this.playersSubject.getValue().filter((e) => e.id !== player.id);
            this.playersSubject.next(players);

            if (this.activePlayerSubject.getValue()?.id === player.id) {
                if (players.length > 0) {
                    this.selectPlayer(players[0]);
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
        this.activePlayerSubject.next(player);
    }

    get players() {
        return this.playersSubject.asObservable();
    }

    get activePlayer() {
        return this.activePlayerSubject.asObservable();
    }

    play() {
        this.activePlayerSubject.getValue()?.play();
    }

    pause() {
        this.activePlayerSubject.getValue()?.pause();
    }

    stop() {
        this.activePlayerSubject.getValue()?.stop();
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
        this.activePlayerSubject.getValue()!.load(channel, item, seekTime);
    }

    seek(time: number) {
        this.activePlayerSubject.getValue()!.seek(time);
    }

}
