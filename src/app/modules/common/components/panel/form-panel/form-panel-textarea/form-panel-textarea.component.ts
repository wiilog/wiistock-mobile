import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {NgModel} from '@angular/forms';
import {
    FormPanelTextareaConfig
} from "@common/components/panel/model/form-panel/configs/form-panel-textarea-config";
import {FormPanelItemComponent} from "@common/components/panel/model/form-panel/form-panel-item.component";


@Component({
    selector: 'wii-form-panel-textarea',
    templateUrl: 'form-panel-textarea.component.html',
    styleUrls: ['./form-panel-textarea.component.scss']
})
export class FormPanelTextareaComponent implements FormPanelItemComponent<FormPanelTextareaConfig> {

    @ViewChild('inputComponent', {static: false})
    public inputComponent: NgModel;

    @Input()
    public inputConfig: FormPanelTextareaConfig;

    @Input()
    public value?: string;

    @Input()
    public label: string;

    @Input()
    public name: string;

    @Input()
    public errors?: {[errorName: string]: string};

    @Input()
    public inline?: boolean;

    @Output()
    public valueChange: EventEmitter<string>;

    public constructor() {
        this.valueChange = new EventEmitter<string>();
    }

    public get error(): string|undefined {
        const errorsKeys = Object.keys(this.inputComponent.control.errors || {});
        return this.errors && errorsKeys.length > 0
            ? this.errors[errorsKeys[0]]
            : undefined;
    }

}
