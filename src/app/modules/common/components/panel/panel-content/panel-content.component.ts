import {Component, Input} from '@angular/core';
import {IconConfig} from "@common/components/panel/model/icon-config";

@Component({
    selector: 'wii-panel-content',
    templateUrl: 'panel-content.component.html',
    styleUrls: ['./panel-content.component.scss']
})
export class PanelContentComponent {

    @Input()
    public content: Array<{
        label: string,
        value?: {
            text: string|number,
            bold?: boolean,
            underline?: boolean,
            color?: string,
            action?: () => void,
        },
        icon?: IconConfig,
    }> = [];
}
