import {FormViewerDetailsConfig} from './form-viewer-details-config';

export type NatureWithQuantity = {
    color: string;
    title: string;
    label: string;
    value: number|string;
};

export interface FormViewerTableConfig extends FormViewerDetailsConfig {
    value: Array<NatureWithQuantity>;
}
