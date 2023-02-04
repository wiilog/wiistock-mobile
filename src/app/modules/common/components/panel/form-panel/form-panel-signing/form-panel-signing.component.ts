import {Component, EventEmitter, Input, OnDestroy, Output} from '@angular/core';
import {LoadingService} from '@app/services/loading.service';
import {delay, mergeMap} from 'rxjs/operators';
import {ModalController} from '@ionic/angular';
import {from, of, Subscription, zip} from 'rxjs';
import {SignaturePadComponent} from '@common/components/signature-pad/signature-pad.component';
import {FormPanelItemComponent} from '@common/components/panel/model/form-panel/form-panel-item.component';
import {FormPanelSigningConfig} from '@common/components/panel/model/form-panel/configs/form-panel-signing-config';


@Component({
    selector: 'wii-form-panel-signing',
    templateUrl: 'form-panel-signing.component.html',
    styleUrls: [
        './form-panel-signing.component.scss'
    ]
})
export class FormPanelSigningComponent implements OnDestroy, FormPanelItemComponent<FormPanelSigningConfig> {

    @Input()
    public inputConfig: FormPanelSigningConfig;

    @Input()
    public value?: string;

    @Input()
    public label: string;

    @Input()
    public name: string;

    @Input()
    public errors?: {[errorName: string]: string};

    @Input()
    public inline?: boolean;

    @Output()
    public valueChange: EventEmitter<string>;

    private itemClickedSubscription?: Subscription;

    public constructor(private modalController: ModalController,
                       private loadingService: LoadingService) {
        this.valueChange = new EventEmitter<string>();
    }

    public get error(): string|undefined {
        return (this.inputConfig.required && !this.value && this.errors)
            ? this.errors['required']
            : undefined;
    }

    public onItemClicked(): void {
        if (!this.itemClickedSubscription) {
            this.itemClickedSubscription = this.loadingService
                .presentLoading()
                .pipe(
                    mergeMap((loading: HTMLIonLoadingElement) => zip(
                        of(loading),
                        from(this.modalController.create({
                            component: SignaturePadComponent,
                            componentProps: {
                                signature: this.value
                            },
                            showBackdrop: true
                        }))
                    )),
                    delay(400), // we wait for the keyboard to finish hiding
                    mergeMap(([loading, modal]: [HTMLIonLoadingElement, HTMLIonModalElement]) => {
                        modal.onDidDismiss().then((returnedData) => {
                            const data = returnedData && returnedData.data;
                            if (data && (data.signature === false || data.signature)) {
                                this.value = data.signature
                                    ? data.signature // not false
                                    : undefined; // if false we delete previous image
                                this.valueChange.emit(this.value);
                            }
                        });
                        return zip(of(loading), from(modal.present()));
                    })
                )
                .subscribe(([loading]: [HTMLIonLoadingElement, void]) => {
                    loading.dismiss();
                    this.unsubscribeClick();
                });
        }
    }

    public ngOnDestroy(): void {
        this.unsubscribeClick();
    }

    private unsubscribeClick(): void {
        if (this.itemClickedSubscription) {
            this.itemClickedSubscription.unsubscribe();
            this.itemClickedSubscription = undefined;
        }
    }
}
