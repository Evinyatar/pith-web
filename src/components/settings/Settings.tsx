import {Component} from "react";
import {PithClientService, PithSettings} from "../../core/pith-client.service";
import {Tab, Tabs} from "react-bootstrap";
import {MediaSettings} from "./MediaSettings";
import {AdvancedSettings} from "./AdvancedSettings";
import {IntegrationSettings} from "./IntegrationSettings";
import {ValidationResults, withValidation} from "../../statemanager/validation";

interface State {
    value: PithSettings | undefined;
    validationResults: ValidationResults
}

interface Props {
    pithClientService: PithClientService
}

export class Settings extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            value: undefined,
            validationResults: []
        }
    }

    async componentDidMount() {
        const settings = await this.props.pithClientService.loadSettings().toPromise();
        this.setState({value: settings, validationResults: []});
    }

    save(settings: PithSettings) {
        this.props.pithClientService.storeSettings(settings);
    }

    render() {
        if(!this.state.value) {
            return <></>;
        }
        const stateManager = withValidation(this.state as {value: PithSettings, validationResults: ValidationResults}, () => {

        }, (state) => this.setState(state)).proxy();
        return <div className="container">
                <button className="btn btn-primary float-right" onClick={() => this.save(this.state.value!)}>Save</button>
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
