import {Injectable} from '@angular/core';
import {ApiService} from '@app/services/api.service';
import {from, mergeMap, zip, Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';
import {App} from "@capacitor/app";


@Injectable({
    providedIn: 'root'
})
export class AppVersionService {

    public constructor(private apiService: ApiService) {}

    public isAvailableVersion(): Observable<{ available: boolean, currentVersion: string }>{
        return this.getVersionNumber()
            .pipe(
                mergeMap((currentVersion) => zip(
                    of(currentVersion),
                    this.apiService.requestApi(ApiService.CHECK_NOMADE_VERSIONS, {
                        secured: false,
                        timeout: true,
                        params: {nomadeVersion: currentVersion}
                    })
                )),
                map(([currentVersion, {validVersion}]) => ({
                    available: validVersion,
                    currentVersion
                }))
            );
    }

    private getVersionNumber(): Observable<string> {
        return from(App.getInfo()).pipe(
            map(({version}) => version)
        );
    }
}
