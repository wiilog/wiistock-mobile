import {NgModule} from '@angular/core';
import {CommonModule as NgCommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {HttpClientModule} from '@angular/common/http';
import {IconComponent} from "@common/components/icon/icon.component";
import {MainLoaderComponent} from "@common/components/main-loader/main-loader.component";
import {ServerImageComponent} from "@common/components/server-image/server-image.component";
import {MainHeaderComponent} from "@common/components/main-header/main-header.component";
import {MenuComponent} from "@common/components/menu/menu.component";
import {StatsSlidersComponent} from "@common/components/stats-sliders/stats-sliders.component";
import {BarcodeScannerComponent} from "@common/components/barcode-scanner/barcode-scanner.component";
import {BadgeComponent} from "@common/components/badge/badge.component";
import {PanelHeaderComponent} from "@common/components/panel/panel-header/panel-header.component";
import {SelectItemComponent} from "@common/components/select-item/select-item.component";
import {IonicSelectableModule} from "ionic-selectable";
import {SearchItemComponent} from "@common/components/select-item/search-item/search-item.component";
import {ListPanelComponent} from "@common/components/panel/list-panel/list-panel.component";
import {ListPanelItemComponent} from "@common/components/panel/list-panel/list-panel-item/list-panel-item.component";
import {FormPanelDirective} from "@common/directives/form-panel/form-panel.directive";
import {FormViewerDirective} from "@common/directives/form-viewer/form-viewer.directive";
import {
    FormPanelButtonsComponent
} from "@common/components/panel/form-panel/form-panel-buttons/form-panel-buttons.component";
import {
    FormPanelCalendarComponent
} from "@common/components/panel/form-panel/form-panel-calendar/form-panel-calendar.component";
import {FormPanelFieldComponent} from "@common/components/panel/form-panel/form-panel-field/form-panel-field.component";
import {
    FormPanelCameraComponent
} from "@common/components/panel/form-panel/form-panel-camera/form-panel-camera.component";
import {FormPanelInputComponent} from "@common/components/panel/form-panel/form-panel-input/form-panel-input.component";
import {
    FormPanelSelectComponent
} from "@common/components/panel/form-panel/form-panel-select/form-panel-select.component";
import {SignaturePadComponent} from "@common/components/signature-pad/signature-pad.component";
import {
    FormPanelSigningComponent
} from "@common/components/panel/form-panel/form-panel-signing/form-panel-signing.component";
import {
    FormPanelTextareaComponent
} from "@common/components/panel/form-panel/form-panel-textarea/form-panel-textarea.component";
import {
    FormPanelToggleComponent
} from "@common/components/panel/form-panel/form-panel-toggle/form-panel-toggle.component";
import {
    FormViewerAttachmentsComponent
} from "@common/components/panel/form-panel/form-viewer-attachments/form-viewer-attachments.component";
import {
    FormViewerTableComponent
} from "@common/components/panel/form-panel/form-viewer-table/form-viewer-table.component";
import {FormViewerTextComponent} from "@common/components/panel/form-panel/form-viewer-text/form-viewer-text.component";

@NgModule({
    imports: [
        NgCommonModule,
        HttpClientModule,
        IonicModule,
        FormsModule,
        IonicSelectableModule,
    ],
    declarations: [
        IconComponent,
        MainLoaderComponent,
        MainHeaderComponent,
        ServerImageComponent,
        MenuComponent,
        StatsSlidersComponent,
        BarcodeScannerComponent,
        BadgeComponent,
        SelectItemComponent,
        SearchItemComponent,
        SignaturePadComponent,
        FormPanelDirective,
        FormViewerDirective,
        PanelHeaderComponent,
        ListPanelComponent,
        ListPanelItemComponent,
        FormPanelButtonsComponent,
        FormPanelCalendarComponent,
        FormPanelFieldComponent,
        FormPanelCameraComponent,
        FormPanelInputComponent,
        FormPanelSelectComponent,
        FormPanelSigningComponent,
        FormPanelTextareaComponent,
        FormPanelToggleComponent,
        FormViewerAttachmentsComponent,
        FormViewerTableComponent,
        FormViewerTextComponent,
    ],
    exports: [
        IconComponent,
        MainLoaderComponent,
        ServerImageComponent,
        MainHeaderComponent,
        MenuComponent,
        StatsSlidersComponent,
        BarcodeScannerComponent,
        BadgeComponent,
        SelectItemComponent,
        PanelHeaderComponent,
        ListPanelComponent,
        ListPanelItemComponent,
    ]
})
export class CommonModule {
}
