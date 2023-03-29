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

    private static readonly MAX_MULTIPLE_SIGNATURE = 1;

    @Input()
    public inputConfig: FormPanelSigningConfig;

    @Input()
    public value?: string|Array<string>;

    @Input()
    public label: string;

    @Input()
    public name: string;

    @Input()
    public errors?: {[errorName: string]: string};

    @Input()
    public inline?: boolean;

    @Output()
    public valueChange: EventEmitter<string|Array<string>>;

    private itemClickedSubscription?: Subscription;

    public constructor(private modalController: ModalController,
                       private loadingService: LoadingService) {
        this.valueChange = new EventEmitter();
    }

    public get error(): string|undefined {
        return (this.inputConfig.required && !this.value && this.errors)
            ? this.errors['required']
            : undefined;
    }

    public onSignatureClicked(index: number): void {
        if (this.inputConfig.multiple) {
            (this.value as Array<string>).splice(index, 1);
        } else {
            this.value = undefined;
        }
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
                                signature: this.inputConfig.multiple ? '' : this.value
                            },
                            showBackdrop: true
                        }))
                    )),
                    delay(400), // we wait for the keyboard to finish hiding
                    mergeMap(([loading, modal]: [HTMLIonLoadingElement, HTMLIonModalElement]) => {
                        modal.onDidDismiss().then((returnedData) => {
                            const data = returnedData && returnedData.data;
                            if (data && (data.signature === false || data.signature)) {
                                if (this.inputConfig.multiple) {
                                    if (!Array.isArray(this.value)) {
                                        this.value = [];
                                    }
                                    this.value.push(data.signature);
                                }
                                else {
                                    this.value = data.signature || undefined;
                                }
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

    public get displaySigningButton(): boolean {
        const max = this.inputConfig.max || FormPanelSigningComponent.MAX_MULTIPLE_SIGNATURE;
        return (
            (
                this.inputConfig.multiple
                && this.value
                && (this.value as Array<string>).length < max
            )
            || !this.value
        );
    }
}
