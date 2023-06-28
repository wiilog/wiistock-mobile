import {ChangeDetectorRef, Component, ViewChild} from '@angular/core';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {NavService} from '@app/services/nav/nav.service';
import {LoadingService} from '@app/services/loading.service';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {MainHeaderService} from '@app/services/main-header.service';
import {ToastService} from '@app/services/toast.service';
import {SelectItemComponent} from '@common/components/select-item/select-item.component';
import {IconConfig} from "@common/components/panel/model/icon-config";
import {HeaderConfig} from "@common/components/panel/model/header-config";
import {ListPanelItemConfig} from "@common/components/panel/model/list-panel/list-panel-item-config";
import {BarcodeScannerModeEnum} from "@common/components/barcode-scanner/barcode-scanner-mode.enum";
import {BarcodeScannerComponent} from "@common/components/barcode-scanner/barcode-scanner.component";
import {ApiService} from "@app/services/api.service";
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";
import {RfidManagerService} from "@app/services/rfid-manager.service";
import {mergeMap, tap} from "rxjs";
import {filter, map} from "rxjs/operators";
import {StorageKeyEnum} from "@app/services/storage/storage-key.enum";
import {StorageService} from "@app/services/storage/storage.service";


@Component({
    selector: 'wii-inventory-mission-zone-controle',
    templateUrl: './inventory-mission-zone-controle.page.html',
    styleUrls: ['./inventory-mission-zone-controle.page.scss'],
})
export class InventoryMissionZoneControlePage implements ViewWillEnter, ViewWillLeave {
    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public scannerModeManual: BarcodeScannerModeEnum = BarcodeScannerModeEnum.ONLY_MANUAL;
    public loading: boolean;

    public zoneLabel: string;
    public zoneId: number;
    public missionId: number;
    public rfidTags: Array<string>;

    public numberOfScannedItems: number;

    public inputRfidTags: Array<string>;
    public headerConfig?: {
        leftIcon: IconConfig;
        rightIcon: IconConfig;
        title: string;
        subtitle?: string;
    };

    public afterValidate: (data: any) => void;

    public elementsToDisplay: Array<{reference?: string, location: string, missing: boolean, ratio?: number}>;

    public missingsRefsListConfig: {
        header: HeaderConfig;
        body: Array<ListPanelItemConfig>;
    };

    public locationsQualityListConfig: {
        header: HeaderConfig;
        body: Array<ListPanelItemConfig>;
    };

    public listBoldValues?: Array<string>;

    private rfidScanMode: boolean = false;
    private rfidPrefix?: string;

    private availableRFIDScan?: boolean;

    public constructor(private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private localDataManager: LocalDataManagerService,
                       private mainHeaderService: MainHeaderService,
                       private toastService: ToastService,
                       private apiService: ApiService,
                       private rfidManager: RfidManagerService,
                       private changeDetector: ChangeDetectorRef,
                       private storageService: StorageService,
                       private navService: NavService) {

        this.rfidTags = [];
    }

    public ionViewWillEnter(): void {
        this.loading = false;
        this.rfidTags = [];
        this.numberOfScannedItems = 0
        this.afterValidate = this.navService.param('afterValidate');
        this.zoneLabel = this.navService.param('zoneLabel');
        this.zoneId = this.navService.param('zoneId');
        this.missionId = this.navService.param('missionId');
        this.inputRfidTags = this.navService.param('rfidTags') || [];
        this.headerConfig = {
            leftIcon: {
                name: 'inventory.svg',
            },
            rightIcon: {
                name: 'rfid_play.svg',
                width: "35px",
                height: "35px",
                action: () => {
                    this.toggleStartAndStopScan();
                }
            },
            title: this.zoneLabel,
            subtitle: `0 objet scanné`
        };
        this.listBoldValues = ['title', 'reference', 'location', 'textRight'];
        this.elementsToDisplay = [];

        this.loadingService
            .presentLoadingWhile({
                event: () => (
                    this.storageService.getString(StorageKeyEnum.PARAMETER_RFID_PREFIX).pipe(
                        tap((rfidPrefix) => {
                            this.rfidPrefix = rfidPrefix || '';
                        }),
                        mergeMap(() => this.rfidManager.ensureScannerConnection()),
                    )
                )
            })
            .subscribe((result) => {
                if (result?.success) {
                    this.availableRFIDScan = true;
                    this.initRfidEvents();
                }

                this.refreshHeaderConfig();
            })
    }

    public ionViewWillLeave(): void {
        this.rfidManager.removeEventListeners();
    }

    public refreshHeaderConfig(): void {
        if (this.headerConfig) {
            this.headerConfig.rightIcon.name = this.rfidScanMode
                ? 'rfid_pause.svg'
                : 'rfid_play.svg';
            const plural = this.numberOfScannedItems > 1 ? 's' : '';
            this.headerConfig.subtitle = `${this.numberOfScannedItems} objet${plural} scanné${plural}`;
            this.changeDetector.detectChanges();
        }
    }

