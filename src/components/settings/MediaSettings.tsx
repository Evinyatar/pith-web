import {PithClientService, PithSettings} from "../../core/pith-client.service";
import {bindInput, NumberTransformer, Scale, StateManagerProxy} from "../../statemanager/stateManager";
import {LibraryCategorySettings} from "./LibraryCategorySettings";

export function MediaSettings({stateManager, pithClient}: { stateManager: StateManagerProxy<PithSettings>, pithClient: PithClientService }) {
    return <>
        <div className="card my-3">
            <div className="card-header">
                General settings
            </div>
            <div className="card-body">
                <div className="form-group">
                    <label htmlFor="rootDir">Media root directory</label>
                    <input {...bindInput(stateManager.files.rootDir())} className="form-control" required name="rootDir" id="rootDir"/>
                </div>
                <div className="alert alert-danger alert-sm">
                    Changing this path will invalidate all file folders in your media folders. Be sure to remove any invalid folders
                    and clean the library if you change this value.
                </div>

                <div className="form-group">
                    <label htmlFor="scanInterval">Scan for new library items every (minutes):</label>
                    <input
                        type="number" {...bindInput(stateManager.library.scanInterval().transform(Scale(60000)).transform(NumberTransformer()))}
                        className="form-control"
                        required min="1" name="scanInterval" id="scanInterval"/>
                </div>
            </div>
        </div>
        <LibraryCategorySettings binder={stateManager} pithClient={pithClient}/>
    </>;
}
