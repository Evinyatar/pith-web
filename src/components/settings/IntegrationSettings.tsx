import {PithClientService, PithSettings} from "../../core/pith-client.service";
import {ValidatedStateManagerProxy} from "../../statemanager/validation";
import {bindCheckbox, bindInput} from "../../statemanager/binding";

function getSonarSettingsUrl(settings: PithSettings) {
    var url = settings.sonarr.url;
    if (!url.endsWith('/')) {
        url += '/';
    }
    url += 'settings/general';
    return url;
}

function getCouchpotatoSettingsUrl(settings: PithSettings) {
    var url = settings.couchpotato.url;
    if (!url.endsWith('/')) {
        url += '/';
    }
    url += 'settings/general';
    return url;
}

export function IntegrationSettings({binder, pithClient}: { binder: ValidatedStateManagerProxy<PithSettings>, pithClient: PithClientService }) {
    const sonarSettingsUrl = getSonarSettingsUrl(binder().get());
    const couchpotatoSettingsUrl = getCouchpotatoSettingsUrl(binder().get());
    return <>
        <div className="card my-3">
            <div className="card-header">
                <input type="checkbox" {...bindCheckbox(binder.sonarr.enabled())} id="sonarrEnabled"/>
                {" "}<label className="m-0" htmlFor="sonarrEnabled">Sonarr</label>
            </div>
            <div className="card-body" hidden={!binder.sonarr.enabled().get()}>
                <div className="form-group">
                    <label htmlFor="sonarrUrl">Sonarr URL</label>
                    <input type="text" {...bindInput(binder.sonarr.url())} name="sonarrUrl" id="sonarrUrl" className="form-control"
                           required={binder.sonarr.enabled().get()}/>
                </div>
                <div className="form-group">
                    <label htmlFor="sonarrApikey">API key{" "}
                        <small>which you can find here: <a target=" _blank" href={sonarSettingsUrl}>{sonarSettingsUrl}</a></small>
                    </label>
                    <input type="text" {...bindInput(binder.sonarr.apikey())} name="sonarrApikey" id="sonarrApikey" className="form-control"
                           required={binder.sonarr.enabled().get()}/>
                </div>
            </div>
        </div>

        <div className="card my-3">
            <div className="card-header">
                <input type="checkbox" {...bindCheckbox(binder.couchpotato.enabled())} id="couchpotatoEnabled"/>
                {" "}<label className="m-0" htmlFor="couchpotatoEnabled">CouchPotato</label>
            </div>
            <div className="card-body" hidden={!binder().get().couchpotato.enabled}>
                <div className="form-group">
                    <label htmlFor="couchpotatoUrl">couchpotato URL</label>
                    <input type="text" {...bindInput(binder.couchpotato.url())} name="couchpotatoUrl" id="couchpotatoUrl"
                           className="form-control"
                           required={binder().get().couchpotato.enabled}/>
                </div>
                <div className="form-group">
                    <label htmlFor="couchpotatoApikey">
                        API key{" "}
                        <small>which you can find here: <a target=" _blank"
                                                           href={couchpotatoSettingsUrl}>{couchpotatoSettingsUrl}</a></small>
                    </label>
                    <input type="text" {...bindInput(binder.couchpotato.apikey())} name="couchpotatoApikey" id="couchpotatoApikey"
                           className="form-control" required={binder().get().couchpotato.enabled}/>
                </div>
            </div>
        </div>

        <div className="card my-3">
            <div className="card-header">
                <input type="checkbox" {...bindCheckbox(binder.upnpsharing.enabled())} id="upnpsharingEnabled"/>
                {" "}<label className="m-0" htmlFor="upnpsharingEnabled">UPnP Sharing</label>
            </div>
            <div className="card-body" hidden={!binder().get().upnpsharing.enabled}>
                With UPnP sharing you'll be able to browse your Pith library from within your favorite UPnP client, such as Kodi or VLC.
            </div>
        </div>

    </>;
}
