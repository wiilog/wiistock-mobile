import {Component, EventEmitter, Input, Output} from '@angular/core';
import {map, take} from 'rxjs/operators';
import {from, Observable} from 'rxjs';
import {FormPanelItemComponent} from '@common/components/panel/model/form-panel/form-panel-item.component';
import {FormPanelCalendarConfig} from '@common/components/panel/model/form-panel/configs/form-panel-calendar-config';
import {FormPanelCalendarMode} from '@common/components/panel/form-panel/form-panel-calendar/form-panel-calendar-mode';
import * as moment from 'moment';
import { Plugins } from "@capacitor/core";
import { DatePickerPluginInterface } from "@capacitor-community/date-picker";

// TODO WIIS-7970 Voir si il y a un fork mieux sans le Plugins ?
const DatePicker: DatePickerPluginInterface = Plugins["DatePickerPlugin"] as any;

@Component({
    selector: 'wii-form-panel-calendar',
    templateUrl: 'form-panel-calendar.component.html',
    styleUrls: ['./form-panel-calendar.component.scss']
})
export class FormPanelCalendarComponent implements FormPanelItemComponent<FormPanelCalendarConfig> {

    @Input()
    public inputConfig: FormPanelCalendarConfig;

    @Input()
    public value?: string;

    @Input()
    public label: string;

    @Input()
    public name: string;

    @Input()
    public errors?: { [errorName: string]: string };

    @Input()
    public inline?: boolean;

    @Output()
    public valueChange: EventEmitter<string>;

    public constructor() {
        this.valueChange = new EventEmitter<string>();
    }

    public get error(): string|undefined {
        return (this.inputConfig.required && !this.value)
            ? (this.errors && this.errors['required'])
            : undefined;
    }

    public emptyValue(): void {
        this.value = '';
    }

    public onItemClicked(): void {
        (from(DatePicker.present({
            date: this.pickerDate,
            mode: this.inputConfig.mode,
            theme: "light",
            is24h: true
        }))
            .pipe(
                take(1),
                map(({value}) => value ? new Date(value) : undefined)
            ) as Observable<Date>)
            .subscribe(
                (pickedDate: Date) => {
                    this.value = moment(pickedDate).format(this.inputValueFormat);
                }
            );
    }

    public get formattedValue(): string {
        const format = 'DD/MM/YYYY' + (this.inputConfig.mode === FormPanelCalendarMode.DATETIME ? ' HH:mm' : '');
        return this.value
            ? moment(this.value, this.inputValueFormat).format(format)
            : ''
    }

    public get inputValueFormat(): string {
        return 'YYYY-MM-DD' + (this.inputConfig.mode === FormPanelCalendarMode.DATETIME ? '\THH:mm' : '');
    }

    private get pickerDate(): string {
        const date = this.value
            ? moment(this.value, this.inputValueFormat).toDate()
            : new Date();
        return date.toISOString();
    }

}
