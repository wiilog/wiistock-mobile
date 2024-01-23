import {Injectable} from '@angular/core';
import {StorageService} from '@app/services/storage/storage.service';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {from, Observable, of, Subject, zip} from 'rxjs';
import {mergeMap, map, tap} from 'rxjs/operators';
import { FCM } from "@capacitor-community/fcm";
import { PushNotifications } from "@capacitor/push-notifications";
import {LocalNotifications, LocalNotificationSchema} from "@capacitor/local-notifications";
import {PermissionStatus, PushNotificationSchema} from "@capacitor/push-notifications/dist/esm/definitions";

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    private static LocalNotificationCounter: number = 0;

    private readonly _notificationTapped$: Subject<LocalNotificationSchema>;

    private _userIsLogged: boolean;

    public constructor(private storageService: StorageService) {
        this._userIsLogged = false;
        this._notificationTapped$ = new Subject();
    }

    public initialize(): Observable<void> {
        return this.unsubscribe().pipe(
            mergeMap(() => this.registerPushNotification()),
            mergeMap(() => this.subscribeToTopics()),
            mergeMap(() => this.handleEvents()),
        );
    }

    public set userIsLogged(userIsLogged: boolean) {
        this._userIsLogged = userIsLogged;
    }

    private subscribeToTopics(): Observable<void> {
        return this.storageService.getString(StorageKeyEnum.NOTIFICATION_CHANNELS)
            .pipe(
                map((rawChannels: string|null) => (
                    rawChannels
                        ? (JSON.parse(rawChannels) || [])
                        : []
                )),
                mergeMap((topics: Array<string>) => {
                    return (
                        topics.length > 0
                            ? zip(...topics.map((topic) => FCM.subscribeTo({topic})))
                            : of(undefined)
                    );
                }),
                map(() => undefined)
            );
    }

    public unsubscribe(): Observable<void> {
        return of(undefined);
        return from(FCM.deleteInstance()).pipe(
            map(() => undefined)
        );
    }

    public get notificationTapped$(): Observable<LocalNotificationSchema> {
        return this._notificationTapped$;
    }

    private registerPushNotification(): Observable<void> {
        return from(PushNotifications.checkPermissions())
            .pipe(
                mergeMap((state: PermissionStatus) => {
                    if (state.receive === 'prompt') {
                        return PushNotifications.requestPermissions();
                    }
                    return of(state);
                }),
                tap((state) => {
                    if (state.receive !== 'granted') {
                        throw new Error('User denied permissions!');
                    }
                }),
                mergeMap(() => PushNotifications.register())
            );
    }

    private handleEvents(): Observable<void> {
        console.warn('>> handleEvents')
        return from(PushNotifications.removeAllListeners()).pipe(
            mergeMap(() => {
                console.warn('>> localNotificationActionPerformed')
                // event on a tapped LocalNotification when app is in background
                return LocalNotifications.addListener('localNotificationActionPerformed', ({notification}) => {
                    console.warn('localNotificationActionPerformed', notification)
                    this._notificationTapped$.next(notification);
                })
            }),
            mergeMap(() => {
                console.warn('>> pushNotificationActionPerformed')
                // event on a tapped PushNotification when app is in background
                return PushNotifications.addListener('pushNotificationActionPerformed', async ({notification}) => {
                    await PushNotifications.removeAllDeliveredNotifications();
                    console.log('pushNotificationActionPerformed', notification)
                    this._notificationTapped$.next(this.transformPushToLocal(notification));
                });
            }),
            mergeMap(() => {

                console.warn('>> pushNotificationReceived')
                // event a PushNotification received when app is in background
                // => we create a new LocalNotification
                return PushNotifications.addListener('pushNotificationReceived', async (notification) => {
                    await PushNotifications.removeAllDeliveredNotifications();
                    await LocalNotifications.schedule({
                        notifications: [this.transformPushToLocal(notification)],
                    });
                });
            }),
            map(() => undefined)
        );
    }

    private transformPushToLocal(push: PushNotificationSchema): LocalNotificationSchema {
        return {
            title: push.title || '',
            body: push.body || '',
            id: ++NotificationService.LocalNotificationCounter,
            smallIcon: 'res://drawable/push_icon',
            ...(push.data?.image
                ? {largeIcon: push.data.image}
                : {}),
            iconColor: '#1B1464',
            extra: push.data,
        };
    }
}
