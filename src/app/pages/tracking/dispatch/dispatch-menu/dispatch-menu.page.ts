import {Component, EventEmitter, ViewChild} from '@angular/core';
import {Subscription, zip} from 'rxjs';
import {NavService} from '@app/services/nav/nav.service';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {LoadingService} from '@app/services/loading.service';
import {mergeMap, tap} from 'rxjs/operators';
import {Dispatch} from '@entities/dispatch';
import {CardListConfig} from '@common/components/card-list/card-list-config';
import {CardListColorEnum} from '@common/components/card-list/card-list-color.enum';
import {MainHeaderService} from '@app/services/main-header.service';
import {SelectItemTypeEnum} from "@common/components/select-item/select-item-type.enum";
import {BarcodeScannerModeEnum} from "@common/components/barcode-scanner/barcode-scanner-mode.enum";
import {SelectItemComponent} from "@common/components/select-item/select-item.component";
import {ToastService} from '@app/services/toast.service';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {Translations} from '@entities/translation';
import {TranslationService} from '@app/services/translations.service';
import * as moment from 'moment';
import {StorageKeyEnum} from "@app/services/storage/storage-key.enum";
import {StorageService} from "@app/services/storage/storage.service";
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";

@Component({
    selector: 'wii-dispatch-menu',
    templateUrl: './dispatch-menu.page.html',
    styleUrls: ['./dispatch-menu.page.scss'],
})
export class DispatchMenuPage implements ViewWillEnter, ViewWillLeave {
    public readonly barcodeScannerSearchMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.ONLY_SCAN;
    public readonly selectItemType = SelectItemTypeEnum.DISPATCH_NUMBER;

    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    private loadingSubscription?: Subscription;

    public loading: boolean;
    public firstLaunch: boolean;
    public labelTo?: string;
    public labelFrom?: string;

    public hasRightDisplayGroupedSignatureButton: boolean;

    public resetEmitter$: EventEmitter<void>;

    public dispatchesListConfig: Array<CardListConfig>;
    public readonly dispatchesListColor = CardListColorEnum.GREEN;
    public dispatchesIconName?: string = 'stock-transfer.svg';

    public dispatchTranslations: Translations;

    public constructor(private sqliteService: SqliteService,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private mainHeaderService: MainHeaderService,
                       private translationService: TranslationService,
                       private storageService: StorageService,
                       private navService: NavService) {
        this.resetEmitter$ = new EventEmitter<void>();
        this.loading = true;
        this.firstLaunch = true;
        this.hasRightDisplayGroupedSignatureButton = false;
    }


    public ionViewWillEnter(): void {
        this.storageService.getRight(StorageKeyEnum.RIGHT_GROUPED_SIGNATURE).subscribe((hasRightDisplayGroupedSignatureButton) => {
            this.hasRightDisplayGroupedSignatureButton = hasRightDisplayGroupedSignatureButton;

            this.resetEmitter$.emit();
            this.updateDispatchList();
        });
    }

    public ionViewWillLeave(): void {
        this.unsubscribeLoading();
        if (this.selectItemComponent) {
            this.selectItemComponent.unsubscribeZebraScan();
        }
    }

    private updateDispatchList(): void {
        this.loading = true;
        this.unsubscribeLoading();
        let loaderElement: HTMLIonLoadingElement|undefined;

        const withoutLoading = this.navService.param('withoutLoading');
        if (!this.firstLaunch || !withoutLoading) {
            this.loadingSubscription = this.loadingService.presentLoading()
                .pipe(
                    tap(loader => loaderElement = loader),
                    mergeMap(() => zip(
                        this.sqliteService.findBy('dispatch',
                            [
                                'draft = 0',
                                'treatedStatusId IS NULL OR partial = 1',
                            ]
                        ),
                        this.translationService.get(`Demande`, `Acheminements`, `Champs fixes`)
                    ))
                )
                .subscribe(([dispatches, translations]: [Array<Dispatch>, Translations]) => {
                    this.refreshDispatchesListConfig(dispatches, translations);

                    this.refreshSubTitle();
                    this.unsubscribeLoading();
                    this.loading = false;
                    if (loaderElement) {
                        loaderElement.dismiss();
                        loaderElement = undefined;
                    }
                });
        }
        else {
            this.loading = true;
            this.firstLaunch = false;
        }
    }

