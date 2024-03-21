import {Component} from '@angular/core';
import {NavService} from '@app/services/nav/nav.service';
import {ToastService} from '@app/services/toast.service';
import {ViewWillEnter} from "@ionic/angular";
import {NavPathEnum} from "@app/services/nav/nav-path.enum";
import {Emplacement} from "@entities/emplacement";
import {BarcodeScannerModeEnum} from "@common/components/barcode-scanner/barcode-scanner-mode.enum";
import {SqliteService} from "@app/services/sqlite/sqlite.service";

@Component({
    selector: 'wii-manual-collect-article-take',
    templateUrl: './manual-collect-article-take.page.html',
    styleUrls: ['./manual-collect-article-take.page.scss'],
})
export class ManualCollectArticleTakePage implements ViewWillEnter{

    public simpleFormConfig: {
        title: string;
        info: Array<{label: string; value?: string;}>
        fields: Array<{label: string; name: string; type: string; value: string|number;}>
    };

    private selectedReference: {
        id: number;
        refArticleBarCode: string;
        'article-to-pick'?: string;
        label: string;
        reference: string;
        quantityType: string;
        location: string;
    };

    private selectArticle: (quantity: number, selectedReference: any, dropLocation?: Emplacement) => void;

    public constructor(private toastService: ToastService,
                       private sqliteService: SqliteService,
                       private navService: NavService) {
    }

    public ionViewWillEnter(): void {
        if (this.navService.popItem?.path
            && this.navService.popItem?.path !== NavPathEnum.MANUAL_COLLECT_ARTICLE_TAKE) {
            return;
        }

        this.selectArticle = this.navService.param('selectArticle');
        this.selectedReference = this.navService.param('selectedReference');

        this.simpleFormConfig = {
            title: 'Confirmation quantité',
            info: [
                {label: 'Référence', value: this.selectedReference.reference},
                {label: 'Libellé', value: this.selectedReference.label},
                {
                    label: `Code barre ${this.selectedReference["article-to-pick"] ? 'article' : 'référence'}`,
                    value: this.selectedReference["article-to-pick"] ? this.selectedReference["article-to-pick"] : this.selectedReference.refArticleBarCode
                },
                {label: 'Emplacement de stockage', value: this.selectedReference.location}
            ],
            fields: [
                {
                    label: 'Quantité collectée',
                    name: 'quantity',
                    type: 'number',
                    value: '',
                }
            ]
        };
    }

    public addArticle(data: any): void {
        const {quantity} = data;
        if (!quantity) {
            this.toastService.presentToast('Veuillez selectionner une quantité valide.');
        }
        else {
            this.sqliteService.findBy('emplacement', [`label = '${this.selectedReference.location}'`])
                .subscribe((restrictedLocations) => {
                    this.navService.push(NavPathEnum.EMPLACEMENT_SCAN, {
                        scanMode: BarcodeScannerModeEnum.TOOL_SEARCH,
                        customAction: (location: Emplacement) => {
                            this.navService.pop({path: NavPathEnum.MANUAL_COLLECT_ARTICLES})
                                .subscribe(() => {
                                    this.selectArticle(quantity, this.selectedReference, location);
                                });
                        },
                        ...(this.selectedReference.quantityType === 'reference' && restrictedLocations.length > 0? {
                            restrictedLocations
                        } :  {}),
                    });
                });
        }
    }
}
