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
        path: NavPathEnum.ARTICLE_CREATION,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('./pages/stock/article-creation/article-creation.module').then(m => m.ArticleCreationModule)
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
