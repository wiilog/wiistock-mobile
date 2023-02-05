import {Component, ElementRef, EventEmitter, HostBinding, HostListener, Input, Output, ViewChild} from '@angular/core';
import {IconConfig} from '@common/components/panel/model/icon-config';
import {ListPanelItemConfig} from "@common/components/panel/model/list-panel/list-panel-item-config";
import {BadgeConfig} from '@common/components/badge/badge-config';


@Component({
    selector: 'wii-panel-header',
    templateUrl: 'panel-header.component.html',
    styleUrls: ['./panel-header.component.scss']
})
export class PanelHeaderComponent {

    private static readonly INIT_COLLAPSED_HEADER_BODY = 65;

    @ViewChild('headerBodyWrapper')
    public headerBodyWrapper: ElementRef;

    @Input()
    public color?: string;

    @Input()
    public item?: ListPanelItemConfig;

    @Input()
    public leftIcon?: IconConfig;

    @Input()
    public title?: string;

    @Input()
    public info?: string;

    @Input()
    @HostBinding('class.collapse')
    public collapsed: boolean;

    @Input()
    @HostBinding('class.transparent-panel-header')
    public transparent?: boolean = false;

    @Input()
    public fireAction: boolean;

    @Input()
    public showOrHide: boolean = false;

    @Output()
    public action: EventEmitter<Event>;

    @Output()
    public toggle: EventEmitter<boolean>;

    @HostBinding('class.open')
    public open: boolean;

    @Input()
    public leftBadge?: BadgeConfig;

    @Input()
    public rightBadge?: BadgeConfig;

    @Input()
    public headerButtonConfig: {
        label: string;
        icon: IconConfig;
    };

    @Input()
    public rightIconLayout?: 'vertical'|'horizontal' = 'vertical';

    @Input()
    public light: boolean = false;

    @Output()
    public mainButtonAction: EventEmitter<boolean>;

    public _bodyMaxHeight: number;

    public _rightIcons: Array<IconConfig>;

    public _subtitle: Array<string>;

    public constructor() {
        this._subtitle = [];
        this.open = false;
        this.action = new EventEmitter<Event>();
        this.toggle = new EventEmitter<boolean>();
        this.mainButtonAction = new EventEmitter<boolean>();
        this._bodyMaxHeight = PanelHeaderComponent.INIT_COLLAPSED_HEADER_BODY
    }

    @HostBinding('class.ion-activatable')
    @HostBinding('class.ripple-parent')
    public get hasRipple(): boolean {
        return this.fireAction;
    }

    @HostListener('click', ['$event'])
    public onClick(event: Event): void {
        this.action.emit(event);
    }

    @Input()
    public set subtitle(subtitle: string|Array<string>|undefined) {
        this._subtitle = subtitle
            ? (typeof subtitle === 'string' ? [subtitle] : subtitle)
            : [];
    }

    @Input()
    public set rightIcons(rightIcons: IconConfig|Array<IconConfig>|undefined) {
        this._rightIcons = rightIcons
            ? (Array.isArray(rightIcons) ? rightIcons : [rightIcons])
            : [];
    }

    public get subtitle(): string|Array<string> {
        return this._subtitle;
    }

    public get rightIcons(): IconConfig|Array<IconConfig> {
        return this._rightIcons;
    }

    public onLeftIconClick(event: Event): void {
        if (this.leftIcon && this.leftIcon.action) {
            this.leftIcon.action();
            event.preventDefault();
            event.stopPropagation();
        }
    }

    public onRightIconClick(event: Event, index: number): void {
        const rightIcons = this.rightIcons as Array<IconConfig>;
        if (rightIcons && rightIcons[index]) {
            const rightIcon = rightIcons[index];
            if (rightIcon.action) {
                rightIcon.action();
                event.preventDefault();
                event.stopPropagation();
            }
        }
    }

    public get leftIconHasAction(): boolean {
        return Boolean(this.leftIcon && this.leftIcon.action);
    }

    public rightIconHasAction(index: number): boolean {
        const rightIcons = this.rightIcons as Array<IconConfig>;
        return Boolean(rightIcons && rightIcons[index] && rightIcons[index].action);
    }

    public toggleTitle(): void {
        if (this.collapsed) {
            this.open = !this.open;
            if (this.open) {
                const {height = 0} = this.headerBodyWrapper.nativeElement.getBoundingClientRect() || {};
                if (height) {
                    this._bodyMaxHeight = height;
                    this.toggle.emit(this.open);
                }
            }
            else {
                this.toggle.emit(this.open);
                this._bodyMaxHeight = PanelHeaderComponent.INIT_COLLAPSED_HEADER_BODY;
            }
        }
    }

    public get bodyMaxHeight(): number|undefined {
        return this.collapsed ? this._bodyMaxHeight : undefined;
    }

    public mainButtonActionClick(): void {
        this.mainButtonAction.emit();
    }
}
