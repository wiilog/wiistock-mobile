import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
    selector: 'wii-logo-card',
    templateUrl: 'logo-card.component.html',
    styleUrls: ['./logo-card.component.scss']
})
export class LogoCardComponent {

    @Input()
    public width: string;

    @Input()
    public height: string;

    @Input()
    public src: string;

    @Input()
    public alt: string;

    @Input()
    public id: number;

    @Input()
    public selected: boolean;

    @Output()
    public action: EventEmitter<Event>;

    public constructor() {
        this.selected = false;
        this.action = new EventEmitter<Event>();
    }

    public onLogoClick(event: Event) {
        this.action.emit(event)
        event.stopPropagation();
    }
}
