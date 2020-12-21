import {Component, ReactNode} from "react";
import {classNames} from "../util";
import './SwipeIn.scss';

interface SwipeInProps {
    target: ReactNode
    expanded: boolean
    onChange: (expanded: boolean) => void
}

interface SwipeInState {
    dragging: boolean
    previousValue: number | null
    firstValue: number | null
    pos: string | null
}

export class SwipeIn extends Component<SwipeInProps, SwipeInState> {
    private targetElement: HTMLDivElement | null = null;

    constructor(props: SwipeInProps) {
        super(props);
        this.state = {
            dragging: false,
            previousValue: null,
            firstValue: null,
            pos: null
        };
    }

    private touchStartHandler(event: TouchEvent) {
        const touch = event.touches[0];
        if (touch.clientX < 20 && !this.props.expanded) {
            this.setState({
                dragging: true,
                previousValue: 0
            });
            event.preventDefault();
            event.stopPropagation();
        }
    }

    private touchEndHandler() {
        if (this.state.dragging) {
            this.setState({
                dragging: false,
                pos: null
            });
        }
    }

    private touchMoveHandler(event: TouchEvent) {
        const touch = event.touches[0];
        if (!this.state.dragging) {
            return;
        }
        this.setState({
            pos: Math.min(0, touch.clientX - this.targetElement!.offsetWidth) + 'px',
            previousValue: touch.clientX
        });
        this.props.onChange(this.state.previousValue! < touch.clientX)
    }

    pageHostTouchStartHandler(event: TouchEvent) {
        this.setState({
            firstValue: event.touches[0].clientX,
            previousValue: event.touches[0].clientX,
            dragging: true,
            pos: "0"
        });
    }

    pageHostTouchEndHandler(event: TouchEvent) {
        this.setState({
            pos: null,
            dragging: false
        });
    }

    pageHostTouchMoveHandler(event: TouchEvent) {
        this.setState({
            pos: Math.min(0, event.touches[0].clientX - this.state.firstValue!) + 'px',
            previousValue: event.touches[0].clientX
        });
        this.props.onChange(this.state.previousValue! < event.touches[0].clientX);
        event.preventDefault();
        event.stopPropagation();
    }

    render() {
        return <div>
            <div
                onTouchStart={(event) => this.touchStartHandler(event.nativeEvent)}
                onTouchMove={(event) => this.touchMoveHandler(event.nativeEvent)}
                onTouchEnd={(event) => this.touchEndHandler()}
            >
                {this.props.children}
            </div>
            <div
                onTouchStart={(event) => this.pageHostTouchStartHandler(event.nativeEvent)}
                onTouchEnd={(event) => this.pageHostTouchEndHandler(event.nativeEvent)}
                onTouchMove={(event) => this.pageHostTouchMoveHandler(event.nativeEvent)}
                ref={(el) => this.targetElement = el}
                className={classNames('c-swipeIn', {
                    dragging: this.state.dragging,
                    expanded: this.props.expanded
                })}

                style={
                    {
                        left: this.state.pos ?? undefined
                    }
                }
            >
                {this.props.target}
            </div>
        </div>;
    }
}
