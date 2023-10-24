import {Injectable} from '@angular/core';
import {Network} from '@capacitor/network';
import {from, mergeMap, Observable, of, zip} from "rxjs";
import {delay} from "rxjs/operators";
import {ToastService} from "@app/services/toast.service";
import {BatteryManagerService} from "@plugins/battery-manager/battery-manager.service";

@Injectable({
    providedIn: 'root'
})
export class NetworkService {

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
        let remaining = remainingTry !== undefined ? remainingTry : NetworkService.NETWORK_CHECK_TRY_NUMBER;
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
                                    remainingTry: remaining -1,
                                    shouldWeContinuing,
                                }))
                            )
                            : of(false)
                ))
            );
    }
}
