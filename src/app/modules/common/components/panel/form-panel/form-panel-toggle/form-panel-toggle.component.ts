import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {NgModel} from '@angular/forms';
import {FormPanelItemComponent} from '@common/components/panel/model/form-panel/form-panel-item.component';
import {FormPanelToggleConfig} from '@common/components/panel/model/form-panel/configs/form-panel-toggle-config';


@Component({
    selector: 'wii-form-panel-toggle',
    templateUrl: 'form-panel-toggle.component.html',
    styleUrls: ['./form-panel-toggle.component.scss']
})
export class FormPanelToggleComponent implements FormPanelItemComponent<FormPanelToggleConfig> {


    @ViewChild('inputComponent', {static: false})
    public inputComponent: NgModel;

    @Input()
    public inputConfig: FormPanelToggleConfig;

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
    public valueChange: EventEmitter<boolean>;

    public constructor() {
        this.valueChange = new EventEmitter<boolean>();
    }

    public onValueChange(value: boolean) {
        this.valueChange.emit(value);

        if(this.inputConfig.onChange) {
            this.inputConfig.onChange(value);
        }
    }

    public get error(): string|undefined {
        const errorsKeys = Object.keys(this.inputComponent.control.errors || {});
        return errorsKeys.length > 0 && this.errors
            ? this.errors[errorsKeys[0]]
            : undefined;
    }
}
