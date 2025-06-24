import {NgModule} from '@angular/core';
import {PreloadAllModules, RouterModule, Routes} from '@angular/router';
import {NavPathEnum} from "./services/nav/nav-path.enum";
import {UserDisconnectedGuard} from "@app/guards/user-disconnected.guard";
import {UserConnectedGuard} from "@app/guards/user-connected.guard";

const routes: Routes = [
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
        path: NavPathEnum.INVENTORY_VALIDATE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/inventory/inventory-validate/inventory-validate.module').then(m => m.InventoryValidatePageModule)
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
        path: NavPathEnum.UNGROUP_SCAN_LOCATION,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/tracking/ungroup/ungroup-scan-location/ungroup-scan-location.module').then(m => m.UngroupScanLocationPageModule)
    },
    {
        path: NavPathEnum.UNGROUP_SCAN_GROUP,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/tracking/ungroup/ungroup-scan-group/ungroup-scan-group.module').then(m => m.UngroupScanGroupPageModule)
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
        path: NavPathEnum.LIVRAISON_ARTICLE_TAKE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/livraison/livraison-article-take/livraison-article-take.module').then(m => m.LivraisonArticleTakePageModule)
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
        path: NavPathEnum.LIVRAISON_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/livraison/livraison-menu/livraison-menu.module').then(m => m.LivraisonMenuPageModule)
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
    {
        path: NavPathEnum.FINISH_TRANSPORT,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/track/finish-transport/finish-transport.module').then(m => m.FinishTransportPageModule)
    },
    {
        path: NavPathEnum.TRANSPORT_COLLECT_NATURES,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/track/transport-collect-natures/transport-collect-natures.module').then(m => m.TransportCollectNaturesPageModule)
    },
    {
        path: NavPathEnum.TRANSPORT_DEPOSIT_LOCATION,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/track/transport-deposit-location/transport-deposit-location.module').then(m => m.TransportDepositLocationPageModule)
    },
    {
        path: NavPathEnum.TRANSPORT_DEPOSIT_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/track/transport-deposit-menu/transport-deposit-menu.module').then(m => m.TransportDepositMenuPageModule)
    },
    {
        path: NavPathEnum.TRANSPORT_DEPOSIT_PACKS,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/track/transport-deposit-packs/transport-deposit-packs.module').then(m => m.TransportDepositPacksPageModule)
    },
    {
        path: NavPathEnum.TRANSPORT_PACK_DELIVER,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/track/transport-pack-deliver/transport-pack-deliver.module').then(m => m.TransportPackDeliverPageModule)
    },
    {
        path: NavPathEnum.TRANSPORT_ROUND_FINISH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/track/transport-round-finish/transport-round-finish.module').then(m => m.TransportRoundFinishPageModule)
    },
    {
        path: NavPathEnum.TRANSPORT_ROUND_FINISH_PACK_DROP,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/track/transport-round-finish-pack-drop/transport-round-finish-pack-drop.module').then(m => m.TransportRoundFinishPackDropPageModule)
    },
    {
        path: NavPathEnum.TRANSPORT_ROUND_FINISH_PACK_DROP_VALIDATE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/track/transport-round-finish-pack-drop-validate/transport-round-finish-pack-drop-validate.module').then(m => m.TransportRoundFinishPackDropValidatePageModule)
    },
    {
        path: NavPathEnum.TRANSPORT_ROUND_LIST,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/track/transport-round-list/transport-round-list.module').then(m => m.TransportRoundListPageModule)
    },
    {
        path: NavPathEnum.TRANSPORT_ROUND_PACK_LOAD,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/track/transport-round-pack-load/transport-round-pack-load.module').then(m => m.TransportRoundPackLoadPageModule)
    },
    {
        path: NavPathEnum.TRANSPORT_ROUND_PACK_LOAD_VALIDATE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/track/transport-round-pack-load-validate/transport-round-pack-load-validate.module').then(m => m.TransportRoundPackLoadConfirmPageModule)
    },
    {
        path: NavPathEnum.TRANSPORT_SHOW,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/track/transport-show/transport-show.module').then(m => m.TransportShowPageModule)
    },
    {
        path: NavPathEnum.TRANSPORT_FAILURE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/track/transport-failure/transport-failure.module').then(m => m.TransportFailurePageModule)
    },
    {
        path: NavPathEnum.TRANSPORT_LIST,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/track/transport-list/transport-list.module').then(m => m.TransportListPageModule)
    },
    {
        path: NavPathEnum.RECEIPT_ASSOCIATION_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/tracking/receipt-association/receipt-association-menu/receipt-association-menu.module').then(m => m.ReceiptAssociationMenuPageModule)
    },
    {
        path: NavPathEnum.RECEIPT_ASSOCIATION_LOGISTIC_UNIT,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/tracking/receipt-association/receipt-association-logistic-unit/receipt-association-logistic-unit.module').then(m => m.ReceiptAssociationLogisticUnitPageModule)
    },
    {
        path: NavPathEnum.MANUAL_COLLECT_ARTICLES,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/manual-collect/manual-collect-articles/manual-collect-articles.module').then(m => m.ManualCollectArticlesPageModule)
    },
    {
        path: NavPathEnum.MANUAL_COLLECT_ARTICLE_TAKE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/manual-collect/manual-collect-article-take/manual-collect-article-take.module').then(m => m.ManualCollectArticleTakePageModule)
    },
    {
        path: NavPathEnum.RECEPTION_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/reception/reception-menu/reception-menu.module').then(m => m.ReceptionMenuPageModule)

    },
    {
        path: NavPathEnum.RECEPTION_DETAILS,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/reception/reception-details/reception-details.module').then(m => m.ReceptionDetailsPageModule)
    },
    {
        path: NavPathEnum.RECEPTION_REFERENCE_TAKE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/reception/reception-reference-take/reception-reference-take.module').then(m => m.ReceptionReferenceTakePageModule)
    },
    {
        path: NavPathEnum.READING_SCAN,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/tracking/reading/reading-scan/reading-scan.module').then(m => m.ReadingScanModule)
    },
    {
        path: NavPathEnum.READING_DETAILS,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/tracking/reading/reading-details/reading-details.module').then(m => m.ReadingDetailsModule)
    },
    {
        path: NavPathEnum.PICK_AND_DROP,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/tracking/pick-and-drop/pick-and-drop.module').then(m => m.PickAndDropPageModule)
    }
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, {preloadingStrategy: PreloadAllModules})
    ],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
