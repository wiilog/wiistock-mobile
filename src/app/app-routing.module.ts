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
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, {preloadingStrategy: PreloadAllModules})
    ],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
