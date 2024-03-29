import {Injectable} from '@angular/core';
import {Network} from '@capacitor/network';
import {mergeMap, Observable, of, zip} from "rxjs";
import {delay} from "rxjs/operators";

@Injectable({
    providedIn: 'root'
})
export class NetworkService {

    public static DEFAULT_HAS_NETWORK_MESSAGE: string = `Une connexion internet est requise pour accéder à cette fonctionnalité.`;
    private static NETWORK_CHECK_TRY_NUMBER: number = 60;

    public async hasNetwork(): Promise<boolean> {
        const {connected, connectionType} = await Network.getStatus()

        return (
            connected
            && connectionType
            && connectionType !== 'none'
        );
    }


    public hasNetworkTry({remainingTry, shouldWeContinuing} : {remainingTry?: number, shouldWeContinuing?: () => Observable<boolean>}): Observable<boolean> {
        const remaining = remainingTry !== undefined ? remainingTry : NetworkService.NETWORK_CHECK_TRY_NUMBER;
        return zip(
            this.hasNetwork(),
            shouldWeContinuing ? shouldWeContinuing() : of(true),
        )
            .pipe(
                mergeMap(([hasNetwork, continuing]) => (
                    hasNetwork
                        ? of(true)
                        : remaining > 1 && continuing
                            ? of(true).pipe(
                                delay(1000),
                                mergeMap(() => this.hasNetworkTry({
                                    remainingTry: remaining - 1,
                                    shouldWeContinuing,
                                }))
                            )
                            : of(false)
                ))
            );
    }
}
