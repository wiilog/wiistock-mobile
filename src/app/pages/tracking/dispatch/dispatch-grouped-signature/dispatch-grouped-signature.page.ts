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
import {StorageService} from "@app/services/storage/storage.service";
import {HeaderConfig} from "@common/components/panel/model/header-config";
import {IconColor} from "@common/components/icon/icon-color";
import {BarcodeScannerComponent} from "@common/components/barcode-scanner/barcode-scanner.component";
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";

@Component({
    selector: 'wii-dispatch-grouped-signature',
    templateUrl: './dispatch-grouped-signature.page.html',
    styleUrls: ['./dispatch-grouped-signature.page.scss'],
})
export class DispatchGroupedSignaturePage implements ViewWillEnter, ViewWillLeave {
    public readonly selectItemType = SelectItemTypeEnum.DISPATCH_NUMBER;

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public readonly scannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.INVISIBLE;

    private loadingSubscription?: Subscription;

    public loading: boolean;
    public firstLaunch: boolean;

    public resetEmitter$: EventEmitter<void>;

    public dispatchesListConfig: Array<CardListConfig>;
    public dispatchesToSignListConfig: Array<CardListConfig>;
    public headerFilteredDispatchs?: HeaderConfig;
    public headerDispatchsToSign?: HeaderConfig;
    public readonly dispatchesListColor = CardListColorEnum.GREEN;
    public dispatchesToSign?: Array<Dispatch>;
    public dispatches: Array<Dispatch>;
    public dispatchTranslations: Translations;
    public labelFrom: string;
    public labelTo: string;
    public filters: {
        status?: { id: number; text: string };
        type?: { id: number; text: string };
        from?: { id: number; text: string };
        to?: { id: number; text: string };
    };

    public constructor(private sqliteService: SqliteService,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private mainHeaderService: MainHeaderService,
                       private translationService: TranslationService,
                       private storageService: StorageService,
                       private navService: NavService) {
        this.resetEmitter$ = new EventEmitter();
        this.loading = true;
        this.firstLaunch = true;
        this.filters = {
            status: undefined,
            type: undefined,
            from: undefined,
            to: undefined,
        }
    }


    public ionViewWillEnter(): void {
        this.resetEmitter$.emit();

        if (this.footerScannerComponent) {
            this.footerScannerComponent.fireZebraScan();
        }

        this.updateDispatchList();
    }

    public ionViewWillLeave(): void {
        this.unsubscribeLoading();
        if (this.selectItemComponent) {
            this.selectItemComponent.unsubscribeZebraScan();
        }

        if (this.footerScannerComponent) {
            this.footerScannerComponent.unsubscribeZebraScan();
        }
    }

