import {Component, Input} from '@angular/core';

@Component({
    selector: 'wii-form-field',
    templateUrl: 'form-panel-field.component.html',
    styleUrls: ['./form-panel-field.component.scss']
})
export class FormPanelFieldComponent {

    @Input()
    public required?: boolean = false;

    @Input()
    public label: string = '';

    @Input()
    public inline?: boolean;

    @Input()
    public disabled?: boolean;

}
