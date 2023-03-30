import {Component} from '@angular/core';
import {NavService} from '@app/services/nav/nav.service';
import {ToastService} from '@app/services/toast.service';
import {ArticleCollecte} from '@entities/article-collecte';
import {mergeMap} from 'rxjs/operators';
import {of} from 'rxjs';
import {ViewWillEnter} from "@ionic/angular";

@Component({
    selector: 'wii-collecte-article-take',
    templateUrl: './collecte-article-take.page.html',
    styleUrls: ['./collecte-article-take.page.scss'],
})
export class CollecteArticleTakePage implements ViewWillEnter{

    public article: ArticleCollecte;
    public pickedArticle: ArticleCollecte;

    public simpleFormConfig: {
        title: string;
        info: Array<{label: string; value?: string;}>
        fields: Array<{label: string; name: string; type: string; value: string|number;}>
    };

    private selectArticle: (quantity: number) => void;

    public constructor(private toastService: ToastService,
                       private navService: NavService) {
    }

    public ionViewWillEnter(): void {
        this.article = this.navService.param('article');
        this.pickedArticle = this.navService.param('pickedArticle');
        this.selectArticle = this.navService.param('selectArticle');

        this.simpleFormConfig = {
            title: 'Confirmation quantité',
            info: [
                {label: 'Référence', value: this.article.reference},
                {label: 'Libellé référence', value: this.article.reference_label},
                {label: 'Code barre', value: this.pickedArticle ? this.pickedArticle.barcode : this.article.barcode},
                {label: 'Quantité à collecter', value: `${this.article.quantite}`}
            ],
            fields: [
                {
                    label: 'Quantité souhaitée',
                    name: 'quantity',
                    type: 'number',
                    value: this.article.quantite
                }
            ]
        }
    }

    public addArticle(data: any): void {
        const {quantity} = data;
        if (quantity && quantity > this.article.quantite || quantity <= 0) {
            this.toastService.presentToast('Veuillez selectionner une quantité valide.');
        }
        else {
            this.navService.pop()
                .pipe(
                    mergeMap(() => (
                        (this.article.is_ref && this.article.quantity_type === 'article')
                            ? this.navService.pop()
                            : of(undefined)
                    ))
                )
                .subscribe(() => {
                    this.selectArticle(quantity);
                });
        }
    }
}
