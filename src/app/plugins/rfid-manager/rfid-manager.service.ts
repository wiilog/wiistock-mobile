import {Injectable} from "@angular/core";
import {registerPlugin} from "@capacitor/core";
import {DeviceInfoResult, ErrorCodeEnum, ManagerResult, RfidManagerPlugin, RunResult} from "./definitions";
import {from, mergeMap, Observable, of, Subject} from "rxjs";
import {PluginListenerHandle} from "@capacitor/core/types/definitions";
import {catchError} from "rxjs/operators";

@Injectable()
export class RfidManagerService {

    private rfidManagerPlugin: RfidManagerPlugin;

    private eventsLaunched: boolean;
    private _tagsRead$?: Subject<{ tags: Array<string> }>;
    private _scanStarted$?: Subject<void>;
    private _scanStopped$?: Subject<void>;
    private listeners: Array<PluginListenerHandle>;

    public constructor() {
        this.rfidManagerPlugin = registerPlugin<RfidManagerPlugin>('RfidManager');
        this.eventsLaunched = false;
        this.listeners = [];
    }

    public get tagsRead$(): Observable<{ tags: Array<string> }> {
        if (!this._tagsRead$) {
            throw new Error("Event listeners not launched");
        }
        return this._tagsRead$;
    }

    public get scanStarted$(): Observable<void> {
        if (!this._scanStarted$) {
            throw new Error("Event listeners not launched");
        }
        return this._scanStarted$;
    }

    public get scanStopped$(): Observable<void> {
        if (!this._scanStopped$) {
            throw new Error("Event listeners not launched");
        }
        return this._scanStopped$;
    }

    public launchEventListeners(): void {
        if (this.eventsLaunched) {
            throw new Error("Event listeners already launched");
        }
        this._tagsRead$ = new Subject();
        this.rfidManagerPlugin
            .addListener('tagsRead', (data) => {
                this._tagsRead$?.next(data);
            })
            .then((listener) => {
                this.listeners.push(listener);
            });

        this._scanStarted$ = new Subject();
        this.rfidManagerPlugin
            .addListener('scanStarted', (data) => {
                this._scanStarted$?.next(data);
            })
            .then((listener) => {
                this.listeners.push(listener);
            });

        this._scanStopped$ = new Subject();
        this.rfidManagerPlugin
            .addListener('scanStopped', (data) => {
                this._scanStopped$?.next(data);
            })
            .then((listener) => {
                this.listeners.push(listener);
            });

        this.eventsLaunched = true;
    }

    public removeEventListeners(): void {
        this.listeners.forEach((listener) => {
            listener.remove();
        });
        this.listeners = [];

        this._tagsRead$?.unsubscribe();
        this._tagsRead$ = undefined;

        this._scanStarted$?.unsubscribe();
        this._scanStarted$ = undefined;

        this._scanStopped$?.unsubscribe();
        this._scanStopped$ = undefined;

        this.eventsLaunched = false;
    }

    public ensureScannerConnection(): Observable<ManagerResult> {
        return this.connect().pipe(
            mergeMap(() => this.configure()),
            catchError((error: Error) => this.handleRunError(error))
        );
    }

    public startScan(): Observable<ManagerResult> {
        return from(this.rfidManagerPlugin.run({action: 'startScan'}))
            .pipe(
                catchError((error: Error) => this.handleRunError(error))
            );
    }

    public stopScan(): Observable<RunResult> {
        return from(this.rfidManagerPlugin
            .run({
                action: 'stopScan'
            }));
    }

    public deviceInfo(): Observable<DeviceInfoResult> {
        return from(this.rfidManagerPlugin.deviceInfo());// TODO test for return type
    }

    // TODO WIIS-7970
    public disconnect(): Observable<RunResult> {
        return from(this.rfidManagerPlugin.run({
            action: 'disconnect'
        }));
    }

    private connect(): Observable<RunResult> {
        return from(this.rfidManagerPlugin
            .run({
                action: 'connect'
            }));
    }

    private configure(): Observable<RunResult> {
        return from(this.rfidManagerPlugin
            .run({
                action: 'configure'
            }));
    }

    private handleRunError(error: Error): Observable<ManagerResult> {
        const code = error.message;
        const message = (
            code === ErrorCodeEnum.RETRIEVE_AVAILABLE_READERS_LIST_FAILURE ? 'impossible de récupérer la liste des scanners RFID, vérifier votre connexion bluetooth' :
            code === ErrorCodeEnum.READER_ALREADY_CONNECTED ? 'la connexion au scanner RFID existe déjà' :
            code === ErrorCodeEnum.READER_CONNECTION_FAILURE ? 'problème lors de la connexion au scanner RFID' :
            code === ErrorCodeEnum.READER_CONNECTION_FAILURE_RFID_COMM_OPEN_ERROR ? `problème lors de la connexion au scanner RFID, veuillez fermer les applications zebra l'utilisant (123RFID)` :
            code === ErrorCodeEnum.READER_CONNECTION_FAILURE_NOT_CONFIGURED ? 'problème lors de la connexion au scanner RFID, veuillez préalablement le configurer' :
            code === ErrorCodeEnum.NO_READER_FOUND ? 'aucun scanner RFID trouvé' :
            code === ErrorCodeEnum.READER_CONFIGURATION_FAILED ? 'la configuration du scanner a échoué' :
            code === ErrorCodeEnum.READER_NOT_CONNECTED ? 'aucun scanner trouvé' :
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

}
