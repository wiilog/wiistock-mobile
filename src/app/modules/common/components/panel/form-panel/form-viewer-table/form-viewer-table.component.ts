import {Component, Input} from '@angular/core';
import {FormViewerTableConfig, NatureWithQuantity} from '@common/components/panel/model/form-viewer/form-viewer-table-config';


@Component({
    selector: 'wii-form-viewer-table',
    templateUrl: 'form-viewer-table.component.html',
    styleUrls: ['./form-viewer-table.component.scss']
})
export class FormViewerTableComponent implements FormViewerTableConfig {

    @Input()
    public value: Array<NatureWithQuantity>;

    @Input()
    public label: string;

}
