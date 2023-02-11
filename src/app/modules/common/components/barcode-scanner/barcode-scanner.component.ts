import {Component, EventEmitter, HostBinding, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {ToastService} from '@app/services/toast.service';
import {Observable, Subscription} from 'rxjs';
import {BarcodeScannerModeEnum} from './barcode-scanner-mode.enum';

interface DisplayConfig {
    search: boolean;
    plus: boolean;
    photo: boolean;
    selectedLabel: boolean;
    input: boolean;
}

@Component({
    selector: 'wii-barcode-scanner',
    templateUrl: 'barcode-scanner.component.html',
    styleUrls: ['./barcode-scanner.component.scss']
})
export class BarcodeScannerComponent implements OnInit, OnDestroy {

    private static readonly AllDisplayConfigs: { [mode: number]: DisplayConfig } = {
        [BarcodeScannerModeEnum.ONLY_MANUAL]: {
            search: false,
            plus: false,
            photo: false,
            selectedLabel: false,
            input: true,
        },
        [BarcodeScannerModeEnum.ONLY_SCAN]: {
            search: false,
            plus: false,
            photo: true,
            selectedLabel: false,
            input: false,
        },
        [BarcodeScannerModeEnum.WITH_MANUAL]: {
            search: false,
            plus: false,
            photo: true,
            selectedLabel: false,
            input: true,
        },
        [BarcodeScannerModeEnum.TOOL_SEARCH]: {
            search: true,
            plus: false,
            photo: true,
            selectedLabel: false,
            input: false,
        },
        [BarcodeScannerModeEnum.TOOL_SELECTED_LABEL]: {
            search: false,
            plus: false,
            photo: true,
            selectedLabel: true,
            input: false,
        },
        [BarcodeScannerModeEnum.TOOLS_FULL]: {
            search: true,
            plus: true,
            photo: true,
            selectedLabel: false,
            input: false,
        },
        [BarcodeScannerModeEnum.ONLY_SEARCH]: {
            search: true,
            plus: false,
            photo: false,
            selectedLabel: false,
            input: false,
        },
        [BarcodeScannerModeEnum.INVISIBLE]: {
            search: false,
            plus: false,
            photo: false,
            selectedLabel: false,
            input: false,
        },
    };

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
        this.cameraAdd = new EventEmitter<string>();
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
                .datawedgeScan$
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

    public get displayConfig(): DisplayConfig {
        const mode = this.mode !== undefined ? this.mode : -1;
        return BarcodeScannerComponent.AllDisplayConfigs[mode]
            // fallback
            || BarcodeScannerComponent.AllDisplayConfigs[BarcodeScannerModeEnum.INVISIBLE];
    }
}
