import {Component} from '@angular/core';
import {ViewWillEnter} from '@ionic/angular';
import {NavService} from '@app/services/nav/nav.service';
import {TransportRound} from '@entities/transport-round';
import {LoadingService} from '@app/services/loading.service';
import {ApiService} from '@app/services/api.service';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import * as moment from 'moment';
import {ToastService} from '@app/services/toast.service';
import {NetworkService} from '@app/services/network.service';
import {TransportCardMode} from '@common/components/transport-card/transport-card.component';
import {TransportRoundLine} from '@entities/transport-round-line';
import {AlertService} from '@app/services/alert.service';
import {MainHeaderService} from '@app/services/main-header.service';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {TranslationService} from "@app/services/translations.service";

@Component({
    selector: 'wii-transport-round-list',
    templateUrl: './transport-round-list.page.html',
    styleUrls: ['./transport-round-list.page.scss'],
})
export class TransportRoundListPage implements ViewWillEnter {

    public transportRoundsByDates: {
        [date: string]: Array<TransportRound>
    } | null;

    public loading: boolean;

    public constructor(private navService: NavService,
                       private mainHeaderService: MainHeaderService,
                       private apiService: ApiService,
                       private localDataService: LocalDataManagerService,
                       private loadingService: LoadingService,
                       private toastService: ToastService,
                       private networkService: NetworkService,
                       private alertService: AlertService,
                       private translationService: TranslationService) {
    }

    public ionViewWillEnter(): void {
        moment.locale('fr');

        this.synchronise();
    }

    public formatDate(date: string): string {
        return moment(date, 'DD/MM/YYYY').format('dddd D MMMM YYYY');
    }

    public view(round: TransportRound): void {
        this.navService.push(NavPathEnum.TRANSPORT_LIST, {
            round,
            mode: round.status !== 'En cours' ? TransportCardMode.VIEW : TransportCardMode.STARTABLE,
        });
    }

    public load(event: any, round: TransportRound): void {
        event.stopPropagation();

        if (round.loaded_packs === round.total_loaded) {
            return;
        }

        this.navService.push(NavPathEnum.TRANSPORT_ROUND_PACK_LOAD, {
            round
        });
    }

    public start(event: any, round: TransportRound) {
        event.stopPropagation();

        if (round.loaded_packs !== round.total_loaded) {
            return;
        }

        this.proceedWithStart(event, round);
    }

    public depositPacks(event: any, round: TransportRound) {
        event.stopPropagation();
        const depositedDeliveries = round.deposited_delivery_packs || round.packs_to_return === round.returned_packs || round.packs_to_return === 0;
        const depositedCollects = round.deposited_collect_packs || round.packs_to_deposit === round.deposited_packs || round.packs_to_deposit === 0;

        if (!depositedDeliveries || !depositedCollects) {
            this.loadingService.presentLoadingWhile({
                event: () => this.apiService.requestApi(ApiService.PACKS_RETURN_LOCATIONS)
            }).subscribe(({collectedPacksLocations, undeliveredPacksLocations}) => {
                if (collectedPacksLocations.length === 0) {
                    this.toastService.presentToast(`Aucun emplacement de dépose des objets collectés n'a été paramétré, vous ne pouvez pas continuer.`);
                } else if (undeliveredPacksLocations.length === 0) {
                    this.toastService.presentToast(`Aucun emplacement de retour des colis non livrés n'a été paramétré, vous ne pouvez pas continuer.`);
                } else {
                    if (depositedDeliveries) {
                        round.lines = round.lines.filter((line: TransportRoundLine) => !line.collect || !line.collect.failure);

                        this.navService.push(NavPathEnum.TRANSPORT_COLLECT_NATURES, {
                            round,
                            skippedMenu: true,
                            collectedPacksLocations
                        });
                    } else if (depositedCollects) {
                        this.navService.push(NavPathEnum.TRANSPORT_DEPOSIT_PACKS, {
                            round,
                            skippedMenu: true,
                            undeliveredPacksLocations
                        });
                    } else {
                        this.navService.push(NavPathEnum.TRANSPORT_DEPOSIT_MENU, {
                            round,
                            skippedMenu: false,
                            collectedPacksLocations,
                            undeliveredPacksLocations
                        });
                    }
                }
            });
        }
    }

    public finishRound(event: any, round: TransportRound): void {
        event.stopPropagation();
        this.loadingService.presentLoadingWhile({
            event: () => this.apiService.requestApi(ApiService.GET_END_ROUND_LOCATIONS)
        }).subscribe(({endRoundLocations}) => {
            if(endRoundLocations.length > 0) {
                const packsToDrop = round.lines
                    .filter(({failure}) => failure)
                    .reduce(
                        (acc: Array<any>, line: TransportRoundLine) => [
                            ...(line.packs.filter(({temperature_range, dropped}) => temperature_range && !dropped) || []),
                            ...acc
                        ],
                        []
                    );

                if(packsToDrop.length === 0) {
                    this.navService.push(NavPathEnum.TRANSPORT_ROUND_FINISH, {
                        round,
                        endRoundLocations
                    });
                } else {
                    this.loadingService.presentLoadingWhile({
                        event: () => this.apiService.requestApi(ApiService.PACKS_RETURN_LOCATIONS)
                    }).subscribe(({undeliveredPacksLocations}) => {
                        if(undeliveredPacksLocations.length > 0) {
                            this.navService.push(NavPathEnum.TRANSPORT_ROUND_FINISH_PACK_DROP, {
                                round,
                                packs: packsToDrop,
                                endRoundLocations,
                                undeliveredPacksLocations,
                                hasPacksToDrop: true
                            });
                        } else {
                            this.toastService.presentToast(`Aucun emplacement de retour des colis non livrés n'a été paramétré, vous ne pouvez pas continuer.`)
                        }
                    });
                }
            } else {
                this.toastService.presentToast(`Aucun emplacement de fin de tournée n'a été paramétré, vous ne pouvez pas continuer.`)
            }
        });

    }

