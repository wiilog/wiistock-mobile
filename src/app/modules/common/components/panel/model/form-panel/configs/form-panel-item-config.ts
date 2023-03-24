export interface FormPanelItemConfig<InputConfig> {
    label?: string;
    name: string|number;
    group?: string;
    ignoreEmpty?: boolean;
    value?: string|number|boolean|Array<string>;
    errors?: {[errorName: string]: string};
    inputConfig: InputConfig;
    section?: {title: string; bold: boolean; logo?: string;};
    multiple?: boolean;
    inline?: boolean;
}
