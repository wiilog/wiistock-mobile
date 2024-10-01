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
import {FormPanelComponent} from "@common/components/panel/form-panel/form-panel.component";
import {SuggestionListComponent} from "@common/components/suggestion-list/suggestion-list.component";
import {TabComponent} from "@common/components/tab/tab.component";
import {SimpleFormComponent} from "@common/components/simple-form/simple-form.component";
import {CardListComponent} from "@common/components/card-list/card-list.component";
import {LogoCardComponent} from "@common/components/logo-card/logo-card.component";
import {NumberInputComponent} from "@common/components/number-input/number-input.component";
import {PackCountComponent} from "@common/components/pack-count/pack-count.component";
import {SimpleCardComponent} from "@common/components/simple-card/simple-card.component";
import {LeafletMapComponent} from "@common/components/leaflet-map/leaflet-map.component";
import {TransportCardComponent} from "@common/components/transport-card/transport-card.component";
import {PanelContentComponent} from "@common/components/panel/panel-content/panel-content.component"

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
        FormPanelComponent,
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
        SuggestionListComponent,
        TabComponent,
        SimpleFormComponent,
        CardListComponent,
        LogoCardComponent,
        NumberInputComponent,
        PackCountComponent,
        SimpleCardComponent,
        LeafletMapComponent,
        TransportCardComponent,
        PanelContentComponent,
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
        FormPanelComponent,
        SuggestionListComponent,
        TabComponent,
        SimpleFormComponent,
        CardListComponent,
        LogoCardComponent,
        NumberInputComponent,
        PackCountComponent,
        SimpleCardComponent,
        LeafletMapComponent,
        TransportCardComponent,
        PanelContentComponent,
    ]
})
export class CommonModule {
}
