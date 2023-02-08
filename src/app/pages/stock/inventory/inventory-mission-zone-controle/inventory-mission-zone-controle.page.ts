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
import {mergeMap, of} from "rxjs";
import {filter} from "rxjs/operators";


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

    public inputRfidTags: Array<string>;
    public headerConfig?: {
        leftIcon: IconConfig;
        rightIcon: IconConfig;
        title: string;
        subtitle?: string;
    };

    public afterValidate: (data: any) => void;

    public elementsToDisplay: Array<{reference: string, location: string, ratio: number}>;

    public missingsRefsListConfig: {
        header: HeaderConfig;
        body: Array<ListPanelItemConfig>;
    };

    public locationsQualityListConfig: {
        header: HeaderConfig;
        body: Array<ListPanelItemConfig>;
    };

    public listBoldValues?: Array<string>;

    private rfidScanMode?: boolean;

    public constructor(private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private localDataManager: LocalDataManagerService,
                       private mainHeaderService: MainHeaderService,
                       private toastService: ToastService,
                       private apiService: ApiService,
                       private rfidManager: RfidManagerService,
                       private changeDetector: ChangeDetectorRef,
                       private navService: NavService) {

        this.rfidTags = [];
    }

    public ionViewWillEnter(): void {
        this.loading = false;
        this.rfidTags = [];
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
                event: () => this.rfidManager.ensureScannerConnection().pipe(
                    mergeMap((result) => result.success
                        ? this.rfidManager.startScan()
                        : of(result)
                    )
                )
            })
            .subscribe((result) => {
                if (result) {
                    this.rfidScanMode = true;
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
            this.changeDetector.detectChanges();
        }
    }

    private initRfidEvents(): void {
        this.rfidManager.launchEventListeners();
        this.rfidManager.tagsRead$
            .pipe(filter(() => Boolean(this.rfidScanMode)))
            .subscribe(({tags}) => {
                const newTags = tags.filter((tag) => this.rfidTags.indexOf(tag) === -1);
                this.rfidTags.push(...newTags);
                this.inputRfidTags.push(...newTags);
                console.warn(newTags)
                console.warn(this.inputRfidTags)
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
        if (!this.rfidScanMode) {
            this.rfidManager.startScan();
        }
        else {
            this.rfidManager.stopScan();
            this.retrieveZoneRfidSummary();
        }
        this.refreshHeaderConfig();
    }

    public refreshMissingsRefsListConfig(){
        const missingsRefsToDisplay = this.elementsToDisplay.filter((missingRef) => missingRef.ratio === 0);
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
                        value: reference
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
        const locationQualityToDisplay = this.elementsToDisplay.filter((missingRef) => missingRef.ratio > 0);
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
            body: locationQualityToDisplay.map(({location, reference, ratio}) => ({
                infos: {
                    reference: {
                        label: 'Référence',
                        value: reference
                    },
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
            this.loading = true;
            this.loadingService.presentLoadingWhile({
                event: () => {
                    return this.apiService.requestApi(ApiService.ZONE_RFID_SUMMARY, {
                        params: {
                            zone: this.zoneId,
                            mission: this.missionId,
                            rfidTags: this.rfidTags,
                        }
                    })
                }
            }).subscribe((response) => {
                this.loading = false;
                this.elementsToDisplay = response.data;
                this.refreshMissingsRefsListConfig();
                this.refreshLocationsQualityListConfig();
            });
        }
    }
}
