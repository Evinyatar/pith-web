import {Component} from "react";
import {ChannelBrowserProps} from "./ChannelBrowser";
import {Link} from 'react-router-dom';
import {Dropdown} from "react-bootstrap";
import {ChannelItem} from "../../core/pith-client.service";
import {classNames} from "../../util";
import {prescale} from "../../util/prescale";
import {formatTime} from "../../core/formatTime";
import {BreadCrumb} from "./BreadCrumb";
import InfiniteScroll from 'react-infinite-scroller';

interface State {
    searchString: string
    contents: ChannelItem[]
    filteredContents: ChannelItem[]
    limit: number
}

const fieldDescriptions = {
    year: 'Year',
    rating: 'Rating',
    releaseDate: 'Release date',
    title: 'Title',
    runtime: 'Runtime',
    creationTime: 'Date added'
} as { [field: string]: string };

export class ContainerDetails extends Component<ChannelBrowserProps, State> {
    constructor(props: ChannelBrowserProps) {
        super(props);
        this.state = {
            searchString: '',
            contents: [],
            filteredContents: [],
            limit: 150
        };
    }

    sort(sortField: string) {
        let direction = 1;
        let transform = (x: any) => x;
        switch (sortField) {
            case 'year':
            case 'creationTime':
            case 'releaseDate':
            case 'rating':
                direction = -1;
                break;
            case 'title':
                transform = (x) => x.toUpperCase();
        }
        const compareFn = function (a: any, b: any) {
            return direction * (transform(a[sortField]) < transform(b[sortField]) ? -1 : transform(a[sortField]) > transform(b[sortField]) ? 1 : 0);
        };
        this.setState({
            contents: this.state.contents.sort(compareFn),
            filteredContents: this.state.filteredContents.sort(compareFn)
        });
    }

    search(value: string, forceFull?: boolean) {
        if (!value) {
            this.setState({
                searchString: '',
                filteredContents: this.state.contents
            });
        } else {
            const filter = ((i: any) => i.title.toLocaleLowerCase().indexOf(value.toLocaleLowerCase()) != -1);
            const currentSearch = this.state.searchString;
            let filteredContents;
            if (!forceFull && currentSearch && value.indexOf(currentSearch) != -1) {
                filteredContents = this.state.filteredContents.filter(filter);
            } else {
                filteredContents = this.state.contents.filter(filter);
            }
            this.setState({
                filteredContents,
                searchString: value
            });
        }
    }

    componentDidMount() {
        this.props.channel.listContents(this.props.item?.id).subscribe(contents => this.setState({
            contents: contents,
            filteredContents: contents
        }));
    }

    loadMore() {
        this.setState((state) => ({limit: state.limit + 150}));
    }

    render() {
        const all = [...this.state.filteredContents];
        const view = all.slice(0, this.state.limit);

        return <>
            <div className="c-channelNav u-hideOnMobile">
                <BreadCrumb channel={this.props.channel} path={this.props.path}/>
                {this.props.item?.sortableFields?.length &&
                <Dropdown>
                    <Dropdown.Toggle as={"a"} className="btn"><i className="oi oi-sort-ascending"/></Dropdown.Toggle>
                    <Dropdown.Menu>
                        {
                            this.props.item.sortableFields.map(sortField =>
                                <Dropdown.Item key={sortField}
                                               onClick={() => this.sort(sortField)}>
                                    {fieldDescriptions[sortField]}
                                </Dropdown.Item>
                            )
                        }
                    </Dropdown.Menu>
                </Dropdown>
                }

                <div className="c-channelNav__search">
                    <input type="text" value={this.state.searchString}
                           onChange={(event) => this.search(event.target.value)} role="search"
                           className="c-channelNav__searchInput" required={true}/>
                    <span className="oi oi-magnifying-glass c-channelNav__searchIcon"/>
                </div>
            </div>

            <ul className={classNames("c-contentBrowser", {
                "c-contentBrowser--poster": this.props.item?.preferredView !== 'details',
                "c-contentBrowser--details": this.props.item?.preferredView === 'details'
            })}>
                <InfiniteScroll loadMore={() => this.loadMore()} hasMore={view.length < all.length} loader={<span></span>}>
                    {view.map(item =>
                        <li className={classNames("c-contentBrowser__item", {
                            withposter: item.poster !== undefined,
                            withstill: item.still !== undefined,
                            withinfo: (item.tagline || item.rating || item.genres?.length || item.plot || item.overview) !== undefined,
                            watched: item.playState?.status === 'watched',
                            inprogress: item.playState?.status === 'inprogress',
                            hasnew: item.hasNew,
                            unavailable: item.unavailable
                        })}
                            key={item.id}>

                            <Link className="c-contentBrowser__itemPresentation" to={`/channel/${this.props.channel.id}/${item.id}`}>
                                {item.poster && <div className="c-contentBrowser__poster"
                                                     style={{backgroundImage: `url(${prescale(item.poster, '130x195')})`}}/>}
                                {item.still && !item.poster && <img className="c-contentBrowser__still"
                                                                    src={prescale(item.still, '266x150')}/>}

                                <span className="c-contentBrowser__itemInfo">
                                    {item.title && <span className="r-title">{item.title}</span>}
                                    {item.year && <span className="r-year">{item.year}</span>}
                                    {item.rating && <span className="r-rating"><span className="stars" data-starrating={item.rating}/></span>}
                                    {item.duration && <span className="r-duration">{formatTime(item.duration)}</span>}
                                </span>
                            </Link>
                        </li>
                    )}
                </InfiniteScroll>
            </ul>
        </>;
    }
}
