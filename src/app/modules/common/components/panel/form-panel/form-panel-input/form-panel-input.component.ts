import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {NgModel} from '@angular/forms';
import {FormPanelInputConfig} from '@common/components/panel/model/form-panel/configs/form-panel-input-config';
import {FormPanelItemComponent} from '@common/components/panel/model/form-panel/form-panel-item.component';


@Component({
    selector: 'wii-form-panel-input',
    templateUrl: 'form-panel-input.component.html',
    styleUrls: ['./form-panel-input.component.scss']
})
export class FormPanelInputComponent implements FormPanelItemComponent<FormPanelInputConfig> {

    @ViewChild('inputComponent', {static: false})
    public inputComponent: NgModel;

    @Input()
    public inputConfig: FormPanelInputConfig;

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

    public onValueChange(value: string) {
        this.valueChange.emit(value);

        if(this.inputConfig.onChange) {
            this.inputConfig.onChange(value);
        }
    }

    public get error(): string|undefined {
        const errorsKeys = Object.keys(this.inputComponent.control.errors || {});
        return this.errors && errorsKeys.length > 0
            ? this.errors[errorsKeys[0]]
            : undefined;
    }
}
