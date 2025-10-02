import {Component, Input} from '@angular/core';
import {IconConfig} from "@common/components/panel/model/icon-config";
import {BadgeConfig} from "@common/components/badge/badge-config";

@Component({
    selector: 'wii-timeline',
    templateUrl: 'timeline.component.html',
    styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent {

    @Input()
    public elements: Array<{
        icon?: string;
        name: string;
        checked: boolean;
        clickable: boolean;
        rightBadge?: BadgeConfig;
        action?: (label: string) => void;
    }>;

    @Input()
    public commonIcon?: IconConfig;

    @Input()
    public disableList: boolean;

    @Input()
    public title: string;

    public counter(title: string): string {
        const total = this.elements.length;
        const checkedElements = this.elements.filter((element) => element.checked && !element.clickable).length;
        return checkedElements + "/" + total + " " + title + (total > 1 ? 's' : '');
    }
}
