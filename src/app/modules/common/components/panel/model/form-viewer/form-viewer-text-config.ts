import {FormViewerDetailsConfig} from './form-viewer-details-config';

export interface FormViewerTextConfig extends FormViewerDetailsConfig {
    value: string;
    inline?: boolean;
}