    private async proceedWithStart(event: any, round: TransportRound, ignore: boolean = false) {
        const hasNetwork = await this.networkService.hasNetwork();
        if (hasNetwork) {
            const packs = round.lines
                .reduce(
                    (acc: Array<any>, line: TransportRoundLine) => [...(line.packs || []), ...acc],
                    []
                ).map(({code}) => code);
            const options = {
                params: {
                    round: round.id,
                    packs: packs
                }
            }
            this.loadingService.presentLoadingWhile({
                event: () => this.apiService.requestApi(ApiService.HAS_NEW_PACKS, options)
            }).subscribe(({success, has_new_packs}) => {
                if (success) {
                    if (has_new_packs) {
                        this.alertService.show({
                            header: 'Attention',
                            cssClass: AlertService.CSS_CLASS_MANAGED_ALERT,
                            message: 'De nouveaux colis ont été ajoutés, veuillez les charger avant de débuter la tournée',
                            buttons: [{
                                text: 'Charger',
                                cssClass: 'alert-success',
                                handler: () => {
                                    this.synchronise((updatedRound: TransportRound) => this.pushPackLoadingPage(updatedRound, event), round);
                                }
                            }]
                        });
                    } else if(!ignore) {
                        this.unpreparedDeliveries(event, round);
                    } else {
                        const options = {
                            params: {
                                round: round.id
                            }
                        }
                        this.loadingService
                            .presentLoadingWhile({
                                event: () => this.apiService.requestApi(ApiService.START_DELIVERY_ROUND, options)
                            })
                            .subscribe(({success, msg, round: apiRound}) => {
                                if (round) {
                                    Object.assign(round, apiRound);
                                }

                                if (msg) {
                                    this.toastService.presentToast(msg);
                                }

                                if (success) {
                                    this.navService.push(NavPathEnum.TRANSPORT_LIST, {
                                        round,
                                        mode: TransportCardMode.STARTABLE,
                                    });
                                }

                                event.stopPropagation();
                            });
                    }
                }
            });
        } else {
            this.toastService.presentToast('Veuillez vous connecter à internet afin de débuter la tournée');
        }
    }

    public async synchronise(callback?: (updatedRound: TransportRound) => void, currentRound?: TransportRound) {
        const hasNetwork = await this.networkService.hasNetwork();
        if (hasNetwork) {
            this.loading = true;

            this.loadingService.presentLoading('Récupération des tournées en cours').subscribe(loader => {
                this.localDataService.synchroniseData().subscribe(({finished}) => {
                    if(!finished) {
                        return;
                    }

                    this.apiService.requestApi(ApiService.GET_TRANSPORT_ROUNDS).subscribe((rounds: Array<TransportRound>) => {
                        loader.dismiss();

                        for (const round of rounds) {
                            for (const transport of round.lines) {
                                transport.round = round;
                                if (transport.collect) {
                                    transport.collect.round = round;
                                }
                            }
                        }

                        this.transportRoundsByDates = rounds
                            .sort(({date: date1}, {date: date2}) => {
                                const momentDate1 = moment(date1, 'DD/MM/YYYY')
                                const momentDate2 = moment(date2, 'DD/MM/YYYY')
                                return (
                                    momentDate1.isBefore(momentDate2) ? -1 :
                                        momentDate1.isAfter(momentDate2) ? 1 :
                                            0
                                );
                            })
                            .reduce((acc: any, round) => ({
                                [round.date]: [
                                    ...(acc[round.date] || []),
                                    round,
                                ]
                            }), {});

                        if(Object.keys(this.transportRoundsByDates || {}).length === 0) {
                            this.transportRoundsByDates = null;
                        }

                        this.loading = false;
                        if(callback && currentRound) {
                            const updatedRound = rounds.find(({id}) => id === currentRound.id);
                            if (updatedRound) {
                                callback(updatedRound);
                            }
                        }
                    });
                });
            });
        } else {
            this.loading = false;
            this.toastService.presentToast('Veuillez vous connecter à internet afin de synchroniser vos données');
        }
    }

    public unpreparedDeliveries(event: any, round: TransportRound): void {
        if(round.ready_deliveries != round.total_ready_deliveries) {
            this.alertService.show({
                header: `Attention`,
                cssClass: `warning`,
                message: `Des livraisons ne sont pas encore préparées. Elles seront exclues de cette tournée si vous confirmez son début.`,
                buttons: [
                    {
                        text: 'Annuler',
                        role: 'cancel'
                    },
                    {
                        text: 'Confirmer',
                        handler: () => {
                            this.proceedWithStart(event, round, true);
                        },
                        cssClass: 'alert-success'
                    }
                ],
            });
        } else {
            this.proceedWithStart(event, round, true);
        }
    }

    private pushPackLoadingPage(updatedRound: TransportRound, event: Event): void {
        this.navService.push(NavPathEnum.TRANSPORT_ROUND_PACK_LOAD, {
            round: updatedRound,
            unpreparedDeliveries: () => this.unpreparedDeliveries(event, updatedRound)
        })
    }
}
