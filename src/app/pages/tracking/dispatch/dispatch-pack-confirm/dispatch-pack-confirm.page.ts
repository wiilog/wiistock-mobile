import {Component, ViewChild} from '@angular/core';
import {NavService} from '@app/services/nav/nav.service';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {LoadingService} from '@app/services/loading.service';
import {Dispatch} from '@entities/dispatch';
import {CardListColorEnum} from '@common/components/card-list/card-list-color.enum';
import {MainHeaderService} from '@app/services/main-header.service';
import {ToastService} from '@app/services/toast.service';
import {SelectItemTypeEnum} from '@common/components/select-item/select-item-type.enum';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {DispatchPack} from '@entities/dispatch-pack';
import {FormPanelSelectComponent} from '@common/components/panel/form-panel/form-panel-select/form-panel-select.component';
import {HeaderConfig} from '@common/components/panel/model/header-config';
import {FormPanelParam} from '@common/directives/form-panel/form-panel-param';
import {FormPanelInputComponent} from '@common/components/panel/form-panel/form-panel-input/form-panel-input.component';
import {FormPanelComponent} from '@common/components/panel/form-panel/form-panel.component';
import {Nature} from '@entities/nature';
import {FormViewerParam} from '@common/directives/form-viewer/form-viewer-param';
import {FormViewerTextComponent} from '@common/components/panel/form-panel/form-viewer-text/form-viewer-text.component';
import {
    FormPanelCameraComponent
} from '@common/components/panel/form-panel/form-panel-camera/form-panel-camera.component';
import {ViewWillEnter} from "@ionic/angular";


@Component({
    selector: 'wii-dispatch-pack-confirm',
    templateUrl: './dispatch-pack-confirm.page.html',
    styleUrls: ['./dispatch-pack-confirm.page.scss'],
})
export class DispatchPackConfirmPage implements ViewWillEnter {
    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public headerConfig: HeaderConfig;
    public bodyConfig: Array<FormPanelParam>;

    private confirmPack: (pack: DispatchPack) => void;
    private natureTranslationLabel: string;
    private pack: DispatchPack;
    public detailsConfig: Array<FormViewerParam>;

    public constructor(private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private mainHeaderService: MainHeaderService,
                       private localDataManagerService: LocalDataManagerService,
                       private toastService: ToastService,
                       private navService: NavService) {
    }


    public ionViewWillEnter(): void {
        this.pack = this.navService.param('pack');
        const dispatch: Dispatch = this.navService.param('dispatch');
        this.confirmPack = this.navService.param('confirmPack');
        this.natureTranslationLabel = this.navService.param('natureTranslationLabel');

        this.headerConfig = {
            title: `Colis ${this.pack.code}`,
            subtitle: [
                `Demande ${dispatch.number}`,
                `Emplacement de dépose : ${dispatch.locationToLabel}`
            ],
            leftIcon: {
                color: CardListColorEnum.GREEN,
                name: 'stock-transfer.svg'
            }
        };

        const photos = [];
        if (this.pack.photo1) {
            photos.push(this.pack.photo1);
        }
        if (this.pack.photo2) {
            photos.push(this.pack.photo2);
        }

        this.bodyConfig = [
            {
                item: FormPanelSelectComponent,
                config: {
                    label: this.natureTranslationLabel,
                    name: 'natureId',
                    value: this.pack.natureId,
                    inputConfig: {
                        required: false,
                        searchType: SelectItemTypeEnum.TRACKING_NATURES,
                        filterItem: (nature: Nature) => (!nature.hide)
                    }
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Quantité',
                    name: 'quantity',
                    value: this.pack.quantity || 1,
                    inputConfig: {
                        type: 'number'
                    }
                }
            },
            {
                item: FormPanelCameraComponent,
                config: {
                    label: 'Photos',
                    name: 'photos',
                    value: photos,
                    inputConfig: {
                        multiple: true,
                        max: 2,
                    }
                }
            },
        ];

        this.detailsConfig = this.pack.comment
            ? [
                {
                    item: FormViewerTextComponent,
                    config: {
                        label: `Commentaire`,
                        value: this.pack.comment || ''
                    }
                }
            ]
            : [];
    }

    public onFormSubmit(): void {
        if (this.formPanelComponent.firstError) {
            this.toastService.presentToast(this.formPanelComponent.firstError);
        }
        else {
            const {quantity, natureId, photos} = this.formPanelComponent.values;
            const photo1 = photos ? photos[0] : undefined;
            const photo2 = photos ? photos[1] : undefined;
            this.confirmPack({
                ...this.pack,
                quantity,
                photo1,
                photo2,
                natureId
            });
            this.navService.pop();
        }
    }
}
