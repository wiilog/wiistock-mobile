export interface FormPanelButtonsConfig {
    required?: boolean;
    elements?: Array<{id: number; label: string;}>;
    onChange?: (item: any) => void;
}
