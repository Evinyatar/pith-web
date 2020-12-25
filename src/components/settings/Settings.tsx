import {Component} from "react";
import {PithClientService, PithSettings} from "../../core/pith-client.service";
import {Tab, Tabs} from "react-bootstrap";

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
        this.setState({
            settings
        });
    }

    save(settings: PithSettings) {
        this.props.pithClientService.storeSettings(settings);
    }

    render() {
        return this.state.settings ?
            <div className="container">
                <button className="btn btn-primary float-right" onClick={() => this.save(this.state.settings!)}>Save</button>
                <Tabs defaultActiveKey="media" id="settingsTabPanel">
                    <Tab eventKey="media" title="Media">
                        Media settings
                    </Tab>
                    <Tab eventKey="advanced" title="Advanced">
                        Advanced settings
                    </Tab>
                    <Tab eventKey="integrations" title="Integrations">
                        Integrations
                    </Tab>
                </Tabs>
            </div> :
            <></>;
    }
}
