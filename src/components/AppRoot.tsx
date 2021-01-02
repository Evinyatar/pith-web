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
import {SwipeIn} from "../util/SwipeIn";
import {Switch, Route, BrowserRouter as Router, Link, useParams} from "react-router-dom";
import {Settings} from "./settings/Settings";
import {ChannelBrowser} from "./browser/ChannelBrowser";

export interface AppRootState {
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
            navbarExpanded: false,
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
        })

        this.pithClientService.queryChannels().subscribe(channels => {
            this.setState({channels});
        })

        this.playerService.activePlayer.subscribe(player => {
            this.setState({activePlayer: player});
        })
    }

    toggleNavBar() {
        this.setState((state) => ({navbarExpanded: !state.navbarExpanded}));
    }

    toggleStatusBar() {
        this.setState((state) => ({statusbarExpanded: !state.statusbarExpanded}));
    }

    closeNavBar() {
        this.setState(() => ({navbarExpanded: false}));
    }

    selectPlayer(player: Player) {
        this.playerService.selectPlayer(player);
    }

    render() {
        return <Router>
            <div className={classNames("c-statusBar", {
                expanded: this.state.statusbarExpanded,
                loading: this.state.loading
            })}>
                <a className="c-statusBar__sidebarToggle u-borderlessButton"
                   onClick={() => this.toggleNavBar()}><span className="oi oi-menu"/></a>

                {
                    this.state.activePlayer ?
                        <>
                            <PlayerControl player={this.state.activePlayer}/>
                            <PlayerTimeControl player={this.state.activePlayer}/>
                        </>
                        :
                        <div className="c-statusBar__playbackArea c-statusBar__playbackArea--noplayer">
                            No player selected
                        </div>
                }

                <div className="c-statusBar__castSelector">
                    <Dropdown>
                        <Dropdown.Toggle as="a">
                            {this.state.activePlayer?.icons &&
                            <img alt="Active player icon" height="24" src={prescale(this.state.activePlayer.icons['48x48'].url)}/>}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            {
                                this.state.players.map(player => (
                                    <Dropdown.Item key={player.id} onClick={() => this.selectPlayer(player)}>
                                        <img alt={player.friendlyName} src={prescale(player.icons['48x48'].url)} height="24"/> {player.friendlyName}
                                    </Dropdown.Item>
                                ))
                            }
                        </Dropdown.Menu>
                    </Dropdown>
                </div>

                <div className="c-statusBar__expandButton u-borderlessButton" onClick={() => this.toggleStatusBar()}>
                    <i className={classNames("oi", this.state.statusbarExpanded ? "oi-chevron-top" : "oi-chevron-bottom")}/>
                </div>
            </div>

            <SwipeIn
                expanded={this.state.navbarExpanded}
                onChange={ (expanded) => this.setState({navbarExpanded: expanded}) }
                target={
                <div className="c-navBar">
                    <a className="c-navBar__closeBtn" onClick={() => this.closeNavBar()}><i className="oi oi-chevron-left"/></a>
                    <ul>
                        <li className="c-navBar__group">Channels
                            <ul>
                                {
                                    this.state.channels.map(channel => (
                                        <li className="c-navBar__item" key={channel.id}>
                                            <Link to={`/channel/${channel.id}`} onClick={() => this.closeNavBar()}>{channel.title}</Link>
                                        </li>
                                    ))
                                }
                            </ul>
                        </li>
                        <li className="c-navBar__item">
                            <Link to="/settings" onClick={() => this.closeNavBar()}>Settings</Link>
                        </li>
                    </ul>
                </div>
            }>
                <div className="page-host">
                    <Switch>
                        <Route path="/settings"><Settings pithClientService={this.pithClientService}/></Route>
                        <Route path="/channel/:channelId/:itemId+"><ChannelRoute client={this.pithClientService} playerService={this.playerService}/></Route>
                        <Route path="/channel/:channelId"><ChannelRoute client={this.pithClientService} playerService={this.playerService}/></Route>
                    </Switch>
                </div>
            </SwipeIn>
        </Router>;
    }
}

function ChannelRoute({client, playerService}: {client: PithClientService, playerService: PlayerService}) {
    const {channelId, itemId} = useParams() as {channelId: string, itemId?: string};

    return <ChannelBrowser key={channelId+"/"+itemId} channelId={channelId} itemId={itemId} client={client} playerService={playerService}/>
}
