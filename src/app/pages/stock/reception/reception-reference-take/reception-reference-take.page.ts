import {Component} from '@angular/core';
import {NavService} from '@app/services/nav/nav.service';
import {ToastService} from '@app/services/toast.service';
import {ViewWillEnter} from "@ionic/angular";
import {NavPathEnum} from "@app/services/nav/nav-path.enum";
import {ReceptionReferenceArticle} from "@entities/reception-reference-article";

@Component({
    selector: 'wii-reception-article-take',
    templateUrl: './reception-reference-take.page.html',
    styleUrls: ['./reception-reference-take.page.scss'],
})
export class ReceptionReferenceTakePage implements ViewWillEnter {

    public refArticle: ReceptionReferenceArticle;

    public simpleFormConfig: {
        title: string;
        info: Array<{label: string; value: string;}>
        fields: Array<{label: string; name: string; type: string; value: string|number;}>
    };

    private selectReference: (quantity: number) => void;

    public constructor(private toastService: ToastService,
                       private navService: NavService) {
    }

    public ionViewWillEnter(): void {
        this.refArticle = this.navService.param('reference');
        this.selectReference = this.navService.param('selectReference');

        this.simpleFormConfig = {
            title: 'Confirmation quantité',
            info: [
                ...(this.refArticle ? [{label: 'Référence', value: this.refArticle.reference}] : []),
                {label: 'Libellé', value: this.refArticle.label || ''},
                {label: 'Code barre référence', value: `${this.refArticle.barCode}`},
            ],
            fields: [
                {
                    label: 'Quantité réceptionnée',
                    name: 'quantity',
                    type: 'number',
                    value: this.refArticle.receivedQuantity,
                }
            ]
        }
    }

    public addArticle(data: any): void {
        const {quantity} = data;
        const maxQuantityAvailable = this.refArticle.quantityToReceive;

        if (!quantity || (quantity > maxQuantityAvailable) || quantity <= 0) {
            this.toastService.presentToast('Veuillez sélectionner une quantité valide.');
        }
        else {
            this.navService.pop({path: NavPathEnum.RECEPTION_DETAILS}).subscribe(() => {
                this.selectReference(quantity);
            });
        }
    }
}
