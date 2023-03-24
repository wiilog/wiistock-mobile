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
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, {preloadingStrategy: PreloadAllModules})
    ],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
