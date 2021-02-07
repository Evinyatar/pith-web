import {PithClientService, PithSettings} from "../../core/pith-client.service";
import {StateManagerProxy} from "../../statemanager/stateManager";
import {useState} from "react";
import {ContainerChooser} from "./ContainerChooser";
import {bindCheckbox, bindInput} from "../../statemanager/binding";

export function LibraryCategorySettings({binder, pithClient}: { binder: StateManagerProxy<PithSettings>, pithClient: PithClientService }) {
    function removeLibraryContainer(folder: number) {
        binder.library.folders.splice(folder, 1);
    }

    function addLibraryContainer() {
        openContainerChooser(true);
    }

    function finishAddLibraryContainer(result?: {channelId: string, containerId: string | null}) {
        openContainerChooser(false);
        if(result) {
            binder.library.folders.push({
                channelId: result.channelId,
                containerId: result.containerId,
                scanAutomatically: true,
                contains: ""
            })
        }
    }

    let [showContainerChooser, openContainerChooser] = useState(false);

    return (
        <div className="card my-3">
            <div className="card-header border-bottom-0">Library folders</div>
            <ul className="list-group list-group-flush">
                {
                    binder.library.folders.map((folder, idx) => (
                        <li className="list-group-item">
                            <div className="custom-control custom-checkbox custom-control-inline">
                                <label className="form-check-label"><input className="form-check-input"
                                                                           type="checkbox" {...bindCheckbox(folder.scanAutomatically())}
                                                                           title="Enable scanning"/> {folder.containerId().get()}</label>
                            </div>
                            <i>contains</i>
                            <div className="custom-control custom-control-inline">
                                <select className="form-control" required {...bindInput(folder.contains())}>
                                    <option value="movies">Movies</option>
                                    <option value="tvshows">TV Shows</option>
                                    <option value="music">Music</option>
                                </select>
                            </div>
                            <a className="float-right" onClick={() => removeLibraryContainer(idx)} title="Remove folder">
                                <span className="oi oi-trash"></span>
                            </a>
                        </li>))
                }
            </ul>
            <div className="card-footer border-top-0">
                <a onClick={() => addLibraryContainer()} tabIndex={0}><i className="oi oi-plus"></i> Add folder
                </a>
            </div>

            {showContainerChooser && <ContainerChooser show={showContainerChooser} onFinish={finishAddLibraryContainer} pithClient={pithClient} />}
        </div>);
}
