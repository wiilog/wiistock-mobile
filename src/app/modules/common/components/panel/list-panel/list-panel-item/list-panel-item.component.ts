import {Component, ElementRef, HostBinding, Input} from '@angular/core';
import {IconConfig} from '@common/components/panel/model/icon-config';
import {BadgeConfig} from "@common/components/badge/badge-config";


@Component({
    selector: 'wii-list-panel-item',
    templateUrl: 'list-panel-item.component.html',
    styleUrls: ['./list-panel-item.component.scss']
})
export class ListPanelItemComponent {

    @Input()
    public infos: {
        [name: string]: {
            label?: string;
            value?: string;
            emergency?: boolean;
        };
    };

    @Input()
    public color?: string;

    @Input()
    public disabled?: boolean;

    @Input()
    public loading?: boolean;

    @Input()
    public boldValues?: Array<string>;

    @Input()
    public rightIcon?: IconConfig;

    @Input()
    public badge?: BadgeConfig;

    @Input()
    public leftIcon?: IconConfig;

    @Input()
    public rightButton?: {
        text: string;
        color?: string;
        action?: () => void;
    }

    @Input()
    public rightIconBase64?: string;

    @Input()
    public sliding?: boolean;

    @Input()
    public slidingConfig?: {
        left: Array<{
            label: string;
            color: string;
            action: () => void;
        }>;
        right: Array<{
            label: string;
            color: string;
            action: () => void;
        }>
    };

    @Input()
    public textRight?: {
        label?: string;
        size?: string;
    };

    @Input()
    public pressAction?: (infos: {[name: string]: {label?: string; value?: string; emergency?: boolean;};}) => void;

    @HostBinding('class')
    public _backgroundColor?: string;

    public constructor(private elementRef: ElementRef) {}

    public get infosArray(): Array<{label?: string; value?: string; key: string;emergency?: boolean;}> {
        return Object.keys(this.infos).map((key) => ({
            key,
            ...(this.infos[key])
        }))
    }

    public onPress(): void {
        if (!this.loading && this.pressAction) {
            this.pressAction(this.infos);
        }
    }

    @Input()
    public set backgroundColor(backgroundColor: string|undefined) {
        if (this.elementRef && this.elementRef.nativeElement) {
            const oldBackgroundColorClass = this._backgroundColor;
            this._backgroundColor = backgroundColor
                ? `bg-${backgroundColor}`
                : undefined;

            if (oldBackgroundColorClass) {
                this.elementRef.nativeElement.classList.remove(oldBackgroundColorClass);
            }

            if (this._backgroundColor) {
                this.elementRef.nativeElement.classList.add(this._backgroundColor);
            }
        }
    }
}
