import {Injectable} from "@angular/core";
import {RfidManagerService as PluginRfidManagerService} from "@plugins/rfid-manager/rfid-manager.service";
import {catchError, from, mergeMap, Observable, of, Subject, tap} from "rxjs";
import {
    DeviceInfoResult,
    ErrorCodeEnum,
    ManagerResult,
    TagsReadData
} from "@plugins/rfid-manager/definitions";
import {ToastService} from "@app/services/toast.service";
import {map} from "rxjs/operators";

@Injectable({
    providedIn: 'root'
})
export class RfidManagerService {

    public constructor(private plugin: PluginRfidManagerService,
                       private toastService: ToastService) {
    }

    public get tagsRead$(): Observable<TagsReadData> {
        return this.plugin.tagsRead$.pipe(
            map((value) => ({
                ...value,
                tags: (value?.tags || []).map((tag) => this.getAsciiFromHex(tag))
            }))
        );
    }

    public get scanStarted$(): Observable<void> {
        return this.plugin.scanStarted$;
    }

    public get scanStopped$(): Observable<void> {
        return this.plugin.scanStopped$;
    }

    public launchEventListeners(): void {
        return this.plugin.launchEventListeners();
    }

    public removeEventListeners(): void {
        return this.plugin.removeEventListeners();
    }

    public ensureScannerConnection(presentErrorToast: boolean = true): Observable<ManagerResult & {deviceInfo?: DeviceInfoResult}> {
        const subject$ = new Subject<ManagerResult & {deviceInfo?: DeviceInfoResult}>();
        this.plugin.deviceInfo()
            .pipe(
                mergeMap((deviceInfo: DeviceInfoResult) => (
                    deviceInfo.connected
                        ? of({success: true, deviceInfo})
                        : this.launchNewConnection()
                )),
                tap((result: ManagerResult & {alreadyConnected?: boolean, deviceInfo?: DeviceInfoResult}) => {
                    if (result.success) {
                        if (result.deviceInfo) {
                            this.toastService.presentToast(`Connexion réussie au scanner ${result.deviceInfo.serialNumber}`);
                        }
                    }
                    else {
                        this.presentErrorToast(presentErrorToast, result);
                    }
                }),
            )
            .subscribe(subject$);
        return subject$;
    }

    public startScan(presentErrorToast: boolean = true): Observable<ManagerResult & {deviceInfo?: DeviceInfoResult}> {
        const subject$ = new Subject<ManagerResult & {deviceInfo?: DeviceInfoResult}>();
        this.plugin.startScan()
            .pipe(
                catchError((error: Error) => this.handleRunError(error)),
                tap((result: ManagerResult) => {
                    this.presentErrorToast(presentErrorToast, result);
                }),
            )
            .subscribe(subject$);
        return subject$;
    }

    public stopScan(presentErrorToast: boolean = true): Observable<ManagerResult> {
        const subject$ = new Subject<ManagerResult & {deviceInfo?: DeviceInfoResult}>();
        this.plugin.stopScan()
            .pipe(
                catchError((error: Error) => this.handleRunError(error)),
                tap((result: ManagerResult) => {
                    this.presentErrorToast(presentErrorToast, result);
                }),
            )
            .subscribe(subject$);
        return subject$;
    }

    public disconnect(presentErrorToast: boolean = true): Observable<ManagerResult> {
        const subject$ = new Subject<ManagerResult & {deviceInfo?: DeviceInfoResult}>();
        this.plugin.disconnect()
            .pipe(
                catchError((error: Error) => this.handleRunError(error)),
                tap((result: ManagerResult) => {
                    this.presentErrorToast(presentErrorToast, result);
                }),
            )
            .subscribe(subject$);
        return subject$;
    }

    private handleRunError(error: Error): Observable<ManagerResult> {
        const code = error.message;
        const message = (
            code === ErrorCodeEnum.RETRIEVE_AVAILABLE_READERS_LIST_FAILURE ? 'impossible de récupérer la liste des scanners RFID, vérifier votre connexion bluetooth' :
            code === ErrorCodeEnum.READER_CONNECTION_FAILURE ? 'problème lors de la connexion au scanner RFID' :
            code === ErrorCodeEnum.READER_CONNECTION_FAILURE_RFID_COMM_OPEN_ERROR ? `problème lors de la connexion au scanner RFID, veuillez fermer les applications zebra l'utilisant (123RFID)` :
            code === ErrorCodeEnum.READER_CONNECTION_FAILURE_NOT_CONFIGURED ? 'problème lors de la connexion au scanner RFID, veuillez préalablement le configurer' :
            code === ErrorCodeEnum.NO_READER_FOUND ? 'aucun scanner RFID trouvé' :
            code === ErrorCodeEnum.READER_NOT_CONNECTED ? 'aucun scanner RFID trouvé' :
            code === ErrorCodeEnum.READER_CONFIGURATION_FAILED ? 'la configuration du scanner a échoué' :
                code // default
        );

        return of({
            success: false,
            error: {
                code,
                message: `Erreur RFID : ${message}`
            }
        });
    }

    private presentErrorToast(presentErrorToast: boolean, {success, error}: ManagerResult): void {
        if (presentErrorToast && !success && error) {
            this.toastService.presentToast(error.message, {duration: ToastService.LONG_DURATION});
        }
    }

    private launchNewConnection(): Observable<ManagerResult & {deviceInfo?: DeviceInfoResult}> {
        return this.plugin.connect().pipe(
            mergeMap(() => this.plugin.configure()),
            catchError((error: Error) => this.handleRunError(error)),
            mergeMap((result) => (
                result.success
                    ? this.plugin.deviceInfo().pipe(map((deviceInfo) => ({
                        ...result,
                        deviceInfo
                    })))
                    : of(result)
            ))
        );
    }

    private getAsciiFromHex(source: string): string {
        let str = '';
        for (let i = 0; i < source.length; i += 2) {
            str += String.fromCharCode(parseInt(source.substring(i, i + 2), 16));
        }
        return str;
    }

}
