import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnDestroy,
    Output,
    ViewChild
} from '@angular/core';
import {ToastService} from '@app/services/toast.service';
import {AlertService} from '@app/services/alert.service';
import {SelectItemTypeEnum} from '@common/components/select-item/select-item-type.enum';
import {BarcodeScannerModeEnum} from '@common/components/barcode-scanner/barcode-scanner-mode.enum';
import {SearchItemComponent} from './search-item/search-item.component';
import {BarcodeScannerComponent} from '@common/components/barcode-scanner/barcode-scanner.component';
import {Observable, Subject, Subscription} from 'rxjs';
import {filter} from 'rxjs/operators';


@Component({
    selector: 'wii-select-item',
    templateUrl: 'select-item.component.html',
    styleUrls: ['./select-item.component.scss']
})
export class SelectItemComponent implements AfterViewInit, OnDestroy {

    @Input()
    public type: SelectItemTypeEnum;

    @Input()
    public scanMode: BarcodeScannerModeEnum;

    @Input()
    public checkBarcodeValidity?: boolean = false;

    @Input()
    public customBarcodeValidator?: (barcode: string) => Observable<any>;

    @Input()
    public requestParams?: Array<string> = [];

    @Input()
    public resetEmitter?: Observable<void>;

    @Output()
    public itemChange: EventEmitter<any>;

    @Output()
    public createItem: EventEmitter<boolean>;

    @ViewChild('searchComponent', {static: false})
    public searchComponent: SearchItemComponent;

    @ViewChild('barcodeScanner', {static: false})
    public barcodeScanner: BarcodeScannerComponent;

    public selectedLabel$: Subject<string|undefined>;

    private resetEmitterSubscription?: Subscription;

    public readonly config = {
        [SelectItemTypeEnum.DEMANDE_LIVRAISON_TYPE]: {
            invalidMessage: 'Le type scanné n\'est pas présent dans la liste',
        },
        [SelectItemTypeEnum.DEMANDE_LIVRAISON_ARTICLES]: {
            invalidMessage: 'L\'article scanné n\'est pas présent dans la liste',
        },
        [SelectItemTypeEnum.STATUS]: {
            invalidMessage: 'Le statut scanné n\'est pas présent dans la liste',
        },
        [SelectItemTypeEnum.ARTICLE_TO_PICK]: {
            invalidMessage: 'L\'article scanné n\'est pas présent dans la liste',
        },
        [SelectItemTypeEnum.LOCATION]: {
            invalidMessage: 'Veuillez flasher ou sélectionner un emplacement connu',
            alert: true
        },
        [SelectItemTypeEnum.INVENTORY_LOCATION]: {
            invalidMessage: 'L\'emplacement scanné n\'est pas dans la liste',
        },
        [SelectItemTypeEnum.INVENTORY_ARTICLE]: {
            invalidMessage: 'L\'article scanné n\'est pas dans la liste',
        },
        [SelectItemTypeEnum.INVENTORY_ANOMALIES_LOCATION]: {
            invalidMessage: 'L\'emplacement scanné n\'est pas dans la liste',
        },
        [SelectItemTypeEnum.INVENTORY_ANOMALIES_ARTICLE]: {
            invalidMessage: 'L\'article scanné n\'est pas dans la liste',
        },
        [SelectItemTypeEnum.DISPATCH_NUMBER]: {
            invalidMessage: 'L\'acheminement n\'est pas dans la liste',
        },
        [SelectItemTypeEnum.COLLECTABLE_ARTICLES]: {
            invalidMessage: 'L\'article n\'est pas dans la liste',
        },
        [SelectItemTypeEnum.PROJECT]: {
            invalidMessage: 'Le project scanné n\'est pas dans la liste',
        },
    }

    public constructor(private toastService: ToastService,
                       private changeDetector: ChangeDetectorRef,
                       private alertService: AlertService) {
        this.itemChange = new EventEmitter();
        this.createItem = new EventEmitter();
        this.selectedLabel$ = new Subject();
    }

    public ngAfterViewInit() {
        if (this.resetEmitter) {
            this.resetEmitterSubscription = this.resetEmitter
                .pipe(filter(() => Boolean(this.searchComponent)))
                .subscribe(() => {
                    this.resetSearchComponent();
                });
        }
    }

    public ngOnDestroy(): void {
        if (this.resetEmitterSubscription) {
            this.resetEmitterSubscription.unsubscribe();
            this.resetEmitterSubscription = undefined;
        }
    }

    public get dbItemsLength(): number {
        return this.searchComponent.dbItemsLength;
    }

    public onItemSelect(item: any) {
        this.itemChange.emit(item);
        const {label: labelName} = this.searchComponent.config[this.type];
        this.selectedLabel$.next((item && labelName) ? item[labelName] : undefined);
        if (!item) {
            this.resetSearchComponent();
        }
    }

    public onPenClick(): void {
        this.createItem.emit(true);
    }

    public reload(): Observable<Array<any>> {
        this.searchComponent.clear();
        return this.searchComponent.reload();
    }

    public openSearch(): void {
        setTimeout(() => {
            if (this.searchComponent
                && this.searchComponent.itemComponent
                && !this.searchComponent.itemComponent.isOpened
                && this.searchComponent.itemComponent.isEnabled) {
                this.searchComponent.itemComponent.open();
            }
        });
    }

    public closeSearch(): void {
        setTimeout(() => {
            if (this.searchComponent
                && this.searchComponent.itemComponent
                && this.searchComponent.itemComponent.isOpened
                && this.searchComponent.itemComponent.isEnabled) {
                this.searchComponent.itemComponent.close();
            }
        });
    }

    public testIfBarcodeValid(barcode: string, withoutCustom: boolean = false): void {
        if (barcode) {
            if (!withoutCustom && this.customBarcodeValidator) {
                this.customBarcodeValidator(barcode).subscribe((item: any) => {
                    this.validateItem(item, barcode);
                });
            }
            else {
                let item = this.searchComponent.findItem(barcode);
                this.validateItem(item, barcode);
            }
        }
        else {
            this.presentInvalidItemToast();
        }
    }

    public fireZebraScan(): void {
        if (this.barcodeScanner) {
            this.barcodeScanner.fireZebraScan();
        }
    }

    public unsubscribeZebraScan(): void {
        if (this.barcodeScanner) {
            this.barcodeScanner.unsubscribeZebraScan();
        }
    }

    private presentInvalidItemToast(): void {
        // @ts-ignore
        const currentConfig = this.config[this.label];
        if (currentConfig) {
            const message = currentConfig.invalidMessage;
            if (currentConfig.alert) {
                this.alertService.show({
                    header: 'Erreur',
                    message,
                    buttons: [{
                        text: 'Fermer',
                        role: 'cancel'
                    }]
                });
            } else {
                this.toastService.presentToast(message);
            }
        }
    }

    public resetSearchComponent(): void {
        this.searchComponent.clear();
        this.changeDetector.detectChanges();
    }

    private validateItem(item: any, barcode: string): void {
        if (!item) {
            if (this.scanMode === BarcodeScannerModeEnum.TOOL_SEARCH || this.checkBarcodeValidity) {
                this.presentInvalidItemToast();
            }
            else {
                this.onItemSelect({
                    id: new Date().getUTCMilliseconds(),
                    label: barcode
                });
            }
        }
        else {
            this.onItemSelect(item);
        }
    }
}
