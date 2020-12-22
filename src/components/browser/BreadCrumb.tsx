import {Channel} from "../../core/pith-client.service";
import {Path} from "./ChannelBrowser";
import {Link} from "react-router-dom";

export function BreadCrumb({channel, path}: {channel: Channel, path?: Path}) {
    return <ul className="c-channelNav__breadcrumb">
        <li><Link to={'/channel/' + channel.id} tabIndex={0}>{channel?.title}</Link></li>
        {
            path?.map(pathItem =>
                <li key={pathItem.id}><Link to={`/channel/${channel.id}/${pathItem.id}`}
                                            tabIndex={1}>{pathItem.title}</Link></li>
            )
        }
    </ul>;
}
