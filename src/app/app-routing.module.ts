import {NgModule} from '@angular/core';
import {PreloadAllModules, RouterModule, Routes} from '@angular/router';
import {NavPathEnum} from "./services/nav/nav-path.enum";
import {UserDisconnectedGuard} from "@app/guards/user-disconnected.guard";
import {UserConnectedGuard} from "@app/guards/user-connected.guard";

const routes: Routes = [
    {
        path: '',
        redirectTo: NavPathEnum.LOGIN,
        pathMatch: 'full'
    },
    {
        path: NavPathEnum.LOGIN,
        canActivate: [UserDisconnectedGuard],
        loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule)
    },
    {
        path: NavPathEnum.PARAMS,
        canActivate: [UserDisconnectedGuard],
        loadChildren: () => import('./pages/params/params.module').then(m => m.ParamsPageModule)
    },
    {
        path: NavPathEnum.MAIN_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('./pages/main-menu/main-menu.module').then(m => m.MainMenuPageModule)
    },
    {
        path: NavPathEnum.STOCK_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('./pages/stock/stock-menu/stock-menu.module').then(m => m.StockMenuPageModule)
    },
    {
        path: NavPathEnum.ARTICLE_CREATION_SCAN_RFID_TAG,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('./pages/stock/article-creation/scan-rfid-tag/scan-rfid-tag.module').then(m => m.ScanRfidTagModule)
    },
    {
        path: NavPathEnum.ARTICLE_CREATION_FORM,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('./pages/stock/article-creation/form/form.module').then(m => m.FormModule)
    },
    {
        path: NavPathEnum.INVENTORY_ARTICLES,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('./pages/stock/inventory/inventory-articles/inventory-articles.module').then(m => m.InventoryArticlesPageModule)
    },
    {
        path: NavPathEnum.INVENTORY_LOCATIONS,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('./pages/stock/inventory/inventory-locations/inventory-locations.module').then(m => m.InventoryLocationsPageModule)
    },
    {
        path: NavPathEnum.INVENTORY_LOCATIONS_ANOMALIES,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('./pages/stock/inventory/inventory-locations/inventory-locations-anomalies/inventory-locations-anomalies.module').then(m => m.InventoryLocationsAnomaliesPageModule)
    },
    {
        path: NavPathEnum.INVENTORY_LOCATIONS_MISSIONS,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('./pages/stock/inventory/inventory-locations/inventory-locations-missions/inventory-locations-missions.module').then(m => m.InventoryLocationsMissionsPageModule)
    },
    {
        path: NavPathEnum.INVENTORY_MISSION_ZONE_CONTROLE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/inventory/inventory-mission-zone-controle/inventory-mission-zone-controle.module').then(m => m.InventoryMissionZoneControlePageModule)
    },
    {
        path: NavPathEnum.INVENTORY_MISSION_ZONES,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/inventory/inventory-mission-zones/inventory-mission-zones.module').then(m => m.InventoryMissionZonesPageModule)
    },
    {
        path: NavPathEnum.ASSOCIATION,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/association/association.module').then(m => m.AssociationModule)
    },
    {
        path: NavPathEnum.DEMANDE_LIVRAISON_ARTICLE_TAKE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/demande/demande-livraison/demande-livraison-article-take/demande-livraison-article-take.module').then(m => m.DemandeLivraisonArticleTakePageModule)
    },
    {
        path: NavPathEnum.DEMANDE_LIVRAISON_ARTICLES,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/demande/demande-livraison/demande-livraison-articles/demande-livraison-articles.module').then(m => m.DemandeLivraisonArticlesPageModule)
    },
    {
        path: NavPathEnum.DEMANDE_LIVRAISON_HEADER,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/demande/demande-livraison/demande-livraison-header/demande-livraison-header.module').then(m => m.DemandeLivraisonHeaderPageModule)
    },
    {
        path: NavPathEnum.DEMANDE_LIVRAISON_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/demande/demande-livraison/demande-livraison-menu/demande-livraison-menu.module').then(m => m.DemandeLivraisonMenuPageModule)
    },
    {
        path: NavPathEnum.DEMANDE_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/demande/demande-menu/demande-menu.module').then(m => m.DemandeMenuPageModule)
    },
    {
        path: NavPathEnum.IMAGE_VIEWER,
        loadChildren: () => import('@pages/image-viewer/image-viewer.module').then(m => m.ImageViewerPageModule)
    },
    {
        path: NavPathEnum.DISPATCH_NEW,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/demande/dispatch/dispatch-new/dispatch-new.module').then(m => m.DispatchNewModule)
    },
    {
        path: NavPathEnum.DISPATCH_REQUEST_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/demande/dispatch/dispatch-request-menu/dispatch-request-menu.module').then(m => m.DispatchRequestMenuModule)
    },
    {
        path: NavPathEnum.HANDLING_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/demande/handling/handling-menu/handling-menu.module').then(m => m.HandlingMenuPageModule)
    },
    {
        path: NavPathEnum.HANDLING_VALIDATE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/demande/handling/handling-validate/handling-validate.module').then(m => m.HandlingValidatePageModule)
    },
    {
        path: NavPathEnum.NEW_EMPLACEMENT,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/new-emplacement/new-emplacement.module').then(m => m.NewEmplacementPageModule)
    },
    {
        path: NavPathEnum.DEPOSE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/prise-depose/depose/depose.module').then(m => m.DeposePageModule)
    },
    {
        path: NavPathEnum.EMPLACEMENT_SCAN,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/prise-depose/emplacement-scan/emplacement-scan.module').then(m => m.EmplacementScanPageModule)
    },
    {
        path: NavPathEnum.MOVEMENT_CONFIRM,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/prise-depose/movement-confirm/movement-confirm.module').then(m => m.MovementConfirmPageModule)
    },
    {
        path: NavPathEnum.MOVEMENT_CONFIRM_SUB_PACK,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/prise-depose/movement-confirm/movement-confirm.module').then(m => m.MovementConfirmPageModule)
    },
    {
        path: NavPathEnum.PRISE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/prise-depose/prise/prise.module').then(m => m.PrisePageModule)
    },
    {
        path: NavPathEnum.PRISE_UL_DETAILS,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/prise-depose/prise-ul-details/prise-ul-details.module').then(m => m.PriseUlDetailsPageModule)
    },
    {
        path: NavPathEnum.DISPATCH_GROUPED_SIGNATURE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/tracking/dispatch/dispatch-grouped-signature/dispatch-grouped-signature.module').then(m => m.DispatchGroupedSignaturePageModule)
    },
    {
        path: NavPathEnum.DISPATCH_GROUPED_SIGNATURE_FINISH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/tracking/dispatch/dispatch-grouped-signature-finish/dispatch-grouped-signature-finish.module').then(m => m.DispatchGroupedSignatureFinishPageModule)
    },
    {
        path: NavPathEnum.DISPATCH_GROUPED_SIGNATURE_VALIDATE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/tracking/dispatch/dispatch-grouped-signature-validate/dispatch-grouped-signature-validate.module').then(m => m.DispatchGroupedSignatureValidatePageModule)
    },
    {
        path: NavPathEnum.DISPATCH_LOGISTIC_UNIT_REFERENCE_ASSOCIATION,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/tracking/dispatch/dispatch-logistic-unit-reference-association/dispatch-logistic-unit-reference-association.module').then(m => m.DispatchLogisticUnitReferenceAssociationModule)
    },
    {
        path: NavPathEnum.DISPATCH_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/tracking/dispatch/dispatch-menu/dispatch-menu.module').then(m => m.DispatchMenuPageModule)
    },
    {
        path: NavPathEnum.DISPATCH_PACK_CONFIRM,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/tracking/dispatch/dispatch-pack-confirm/dispatch-pack-confirm.module').then(m => m.DispatchPackConfirmPageModule)
    },
    {
        path: NavPathEnum.DISPATCH_PACKS,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/tracking/dispatch/dispatch-packs/dispatch-packs.module').then(m => m.DispatchPacksPageModule)
    },
    {
        path: NavPathEnum.DISPATCH_VALIDATE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/tracking/dispatch/dispatch-validate/dispatch-validate.module').then(m => m.DispatchValidatePageModule)
    },
    {
        path: NavPathEnum.DISPATCH_WAYBILL,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/tracking/dispatch/dispatch-waybill/dispatch-waybill-page.module').then(m => m.DispatchWaybillPageModule)
    },
    {
        path: NavPathEnum.EMPTY_ROUND,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/tracking/empty-round/empty-round.module').then(m => m.EmptyRoundPageModule)
    },
    {
        path: NavPathEnum.GROUP_CONTENT,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/tracking/group/group-content/group-content.module').then(m => m.GroupContentPageModule)
    },
    {
        path: NavPathEnum.GROUP_SCAN_GROUP,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/tracking/group/group-scan-group/group-scan-group.module').then(m => m.GroupScanGroupPageModule)
    },
    {
        path: NavPathEnum.TRACKING_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/tracking/tracking-menu/tracking-menu.module').then(m => m.TrackingMenuPageModule)
    },
    {
        path: NavPathEnum.TRACKING_MOVEMENT_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/tracking/tracking-movement-menu/tracking-movement-menu.module').then(m => m.TrackingMovementMenuPageModule)
    },
    {
        path: NavPathEnum.TRUCK_ARRIVAL_CARRIER,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/tracking/truck-arrival/truck-arrival-carrier/truck-arrival-carrier-page.module').then(m => m.TruckArrivalCarrierPageModule)
    },
    {
        path: NavPathEnum.TRUCK_ARRIVAL_DRIVER,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/tracking/truck-arrival/truck-arrival-driver/truck-arrival-driver-page.module').then(m => m.TruckArrivalDriverPageModule)
    },
    {
        path: NavPathEnum.TRUCK_ARRIVAL_LINES,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/tracking/truck-arrival/truck-arrival-lines/truck-arrival-lines-page.module').then(m => m.TruckArrivalLinesPageModule)
    },
    {
        path: NavPathEnum.TRUCK_ARRIVAL_RESERVES,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/tracking/truck-arrival/truck-arrival-reserves/truck-arrival-reserves-page.module').then(m => m.TruckArrivalReservesPageModule)
    },
    {
        path: NavPathEnum.TRUCK_ARRIVAL_RESERVE_DETAILS,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/tracking/truck-arrival/truck-arrival-reserve-details/truck-arrival-reserve-details-page.module').then(m => m.TruckArrivalReserveDetailsPageModule)
    },
    {
        path: NavPathEnum.UNGROUP_CONFIRM,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/tracking/ungroup/ungroup-confirm/ungroup-confirm.module').then(m => m.UngroupConfirmPageModule)
    },
    {
        path: NavPathEnum.COLLECTE_ARTICLE_PICKING,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/collecte/collecte-article-picking/collecte-article-picking.module').then(m => m.CollecteArticlePickingPageModule)
    },
    {
        path: NavPathEnum.COLLECTE_ARTICLE_TAKE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/collecte/collecte-article-take/collecte-article-take.module').then(m => m.CollecteArticleTakePageModule)
    },
    {
        path: NavPathEnum.COLLECTE_ARTICLES,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/collecte/collecte-articles/collecte-articles.module').then(m => m.CollecteArticlesPageModule)
    },
    {
        path: NavPathEnum.COLLECTE_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/collecte/collecte-menu/collecte-menu.module').then(m => m.CollecteMenuPageModule)
    },
    {
        path: NavPathEnum.DELIVERY_LOGISTIC_UNIT_CONTENT,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/livraison/delivery-logistic-unit-content/delivery-logistic-unit-content.module').then(m => m.DeliveryLogisticUnitContentModule)
    },
    {
        path: NavPathEnum.DEMANDE_LIVRAISON_ARTICLE_TAKE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/demande/demande-livraison/demande-livraison-article-take/demande-livraison-article-take.module').then(m => m.DemandeLivraisonArticleTakePageModule)
    },
    {
        path: NavPathEnum.LIVRAISON_ARTICLES,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/livraison/livraison-articles/livraison-articles.module').then(m => m.LivraisonArticlesPageModule)
    },
    {
        path: NavPathEnum.LIVRAISON_EMPLACEMENT,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/livraison/livraison-emplacement/livraison-emplacement.module').then(m => m.LivraisonEmplacementPageModule)
    },
    {
        path: NavPathEnum.DEMANDE_LIVRAISON_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/demande/demande-livraison/demande-livraison-menu/demande-livraison-menu.module').then(m => m.DemandeLivraisonMenuPageModule)
    },
    {
        path: NavPathEnum.MANUAL_DELIVERY,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/livraison/manual-delivery/manual-delivery.module').then(m => m.ManualDeliveryPageModule)
    },
    {
        path: NavPathEnum.MANUAL_DELIVERY_LOCATION,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/livraison/manual-delivery-location/manual-delivery-location.module').then(m => m.ManualDeliveryLocationModule)
    },
    {
        path: NavPathEnum.PREPARATION_ARTICLE_TAKE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/preparation/preparation-article-take/preparation-article-take.module').then(m => m.PreparationArticleTakePageModule)
    },
    {
        path: NavPathEnum.PREPARATION_ARTICLES,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/preparation/preparation-articles/preparation-articles.module').then(m => m.PreparationArticlesPageModule)
    },
    {
        path: NavPathEnum.PREPARATION_EMPLACEMENT,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/preparation/preparation-emplacement/preparation-emplacement.module').then(m => m.PreparationEmplacementPageModule)
    },
    {
        path: NavPathEnum.PREPARATION_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/preparation/preparation-menu/preparation-menu.module').then(m => m.PreparationMenuPageModule)
    },
    {
        path: NavPathEnum.PREPARATION_REF_ARTICLES,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/preparation/preparation-ref-articles/preparation-ref-articles.module').then(m => m.PreparationRefArticlesPageModule)
    },
    {
        path: NavPathEnum.STOCK_MOVEMENT_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/stock-movement-menu/stock-movement-menu.module').then(m => m.StockMovementMenuPageModule)
    },
    {
        path: NavPathEnum.TRANSFER_ARTICLES,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/transfer/transfer-articles/transfer-articles.module').then(m => m.TransferArticlesPageModule)
    },
    {
        path: NavPathEnum.TRANSFER_LIST,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/transfer/transfer-list/transfer-list.module').then(m => m.TransferListPageModule)
    },
    {
        path: NavPathEnum.TRANSFER_VALIDATE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/transfer/transfer-validate/transfer-validate.module').then(m => m.TransferValidatePageModule)
    },
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, {preloadingStrategy: PreloadAllModules})
    ],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
