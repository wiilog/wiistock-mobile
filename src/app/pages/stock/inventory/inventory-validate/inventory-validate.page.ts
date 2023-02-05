import {Component} from '@angular/core';
import {ArticleInventaire} from '@entities/article-inventaire';
import {NavService} from '@app/services/nav/nav.service';
import {ToastService} from '@app/services/toast.service';
import {ViewWillEnter} from "@ionic/angular";

@Component({
    selector: 'wii-inventory-validate',
    templateUrl: './inventory-validate.page.html',
    styleUrls: ['./inventory-validate.page.scss'],
})
export class InventoryValidatePage implements ViewWillEnter {

    public selectedArticle: ArticleInventaire;

    public simpleFormConfig: {
        title: string;
        info: Array<{label: string; value: string;}>
        fields: Array<{label: string; name: string; type: string; value: string|number;}>
    };

    private validateQuantity: (quantity: number) => void;

    public constructor(private toastService: ToastService,
                       private navService: NavService) {
    }

    public ionViewWillEnter(): void {
        this.selectedArticle = this.navService.param('selectedArticle');
        this.validateQuantity = this.navService.param('validateQuantity');
        const quantity = this.navService.param('quantity');

        this.simpleFormConfig = {
            title: 'Confirmation quantité',
            info: [
                {label: 'Article', value: this.selectedArticle.reference},
                {label: 'Code barre', value: this.selectedArticle.barcode || ''}
            ],
            fields: [
                {
                    label: 'Quantité relevée',
                    name: 'quantity',
                    type: 'number',
                    value: quantity ? `${quantity}` : ''
                }
            ]
        }
    }

    public addArticle(data: any): void {
        const {quantity} = data;

        if (quantity < 0 || quantity === '' || quantity === undefined || quantity === null || isNaN(quantity)) {
            this.toastService.presentToast('Veuillez sélectionner une quantité valide.');
        } else {
            this.navService.pop().subscribe(() => {
                this.validateQuantity(quantity);

                const remainingArticles = this.navService.param('remainingArticles');
                if(remainingArticles == 0) {
                    this.navService.pop();
                }
            });
        }
    }
}
