import {Component} from "react";

export interface ScrubberProps {
    value: number
    max: number
    valueChanged: (newValue: number) => void
}

export class Scrubber extends Component<ScrubberProps, {}> {
    private container: HTMLDivElement | null = null;

    handleSeekClick(event: MouseEvent) {
        let targetTime = this.props.max * event.offsetX / this.container!.offsetWidth;
        this.props.valueChanged(targetTime);
    }

    render() {
        return (
            <div ref={(el) => this.container = el}
                 className="progress progress-thin flex-grow"
                 onClick={(event) => this.handleSeekClick(event.nativeEvent)}>
                <div className="progress-bar" role="progressbar" style={{width: (this.props.value / this.props.max * 100 + '%')}}/>
            </div>
        );
    }
}
