import {Component, EventEmitter, Input, Output} from '@angular/core';
import {take} from 'rxjs/operators';
import {from} from 'rxjs';
import {FormPanelItemComponent} from '@common/components/panel/model/form-panel/form-panel-item.component';
import {FormPanelCameraConfig} from '@common/components/panel/model/form-panel/configs/form-panel-camera-config';
import {Camera, Photo} from "@capacitor/camera";
import {CameraResultType, CameraSource} from "@capacitor/camera/dist/esm/definitions";


@Component({
    selector: 'wii-form-panel-camera',
    templateUrl: 'form-panel-camera.component.html',
    styleUrls: ['./form-panel-camera.component.scss']
})
export class FormPanelCameraComponent implements FormPanelItemComponent<FormPanelCameraConfig> {

    private static readonly MAX_MULTIPLE_PHOTO = 10;

    @Input()
    public inputConfig: FormPanelCameraConfig;

    @Input()
    public value?: string|Array<string>;

    @Input()
    public label: string;

    @Input()
    public name: string;

    @Input()
    public disabled?: boolean;

    @Input()
    public errors?: { [errorName: string]: string };

    @Input()
    public inline?: boolean;

    @Output()
    public valueChange: EventEmitter<string|Array<string>>;

    public constructor() {
        this.valueChange = new EventEmitter<string|Array<string>>();
    }

    public get error(): string|undefined {
        return (this.inputConfig.required && !this.value)
            ? (this.errors && this.errors['required'])
            : undefined;
    }

    public onPhotoClicked(index: number): void {
        if (!this.inputConfig.disabled) {
            if (this.inputConfig.multiple) {
                (this.value as Array<string>).splice(index, 1);
            } else {
                this.value = undefined;
            }
        }
    }

    public onItemClicked(): void {
        from(Camera.getPhoto({
            quality: 30,
            resultType: CameraResultType.DataUrl,
            source: CameraSource.Camera,
            saveToGallery: false,
        }))
            .pipe(take(1))
            .subscribe({
                next: ({dataUrl: value}: Photo) => {
                    if (this.inputConfig.multiple && value) {
                        if (!Array.isArray(this.value)) {
                            if (this.value) {
                                this.value = [this.value];
                            } else {
                                this.value = [];
                            }
                        }
                        this.value.push(value);
                    } else {
                        this.value = value || undefined;
                    }
                    this.valueChange.emit(this.value);
                },
                error: () => {
                    this.valueChange.emit(undefined);
                }
            });
    }

    public get displayCameraButton(): boolean {
        const max = this.inputConfig.max || FormPanelCameraComponent.MAX_MULTIPLE_PHOTO;
        return (
            (
                this.inputConfig.multiple
                && this.value
                && (this.value as Array<string>).length < max
            )
            || !this.value
        );
    }

    public get valueArray(): Array<string> {
        return this.value as Array<string>;
    }
}
