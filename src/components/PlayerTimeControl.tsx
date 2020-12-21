import {Component} from "react";
import {Player, PlayerStatus} from "../core/pith-client.service";
import {formatTime} from "../core/formatTime";
import {Subscription} from "rxjs";
import {Scrubber} from "../util/Scrubber";

export interface PlayerControlProps {
    player: Player
}

export interface PlayerControlState {
    status: PlayerStatus | null
}

export class PlayerTimeControl extends Component<PlayerControlProps, PlayerControlState> {
    private subscription: Subscription | null = null;

    constructor(props: PlayerControlProps) {
        super(props);
        this.state = {
            status: null
        };
    }

    componentDidMount() {
        this.subscription = this.props.player.status.subscribe(status => {
            this.setState({status});
        });
    }

    componentWillUnmount() {
        this.subscription?.unsubscribe();
    }

    seekTo(position: number) {
        this.props.player.seek(position);
    }

    render() {
        return <div className="c-statusBar__playbackArea">
            <span className="playback-title">{this.state.status?.position?.title ?? "Unknown"}</span>
            <span className="playback-time">{formatTime(this.state.status?.position?.time)}</span>
            <div className="playback-bar">
                <Scrubber value={this.state.status?.position?.time ?? 0} valueChanged={(time) => this.seekTo(time)}
                          max={this.state.status?.position?.duration ?? 0}></Scrubber>
            </div>
            <span className="playback-runtime">{formatTime(this.state.status?.position?.duration)}</span>
        </div>;
    }
}
