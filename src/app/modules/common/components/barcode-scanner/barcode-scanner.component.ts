import {Component, EventEmitter, HostBinding, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {ToastService} from '@app/services/toast.service';
import {Observable, Subscription} from 'rxjs';
import {BarcodeScannerModeEnum} from './barcode-scanner-mode.enum';


@Component({
    selector: 'wii-barcode-scanner',
    templateUrl: 'barcode-scanner.component.html',
    styleUrls: ['./barcode-scanner.component.scss']
})
export class BarcodeScannerComponent implements OnInit, OnDestroy {

    public readonly ONLY_MANUAL_MODE = BarcodeScannerModeEnum.ONLY_MANUAL;
    public readonly WITH_MANUAL_MODE = BarcodeScannerModeEnum.WITH_MANUAL;
    public readonly ONLY_SCAN_MODE = BarcodeScannerModeEnum.ONLY_SCAN;
    public readonly TOOL_SEARCH_MODE = BarcodeScannerModeEnum.TOOL_SEARCH;
    public readonly TOOLS_FULL_MODE = BarcodeScannerModeEnum.TOOLS_FULL;
    public readonly ONLY_SEARCH_MODE = BarcodeScannerModeEnum.ONLY_SEARCH;
    public readonly TOOL_SELECTED_LABEL = BarcodeScannerModeEnum.TOOL_SELECTED_LABEL;

    public input: string;

    @Input()
    public selectedLabel$?: Observable<string>;

    @Input()
    public hidden?: boolean;

    @Input()
    public mode?: BarcodeScannerModeEnum = BarcodeScannerModeEnum.ONLY_SCAN;

    @Output()
    public scanAdd: EventEmitter<string>;

    @Output()
    public cameraAdd: EventEmitter<string>;

    @Output()
    public manualAdd: EventEmitter<string>;

    @Output()
    public search: EventEmitter<undefined>;

    @Output()
    public clear: EventEmitter<undefined>;

    @Output()
    public createForm: EventEmitter<undefined>;

    private zebraScanSubscription?: Subscription;

    public constructor(private barcodeScannerManager: BarcodeScannerManagerService,
                       private toastService: ToastService) {
        this.scanAdd = new EventEmitter<string>();
        this.manualAdd = new EventEmitter<string>();
        this.search = new EventEmitter<undefined>();
        this.createForm = new EventEmitter<undefined>();
        this.clear = new EventEmitter<undefined>();
    }

    public ngOnInit(): void {
        this.fireZebraScan();
    }

    public ngOnDestroy(): void {
        this.unsubscribeZebraScan();
    }

    public scan(): void {
        this.barcodeScannerManager.scan().subscribe((barcode) => {
            this.triggerAdd(this.cameraAdd, barcode);
        });
    }

    public addManually() {
        if (this.input) {
            this.triggerAdd(this.manualAdd, this.input);
            this.clearInput();
        }
        else {
            this.toastService.presentToast('Aucune donnée saisie');
        }
    }

    public fireZebraScan(): void {
        this.unsubscribeZebraScan();
        if (this.mode !== BarcodeScannerModeEnum.ONLY_SEARCH) {
            this.zebraScanSubscription = this.barcodeScannerManager
                .zebraScan$
                .subscribe((barcode) => {
                    this.triggerAdd(this.scanAdd, barcode);
                });
        }
    }

    public unsubscribeZebraScan(): void {
        if (this.zebraScanSubscription) {
            this.zebraScanSubscription.unsubscribe();
            this.zebraScanSubscription = undefined;
        }
    }

    public onSearchClick() {
        this.search.emit();
    }

    public onPenClick() {
        this.createForm.emit();
    }

    private clearInput(): void {
        this.input = '';
    }

    private triggerAdd(emitter: EventEmitter<string>, barcode: string): void {
        if (!this.hidden) {
            const smartBarcode = (barcode || '').trim();
            emitter.emit(smartBarcode);
        }
    }

    @HostBinding('attr.hidden')
    public get attrHidden(): string|undefined {
        return this.hidden ? '' : undefined;
    }

    public onSelectedLabelClick(): void {
        this.clear.emit();
    }
}
