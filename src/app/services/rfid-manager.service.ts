import {Injectable} from "@angular/core";
import {RfidManagerService as PluginRfidManagerService} from "@plugins/rfid-manager/rfid-manager.service";
import {mergeMap, Observable, of, tap} from "rxjs";
import {DeviceInfoResult, ManagerResult} from "@plugins/rfid-manager/definitions";
import {ToastService} from "@app/services/toast.service";
import {map} from "rxjs/operators";

@Injectable({
    providedIn: 'root'
})
export class RfidManagerService {

    public constructor(private pluginRfidManager: PluginRfidManagerService,
                       private toastService: ToastService) {
    }


    public get plugin(): PluginRfidManagerService {
        return this.pluginRfidManager;
    }

    public ensureScannerConnection(presentErrorToast: boolean = true): Observable<ManagerResult & {deviceInfo?: DeviceInfoResult}> {
        return this.pluginRfidManager.ensureScannerConnection().pipe(
            mergeMap((result) => (
                result.success
                    ? this.plugin.deviceInfo().pipe(map((deviceInfo) => ({
                        ...result,
                        deviceInfo
                    })))
                    : of(result)
            )),
            tap((result: ManagerResult & {deviceInfo?: DeviceInfoResult}) => {
                if (result.success) {
                    if (result.deviceInfo) {
                        this.toastService.presentToast(`Connexion réussie au scanner ${result.deviceInfo.serialNumber}`);
                    }
                }
                else {
                    this.presentErrorToast(presentErrorToast, result);
                }
            }),
        );
    }

    public startScan(presentErrorToast: boolean = true): Observable<ManagerResult> {
        return this.pluginRfidManager.startScan().pipe(
            tap((result: ManagerResult) => {
                this.presentErrorToast(presentErrorToast, result);
            }),
        );
    }

    public stopScan(presentErrorToast: boolean = true): Observable<ManagerResult> {
        return this.pluginRfidManager.stopScan().pipe(
            tap((result: ManagerResult) => {
                this.presentErrorToast(presentErrorToast, result);
            }),
        );
    }

    private presentErrorToast(presentErrorToast: boolean, {success, error}: ManagerResult): void {
        if (presentErrorToast && !success && error) {
            this.toastService.presentToast(error.message, {duration: ToastService.LONG_DURATION});
        }
    }

}
