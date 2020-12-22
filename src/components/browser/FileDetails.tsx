import {Component} from "react";
import {ChannelBrowserProps} from "./ChannelBrowser";
import {BreadCrumb} from "./BreadCrumb";
import {prescale} from "../../util/prescale";
import {ItemActions} from "./ItemActions";

const resolutionMap: [number, number, string][] = [
    [1920, 1920, '1080'],
    [1280, 1280, '720'],
    [720, 720, '480'],
    [1998, 2048, '2K'],
    [3840, 4096, '4K'],
    [7680, 8192, '8K']
];

interface State {
    flags: { domain: string, subdomain: string, value: string }[]
}

export class FileDetails extends Component<ChannelBrowserProps, State> {
    constructor(props: ChannelBrowserProps) {
        super(props);
        this.state={
            flags: []
        };
    }

    load() {
        this.props.playerService.load(this.props.channel, this.props.item!);
    }

    togglePlayState() {
        this.props.channel.togglePlayState(this.props.item!);
    }

    async componentDidMount() {
        const {stream} = await this.props.channel.stream(this.props.item!.id).toPromise();
        const flags: { [flag: string]: boolean } = {};
        const tag = (...args: string[]) => {
            if (args.findIndex(f => !f) === -1) {
                flags[args.join(':')] = true;
            }
        };
        stream!.format!.streams.forEach(s => {
            switch (s.type) {
                case 'audio':
                    tag('audio', 'codec', s.codec);
                    tag('audio', 'language', s.language);
                    tag('audio', 'channelLayout', s.layout);
                    break;
                case 'video':
                    tag('video', 'codec', s.codec);
                    if (s.resolution?.width) {
                        const m = resolutionMap.find(([lowerBound, upperBound]) => s.resolution!.width >= lowerBound && s.resolution!.width <= upperBound)!;
                        tag('video', 'resolution', m[2] || `${s.resolution.width}x${s.resolution.height}`);
                    }
                    break;
                case "subtitle":
                    tag('subtitle', 'language', s.language);
                    break;
            }
        });
        this.setState({
            flags: Object.keys(flags).map(flag => {
                const [domain, subdomain, value] = flag.split(':');
                return {domain, subdomain, value};
            })
        });
    }

    render() {
        const item = this.props.item!;
        return <div className="c-channelDetails">
            <div className="c-channelNav u-hideOnMobile">
                <BreadCrumb channel={this.props.channel} path={this.props.path}></BreadCrumb>
            </div>

            {(this.props.item!.poster || this.props.item!.still) &&
            <img src={prescale(this.props.item!.poster || this.props.item!.still, '680x1000')}
                 className="c-itemDetails__thumbnail"/>}

            <div className="details">
                <ItemActions channel={this.props.channel} item={item} playerService={this.props.playerService}></ItemActions>

                <span className=" c-contentBrowser__itemInfo"><span className="itemshowname">{item.showname}</span><span
                    className=" itemseason">{item.season}</span>{item.episode &&
                <span className="itemepisode">{item.episode}</span>}</span>
                <span className="c-itemDetails__title">
      {item.playable && <a onClick={() => this.togglePlayState()} className="action-markwatched" title="Mark watched">
          <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 100 100" width="24px" height="20px">
              <use xlinkHref={'#' + (item.playState?.status || 'none')}></use>
          </svg>
      </a>}
                    {item.title} {item.year && <span className="c-itemDetails__year">{item.year}</span>}
  </span>
                {item.tagline && <span className="c-itemDetails__tagline">{item.tagline}</span>}
                <span className="c-itemDetails__rating">{item.rating &&
                <span className="stars" data-starrating={item.rating}></span>}{item.rating}</span>
                {item.genres?.length && <span className="c-itemDetails__genres">{item.genres.join(", ")}</span>}
                {item.plot && <span className="c-itemDetails__plot">{item.plot}</span>}
                {item.overview && <span className="c-itemDetails__overview">{item.overview}</span>}
                {item.imdbId && <a href={`http://www.imdb.com/title/${item.imdbId}`} className="link-imdb" target="_blank"></a>}

                <ul className="o-flags">
                    {this.state.flags.map(flag => <li key={flag.domain + "/" + flag.subdomain + "/" + flag.value} data-domain={flag.domain} data-subdomain={flag.subdomain}
                                                      data-flag={flag.value}></li>)}
                </ul>
            </div>
        </div>;
    }
}
