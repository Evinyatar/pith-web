import {NumberTransformer} from "../../statemanager/stateManager";
import {PithClientService, PithSettings} from "../../core/pith-client.service";
import {ValidatedStateManagerProxy} from "../../statemanager/validation";
import {bindInput} from "../../statemanager/binding";

export function AdvancedSettings({binder, pithClient}: { binder: ValidatedStateManagerProxy<PithSettings>, pithClient: PithClientService }) {
    return <>
        <div className="card my-3">
            <div className="card-header">
                Database settings
            </div>
            <div className="card-body">
                <label htmlFor="mongoUrl">MongoDB Connection String</label>
                <input type="text" {...bindInput(binder.mongoUrl())} className="form-control" name="mongoUrl" id="mongoUrl"
                       required/>
            </div>
        </div>
        <div className="card my-3">
            <div className="card-header">
                Server settings
            </div>
            <div className="card-body">
                <div className="form-group">
                    <label htmlFor="httpPort">HTTP port</label>
                    <input type="number" required {...bindInput(binder.httpPort().transform(NumberTransformer()))} className="form-control"
                           id="httpPort" name="httpPort"/>
                </div>
                <div className="form-group">
                    <label htmlFor="bindAddress">Bind address</label>
                    <input type="text" {...bindInput(binder.bindAddress())} className="form-control" id="bindAddress"
                           placeholder="Leave empty for auto-detect"/>
                </div>
            </div>
        </div></>;
}
