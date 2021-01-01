import {Button, ListGroup, Modal} from "react-bootstrap";
import {Channel, ChannelItem, PithClientService} from "../../core/pith-client.service";
import {Component} from "react";

interface ChannelAndItem {
    channel: Channel | null
    container: ChannelItem | null
}

interface Props {
    show: boolean,
    onFinish: (result?: { channelId: string, containerId: string | null }) => void,
    pithClient: PithClientService
}

export class ContainerChooser extends Component<Props, {
    stateHistory: ChannelAndItem[],
    content: (ChannelItem | Channel)[],
    limit: number
}> {
    constructor(props: Props) {
        super(props);
        this.state = {
            stateHistory: [],
            content: [],
            limit: 0
        };
    }

    get currentState() {
        return this.state.stateHistory[0];
    }

    componentDidMount() {
        this.setHistory([{
            channel: null,
            container: null
        }]);
    }

    async load(state: ChannelAndItem) : Promise<(Channel|ChannelItem)[]> {
        if (state.channel === null) {
            return await this.props.pithClient.queryChannels().toPromise();
        } else {
            return await state.channel.listContents(state.container?.id).toPromise();
        }
    }

    go(where: Channel | ChannelItem) {
        const currentState = this.currentState;
        const newState = {
            channel: currentState.channel || where as Channel,
            container: currentState.channel ? where as ChannelItem : null
        };
        this.setHistory([newState, ...this.state.stateHistory]);
    }

    goBack() {
        this.setHistory(this.state.stateHistory.slice(1))
    }

    select() {
        this.props.onFinish({
            channelId: this.currentState.channel!.id!,
            containerId: this.currentState.container?.id ?? null
        })
    }

    showMore() {
        this.setState({
            ...this.state,
            limit: this.state.limit * 20
        })
    }

    async setHistory(stateHistory: ChannelAndItem[]) {
        this.setState({
            ...this.state,
            content: await this.load(stateHistory[0]),
            stateHistory: stateHistory,
            limit: 20
        })
    }

    render() {
        const state = this.currentState;

        /**
         * <div class="modal-header">
         <h4 class="modal-title">
         {{ state.container?.title || state.channel?.title || "Channels" }}
         </h4>
         <button type="button" class="close" data-dismiss="modal" (click)="activeModal.dismiss()"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
         </div>
         <ul class="list-group list-group-flush">
         <li *ngIf="history.length > 0" class="list-group-item" (click)="goBack()"><a tabindex="0"><i>Go back</i></a></li>
         <li class="list-group-item" *ngFor="let item of view" (click)="go(item)">
         <a tabindex="0">{{item.title}}</a>
         </li>
         <li class="list-group-item" *ngIf="contents?.length > limit" (click)="showMore()"><a tabindex="0"><i>Show more &hellip;</i></a></li>
         </ul>
         <div class="modal-footer">
         <button type="button" class="btn btn-primary pull-right" (click)="select(state.channel, state.container)">Select</button>
         </div>

         */

        const {content, stateHistory, limit} = this.state;

        return <Modal show={this.props.show} onHide={this.props.onFinish}>
            <Modal.Header closeButton>
                <Modal.Title>{state?.container?.title || state?.channel?.title || "Channels"}</Modal.Title>
            </Modal.Header>
            <ListGroup variant="flush">
                {stateHistory.length > 1 && <ListGroup.Item onClick={() => this.goBack()}><i>Go back</i></ListGroup.Item>}
                {content.slice(0, this.state.limit).map(item => (
                    <ListGroup.Item key={item.id} onClick={() => this.go(item)}><a tabIndex={0}>{item.title}</a></ListGroup.Item>
                ))}
                {content?.length > limit && <ListGroup.Item onClick={() => this.showMore()}><i>Show more &hellip;</i></ListGroup.Item>}
            </ListGroup>
            <Modal.Footer>
                <Button variant="primary" disabled={state === undefined || state.channel === null}
                        onClick={() => this.select()}>Select</Button>
            </Modal.Footer>
        </Modal>;
    }

}
