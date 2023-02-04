import {Component, Input} from '@angular/core';
import {FormViewerTextConfig} from '@common/components/panel/model/form-viewer/form-viewer-text-config';


@Component({
    selector: 'wii-form-viewer-text',
    templateUrl: 'form-viewer-text.component.html',
    styleUrls: ['./form-viewer-text.component.scss']
})
export class FormViewerTextComponent implements FormViewerTextConfig {

    @Input()
    public label: string;

    @Input()
    public value: string;

    @Input()
    public inline?: boolean;
}
