import {FormPanelCameraComponent} from '@common/components/panel/form-panel/form-panel-camera/form-panel-camera.component';
import {Type} from '@angular/core';
import {FormPanelItemConfig} from '@common/components/panel/model/form-panel/configs/form-panel-item-config';
import {FormPanelCameraConfig} from '@common/components/panel/model/form-panel/configs/form-panel-camera-config';
import {FormPanelInputComponent} from '@common/components/panel/form-panel/form-panel-input/form-panel-input.component';
import {FormPanelInputConfig} from '@common/components/panel/model/form-panel/configs/form-panel-input-config';
import {FormPanelSelectComponent} from '@common/components/panel/form-panel/form-panel-select/form-panel-select.component';
import {FormPanelSelectConfig} from '@common/components/panel/model/form-panel/configs/form-panel-select-config';
import {FormPanelSigningConfig} from '@common/components/panel/model/form-panel/configs/form-panel-signing-config';
import {FormPanelSigningComponent} from '@common/components/panel/form-panel/form-panel-signing/form-panel-signing.component';
import {FormPanelToggleConfig} from '@common/components/panel/model/form-panel/configs/form-panel-toggle-config';
import {FormPanelToggleComponent} from '@common/components/panel/form-panel/form-panel-toggle/form-panel-toggle.component';
import {FormPanelCalendarComponent} from '@common/components/panel/form-panel/form-panel-calendar/form-panel-calendar.component';
import {FormPanelCalendarConfig} from '@common/components/panel/model/form-panel/configs/form-panel-calendar-config';
import {FormPanelButtonsComponent} from '@common/components/panel/form-panel/form-panel-buttons/form-panel-buttons.component';
import {FormPanelButtonsConfig} from '@common/components/panel/model/form-panel/configs/form-panel-buttons-config';
import {
    FormPanelTextareaComponent
} from "@common/components/panel/form-panel/form-panel-textarea/form-panel-textarea.component";
import {
    FormPanelTextareaConfig
} from "@common/components/panel/model/form-panel/configs/form-panel-textarea-config";

interface CameraParam {
    item: Type<FormPanelCameraComponent>;
    config: FormPanelItemConfig<FormPanelCameraConfig>;
}

interface InputParam {
    item: Type<FormPanelInputComponent>;
    config: FormPanelItemConfig<FormPanelInputConfig>;
}

interface TextareaParam {
    item: Type<FormPanelTextareaComponent>;
    config: FormPanelItemConfig<FormPanelTextareaConfig>;
}

interface SelectParam {
    item: Type<FormPanelSelectComponent>;
    config: FormPanelItemConfig<FormPanelSelectConfig>;
}

interface ButtonsParam {
    item: Type<FormPanelButtonsComponent>;
    config: FormPanelItemConfig<FormPanelButtonsConfig>;
}

interface SigningParam {
    item: Type<FormPanelSigningComponent>;
    config: FormPanelItemConfig<FormPanelSigningConfig>;
}

interface ToggleParam {
    item: Type<FormPanelToggleComponent>;
    config: FormPanelItemConfig<FormPanelToggleConfig>;
}

interface CalendarParam {
    item: Type<FormPanelCalendarComponent>;
    config: FormPanelItemConfig<FormPanelCalendarConfig>;
}

export type FormPanelParam = CameraParam
                           | InputParam
                           | ButtonsParam
                           | SelectParam
                           | SigningParam
                           | ToggleParam
                           | CalendarParam
                           | TextareaParam;
