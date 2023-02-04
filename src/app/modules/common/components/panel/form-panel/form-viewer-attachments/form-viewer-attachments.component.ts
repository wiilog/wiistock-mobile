import {Component, Input} from '@angular/core';
import {FormViewerAttachmentConfig} from '@common/components/panel/model/form-viewer/form-viewer-attachment-config';
import {NavService} from "@app/services/nav/nav.service";
import {NavPathEnum} from "@app/services/nav/nav-path.enum";


@Component({
    selector: 'wii-form-viewer-attachments',
    templateUrl: 'form-viewer-attachments.component.html',
    styleUrls: ['./form-viewer-attachments.component.scss']
})
export class FormViewerAttachmentsComponent implements FormViewerAttachmentConfig {

    @Input()
    public label: string;

    @Input()
    public value: Array<{
        label: string;
        href: string;
    }>;

    @Input()
    public inline?: boolean;

    public constructor(private navService: NavService) {}

    public viewImage(url: string, label?: string) {
        this.navService.push(NavPathEnum.IMAGE_VIEWER, {
            url,
            label,
        });
    }
}
