import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {SearchItemComponent} from '@common/components/select-item/search-item/search-item.component';
import {BarcodeScannerComponent} from '@common/components/barcode-scanner/barcode-scanner.component';
import {FormPanelItemComponent} from '@common/components/panel/model/form-panel/form-panel-item.component';
import {FormPanelSelectConfig} from '@common/components/panel/model/form-panel/configs/form-panel-select-config';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {of} from "rxjs";


@Component({
    selector: 'wii-form-panel-select',
    templateUrl: 'form-panel-select.component.html',
    styleUrls: ['./form-panel-select.component.scss']
})
export class FormPanelSelectComponent implements FormPanelItemComponent<FormPanelSelectConfig>, OnInit {

    private static readonly MULTIPLE_SEPARATOR: string = ';'

    @ViewChild('searchComponent', {static: false})
    public searchComponent: SearchItemComponent;

    @ViewChild('barcodeScanner', {static: false})
    public barcodeScanner: BarcodeScannerComponent;

    @Input()
    public inputConfig: FormPanelSelectConfig;

    @Input()
    public section?: {title: string; bold: boolean; logo?: string;};

    @Input()
    public label: string;

    @Input()
    public name: string;

    @Input()
    public errors?: {[errorName: string]: string};

    @Input()
    public value?: string;

    @Input()
    public inline?: boolean;

    @Input()
    public disabled?: boolean;

    @Output()
    public valueChange: EventEmitter<number>;

    public text?: string;

    public constructor(private sqliteService: SqliteService) {
        this.valueChange = new EventEmitter<number>();
    }

    public ngOnInit() {
        if (this.inputConfig && this.inputConfig.defaultIfSingle) {
            const config = SearchItemComponent.SEARCH_CONFIGS[this.inputConfig.searchType || 'default'];
            const values = config.databaseTable
                ? this.sqliteService.findBy(
                    config.databaseTable,
                    this.inputConfig.requestParams,
                    (config as any).requestOrder || {}
                )
                : of([]);

            values.subscribe(values => {
                setTimeout(() => {
                    this.value = values[0].id;

                    const item = this.value
                        ? this.searchComponent.findItem(this.value, this.searchComponent.config[this.searchComponent.smartType]['valueField'])
                        : undefined;
                    if (item) {
                        this.searchComponent.item = item;
                        this.initText();
                    }
                }, 200);
            })
        }

        setTimeout(() => {
            if (this.searchComponent) {
                const item = this.value
                    ? this.searchComponent.findItem(this.value, this.searchComponent.config[this.searchComponent.smartType]['valueField'])
                    : undefined;
                if (item) {
                    this.searchComponent.item = item;
                    this.initText();
                }
            }
        }, 200);
    }

    private valueToText(value: any) {
        const label = SearchItemComponent.SEARCH_CONFIGS[this.searchComponent?.smartType]?.label || `label`;
        const labels = Array.isArray(label) ? label : [label];

        return Array.isArray(value)
            ? value.map(v => labels.map((label: string) => v[label])[0]).join(FormPanelSelectComponent.MULTIPLE_SEPARATOR)
            : labels.map((label: string) => value[label])[0]
    }

    public fireZebraScan(): void {
        if (this.barcodeScanner) {
            this.barcodeScanner.fireZebraScan();
        }
    }

    public unsubscribeZebraScan() {
        if (this.barcodeScanner) {
            this.barcodeScanner.unsubscribeZebraScan();
        }
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
        return this.errors && errorsKeys.length > 0
            ? this.errors[errorsKeys[0]]
            : undefined;
    }

    public onItemSelect(itemSelected: {id: string|number; label: string;}) {
        if (itemSelected
            && (!Array.isArray(itemSelected) || itemSelected.length > 0)) {
            const value: Array<any> = !Array.isArray(itemSelected) ? [itemSelected] : itemSelected;
            this.text = this.valueToText(itemSelected);
            this.value = value.map(({id}) => id).join(FormPanelSelectComponent.MULTIPLE_SEPARATOR);
        }
        else {
            this.text = undefined;
            this.value = undefined;
        }
        this.onValueChange(this.value);
    }

    public onSearchClick() {
        this.searchComponent.itemComponent.open();
    }

    public onBarcodeScanned(barcode: string): void {
        const item = this.searchComponent.findItem(barcode);
        if (item) {
            this.searchComponent.item = item;
            this.onItemSelect(item);
        }
    }

    public initText(): void {
        if (this.value) {
            const value: Array<any> = !Array.isArray(this.value) ? [this.value] : this.value;
            const selected = this.searchComponent
                ? value
                    .map((val) => this.searchComponent.findItem(val, 'id'))
                    .filter((val) => val)
                : [];

            if (selected.length > 0) {
                this.text = this.valueToText(selected);
            } else if (!this.searchComponent) {
                let valueArray = value
                    .filter((arrayValue) => arrayValue)
                    .map((arrayValue) => {
                        if (typeof arrayValue !== 'object') {
                            return {
                                id: arrayValue,
                                label: arrayValue
                            };
                        } else {
                            return arrayValue;
                        }
                    });
                this.onItemSelect(<any>valueArray);
            }
            else {
                this.value = undefined;
            }
        }
    }

    public onScanButtonClicked(): void {
        this.barcodeScanner.scan();
    }
}
