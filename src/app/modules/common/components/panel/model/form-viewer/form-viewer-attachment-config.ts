import {FormViewerDetailsConfig} from './form-viewer-details-config';

export interface FormViewerAttachmentConfig extends FormViewerDetailsConfig {
    value: Array<{
        label: string;
        href: string;
    }>;
    inline?: boolean;
}
