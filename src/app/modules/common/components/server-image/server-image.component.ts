import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ServerImageKeyEnum} from '@app/services/server-image/server-image-key.enum';
import {ApiService} from '@app/services/api.service';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {Subscription} from 'rxjs';
import {ServerImageService} from '@app/services/server-image/server-image.service';


@Component({
    selector: 'wii-server-image',
    templateUrl: 'server-image.component.html',
    styleUrls: ['./server-image.component.scss']
})
export class ServerImageComponent implements OnInit, OnDestroy {
    @Input()
    public backup: string;

    @Input()
    public alt: string;

    @Input()
    public key: ServerImageKeyEnum;

    public src?: SafeUrl;

    private imageSubscription?: Subscription;

    private static readonly BACKUPS = {
        [ServerImageKeyEnum.HEADER_IMAGE_KEY]: 'assets/images/followgt_bg_transparent.svg',
        [ServerImageKeyEnum.LOGIN_IMAGE_KEY]: 'assets/images/followgt.svg'
    }

    public constructor(private apiService: ApiService,
                       private serverImageService: ServerImageService,
                       private domSanitizer: DomSanitizer) {
    }

    public ngOnInit(): void {
        this.reload();
    }

    public reload(): void {
        const backup = ServerImageComponent.BACKUPS[this.key];
        const image = this.serverImageService.get(this.key) || backup;
        this.src = this.domSanitizer.bypassSecurityTrustUrl(image);

        this.unsubscribeImage();
        this.imageSubscription = this.apiService
            .requestApi(ApiService.GET_SERVER_IMAGES, {params: {key: this.key}})
            .subscribe({
                next: ({success, image}) => {
                    if (success && image) {
                        this.src = this.domSanitizer.bypassSecurityTrustUrl(image);
                        this.serverImageService.saveOneToStorage(this.key, image);
                    } else {
                        this.src = backup;
                    }
                },
                error: () => {
                    this.src = backup;
                }
            });
    }

    public ngOnDestroy(): void {
        this.unsubscribeImage();
    }

    private unsubscribeImage() {
        if (this.imageSubscription) {
            this.imageSubscription.unsubscribe();
            this.imageSubscription = undefined;
        }
    }

}
