export interface FormPanelItemConfig<InputConfig> {
    label?: string;
    name: string|number;
    group?: string;
    ignoreEmpty?: boolean;
    value?: string|number|boolean|Array<string>;
    errors?: {[errorName: string]: string};
    inputConfig: InputConfig;
    multiple?: boolean;
    inline?: boolean;
}
