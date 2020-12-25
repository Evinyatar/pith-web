import {Component} from "react";
import {ChannelBrowserProps} from "./ChannelBrowser";
import {BreadCrumb} from "./BreadCrumb";
import {prescale} from "../../util/prescale";
import {ChannelItem, Season, Show} from "../../core/pith-client.service";
import {Dropdown} from "react-bootstrap";
import {OtherItemActions} from "./ItemActions";
import {classNames} from "../../util";
import {formatDate} from "../../core/formatTime";

interface State {
    selectedSeason: Season
}

export class TvShowDetails extends Component<ChannelBrowserProps, State> {
    constructor(props: ChannelBrowserProps) {
        super(props);

        const show = props.item as Show;
        const seasons = show.seasons.sort((a, b) =>
            a.season === b.season ? 0 :
                a.season === 0 ? 1 :
                    b.season === 0 ? -1 :
                        a.season - b.season);
        let selectedSeason = seasons[0];

        for (let x = 1, l = seasons.length; x < l; x++) {
            const season = seasons[x];
            if ((season.playState?.status === 'inprogress')
                || (seasons[x - 1].playState?.status === 'watched')) {
                selectedSeason = season;
            }
        }
        this.state = {
            selectedSeason
        }
    }

    private togglePlayState(episode: ChannelItem) {
        this.props.channel.togglePlayState(episode);
    }

    private selectSeason(season: Season) {
        this.setState({
            selectedSeason: season,
        });
    }

    private episodesForSeason(episodes: ChannelItem[], season: Season) {
        return episodes.filter(episode => episode.season === season.season);
    }

    render() {
        const item = this.props.item! as Show;
        const selectedSeason = this.state.selectedSeason;
        const episodes = this.episodesForSeason(item.episodes, selectedSeason);

        return <div className="c-channelTvDetails">
            <div className="c-channelNav u-hideOnMobile">
                <BreadCrumb channel={this.props.channel} path={this.props.path}/>
            </div>

            {item.banner &&
            <img className="c-itemDetails__banner" src={prescale(item.banner)} alt="banner"/>}
            {(item.poster || item.still) &&
            <img className="c-itemDetails__thumbnail" src={prescale(item.poster || item.still, '680x1000')} alt="poster"/>}

            <div className="c-itemDetails__episodeGuide">
                <ul className="detailtabs seasons">
                    {item.seasons.map(season => (
                        <li onClick={() => this.selectSeason(season)}
                            key={season.season}
                            className={classNames({
                                selected: selectedSeason === season,
                                inprogress: season.playState.status === 'inprogress',
                                watched: season.playState.status === 'watched'
                            })}>{season.season === 0 ? 'Specials' : season.season}</li>
                    ))}
                </ul>
                <ul className="seasondetails">
                    {episodes.map(episode => (
                        <li key={episode.id}
                            className={classNames({
                            watched: episode.playState?.status === 'watched',
                            inprogress: episode.playState?.status === 'inprogress',
                            unavailable: episode.unavailable
                        })}>
                            {
                                episode.playable &&
                                <div className="seasondetails__thumb">
                                    <i className="oi oi-play-circle u-cursor__pointer"
                                       onClick={() => this.props.playerService.load(this.props.channel, episode)}/>
                                </div>
                            }
                            <span className="seasondetails__title">
                            {
                                episode.playable &&
                                <a onClick={() => this.togglePlayState(episode)} className="action-markwatched" title="Mark watched">
                                    <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 100 100" width="24px" height="20px">
                                        <use xlinkHref={'#' + (episode.playState?.status || 'none')}/>
                                    </svg>
                                </a>
                            }
                                <span className="episode-no">{episode.episode}</span>
                                <span className="episode-title">{episode.title}</span>
                            </span>
                            <span className="seasondetails__info">
                                <span className="episode-airdate">{formatDate(episode.airDate)}</span>
                            </span>
                            <span className="seasondetails__plot">
                                <span className="episode-synopsis">{episode.overview}</span>
                            </span>
                            <span className="seasondetails__otheractions">
                            {
                                episode.playable &&
                                <Dropdown>
                                    <Dropdown.Toggle as="a"/>
                                    <Dropdown.Menu>
                                        <OtherItemActions channel={this.props.channel} item={episode}
                                                          playerService={this.props.playerService}/>
                                    </Dropdown.Menu>
                                </Dropdown>
                            }
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>;
    }
}
