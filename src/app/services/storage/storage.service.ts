import {Injectable} from '@angular/core';
import {Preferences} from '@capacitor/preferences';
import {catchError, from, Observable, of, zip} from 'rxjs';
import {map, mergeMap} from 'rxjs/operators';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';


@Injectable({
    providedIn: 'root'
})
export class StorageService {

    private static FIELD_TYPES_TO_KEEP = ['displayedCreate', 'requiredCreate', 'onMobile'];

    private static ENTITY_FIELDS_BY_TYPE = ['acheminements'];

    public constructor() {}

    public initStorage(apiKey: string,
                       operator: string,
                       operatorId: number,
                       rights: { [name: string]: boolean },
                       notificationChannels: [string],
                       parameters: { [name: string]: boolean },
                       fieldParams: { [entity: string]: any },
                       dispatchDefaultWaybill: { [name: string]: any }): Observable<any> {
        return this.getString(StorageKeyEnum.URL_SERVER)
            .pipe(
                mergeMap((serverUrl) => from(Preferences.clear()).pipe(map(() => serverUrl))),
                mergeMap((serverUrl) => zip(
                    this.setItem(StorageKeyEnum.URL_SERVER, serverUrl),
                    this.setItem(StorageKeyEnum.API_KEY, apiKey),
                    this.setItem(StorageKeyEnum.OPERATOR, operator),
                    this.setItem(StorageKeyEnum.OPERATOR_ID, operatorId),
                    this.setItem(StorageKeyEnum.NOTIFICATION_CHANNELS, JSON.stringify(notificationChannels)),
                    this.setItem(StorageKeyEnum.DISPATCH_DEFAULT_WAYBILL, JSON.stringify(dispatchDefaultWaybill)),
                    this.resetCounters(),
                    this.updateRights(rights),
                    this.updateParameters(parameters),
                    this.updateFieldParams(fieldParams),
                ))
            );
    }

    public clearStorage(valuesToKeep: Array<StorageKeyEnum> = []): Observable<void> {
        if (valuesToKeep.length > 0) {
            return zip(
                ...valuesToKeep.map((key) => this.getString(key))
            )
                .pipe(
                    map((data) => {
                        // we associated all keys with value
                        return valuesToKeep.reduce((acc: any, currentKey, index) => {
                            acc[currentKey] = data[index];
                            return acc;
                        }, {})
                    }),
                    mergeMap((initialValues) => this.clearWithInitialValues(initialValues))
                )
        } else {
            return this.clearWithInitialValues();
        }
    }

    public updateRights(rights: { [name: string]: boolean }): Observable<any> {
        const rightKeys = Object.keys(rights);
        return rightKeys.length > 0
            ? zip(...(rightKeys.map((key) => this.setItem(
                key,
                `${Number(Boolean(rights[key]))}`
            ))))
            : of(undefined);
    }

    public updateFieldParams(fieldParams: { [entity: string]: any }): Observable<any> {
        const fieldParamKeys = Object.keys(fieldParams);
        const storageObservables: Array<Observable<any>> = [];
        fieldParamKeys.forEach((entity) => {
            Object.keys(fieldParams[entity]).forEach((field) => {
                Object.keys(fieldParams[entity][field]).forEach((condition) => {
                    if (StorageService.FIELD_TYPES_TO_KEEP.includes(condition)) {
                        const key = `${entity}.${field}.${condition}`;
                        storageObservables.push(this.setItem(
                            key,
                            `${StorageService.ENTITY_FIELDS_BY_TYPE.includes(entity)
                                ? Array(fieldParams[entity][field][condition])
                                : Number(Boolean(fieldParams[entity][field][condition]))}`
                        ));
                    }
                })
            })
        })

        return storageObservables.length > 0
            ? zip(...storageObservables)
            : of(undefined);
    }

    public updateParameters(parameters: { [name: string]: boolean|string }): Observable<any> {
        const parameterKeys = Object.keys(parameters);
        return parameterKeys.length > 0
            ? zip(...(parameterKeys.map((key) => this.setItem(
                key,
                typeof parameters[key] === 'boolean'
                    ? `${Number(parameters[key])}`
                    : `${parameters[key] || ''}`
            ))))
            : of(undefined);
    }

    public getString(key: StorageKeyEnum|string, maxLength?: number): Observable<string|null> {
        return this.getItem(key)
            .pipe(
                map((value) => (
                    value !== null && maxLength
                        ? (value || '').substring(0, maxLength)
                        : value
                ))
            );
    }

    public getNumber(key: StorageKeyEnum|string): Observable<number|null> {
        return this.getItem(key).pipe(
            map((value) => (
                value !== null
                    ? Number(value)
                    : value
            ))
        );
    }

    public getRight(rightName: StorageKeyEnum): Observable<boolean> {
        return this.getItem(rightName).pipe(
            map(Number),
            map(Boolean)
        );
    }

    public setItem(key: StorageKeyEnum|string, value: any): Observable<void> {
        return from(Preferences.set({
            key,
            value: JSON.stringify(value)
        }));
    }

    public getItem(key: StorageKeyEnum|string): Observable<any> {
        return from(Preferences.get({key})).pipe(
            map(({value}) => {
                try {
                    return value !== null ? JSON.parse(value) : value;
                }
                catch (_) {
                    return value;
                }
            }),
        );
    }

    public resetCounters(): Observable<void> {
        return this.setItem(StorageKeyEnum.COUNTERS, JSON.stringify({}));
    }

    public incrementCounter(key: StorageKeyEnum): Observable<void> {
        return this.getCounters().pipe(
            mergeMap((counters: any) => {
                counters[key] = (counters[key] || 0) + 1;
                return this.setItem(StorageKeyEnum.COUNTERS, JSON.stringify(counters)) as Observable<void>;
            })
        );
    }

    public getCounter(key: StorageKeyEnum): Observable<number> {
        return this.getCounters().pipe(
            map((counters) => Number(counters[key]) || 0)
        );
    }

    public getCounters(): Observable<{[key: string]: number}> {
        return this.getString(StorageKeyEnum.COUNTERS).pipe(
            map((countersStr) => (
                countersStr
                    ? (JSON.parse(countersStr) || {})
                    : {}
            )),
            catchError(() => of({})),
        );
    }

    private clearWithInitialValues(values: { [name: string]: any } = {}): Observable<void> {
        const cacheNames = Object.keys(values);
        return from(Preferences.clear())
            .pipe(
                mergeMap(() => cacheNames.length > 0
                    ? zip(
                        ...cacheNames.map((name) => this.setItem(name as StorageKeyEnum, values[name]))
                    )
                    : of(undefined)
                ),
                map(() => undefined)
            );
    }
}
