import {Component} from '@angular/core';
import {NavService} from '@app/services/nav/nav.service';
import {ViewWillEnter} from "@ionic/angular";

@Component({
    selector: 'wii-image-viewer',
    templateUrl: './image-viewer.page.html',
    styleUrls: ['./image-viewer.page.scss'],
})
export class ImageViewerPage implements ViewWillEnter {

    public url: string;

    public label: string;

    public constructor(private navService: NavService) {}

    public ionViewWillEnter(): void {
        this.url = this.navService.param(`url`);
        this.label = this.navService.param(`label`);
    }

    public close(): void {
        this.navService.pop();
    }

}
