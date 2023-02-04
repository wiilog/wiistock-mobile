import {Component, HostBinding, Input} from '@angular/core';
import {BadgeConfig} from './badge-config';


@Component({
    selector: 'wii-badge',
    templateUrl: 'badge.component.html',
    styleUrls: ['./badge.component.scss']
})
export class BadgeComponent {

    @Input()
    public config: BadgeConfig;

    @HostBinding('style.color')
    public get fontColor(): string|undefined {
        return this.config && this.config.color && this.config.color.font;
    }

    @HostBinding('style.background-color')
    public get backgroundColor(): string|undefined {
        return this.config && this.config.color && this.config.color.background;
    }

    @HostBinding('class.default-color')
    public get defaultColor(): boolean {
        return this.config && !this.config.color;
    }

}
