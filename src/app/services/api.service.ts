import {Injectable} from '@angular/core';
import {App} from '@capacitor/app';
import {HttpClient, HttpParams, HttpResponse} from '@angular/common/http';
import {from, Observable, of, throwError, zip} from 'rxjs';
import {StorageService} from '@app/services/storage/storage.service';
import {catchError, filter, map, mergeMap, tap, timeout} from 'rxjs/operators';
import {UserService} from '@app/services/user.service';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {NavService} from "@app/services/nav/nav.service";
import {NavPathEnum} from "@app/services/nav/nav-path.enum";

const GET = 'get';
const POST = 'post';
const DELETE = 'delete';

@Injectable({
    providedIn: 'root'
})
export class ApiService {

    public static readonly API_URL_BASE = '/api';
    public static readonly MOBILE_API_URL_BASE = `${ApiService.API_URL_BASE}/mobile`;

    public static readonly CHECK_NOMADE_VERSIONS = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/nomade-versions`};
    public static readonly GET_PING = {method: GET, service: `${ApiService.API_URL_BASE}/ping`};

    public static readonly BEGIN_PREPA = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/beginPrepa`};
    public static readonly FINISH_PREPA = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/finishPrepa`};
    public static readonly BEGIN_LIVRAISON = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/beginLivraison`};
    public static readonly FINISH_LIVRAISON = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/finishLivraison`};
    public static readonly BEGIN_COLLECTE = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/beginCollecte`};
    public static readonly FINISH_COLLECTE = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/finishCollecte`};
    public static readonly FINISH_TRANSFER = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/transfer/finish`};
    public static readonly TREAT_ANOMALIES = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/treatAnomalies`};
    public static readonly POST_API_KEY = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/api-key`};
    public static readonly ADD_INVENTORY_ENTRIES = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/addInventoryEntries`};
    public static readonly POST_TRACKING_MOVEMENTS = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/tracking-movements`};
    public static readonly POST_STOCK_MOVEMENTS = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/stock-movements`};
    public static readonly POST_HANDLING = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/handlings`};
    public static readonly GET_DATA = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/getData`};
    public static readonly GET_PREVIOUS_OPERATOR_MOVEMENTS = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/previous-operator-movements`};
    public static readonly NEW_EMP = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/emplacement`};
    public static readonly GET_ARTICLES = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/articles`};
    public static readonly DROP_IN_LU = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/drop-in-lu`};
    public static readonly GET_TRACKING_DROPS = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/tracking-drops`};
    public static readonly POST_DEMANDE_LIVRAISON = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/valider-dl`};
    public static readonly POST_MANUAL_DEMANDE_LIVRAISON = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/valider-manual-dl`};
    public static readonly GET_DEMANDE_LIVRAISON_DATA = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/demande-livraison-data`};
    public static readonly GET_PACK_DATA = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/packs`};
    public static readonly PATCH_DISPATCH = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/dispatches`};
    public static readonly GET_SERVER_IMAGES = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/server-images`};
    public static readonly PACKS_GROUPS = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/pack-groups`};
    public static readonly GROUP = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/group`};
    public static readonly UNGROUP = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/ungroup`};
    public static readonly POST_GROUP_TRACKINGS = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/group-trackings/{mode}`};
    public static readonly POST_EMPTY_ROUND = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/empty-round`};
    public static readonly GET_COLLECTABLE_ARTICLES = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/collectable-articles`};
    public static readonly GET_TRANSPORT_ROUNDS = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/transport-rounds`};
    public static readonly GET_REJECT_MOTIVES = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/reject-motives`};
    public static readonly GET_END_ROUND_LOCATIONS = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/end-round-locations`};
    public static readonly REJECT_PACK = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/reject-pack`};
    public static readonly LOAD_PACKS = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/load-packs`};
    public static readonly FETCH_ROUND = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/fetch-round`};
    public static readonly FETCH_TRANSPORT = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/fetch-transport`};
    public static readonly FINISH_TRANSPORT = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/finish-transport`};
    public static readonly HAS_NEW_PACKS = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/has-new-packs`};
    public static readonly PATCH_ROUND_STATUS = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/patch-round-status`};
    public static readonly TRANSPORT_FAILURE = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/transport-failure`};
    public static readonly START_DELIVERY_ROUND = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/start-round`};
    public static readonly DEPOSIT_TRANSPORT = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/deposit-transport-packs`};
    public static readonly FINISH_ROUND = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/finish-round`};
    public static readonly PACKS_RETURN_LOCATIONS = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/packs-return-locations`};
    public static readonly LOGISTIC_UNIT_ARTICLES = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/logistic-unit/articles`};
    public static readonly CHECK_LOGISTIC_UNIT_CONTENT = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/check-logistic-unit-content`};
    public static readonly CHECK_DELIVERY_LOGISTIC_UNIT_CONTENT = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/check-delivery-logistic-unit-content`};
    public static readonly FINISH_GROUPED_SIGNATURE = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/finish-grouped-signature`};
    public static readonly GET_DISPATCH_EMERGENCIES = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/dispatch-emergencies`};
    public static readonly NEW_DISPATCH = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/new-dispatch`};
    public static readonly DISPATCH_WAYBILL = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/waybill/{dispatch}`};
    public static readonly GET_REFERENCE = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/get-reference`};
    public static readonly GET_ASSOCIATED_DOCUMENT_TYPE_ELEMENTS = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/get-associated-document-type-elements`};
    public static readonly GET_ASSOCIATED_REF = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/get-associated-ref-intels/{pack}/{dispatch}`};
    public static readonly DISPATCH_VALIDATE = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/dispatch-validate`};
    public static readonly GET_ARTICLE_BY_RFID_TAG = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/article-by-rfid-tag/{rfidTag}`};
    public static readonly DEFAULT_ARTICLE_VALUES = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/default-article-values`};
    public static readonly CREATE_ARTICLE = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/create-article`};
    public static readonly GET_SUPPLIER_REF_BY_REF_AND_SUPPLIER = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/supplier_reference/{ref}/{supplier}`};
    public static readonly ZONE_RFID_SUMMARY = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/inventory-missions/{mission}/summary/{zone}`};
    public static readonly FINISH_MISSION = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/finish-mission`};
    public static readonly FINISH_TRUCK_ARRIVAL = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/finish-truck-arrival`};
    public static readonly GET_WAYBILL_DATA = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/get-waybill-data/{dispatch}`};
    public static readonly GET_CARRIERS = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/get-carriers-data`};
    public static readonly GET_TRUCK_ARRIVALS_DEFAULT_UNLOADING_LOCATION = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/get-truck-arrival-default-unloading-location`};
    public static readonly GET_TRUCK_ARRIVALS_LINES_NUMBER = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/get-truck-arrival-lines-number`};
    public static readonly NEW_OFFLINE_DISPATCHES = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/new-offline-dispatches`};
    public static readonly LOGOUT = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/logout`};
    public static readonly POST_RECEIPT_ASSOCIATION = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/receipt-association`};
    public static readonly CHECK_MANUAL_COLLECT_SCAN = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/check-manual-collect-scan`};
    public static readonly FINISH_MANUAL_COLLECT = {method: POST, service: `${ApiService.MOBILE_API_URL_BASE}/finish-manual-collect`};
    public static readonly GET_RECEPTIONS = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/receptions`};
    public static readonly GET_RECEPTION_LINES = {method: GET, service: `${ApiService.MOBILE_API_URL_BASE}/receptions/{reception}/lines`};


    private static readonly DEFAULT_HEADERS = {
        'X-Requested-With': 'XMLHttpRequest'
    };

    // time out for service verification and url ping, 10s
    private static readonly VERIFICATION_SERVICE_TIMEOUT: number = 10000;

    public constructor(private storageService: StorageService,
                       private navService: NavService,
                       private httpClient: HttpClient,
                       private userService: UserService) {
    }

    public pingApi(url: string): Observable<any> {
        return this.getVersionNumber()
            .pipe(
                mergeMap((currentVersion) => this.httpClient
                    .get(url, {
                        headers: {
                            ['X-App-Version']: currentVersion,
                            ...ApiService.DEFAULT_HEADERS
                        }
                    })
                ),
                timeout(ApiService.VERIFICATION_SERVICE_TIMEOUT)
            );
    }

    public requestApi({method, service}: { method: string; service: string; },
                      {params = {}, secured = true, timeout: requestWithTimeout = false, pathParams = {}}: {
                          params?: { [_: string]: any };
                          pathParams?: { [_: string]: string|number };
                          secured?: boolean;
                          timeout?: boolean;
                      } = {params: {}, pathParams: {}, secured: true, timeout: false}): Observable<any> {
        let requestResponse = zip(
            this.getApiUrl({service}, {pathParams}),
            this.getVersionNumber(),
            ...(secured ? [this.storageService.getString(StorageKeyEnum.API_KEY)] : [])
        )
            .pipe(
                tap(([url]: any) => {
                    if (!url) {
                        throw new Error('The api url is not set');
                    }
                }),
                mergeMap(([url, currentVersion, apiKey]: [string, string, string]) => {
                    const keyParam = (method === GET || method === DELETE)
                        ? 'params'
                        : 'body';

                    const options = {
                        [keyParam]: ApiService.ObjectToHttpParams(method, params),
                        responseType: 'json' as 'json',
                        observe: 'response' as 'response',
                        headers: {
                            'X-App-Version': currentVersion,
                            ...(secured && apiKey ? {'X-Authorization': `Bearer ${apiKey}`} : {}),
                            ...ApiService.DEFAULT_HEADERS
                        }
                    };

                    return this.httpClient.request(method, url, options);
                }),
                catchError((response: HttpResponse<any>) => {
                    const currentPath = this.navService.currentPath();

                    if (currentPath !== NavPathEnum.LOGIN
                        && response.status === 401) {
                        this.userService.doLogout();
                        return of(response);
                    }
                    else {
                        return throwError(response);
                    }
                }),
                filter((response: HttpResponse<any>) => (response.status !== 401)),
                map((response: HttpResponse<any>) => response.body)
            );

        if (requestWithTimeout) {
            requestResponse = requestResponse.pipe(timeout(ApiService.VERIFICATION_SERVICE_TIMEOUT));
        }

        return requestResponse;
    }


    private getApiBaseUrl(newUrl?: string): Observable<any> {
        return newUrl
            ? of(`${newUrl}`)
            : this.storageService.getString(StorageKeyEnum.URL_SERVER);
    }

    public getApiUrl({service}: {service: string},
                     {newUrl, pathParams = {}}: { newUrl?: string, pathParams?: { [x: string]: string | number } } = {}): Observable<string|null> {
        for(let pathParamName in pathParams) {
            const regexMatchParam = new RegExp(`\{${pathParamName}\}`, 'g');
            service = service.replace(regexMatchParam, encodeURIComponent(pathParams[pathParamName]));
        }

        return this.getApiBaseUrl(newUrl).pipe(map((baseUrl) => (baseUrl ? `${baseUrl}${service}` : null)));
    }

    private static ObjectToFormData(object: { [x: string]: string }): FormData {
        const formData = new FormData();
        Object
            .keys(object)
            .forEach((key) => {
                formData.set(key, object[key]);
            });
        return formData;
    }

    private static ObjectToHttpParams(method: string,
                                      object: { [_: string]: any }): HttpParams|FormData {
        const paramsObject = Object
            .keys(object)
            .filter((key: string) => object[key] !== null && object[key] !== undefined)
            .reduce((acc, key) => ({
                ...acc,
                [key]: ((typeof object[key] !== 'string') && (typeof object[key] !== 'number') && !(object[key] instanceof Blob))
                    ? JSON.stringify(object[key])
                    : object[key]
            }), {});

        if (method === POST) {
            return ApiService.ObjectToFormData(paramsObject);
        }
        else {
            return new HttpParams({
                fromObject: paramsObject,
                encoder: {
                    encodeKey: (key: string): string => encodeURIComponent(key),
                    encodeValue: (key: string): string => encodeURIComponent(key),
                    decodeKey: (value: string): string => decodeURIComponent(value),
                    decodeValue: (value: string): string => decodeURIComponent(value)
                },
            });
        }
    }

    private getVersionNumber(): Observable<string> {
        return from(App.getInfo()).pipe(
            map(({version}) => version)
        );
    }
}
