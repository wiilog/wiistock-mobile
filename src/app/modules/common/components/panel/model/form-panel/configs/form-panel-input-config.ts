export interface FormPanelInputConfig {
    type: 'number'|'text';
    min?: number;
    max?: number;
    required?: boolean;
    maxLength?: string;
    disabled?: boolean;
    onChange?: (item: any) => void;
}
