import {Channel, ChannelItem} from "../../core/pith-client.service";
import {Button, ButtonGroup, Dropdown} from "react-bootstrap";
import {PlayerService} from "../../core/player.service";

export function OtherItemActions({channel, item, playerService}: { channel: Channel, item: ChannelItem, playerService: PlayerService }) {
    async function vlc(action: 'stream' | 'download') {
        let stream = await channel.stream(item.id).toPromise();
        window.location.href = `vlc-x-callback://x-callback-url/${action}?url=${encodeURIComponent(stream.stream.url)}&x-success=${encodeURIComponent(document.location.href)}`;
    }

    function togglePlayState() {
    }

    let showVlc = false;
    if (/android/i.test(navigator.userAgent) || (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream)) {
        showVlc = true;
    }

    return <>
        {showVlc && item.playable && <>
            <Dropdown.Item onClick={() => vlc('stream')}>Stream in VLC</Dropdown.Item>
            <Dropdown.Item onClick={() => vlc('download')}>Download in VLC</Dropdown.Item>
            <Dropdown.Divider></Dropdown.Divider>
        </>}
        {item.playable && (
            item.playState?.status === 'watched' ?
                <Dropdown.Item onClick={() => togglePlayState()}>Mark unwatched</Dropdown.Item>
                :
                <Dropdown.Item onClick={() => togglePlayState()}>Mark watched</Dropdown.Item>
        )}
    </>;
}

export function ItemActions({channel, item, playerService}: { channel: Channel, item: ChannelItem, playerService: PlayerService }) {
    return <div className="c-itemDetails__actions">
        <Dropdown as={ButtonGroup}>
            {item.playable &&
            <Button variant="primary" onClick={() => playerService.load(channel, item)}><i className="oi oi-media-play"></i> Play</Button>}
            {item.playable && <Dropdown.Toggle split variant="primary"></Dropdown.Toggle>}
            <Dropdown.Menu>
                <OtherItemActions channel={channel} item={item} playerService={playerService}></OtherItemActions>
            </Dropdown.Menu>
        </Dropdown>
    </div>;
}
