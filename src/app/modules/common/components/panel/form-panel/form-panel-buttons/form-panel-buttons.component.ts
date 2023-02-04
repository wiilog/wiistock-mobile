import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormPanelItemComponent} from '@common/components/panel/model/form-panel/form-panel-item.component';
import {FormPanelButtonsConfig} from '@common/components/panel/model/form-panel/configs/form-panel-buttons-config';


@Component({
    selector: 'wii-form-panel-buttons',
    templateUrl: 'form-panel-buttons.component.html',
    styleUrls: ['./form-panel-buttons.component.scss']
})
export class FormPanelButtonsComponent implements FormPanelItemComponent<FormPanelButtonsConfig> {

    @Input()
    public inputConfig: FormPanelButtonsConfig;

    @Input()
    public label: string;

    @Input()
    public name: string;

    @Input()
    public errors?: {[errorName: string]: string};

    @Input()
    public value?: number;

    @Input()
    public inline?: boolean;

    @Output()
    public valueChange: EventEmitter<number>;

    public constructor() {
        this.valueChange = new EventEmitter<number>();
    }

    public onValueChange(value: any) {
        this.valueChange.emit(value);

        if(this.inputConfig.onChange) {
            this.inputConfig.onChange(value);
        }
    }

    public get error(): string|undefined {
        const errorsKeys = !this.value && this.inputConfig.required
            ? ['required']
            : [];
        return (errorsKeys.length > 0) && this.errors
            ? this.errors[errorsKeys[0]]
            : undefined;
    }

    public onItemSelect({id}: {id: number; label: string;}) {
        this.value = id;
        this.onValueChange(this.value);
    }
}
