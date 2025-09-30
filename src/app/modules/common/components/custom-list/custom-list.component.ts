import {Component, Input, ViewChild} from '@angular/core';
import {IonInfiniteScroll} from "@ionic/angular";
import {IconConfig} from "@common/components/panel/model/icon-config";
import {BadgeConfig} from "@common/components/badge/badge-config";


@Component({
    selector: 'wii-custom-list',
    templateUrl: 'custom-list.component.html',
    styleUrls: ['./custom-list.component.scss']
})
export class CustomListComponent {

    @ViewChild('infiniteScroll', {static: false})
    public infiniteScroll: IonInfiniteScroll;

    @Input()
    public elements: Array<{
        icon?: string;
        name: string;
        checked: boolean;
        rightBadge?: BadgeConfig;
        action?: (label: string) => void;
    }>;

    @Input()
    public commonIcon?: IconConfig;

    @Input()
    public disableList: boolean;

    @Input()
    public loadMore: (infiniteScroll: IonInfiniteScroll) => void;
}