    private updateDispatchList(callback?: () => void): void {
        this.loading = true;
        this.unsubscribeLoading();
        let loaderElement: HTMLIonLoadingElement|undefined;

        const withoutLoading = this.navService.param('withoutLoading');
        if (!this.firstLaunch || !withoutLoading) {
            const filtersSQL: Array<string> = [];
            if (this.filters.from && this.filters.to) {
                filtersSQL.push(`(locationFromLabel = '${this.filters.from.text}' OR locationToLabel = '${this.filters.to.text}')`)
            } else if (this.filters.from) {
                filtersSQL.push(`locationFromLabel = '${this.filters.from.text}'`)
            } else if (this.filters.to) {
                filtersSQL.push(`locationToLabel = '${this.filters.to.text}'`)
            }
            if (this.filters.status) {
                filtersSQL.push(`statusId = ${this.filters.status.id}`)
            }
            if (this.filters.type) {
                filtersSQL.push(`typeId = ${this.filters.type.id}`)
            }

            this.loadingSubscription = this.loadingService.presentLoading()
                .pipe(
                    tap(loader => loaderElement = loader),
                    mergeMap(() => zip(
                        this.sqliteService.findBy('dispatch',
                            [
                                'treatedStatusId IS NULL OR partial = 1',
                                ...filtersSQL
                            ]
                        ),
                        this.translationService.get(`Demande`, `Acheminements`, `Champs fixes`)
                    ))
                )
                .subscribe(([dispatches, translations]: [Array<Dispatch>, Translations]) => {
                    if (!this.dispatchesToSign) {
                        this.dispatchesToSignListConfig = [];
                        this.dispatchesToSign = [];
                    }
                    if (!this.dispatches) {
                        this.dispatchesListConfig = [];
                        this.dispatches = dispatches;
                    } else {
                        this.dispatches = dispatches
                            .filter((dispatch) => this.dispatchesToSign && !this.dispatchesToSign.some((dispatchToSign) => dispatchToSign.id === dispatch.id));
                    }
                    this.refreshDispatchesListConfig(translations);
                    this.refreshSubTitle();
                    this.unsubscribeLoading();
                    this.loading = false;
                    if (loaderElement) {
                        loaderElement.dismiss();
                        loaderElement = undefined;
                    }
                    if (callback) {
                        callback();
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

    private refreshHeaders() {
        this.headerFilteredDispatchs = {
            title: `Demandes filtrées`,
            subtitle: `${this.dispatches.length} demandes`,
            leftIcon: {
                color: CardListColorEnum.GREEN,
                name: 'download.svg'
            },
            rightIconLayout: 'horizontal',
            ...(this.dispatches.length ? {
                rightIcon: [
                    {
                        color: 'primary',
                        name: 'scan-photo.svg',
                        action: () => {
                            this.footerScannerComponent.scan();
                        }
                    },
                    ...((this.filters.from && !this.filters.to) || (this.filters.to && !this.filters.from) ? [{
                        name: 'up.svg',
                        action: () => {
                            this.signAll();
                        }
                    }]: [])
                ]
            } : {})
        };
        const requestNumber = this.dispatchesToSign?.length || 0;
        this.headerDispatchsToSign = {
            title: `Sélectionnées`,
            subtitle: `${requestNumber} demande${requestNumber > 1 ? 's' : ''}`,
            leftIcon: {
                color: CardListColorEnum.GREEN,
                name: 'upload.svg'
            },
        };
    }

    private refreshSingleList(attribute: 'dispatchesListConfig'|'dispatchesToSignListConfig', list: Array<Dispatch>|undefined, isSelected: boolean) {
        this[attribute] = (list || [])
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
                    title: {label: 'Statut', value: dispatch.statusLabel},
                    customColor: dispatch.groupedSignatureStatusColor || dispatch.color,
                    content: [
                        {label: 'Numéro', value: dispatch.number || ''},
                        {label: 'Type', value: dispatch.typeLabel || ''},
                        {label: 'Demandeur', value: dispatch.requester || ''},
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
                        {
                            label: 'Références (quantité)',
                            value: dispatch.quantities || ''
                        },
                        (dispatch.emergency
                            ? {label: 'Urgence', value: dispatch.emergency || ''}
                            : {label: 'Urgence', value: 'Non'})
                    ].filter((item) => item && item.value),
                    rightIcon: {
                        color: 'grey' as IconColor,
                        name: isSelected ? 'down.svg' : 'up.svg',
                        action: () => {
                            if (isSelected) {
                                this.signingDispatch(dispatch, true);
                            } else {
                                this.testIfBarcodeEquals(dispatch);
                            }
                        }
                    },
                    action: () => {
                        this.navService.push(NavPathEnum.DISPATCH_PACKS, {
                            localDispatchId: dispatch.localId,
                            fromCreate: true,
                            viewMode: true
                        });
                    }
                };
            });
    }

    private refreshDispatchesListConfig(translations: Translations): void {
        this.dispatchTranslations = translations;
        this.labelFrom = TranslationService.Translate(this.dispatchTranslations, 'Emplacement de prise');
        this.labelTo = TranslationService.Translate(this.dispatchTranslations, 'Emplacement de dépose');
        this.refreshHeaders();
        this.refreshSingleList('dispatchesListConfig', this.dispatches, false);
        this.refreshSingleList('dispatchesToSignListConfig', this.dispatchesToSign, true);
    }

    public resetFilters() {
        this.filters = {
            status: undefined,
            type: undefined,
            from: undefined,
            to: undefined,
        }
        this.dispatchesToSign = undefined;
        this.updateDispatchList();
    }

    public validateGroupedSignature(){
        if(this.filters.status && this.filters.type && (this.filters.to || this.filters.from) && this.dispatchesToSign && this.dispatchesToSign.length > 0){
            this.navService.push(NavPathEnum.DISPATCH_GROUPED_SIGNATURE_VALIDATE, {
                dispatchesToSign: this.dispatchesToSign,
                status: this.filters.status.id,
                type: this.filters.type.id,
                to: this.filters.to,
                from: this.filters.from,
            });
        }
        else {
            this.toastService.presentToast('Veuillez saisir un statut, un type ainsi qu\'un emplacement de prise ou de dépose dans les filtres.');
        }
    }

    public signAll(): void {
        this.dispatchesToSign = this.dispatchesToSign || [];
        this.dispatchesToSign.push(...this.dispatches);
        this.dispatches = [];
        this.refreshHeaders();
        this.refreshSingleList('dispatchesListConfig', this.dispatches, false);
        this.refreshSingleList('dispatchesToSignListConfig', this.dispatchesToSign, true);
    }

    public signingDispatch(dispatch: Dispatch, selected: boolean): void {
        const arrayToSpliceFrom = (selected ? this.dispatchesToSign : this.dispatches) || [];
        const arrayToPushIn = (selected ? this.dispatches : this.dispatchesToSign) || [];
        arrayToSpliceFrom.splice(this.dispatches.findIndex((dispatchIndex) => dispatchIndex.id === dispatch.id), 1);
        arrayToPushIn.push(dispatch);

        this.dispatches = selected ? arrayToPushIn : arrayToSpliceFrom;
        this.dispatchesToSign = selected ? arrayToSpliceFrom : arrayToPushIn;
        this.refreshHeaders();
        this.refreshSingleList('dispatchesListConfig', this.dispatches, false);
        this.refreshSingleList('dispatchesToSignListConfig', this.dispatchesToSign, true);

    }

    public refreshFiltersFromDispatch(dispatch: Dispatch): boolean {
        let changes = false;
        if (this.filters.from && this.filters.to) {
            if (this.filters.from.id === dispatch.locationFromId && this.filters.to.id !== dispatch.locationToId) {
                this.filters.to = undefined;
                changes = true;
            } else if (this.filters.from.id !== dispatch.locationFromId && this.filters.to.id === dispatch.locationToId) {
                this.filters.from = undefined;
                changes = true;
            }
        } else if (!this.filters.from && !this.filters.to) {
            changes = true;
            this.filters = {
                status: {
                    id: dispatch.statusId,
                    text: dispatch.statusLabel,
                },
                type: {
                    id: dispatch.typeId,
                    text: dispatch.typeLabel,
                },
                from: {
                    id: dispatch.locationFromId,
                    text: dispatch.locationFromLabel,
                },
                to: {
                    id: dispatch.locationToId,
                    text: dispatch.locationToLabel,
                },
            }
        }
        return changes;
    }

    public testIfBarcodeEquals(text: string|Dispatch): void {
        const dispatch: Dispatch|undefined = typeof text === 'string'
            ? this.dispatches.find((dispatchToSelect) => {
                const packs = (dispatchToSelect.packs || '').split(',');
                return packs.some((pack: string) => pack === text)
            })
            : text;

        if (dispatch) {
            const changes = this.refreshFiltersFromDispatch(dispatch);
            if (changes) {
                this.updateDispatchList(() => this.signingDispatch(dispatch, false));
            } else {
                this.signingDispatch(dispatch, false);
            }
        }
        else {
            this.toastService.presentToast('Aucun acheminement de la liste ne contient l \'UL scannée.');
        }
    }
}
