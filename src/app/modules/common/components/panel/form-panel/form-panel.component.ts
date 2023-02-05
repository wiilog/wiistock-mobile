import {AfterViewInit, Component, Input, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {HeaderConfig} from '@common/components/panel/model/header-config';
import {FormPanelSelectComponent} from '@common/components/panel/form-panel/form-panel-select/form-panel-select.component';
import {FormPanelParam} from '@common/directives/form-panel/form-panel-param';
import {FormPanelDirective} from '@common/directives/form-panel/form-panel.directive';
import {FormViewerParam} from '@common/directives/form-viewer/form-viewer-param';
import {PanelHeaderComponent} from '@common/components/panel/panel-header/panel-header.component';


@Component({
    selector: 'wii-form-panel',
    templateUrl: 'form-panel.component.html',
    styleUrls: ['./form-panel.component.scss']
})
export class FormPanelComponent implements AfterViewInit {

    @Input()
    public detailPosition: 'top'|'bottom' = 'top'

    @Input()
    public header?: HeaderConfig;

    @Input()
    public body: Array<FormPanelParam>;

    @Input()
    public details?: Array<FormViewerParam>;

    @Input()
    public isForm: boolean = false;

    @ViewChildren('formElements', {read: FormPanelDirective})
    public formElements: QueryList<FormPanelDirective>;

    @ViewChild('formHeaderComponent', {static: false})
    public formHeaderComponent: PanelHeaderComponent;

    private afterViewInit: boolean;
    private fireZebraRequested: boolean;

    private multipleFieldOccurrences: {[name: string]: number} = {};

    public get values(): {[name: string]: any} {
        const getNewValue = (value: any, oldValue: any, multiple: boolean) => {
            return multiple
                ? [...(oldValue || []), value]
                : value
        };

        return this.formElements
            ? this.formElements.reduce((acc: any, {instance: {group, name, value}, param: {config}}: FormPanelDirective) => ({
                ...acc,
                ...((!config.ignoreEmpty
                    || typeof value === 'boolean'
                    || (Array.isArray(value) && value.length > 0)
                    || (!Array.isArray(value) && value)) ?
                    {
                        [group || name]: group
                            ? {
                                ...(acc[group] || {}),
                                [name]: getNewValue(value, (acc[group] || {})[name], config.multiple || false)
                            }
                            : getNewValue(value, acc[name], config.multiple || false)
                    }
                    : {})
            }), {})
            : {};
    }

    public get firstError(): string|undefined {
        return this.formElements
            ? this.formElements.reduce(
                (error: string|undefined, {instance: {error: itemError}}: FormPanelDirective) => error || itemError,
                undefined
            )
            : undefined;
    }

    public ngAfterViewInit(): void {
        setTimeout(() => {
            this.afterViewInit = true;
            if (this.fireZebraRequested) {
                this.doFireZebraScan();
            }
        }, 600);
    }

    public fireZebraScan(): void {
        if (this.afterViewInit) {
            this.doFireZebraScan();
        }
        else {
            this.fireZebraRequested = true;
        }
    }

    private doFireZebraScan(): void {
        this.fireZebraRequested = false;
        this.getInstanceForZebraInit().forEach((element) => {
            element.fireZebraScan();
        });
    }

    public unsubscribeZebraScan() {
        this.fireZebraRequested = false;
        this.getInstanceForZebraInit().forEach((element) => {
            element.unsubscribeZebraScan();
        });
    }

    public getOccurrences({config}: FormPanelParam): Array<number> {
        const {multiple, name} = config;
        const occurrences = (!multiple || !this.multipleFieldOccurrences[name])
            ? 1
            : this.multipleFieldOccurrences[name];
        return new Array<void>(occurrences)
            .fill()
            .map((_, index) => index);
    }

    public addMultipleOccurrence({config}: FormPanelParam): void {
        const {name, multiple} = config;
        if (multiple) {
            if (!this.multipleFieldOccurrences[name]) {
                this.multipleFieldOccurrences[name] = 1;
            }
            this.multipleFieldOccurrences[name]++;
        }
    }

    public updateConfigField(name: string, newConfig: any) {
        const param = this.body.find(({config}) => config.name === name);
        if (param) {
            param.config = {
                ...param.config,
                inputConfig: newConfig
            };
            if (this.formElements) {
                this.formElements.forEach((element) => {
                    const currentName = element && element.param && element.param.config.name;
                    if (currentName === name) {
                        element.reloadInstance();
                    }
                });
            }
        }
    }

    public updateFieldValue(name: string, value: any): void {
        const param = this.body.find(({config}) => config.name === name);
        if(param) {
            param.config.value = value;
            if (this.formElements) {
                this.formElements.forEach((element) => {
                    const currentName = element && element.param && element.param.config.name;
                    if (currentName === name) {
                        element.reloadInstance();
                    }
                });
            }
        }
    }

    private getInstanceForZebraInit(): Array<FormPanelSelectComponent> {
        if(this.formElements) {
            return this.formElements
                .filter(({instance}) => instance instanceof FormPanelSelectComponent)
                .map(({instance}) => instance) as unknown as Array<FormPanelSelectComponent>;
        } else {
            return [];
        }
    }
}
