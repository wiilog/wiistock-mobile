import {Component, ViewChild} from '@angular/core';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {NavService} from '@app/services/nav/nav.service';
import {LoadingService} from '@app/services/loading.service';
import {SelectItemComponent} from '@common/components/select-item/select-item.component';
import {ListPanelItemConfig} from "@common/components/panel/model/list-panel/list-panel-item-config";
import {IconColor} from "@common/components/icon/icon-color";
import {InventoryLocationLine} from "@entities/inventory_location_line";
import {NavPathEnum} from "@app/services/nav/nav-path.enum";
import {ViewWillEnter} from "@ionic/angular";
import {ApiService} from "@app/services/api.service";
import {map, mergeMap} from "rxjs/operators";
import {InventoryLocationTag} from "@entities/inventory_location_tag";
import {zip} from "rxjs";
import {AlertService} from "@app/services/alert.service";


@Component({
    selector: 'wii-inventory-mission-zones',
    templateUrl: './inventory-mission-zones.page.html',
    styleUrls: ['./inventory-mission-zones.page.scss'],
})
export class InventoryMissionZonesPage implements ViewWillEnter{
    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public listBoldValues?: Array<string>;
    public listZonesConfig?: Array<ListPanelItemConfig>;
    public selectedMissionId?: number;
    public treated: boolean = false;

    public constructor(private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private apiService: ApiService,
                       private alertService: AlertService,
                       private navService: NavService) {}

    public ionViewWillEnter(): void {
        this.selectedMissionId = this.navService.param('missionId');
        this.listZonesConfig = [];
        this.treated = false;

        this.initZoneView();
    }

    public initZoneView() {
        this.listBoldValues = ['label'];
        this.loadingService.presentLoadingWhile({
            message: 'Correction des quantités, cela peut prendre un certain temps...',
            event: () => {
                return this.sqliteService
                    .findBy('inventory_location_line', ['mission_id = ' + this.selectedMissionId])
                    .pipe(
                        map((locationsInMission: Array<InventoryLocationLine>) => {
                            return locationsInMission.reduce((acc: {
                                [zoneLabel: string]: { counter: number, zoneId: number, done: boolean }
                            }, inventoryMissionZone: InventoryLocationLine) => {
                                const missionDone = Boolean(inventoryMissionZone.done)

                                if (acc[inventoryMissionZone.zone_label]) {
                                    acc[inventoryMissionZone.zone_label].counter++;
                                    acc[inventoryMissionZone.zone_label].done = missionDone;
                                } else {
                                    acc[inventoryMissionZone.zone_label] = {
                                        zoneId: inventoryMissionZone.zone_id,
                                        counter: 1,
                                        done: missionDone
                                    };
                                }
                                return acc;
                            }, {});
                        })
                    );
            }
        })
            .subscribe((zonesData) => {
                this.treated = Object.keys(zonesData)
                    .every((zoneLabel) => zonesData[zoneLabel].done);

                this.listZonesConfig = Object.keys(zonesData).map((index) => {
                    const counter = zonesData[index].counter;
                    return {
                        infos: {
                            label: {value: index},
                            details: {value: `${counter} emplacement${counter > 1 ? 's' : ''} à inventorier`},
                        },
                        pressAction: () => {
                            const zoneId = zonesData[index].zoneId;
                            this.navService.push(NavPathEnum.INVENTORY_MISSION_ZONE_CONTROLE, {
                                zoneLabel: index,
                                zoneId,
                                missionId: this.selectedMissionId,
                            });
                        },
                        ...(zonesData[index].done ? {
                            rightIcon: {
                                color: 'list-green' as IconColor,
                                name: 'check.svg',
                            }
                        } : {})
                    }
                });
            });
    }

    public validate(): void {
        this.loadingService.presentLoadingWhile({
            message: 'Correction des quantités, cela peut prendre un certain temps...',
            event: () => {
                return zip(
                    this.sqliteService.findBy<InventoryLocationTag>('inventory_location_tag', [
                        `mission_id = ${this.selectedMissionId}`,
                    ]),
                    this.sqliteService.findBy<InventoryLocationLine>('inventory_location_line', [
                        `mission_id = ${this.selectedMissionId}`,
                    ])
                ).pipe(
                    map(([savedTags, zones]) => [
                        savedTags.map(({tag}) => tag),
                        zones.reduce((acc, {location_id, validated_at}) => ({
                            [location_id]: validated_at,
                            ...acc,
                        }), {}),
                    ]),
                    mergeMap(([tags, validatedAtDates]) => (
                        this.apiService.requestApi(ApiService.FINISH_MISSION, {
                            params: {
                                tags,
                                validatedAtDates,
                                mission: this.selectedMissionId
                            }
                        })
                    )),
                    mergeMap((response) => (
                        this.sqliteService.deleteBy('inventory_location_tag', [
                            `mission_id = ${this.selectedMissionId}`,
                        ]).pipe(map(() => response))
                    ))
                )
            }
        }).subscribe(({success, message}: {success: boolean, message: string}) => {
            if (success) {
                this.navService.setRoot(NavPathEnum.MAIN_MENU);
            }
            else {
                this.alertService.show({
                    header: 'Inventaire en erreur',
                    message: message || undefined,
                    buttons: [{
                        text: 'Annuler',
                        role: 'cancel'
                    }]
                })
            }
        });
    }
}
