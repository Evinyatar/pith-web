import {Component} from "react";
import {Channel, ChannelItem, PithClientService} from "../../core/pith-client.service";
import {prescale} from "../../util/prescale";
import {FileDetails} from "./FileDetails";
import {ContainerDetails} from "./ContainerDetails";
import {ShowDetails} from "./ShowDetails";
import {forkJoin, Observable, of} from "rxjs";
import {PlayerService} from "../../core/player.service";
export type Path = { id: string, title:
        string }[];

interface Props {
    channelId: string
    itemId?: string
    client: PithClientService
    playerService: PlayerService
}

export interface ChannelBrowserProps {
    channel: Channel
    item?: ChannelItem
    path?: Path
    playerService: PlayerService
}

interface State {
    path?: Path
    channel?: Channel
    item?: ChannelItem
}

export class ChannelBrowser extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {}
    }

    async componentDidMount() {
        const channel = await this.props.client.getChannel(this.props.channelId).toPromise();
        const item = this.props.itemId ? await channel?.getDetails(this.props.itemId).toPromise() : undefined;
        const path = item ? await this.buildPath(channel!, item.id).toPromise() : undefined;
        this.setState({
            channel,
            item,
            path
        })
    }

    getViewForItem() {
        if(this.state?.channel) {
            if (this.state.item?.type === 'file') {
                return <FileDetails channel={this.state.channel!} item={this.state.item} path={this.state.path} playerService={this.props.playerService}></FileDetails>;
            // } else if (this.state.item?.mediatype === 'show') {
            //     return <ShowDetails channel={this.state.channel!} item={this.state.item} path={this.state.path}></ShowDetails>;
            } else {
                return <ContainerDetails channel={this.state.channel!} item={this.state.item} path={this.state.path} playerService={this.props.playerService}></ContainerDetails>;
            }
        } else {
            return <></>;
        }
    }

    buildPath(channel: Channel, id: string): Observable<Path> {
        if (!id) {
            return of([]);
        }
        const path = id.split('/').map((a, i, r) => r.slice(0, i + 1).join('/'));
        path.pop();
        if (!path.length) {
            return of([]);
        }
        return forkJoin(path.map(p => channel.getDetails(p, {noRefresh: true})));
    }

    render() {
        return <>
            {this.state?.item?.backdrop &&
            <div style={{backgroundImage: 'url(' + prescale(this.state.item.backdrop) + ')'}} className="c-backdrop"></div>}
            {this.getViewForItem()}
        </>;
    }
}
