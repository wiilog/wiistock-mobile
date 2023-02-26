import {Component} from '@angular/core';
import {ApiService} from '@app/services/api.service';
import {ToastService} from '@app/services/toast.service';
import {LoadingService} from '@app/services/loading.service';
import {StorageService} from '@app/services/storage/storage.service';
import {NavService} from '@app/services/nav/nav.service';
import {NetworkService} from '@app/services/network.service';
import {BarcodeScannerModeEnum} from '@common/components/barcode-scanner/barcode-scanner-mode.enum';
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";
import {from, mergeMap, of, tap, zip} from "rxjs";
import {RfidManagerService} from "@app/services/rfid-manager.service";
import {StorageKeyEnum} from "@app/services/storage/storage-key.enum";
import {map} from "rxjs/operators";
import {NavPathEnum} from "@app/services/nav/nav-path.enum";


@Component({
    selector: 'wii-scan-rfid-tag',
    templateUrl: './scan-rfid-tag.page.html',
    styleUrls: ['./scan-rfid-tag.page.scss'],
})
export class ScanRfidTagPage implements ViewWillEnter, ViewWillLeave {

    private static readonly SCANNER_RFID_DELAY: number = 10000; // 10 seconds

    public readonly scannerMode = BarcodeScannerModeEnum.ONLY_MANUAL;

    public loading: boolean = false;
    public alreadyLoaded: boolean = false;

    private rfidPrefix?: string;

    private scanLaunchedWithButton?: boolean;

    public constructor(private networkService: NetworkService,
                       private apiService: ApiService,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private storageService: StorageService,
                       private navService: NavService,
                       private rfidManager: RfidManagerService) {
    }

    public ionViewWillEnter(): void {
        this.loading = true;
        this.loadingService.presentLoadingWhile({
            event: () => from(this.networkService.hasNetwork()).pipe(
                tap((hasNetwork) => {
                    if (!hasNetwork) {
                        throw new Error('no-network')
                    }
                }),
                mergeMap(() => this.alreadyLoaded
                    ? of([this.rfidPrefix])
                    : zip(
                        this.storageService.getString(StorageKeyEnum.PARAMETER_RFID_PREFIX),
                        this.rfidManager.ensureScannerConnection()
                    )
                )
            )
        }).subscribe({
            next: ([rfidPrefix]) => {
                this.rfidPrefix = rfidPrefix || '';
                if (this.rfidPrefix) {
                    this.initRfidEvents();
                }
                this.loading = false;
                this.alreadyLoaded = true;
            },
            error: (error) => {
                if (error instanceof Error && error.message === 'no-network') {
                    this.toastService.presentToast('Une connexion au réseau est nécessaire.');
                    this.navService.pop();
                }
            }
        })
    }

    public ionViewWillLeave(): void {
        this.rfidManager.removeEventListeners();
    }

    private initRfidEvents(): void {
        this.rfidManager.launchEventListeners();

        // unsubscribed in rfidManager.removeEventListeners() in ionViewWillLeave
        this.rfidManager.tagsRead$
            .pipe(
                map(({tags, ...remaining}) => ({
                    ...remaining,
                    tags: (tags || []).filter((tag) => tag.startsWith(this.rfidPrefix || ''))
                }))
            )
            .subscribe(({tags}) => {
                const [firstTag] = tags || [];
                if (firstTag) {
                    this.onRFIDTagScanned(firstTag);
                }
            })
    }

    public onRFIDButtonClicked(): void {
        if (!this.scanLaunchedWithButton) {
            this.scanLaunchedWithButton = true;
            this.rfidManager.startScan();

            setTimeout(() => {
                if (this.scanLaunchedWithButton) {
                    this.rfidManager.stopScan(false);
                    this.scanLaunchedWithButton = false;
                }
            }, ScanRfidTagPage.SCANNER_RFID_DELAY);
        }
    }

    public onRFIDTagScanned(rfidTag: string): void {
        if (!this.loading) {
            this.rfidManager.stopScan();
            this.loading = true;
            this.scanLaunchedWithButton = false;
            this.loadingService.presentLoadingWhile({
                event: () => {
                    return this.apiService
                        .requestApi(ApiService.GET_ARTICLE_BY_RFID_TAG, {
                            pathParams: {rfidTag},
                        })
                }
            }).subscribe(({article}) => {
                if (article) {
                    this.toastService.presentToast('Article existant.');
                } else {
                    this.navService.push(NavPathEnum.ARTICLE_CREATION_FORM, {
                        rfidTag,
                    });
                }
                this.loading = false;
            });
        }
    }
}
