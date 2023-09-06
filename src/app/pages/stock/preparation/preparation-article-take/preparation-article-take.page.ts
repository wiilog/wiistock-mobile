import {Component} from '@angular/core';
import {ArticlePrepa} from '@entities/article-prepa';
import {ArticlePrepaByRefArticle} from '@entities/article-prepa-by-ref-article';
import {Preparation} from '@entities/preparation';
import {NavService} from '@app/services/nav/nav.service';
import {ToastService} from '@app/services/toast.service';
import {ViewWillEnter} from "@ionic/angular";
import {NavPathEnum} from "@app/services/nav/nav-path.enum";

@Component({
    selector: 'wii-preparation-article-take',
    templateUrl: './preparation-article-take.page.html',
    styleUrls: ['./preparation-article-take.page.scss'],
})
export class PreparationArticleTakePage implements ViewWillEnter {

    public article: ArticlePrepa & ArticlePrepaByRefArticle;
    public refArticle: ArticlePrepa;
    public preparation: Preparation;

    public simpleFormConfig: {
        title: string;
        info: Array<{label: string; value: string;}>
        fields: Array<{label: string; name: string; type: string; value: string|number;}>
    };

    private selectArticle: (quantity: number) => void;

    public constructor(private toastService: ToastService,
                       private navService: NavService) {
    }

    public ionViewWillEnter(): void {
        this.article = this.navService.param('article');
        this.refArticle = this.navService.param('refArticle');
        this.preparation = this.navService.param('preparation');
        this.selectArticle = this.navService.param('selectArticle');

        this.simpleFormConfig = {
            title: 'Confirmation quantité',
            info: [
                ...(this.article.isSelectableByUser ? [{label: 'Référence', value: this.article.reference_article}] : []),
                {label: 'Article', value: this.article.barcode || ''},
                {label: 'Quantité à prélever', value: `${this.quantityToSelect}`},
                ...(this.quantityToSelect !== this.availableQuantity ? [{label: 'Quantité disponible', value: `${this.availableQuantity}`}] : []),
            ],
            fields: [
                {
                    label: 'Quantité souhaitée',
                    name: 'quantity',
                    type: 'number',
                    value: this.maxQuantityAvailable
                }
            ]
        }
    }

    public addArticle(data: any): void {
        const {quantity} = data;
        const maxQuantityAvailable = this.maxQuantityAvailable;

        if (!quantity || (quantity > maxQuantityAvailable) || quantity <= 0) {
            this.toastService.presentToast('Veuillez sélectionner une quantité valide.');
        }
        else {
            this.navService.pop({path: NavPathEnum.PREPARATION_ARTICLES}).subscribe(() => {
                this.selectArticle(quantity);
            });
        }
    }

    public get availableQuantity(): number {
        return this.article && (this.article.isSelectableByUser ? this.article.quantity : this.article.quantite);
    }

    public get quantityToSelect(): number {
        return this.article && (this.article.isSelectableByUser ? this.refArticle.quantite : this.article.quantite);
    }

    public get maxQuantityAvailable(): number {
        const availableQuantity = this.availableQuantity;
        const quantityToSelect = this.quantityToSelect;
        return (availableQuantity < quantityToSelect) ? availableQuantity : quantityToSelect;
    }
}
