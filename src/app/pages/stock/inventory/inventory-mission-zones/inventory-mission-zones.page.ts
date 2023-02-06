import {Component, ViewChild} from '@angular/core';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {NavService} from '@app/services/nav/nav.service';
import {LoadingService} from '@app/services/loading.service';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {MainHeaderService} from '@app/services/main-header.service';
import {ToastService} from '@app/services/toast.service';
import {SelectItemComponent} from '@common/components/select-item/select-item.component';
import {ListPanelItemConfig} from "@common/components/panel/model/list-panel/list-panel-item-config";
import {IconColor} from "@common/components/icon/icon-color";
import {InventoryLocationMission} from "@entities/inventory_location_mission";
import {NavPathEnum} from "@app/services/nav/nav-path.enum";
import {ViewWillEnter} from "@ionic/angular";
import {ApiService} from "@app/services/api.service";


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
    public rfidTags: Array<string> = [];
    public zones: Array<number>;
    public treated: boolean = false;

    public constructor(private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private apiService: ApiService,
                       private localDataManager: LocalDataManagerService,
                       private mainHeaderService: MainHeaderService,
                       private toastService: ToastService,
                       private navService: NavService) {
    }

    public ionViewWillEnter(): void {
        this.selectedMissionId = this.navService.param('missionId');
        this.listZonesConfig = [];
        this.zones = [];


        this.initZoneView();
    }

    public initZoneView() {
        this.listBoldValues = ['label'];
        this.sqliteService.findBy('inventory_location_zone', [
            'mission_id = ' + this.selectedMissionId
        ]).subscribe((locationsInMission: Array<InventoryLocationMission>) => {
            const zonesData = locationsInMission.reduce((acc: {[zoneLabel: string]: {counter: number, zoneId: number, done: boolean}}, inventoryMissionZone: InventoryLocationMission) => {
                const missionDone = Boolean(inventoryMissionZone.done)

                if(acc[inventoryMissionZone.zone_label]) {
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

            this.treated = Object.keys(zonesData)
                .every((zoneLabel) => zonesData[zoneLabel].done);

            this.zones = Object.keys(zonesData)
                .map((zoneLabel) => zonesData[zoneLabel].zoneId);

            this.listZonesConfig = Object.keys(zonesData).map((index) => {
                return {
                    infos: {
                        label: {value: index},
                        details: {value: zonesData[index].counter + ' emplacements à inventorier'}
                    },
                    pressAction: () => {
                        this.navService.push(NavPathEnum.INVENTORY_MISSION_ZONE_CONTROLE, {
                            zoneLabel: index,
                            zoneId: zonesData[index].zoneId,
                            missionId: this.selectedMissionId,
                            rfidTags: this.rfidTags,
                            afterValidate: ({tags, zoneId}: any) => {
                                console.warn('afterValidate', tags, zoneId)
                                this.rfidTags = tags;
                                this.refreshListConfig(zoneId);
                            }
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

    public refreshListConfig(zoneId?: number): void{
        this.sqliteService.update(
            'inventory_location_zone',
            [{
                values: {
                    done: 1
                },
                where: [
                    'mission_id = ' + this.selectedMissionId,
                    'zone_id = ' + zoneId
                ],
            }]
        ).subscribe(() => {
            this.initZoneView();
        });
    }

    public validate() {
        this.loadingService.presentLoadingWhile({
            message: 'Correction des quantités, cela peut prendre un certain temps...',
            event: () => {
                return this.apiService.requestApi(ApiService.FINISH_MISSION, {
                    params: {
                        tags: this.rfidTags,
                        zones: this.zones,
                        mission: this.selectedMissionId,
                    }
                })
            }
        }).subscribe(() => {
            this.navService.setRoot(NavPathEnum.MAIN_MENU);
        });
    }
}
