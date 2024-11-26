import {Injectable} from '@angular/core';
import {FreeField, FreeFieldTyping} from '@entities/free-field';
import {FormPanelToggleComponent} from '@common/components/panel/form-panel/form-panel-toggle/form-panel-toggle.component';
import {FormPanelParam} from '@common/directives/form-panel/form-panel-param';
import {FormPanelCalendarMode} from '@common/components/panel/form-panel/form-panel-calendar/form-panel-calendar-mode';
import {FormPanelCalendarComponent} from '@common/components/panel/form-panel/form-panel-calendar/form-panel-calendar.component';
import {FormPanelInputComponent} from '@common/components/panel/form-panel/form-panel-input/form-panel-input.component';
import * as moment from 'moment';
import {FormPanelSelectComponent} from '@common/components/panel/form-panel/form-panel-select/form-panel-select.component';

@Injectable({
    providedIn: 'root'
})
export class FormPanelService {
    public createConfigFromFreeField(freeField: FreeField,
                                     value: any,
                                     formPanelItemGroup: string,
                                     mode: 'create'|'edit'): FormPanelParam|undefined {
        const common = {
            label: freeField.label,
            name: freeField.freeFieldId,
            group: formPanelItemGroup,
            ignoreEmpty: true,
            errors: {
                required: `Le champ ${freeField.label} est requis`
            }
        };

        const requiredFields: {[_:string]: keyof FreeField} = {
            create: 'requiredCreate',
            edit: 'requiredEdit'
        };
        const requiredField = requiredFields[mode];
        const required = requiredField && Boolean(freeField[requiredField]);

        const format = (freeField.typing === FreeFieldTyping.DATE
            ? 'YYYY-MM-DD'
            : (freeField.typing === FreeFieldTyping.DATETIME
                ? 'YYYY-MM-DD HH:mm'
                : '')
        );

        return (
            freeField.typing === FreeFieldTyping.BOOL ? {
                item: FormPanelToggleComponent,
                config: {
                    ...common,
                    value: value !== undefined ? Boolean(Number(value)) : Boolean(Number(freeField.defaultValue)),
                    inputConfig: {}
                }
            } :
            ((freeField.typing === FreeFieldTyping.DATE) || (freeField.typing === FreeFieldTyping.DATETIME)) ? {
                item: FormPanelCalendarComponent,
                config: {
                    ...common,
                    value: value === null || value === undefined
                        ? (freeField.defaultValue
                            ? moment(freeField.defaultValue, format)
                            : undefined)
                        : value,
                    inputConfig: {
                        required,
                        mode: (freeField.typing === FreeFieldTyping.DATE ? FormPanelCalendarMode.DATE : FormPanelCalendarMode.DATETIME)
                    } as any
                }
            } :
            ((freeField.typing === FreeFieldTyping.TEXT) || (freeField.typing === FreeFieldTyping.NUMBER)) ? {
                item: FormPanelInputComponent,
                config: {
                    ...common,
                    value: value || freeField.defaultValue,
                    inputConfig: {
                        required,
                        type: freeField.typing
                    } as any
                }
            } :
            ((freeField.typing === FreeFieldTyping.LIST) || (freeField.typing === FreeFieldTyping.MULTI_LIST)) ? {
                item: FormPanelSelectComponent,
                config: {
                    ...common,
                    value: (freeField.typing === FreeFieldTyping.LIST)
                        ? (value || freeField.defaultValue)
                        : (value || freeField.defaultValue || '')
                            .split(';')
                            .filter((id: any) => id)
                            .map((id: any) => ({id, label: id})),
                    inputConfig: {
                        required,
                        barcodeScanner: false,
                        isMultiple: (freeField.typing === FreeFieldTyping.MULTI_LIST),
                        elements: freeField.elements
                            ? JSON.parse(freeField.elements).map((label: any) => ({id: label, label}))
                            : []
                    } as any
                }
            } :
            undefined
        )
    }

    public formatFreeField({typing, label}: FreeField,
                           value: any): string {
        const prefixLabel = `${label} : `;
        let formattedValue: string;
        if(typing == FreeFieldTyping.BOOL) {
            formattedValue = value ? "Oui" : "Non";
        } else if(typing == FreeFieldTyping.LIST || typing == FreeFieldTyping.MULTI_LIST) {
            formattedValue = `${(value || '')}`.replace(/;/g, ', ');
        } else {
            formattedValue = value || "Non défini";
        }
        return `${prefixLabel}${formattedValue}`;
    }
}
