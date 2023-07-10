import {Injectable} from '@angular/core';
import {Network} from '@capacitor/network';
import {from, mergeMap, Observable, of} from "rxjs";
import {delay} from "rxjs/operators";

@Injectable({
    providedIn: 'root'
})
export class NetworkService {

    private static NETWORK_CHECK_TRY_NUMBER: number = 10;

    public async hasNetwork(): Promise<boolean> {
        const {connected, connectionType} = await Network.getStatus()

        return (
            connected
            && connectionType
            && connectionType !== 'none'
        );
    }


    public hasNetworkTry(remaining: number = NetworkService.NETWORK_CHECK_TRY_NUMBER): Observable<boolean> {
        return from(this.hasNetwork())
            .pipe(
                mergeMap((hasNetwork) => (
                    hasNetwork
                        ? of(true)
                        : remaining > 1
                            ? of(true).pipe(
                                delay(1000),
                                mergeMap(() => this.hasNetworkTry(remaining - 1))
                            )
                            : of(false)
                ))
            );
    }
}
