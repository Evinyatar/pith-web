import {Component} from "react";
import {PithClientService, PithSettings} from "../../core/pith-client.service";
import {Tab, Tabs} from "react-bootstrap";
import {MediaSettings} from "./MediaSettings";
import {createStateManager} from "../../statemanager/stateManager";
import {AdvancedSettings} from "./AdvancedSettings";
import {IntegrationSettings} from "./IntegrationSettings";

interface State {
    settings: PithSettings | undefined;
}

interface Props {
    pithClientService: PithClientService
}

export class Settings extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            settings: undefined
        }
    }

    async componentDidMount() {
        const settings = await this.props.pithClientService.loadSettings().toPromise();
        this.setState({settings});
    }

    save(settings: PithSettings) {
        this.props.pithClientService.storeSettings(settings);
    }

    render() {
        if(!this.state.settings) {
            return <></>;
        }
        const stateManager = createStateManager(this.state.settings, s => this.setState({settings: s})).proxy();
        return <div className="container">
                <button className="btn btn-primary float-right" onClick={() => this.save(this.state.settings!)}>Save</button>
                <Tabs defaultActiveKey="media" id="settingsTabPanel">
                    <Tab eventKey="media" title="Media">
                        <MediaSettings stateManager={stateManager} pithClient={this.props.pithClientService} />
                    </Tab>
                    <Tab eventKey="advanced" title="Advanced">
                        <AdvancedSettings binder={stateManager} pithClient={this.props.pithClientService}/>
                    </Tab>
                    <Tab eventKey="integrations" title="Integrations">
                        <IntegrationSettings binder={stateManager} pithClient={this.props.pithClientService}/>
                    </Tab>
                </Tabs>
            </div>
    }
}
