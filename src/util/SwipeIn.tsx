import {ReactNode} from "react";
import {classNames} from "../util";
import './SwipeIn.scss';

interface SwipeInProps {
    target: ReactNode
    expanded: boolean
    onChange: (expanded: boolean) => void
    children: ReactNode
}

export function SwipeIn(props: SwipeInProps) {
    let targetElement : HTMLDivElement | null = null;

    function initHostEvents(node: HTMLDivElement | null) {
        node?.addEventListener("touchstart", (event: TouchEvent) => {
            if(!targetElement) return;

            const touch = event.touches[0];
            let targetStatus = false;
            if (touch.clientX < 20 && !props.expanded) {
                let previousValue = 0;

                targetElement.classList.add("dragging");
                setTargetPosition(targetElement);

                event.preventDefault();
                event.stopPropagation();

                const touchmove = (event: TouchEvent) => {
                    const touch = event.touches[0];
                    targetElement!.style.left = Math.min(0, touch.clientX - targetElement!.offsetWidth) + 'px';
                    targetStatus = touch.clientX > previousValue;
                    previousValue = touch.clientX;
                }

                const touchend = (event: TouchEvent) => {
                    targetElement!.classList.remove("dragging");
                    setTargetPosition(targetElement!);
                    if(targetStatus) {
                        props.onChange(true);
                    }
                    node!.removeEventListener("touchmove", touchmove);
                    node!.removeEventListener("touchend", touchend);
                }

                node!.addEventListener("touchmove", touchmove);
                node!.addEventListener("touchend", touchend);
            }
        })
    }

    function setTargetPosition(target: HTMLDivElement) {
        target.style.left = -target.offsetWidth + "px";
    }

    function initTargetEvents(node: HTMLDivElement | null) {
        node?.addEventListener("touchstart", (event) => {
            if(!targetElement) {
                return;
            }

            const target = targetElement!;
            const firstValue = event.touches[0].clientX;
            let previousValue = firstValue;
            let shouldCloseOnEnd = false;
            target.classList.add("dragging");
            target.style.left = "0";

            const touchmove = (event: TouchEvent) => {
                const touch = event.touches[0];
                target!.style.left = Math.min(0, touch.clientX - firstValue!) + 'px';
                shouldCloseOnEnd = previousValue > touch.clientX;
                previousValue = touch.clientX;
                event.preventDefault();
                event.stopPropagation();
            }

            const touchend = (event: TouchEvent) => {
                target.classList.remove("dragging");
                setTargetPosition(target);
                if(shouldCloseOnEnd) {
                    props.onChange(false);
                }

                target.removeEventListener("touchend", touchend);
                target.removeEventListener("touchmove", touchmove);
            }

            target.addEventListener("touchend", touchend);
            target.addEventListener("touchmove", touchmove);
        })
    }

    return <div>
        <div
            ref={node => initHostEvents(node)}
        >
            {props.children}
        </div>
        <div
            ref={(el) => {targetElement = el; initTargetEvents(el); el && setTargetPosition(el)}}
            className={classNames('c-swipeIn', {
                expanded: props.expanded
            })}
        >
            {props.target}
        </div>
    </div>;
}