    private initRfidEvents(): void {
        this.rfidManager.launchEventListeners();
        this.rfidManager.tagsRead$
            .pipe(
                filter(() => Boolean(this.rfidScanMode)),
                map(({tags, ...remaining}) => ({
                    ...remaining,
                    tags: (tags || []).filter((tag) => tag.startsWith(this.rfidPrefix || ''))
                }))
            )
            .subscribe(({tags}) => {
                const newCurrentZoneTags = tags.filter((tag) => this.rfidTags.indexOf(tag) === -1);
                const newCurrentMissionTags = tags.filter((tag) => this.inputRfidTags.indexOf(tag) === -1);
                this.rfidTags.push(...newCurrentZoneTags);
                this.inputRfidTags.push(...newCurrentMissionTags);
            });

        this.rfidManager.scanStarted$
            .pipe(filter(() => !this.rfidScanMode))
            .subscribe(() => {
                this.rfidScanMode = true;
                this.refreshHeaderConfig();
            });

        this.rfidManager.scanStopped$
            .pipe(filter(() => Boolean(this.rfidScanMode)))
            .subscribe(() => {
                this.rfidScanMode = false;
                this.refreshHeaderConfig();
                this.retrieveZoneRfidSummary();
            });
    }

    public toggleStartAndStopScan(): void {
        if (this.availableRFIDScan) {
            if (!this.rfidScanMode) {
                this.rfidManager.startScan();
            } else {
                this.rfidManager.stopScan();
                this.retrieveZoneRfidSummary();
            }
            this.refreshHeaderConfig();
        }
        else {
            this.toastService.presentToast('Lancement du scan RFID impossible');
        }
    }

    public refreshMissingsRefsListConfig(){
        const missingsRefsToDisplay = this.elementsToDisplay.filter(({missing}) => missing);
        const plural = missingsRefsToDisplay.length > 1 ? 's' : '';
        const msgToDisplay = `référence${plural} manquante${plural}`;

        this.missingsRefsListConfig = {
            header: {
                title: `Attention ${msgToDisplay}`,
                subtitle: `${missingsRefsToDisplay.length} ${msgToDisplay}`,
                leftIcon: {
                    name: 'emergency.svg',
                    width: '25px'
                }
            },
            body: missingsRefsToDisplay.map(({location, reference}) => ({
                infos: {
                    reference: {
                        label: 'Référence',
                        value: String(reference)
                    },
                    location: {
                        label: 'Emplacement',
                        value: location
                    }
                },
            }))
        };
    }

    public refreshLocationsQualityListConfig(){
        const locationQualityToDisplay = this.elementsToDisplay.filter(({missing}) => !missing);
        const plural = locationQualityToDisplay.length > 1 ? 's' : '';

        this.locationsQualityListConfig = {
            header: {
                title: `Indicateur d'emplacement avant validation`,
                subtitle: `${locationQualityToDisplay.length} emplacement${plural}`,
                leftIcon: {
                    name: 'location-black.svg',
                    color: 'primary',
                    width: '25px'
                }
            },
            body: locationQualityToDisplay.map(({location, ratio}) => ({
                infos: {
                    location: {
                        label: 'Emplacement',
                        value: location
                    }
                },
                textRight: {
                    label: `${ratio}%`,
                    size: `25px`,
                }
            }))
        }
    }

    public validateInventoryMissionZoneControl(){
        this.loadingService.presentLoadingWhile({
            event: () => {
                return this.apiService.requestApi(ApiService.INVENTORY_MISSION_VALIDATE_ZONE, {
                    params: {
                        zone: this.zoneId,
                        mission: this.missionId,
                    }
                })
            }
        }).subscribe((response) => {
            if(response.success){
                this.navService.pop().subscribe(() => {
                    this.afterValidate({
                        zoneId: this.zoneId,
                        tags: this.inputRfidTags
                    });
                });
            }
        });
    }

    public addManualRFID(rfidTag: string){
        if(!this.rfidTags.includes(rfidTag)){
            this.rfidTags.push(rfidTag);
            this.inputRfidTags.push(rfidTag);
        }

        this.retrieveZoneRfidSummary();
    }

    private retrieveZoneRfidSummary() {
        if (!this.loading) {
            if (this.rfidTags?.length > 0) {
                this.loading = true;
                this.loadingService.presentLoadingWhile({
                    event: () => {
                        return this.apiService.requestApi(ApiService.ZONE_RFID_SUMMARY, {
                            params: {
                                rfidTags: this.rfidTags,
                            },
                            pathParams: {
                                zone: this.zoneId,
                                mission: this.missionId,
                            }
                        })
                    }
                }).subscribe({
                    next: (response) => {
                        this.loading = false;
                        this.numberOfScannedItems = response.data.numScannedObjects;
                        this.elementsToDisplay = response.data.lines;

                        this.refreshHeaderConfig();
                        this.refreshMissingsRefsListConfig();
                        this.refreshLocationsQualityListConfig();

                        this.changeDetector.detectChanges();
                    },
                    error: () => {
                        this.loading = false;
                    }
                });
            }
            else {
                this.toastService.presentToast("Aucun tag RFID détecté");
            }
        }
    }
}
