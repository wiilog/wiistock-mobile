import {Injectable} from '@angular/core';
import {CanActivate, Router, UrlTree} from '@angular/router';
import {Observable, zip} from 'rxjs';
import {StorageService} from '@app/services/storage/storage.service';
import {map} from 'rxjs/operators';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';

@Injectable({
    providedIn: 'root'
})
export class UserConnectedGuard implements CanActivate {

    public constructor(private storageService: StorageService,
                       private router: Router) {
    }

    public canActivate(): Observable<UrlTree|boolean> {
        return zip(
            this.storageService.getString(StorageKeyEnum.OPERATOR),
            this.storageService.getString(StorageKeyEnum.API_KEY)
        ).pipe(
            map(([operator, apiKey]) => (
                Boolean(operator && apiKey) || this.router.createUrlTree([NavPathEnum.LOGIN])
            ))
        );
    }

}
