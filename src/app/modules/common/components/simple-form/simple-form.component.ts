import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {IconConfig} from '@common/components/panel/model/icon-config';


@Component({
    selector: 'wii-simple-form',
    templateUrl: 'simple-form.component.html',
    styleUrls: ['./simple-form.component.scss']
})
export class SimpleFormComponent implements OnInit {

    @Input()
    public title: string;

    @Input()
    public hideMainSubmit: boolean;

    @Input()
    public iconInfo: IconConfig;

    @Input()
    public info?: Array<{
        label: string;
        value?: string;
    }>;

    @Input()
    public fields: Array<{
        name: string;
        label: string;
        type?: string;
        value?: string|number;
        displayValidate?: boolean;
    }>;

    @Output()
    public submit: EventEmitter<{ [name: string]: string|number|undefined }>;

    public models: { [name: string]: string|number|undefined };

    public constructor() {
        this.submit = new EventEmitter<{[p: string]: string|number|undefined}>();
    }

    public ngOnInit() {
        this.models = this.fields.reduce(
            (acc, {name, value}) => ({
                ...acc,
                [name]: value
            }),
            {}
        );

        return true;
    }

    public onFormSubmit() {
        this.submit.emit(this.models)
    }

    public onInputChange(name: string, type: string, target: EventTarget|null): void {
        const {value} = (target as HTMLInputElement) || {};
        this.models[name] = value !== undefined
            ? (type === 'number' ? Number(value) : value)
            : undefined;
    }
}
