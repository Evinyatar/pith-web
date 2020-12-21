import {Component} from "react";
import {Player, PlayerStatus} from "../core/pith-client.service";
import {Subscription} from "rxjs";

interface PlayerControlProps {
    player: Player
}

interface PlayerControlState {
    status: PlayerStatus | null
}

export class PlayerControl extends Component<PlayerControlProps, PlayerControlState> {
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

    pause() {
        this.props.player.pause();
    }

    stop() {
        this.props.player.stop();
    }

    play() {
        this.props.player.play();
    }

    render() {
        return <div className="c-statusBar__playbackControls">
            <a className="u-borderlessButton"
               onClick={() => this.pause()}
               hidden={!(this.state.status?.actions?.pause)}><span className="oi oi-media-pause"></span></a>
            <a className="u-borderlessButton"
               onClick={() => this.play()}
               hidden={!(this.state.status?.actions?.play)}><span className="oi oi-media-play"></span></a>
            <a className="u-borderlessButton"
               onClick={() => this.stop()}
               hidden={!(this.state.status?.actions?.stop)}><span className="oi oi-media-stop"></span></a>
        </div>;
    }
}
