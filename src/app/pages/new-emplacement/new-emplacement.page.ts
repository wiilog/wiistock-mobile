import {Component} from '@angular/core';
import {ApiService} from '@app/services/api.service';
import {ToastService} from '@app/services/toast.service';
import {LoadingService} from '@app/services/loading.service';
import {NavService} from '@app/services/nav/nav.service';
import {mergeMap, map} from 'rxjs/operators';
import {from} from 'rxjs';
import {ViewWillEnter} from "@ionic/angular";

@Component({
    selector: 'wii-new-emplacement',
    templateUrl: './new-emplacement.page.html',
    styleUrls: ['./new-emplacement.page.scss'],
})
export class NewEmplacementPage implements ViewWillEnter {

    public loading: boolean;

    public simpleFormConfig: { title: string; fields: Array<{label: string; name: string;}> };

    private createNewEmp: (emplacement: any) => void;
    private isDelivery: boolean;

    public constructor(private apiService: ApiService,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private navService: NavService) {
        this.loading = false;

        this.simpleFormConfig = {
            title: 'Nouvel emplacement',
            fields: [
                {
                    label: 'Label',
                    name: 'location'
                }
            ]
        }
    }

    public ionViewWillEnter(): void {
        this.createNewEmp = this.navService.param('createNewEmp');
        this.isDelivery = this.navService.param('isDelivery');
    }

    public onFormSubmit(data: any): void {
        if (!this.loading) {
            const {location} = data;
            if (location && location.length > 0) {
                this.loadingService
                    .presentLoading('Création de l\'emplacement')
                    .subscribe((loader: HTMLIonLoadingElement) => {
                        this.loading = true;
                        const params = {
                            label: location,
                            isDelivery: this.isDelivery ? '1' : '0'
                        };
                        this.apiService
                            .requestApi(ApiService.NEW_EMP, {params})
                            .pipe(
                                mergeMap((response) => {
                                    this.loading = false;
                                    return from(loader.dismiss()).pipe(map(() => response));
                                }),
                                mergeMap((response) => this.navService.pop().pipe(map(() => response)))
                            )
                            .subscribe({
                                next: (response) => {
                                    this.createNewEmp({
                                        id: Number(response.msg),
                                        label: location
                                    });
                                },
                                error: (response) => {
                                    this.loading = false;
                                    loader.dismiss();
                                    this.toastService.presentToast((response.error && response.error.msg) || 'Une erreur s\'est produite');
                                }
                            });
                    });
            }
            else {
                this.toastService.presentToast('Vous devez saisir un emplacement valide.');
            }
        }
    }
}
