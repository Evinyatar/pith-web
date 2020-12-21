import {Component} from "react";
import {Dropdown} from "react-bootstrap";
import {HttpClient} from "../core/HttpClient";
import {Channel, PithClientService, Player, PlayerStatus} from "../core/pith-client.service";
import {PithEventsService} from "../core/pith-events.service";
import {PlayerService} from "../core/player.service";
import {classNames} from "../util";
import {prescale} from "../util/prescale";
import '../AppRoot.scss';
import {PlayerTimeControl} from "./PlayerTimeControl";
import {PlayerControl} from "./PlayerControl";

export interface AppRootState {
    status?: PlayerStatus
    navbarExpanded: boolean
    statusbarExpanded: boolean
    loading: boolean
    players: Player[]
    activePlayer: Player | null
    channels: Channel[]
}

export class AppRoot extends Component<any, AppRootState> {
    pithClientService: PithClientService;
    playerService: PlayerService;
    pithEventsService: PithEventsService;

    constructor(props: any) {
        super(props);
        this.state = {
            navbarExpanded: true,
            statusbarExpanded: false,
            loading: false,
            activePlayer: null,
            players: [],
            channels: []
        };


        this.pithEventsService = new PithEventsService();
        this.pithClientService = new PithClientService(new HttpClient(), this.pithEventsService);
        this.playerService = new PlayerService(this.pithClientService);
    }

    componentDidMount() {
        this.pithEventsService.connect();

        this.playerService.players.subscribe(players => {
            this.setState({players});
        });

        this.pithClientService.queryChannels().subscribe(channels => {
            this.setState({channels});
        });
    }

    toggleNavBar() {
        this.setState((state) => ({navbarExpanded: !state.navbarExpanded}));
    }

    toggleStatusBar() {
        this.setState((state) => ({statusbarExpanded: !state.statusbarExpanded}));
    }

    selectPlayer(player: Player) {
        this.setState({activePlayer: player});
    }

    render() {
        return <div>
            <div className={classNames("c-statusBar", {
                expanded: this.state.statusbarExpanded,
                loading: this.state.loading
            })}>
                <a className="c-statusBar__sidebarToggle u-borderlessButton"
                   onClick={() => this.toggleNavBar()}><span className="oi oi-menu"></span></a>

                { this.state.activePlayer && <PlayerControl player={this.state.activePlayer}></PlayerControl>}

                {
                    this.state.activePlayer ?
                        <PlayerTimeControl player={this.state.activePlayer}></PlayerTimeControl>
                        :
                        <div className="c-statusBar__playbackArea c-statusBar__playbackArea--noplayer">
                            No player selected
                        </div>
                }

                <div className="c-statusBar__castSelector">
                    <Dropdown>
                        <Dropdown.Toggle as="a">
                            {this.state.activePlayer?.icons &&
                            <img height="24" src={prescale(this.state.activePlayer.icons['48x48'].url)}/>}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            {
                                this.state.players.map(player => (
                                    <Dropdown.Item key={player.id} onClick={() => this.selectPlayer(player)}>
                                        <img src={prescale(player.icons['48x48'].url)} height="24"/> {player.friendlyName}
                                    </Dropdown.Item>
                                ))
                            }
                        </Dropdown.Menu>
                    </Dropdown>
                </div>

                <div className="c-statusBar__expandButton u-borderlessButton">
                    <i className={classNames("oi", this.state.statusbarExpanded ? "oi-chevron-top" : "oi-chevron-bottom")}></i>
                </div>

                <div className={classNames("c-navBar", {
                    closed: this.state.navbarExpanded
                })}>
                    <a className="c-navBar__closeBtn" onClick={() => this.toggleNavBar()}><i className="oi oi-chevron-left"></i></a>
                    <ul>
                        <li className="c-navBar__group">Channels
                            <ul>
                                {
                                    this.state.channels.map(channel => (
                                        <li className="c-navBar__item" key={channel.id}>
                                            <a href="channel/{channel.id}">{channel.title}</a>
                                        </li>
                                    ))
                                }
                            </ul>
                        </li>
                        <li className="c-navBar__item">
                            <a href="settings">Settings</a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>;
    }
}
