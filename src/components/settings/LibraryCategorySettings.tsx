import {PithSettings} from "../../core/pith-client.service";
import {bindCheckbox, StateManagerProxy} from "../../statemanager/stateManager";

export function LibraryCategorySettings({binder}: { binder: StateManagerProxy<PithSettings> }) {
    function removeLibraryContainer(folder: number) {

    }

    function addLibraryContainer() {

    }

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
                                                                           title="Enable scanning"/> {folder.containerId}</label>
                            </div>
                            <i>contains</i>
                            <div className="custom-control custom-control-inline">
                                <select className="form-control" required>
                                    <option value="movies">Movies</option>
                                    <option value="tvshows">TV Shows</option>
                                    <option value="music">Music</option>
                                </select>
                            </div>
                            <a className="float-right" onClick={evt => removeLibraryContainer(idx)} title="Remove folder">
                                <span className="oi oi-trash"></span>
                            </a>
                        </li>))
                }
            </ul>
            <div className="card-footer border-top-0">
                <a onClick={evt => addLibraryContainer()} tabIndex={0}><i className="oi oi-plus"></i> Add folder
                </a>
            </div>
        </div>);
}