    private unsubscribeLoading(): void {
        if (this.loadingSubscription) {
            this.loadingSubscription.unsubscribe();
            this.loadingSubscription = undefined;
        }
    }

    public refreshSubTitle(): void {
        const dispatchesLength = this.dispatchesListConfig.length;
        this.mainHeaderService.emitSubTitle(`${dispatchesLength === 0 ? 'Aucune' : dispatchesLength} demande${dispatchesLength > 1 ? 's' : ''}`)
    }

    public onScanningDispatch(dispatch?: Dispatch) {
        if (dispatch) {
            this.redirectToDispatch(dispatch.localId);
        }
        else {
            this.toastService.presentToast('Aucun acheminement correspondant');
        }
    }

    private redirectToDispatch(localId: number) {
        this.navService.push(NavPathEnum.DISPATCH_PACKS, {
            localDispatchId: localId
        });
    }

    public goToGroupedSignature(){
        this.navService.push(NavPathEnum.DISPATCH_GROUPED_SIGNATURE);
    }

    private refreshDispatchesListConfig(dispatches: Array<Dispatch>, translations: Translations): void {
        this.dispatchTranslations = translations;
        this.labelFrom = TranslationService.Translate(this.dispatchTranslations, 'Emplacement de prise');
        this.labelTo = TranslationService.Translate(this.dispatchTranslations, 'Emplacement de dépose');
        this.dispatchesListConfig = dispatches
            .sort(({startDate: startDate1}, {startDate: startDate2}) => {
                const momentDesiredDate1 = moment(startDate1, 'DD/MM/YYYY HH:mm:ss')
                const momentDesiredDate2 = moment(startDate2, 'DD/MM/YYYY HH:mm:ss')

                if(momentDesiredDate1.isValid() && !momentDesiredDate2.isValid()) {
                    return -1;
                } else if(momentDesiredDate1.isValid() && !momentDesiredDate2.isValid()) {
                    return 1;
                } else if(!momentDesiredDate1.isValid() && !momentDesiredDate2.isValid()) {
                    return 0;
                }

                return (
                    momentDesiredDate1.isBefore(momentDesiredDate2) ? -1 :
                        momentDesiredDate1.isAfter(momentDesiredDate2) ? 1 :
                            0
                );
            })
            .map((dispatch: Dispatch) => {
            return {
                title: {label: 'Demandeur', value: dispatch.requester},
                customColor: dispatch.color,
                content: [
                    {label: 'Numéro', value: dispatch.number || ''},
                    {label: 'Type', value: dispatch.typeLabel || ''},
                    {label: 'Statut', value: dispatch.statusLabel || ''},
                    {
                        label: `Date d'échéance`,
                        value: dispatch.startDate && dispatch.endDate ? `Du ${dispatch.startDate} au ${dispatch.endDate}` : ''
                    },
                    {
                        label: this.labelFrom,
                        value: dispatch.locationFromLabel || ''
                    },
                    {
                        label: this.labelTo,
                        value: dispatch.locationToLabel || ''
                    },
                    (dispatch.emergency
                        ? {label: 'Urgence', value: dispatch.emergency || ''}
                        : {label: 'Urgence', value: 'Non'})
                ].filter((item) => item && item.value),
                ...(dispatch.emergency
                    ? {
                        rightIcon: {
                            name: 'exclamation-triangle.svg',
                            color: 'danger'
                        }
                    }
                    : {}),
                action: () => {
                    this.navService.push(NavPathEnum.DISPATCH_PACKS, {
                        dispatchId: dispatch.id
                    });
                }
            };
        });
    }
}
