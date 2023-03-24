import {Component, HostBinding, Input} from '@angular/core';
import {CardListColorEnum} from './card-list-color.enum';
import {CardListConfig} from './card-list-config';
import {HeaderConfig} from '@common/components/panel/model/header-config';


@Component({
    selector: 'wii-card-list',
    templateUrl: 'card-list.component.html',
    styleUrls: ['./card-list.component.scss']
})
export class CardListComponent {
    @Input()
    public listIconName?: string;

    @HostBinding('attr.class')
    @Input()
    public color: CardListColorEnum;

    @Input()
    public config: Array<CardListConfig>;

    @Input()
    public header?: HeaderConfig;

    public onCardClick(cardConfig: CardListConfig) {
        if (cardConfig.action) {
            cardConfig.action();
        }
    }

    public getCardTitle(titleConfig: {label?: string;value?: string;} | Array<{label?: string; value?: string;}>): Array<{label?: string; value?: string;}> {
        if (!titleConfig) {
            return [];
        }
        else if (!Array.isArray(titleConfig)) {
            return [titleConfig];
        }
        else {
            return titleConfig;
        }
    }
}
