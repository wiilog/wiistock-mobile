import {Injectable} from '@angular/core';
import {from, Observable, of, throwError} from 'rxjs';
import {LoadingController} from '@ionic/angular';
import {catchError, filter, map, mergeMap, tap} from 'rxjs/operators';
import {NavigationEnd, Router} from '@angular/router';


@Injectable({
    providedIn: 'root'
})
export class LoadingService {

    private static readonly DEFAULT_MESSAGE: string = 'Chargement...';

    private lastLoading?: HTMLIonLoadingElement;

    public constructor(private loadingController: LoadingController,
                       router: Router) {
        router.events
            .pipe(
                filter((event) => (event instanceof NavigationEnd)),
                mergeMap(() => this.dismissLastLoading())
            )
            .subscribe(() => {
            });
    }

    public presentLoading(message?: string): Observable<HTMLIonLoadingElement> {
        const messageToPrint = message ? message : LoadingService.DEFAULT_MESSAGE;
        return of(undefined)
            .pipe(
                mergeMap(() => this.dismissLastLoading()),
                mergeMap(() => from(this.loadingController.create({message: messageToPrint}))),
                mergeMap((loading) => from(loading.present()).pipe(map(() => loading))),
                tap((loading: HTMLIonLoadingElement) => {
                    this.lastLoading = loading;
                })
            );
    }

    public presentLoadingWhile<T>({message, event}: { message?: string; event: () => Observable<T>; }): Observable<T> {
        return this.dismissLastLoading()
            .pipe(
                mergeMap(() => this.presentLoading(message)),
                mergeMap((loader: HTMLIonLoadingElement) => event().pipe(
                    map((res): [T, HTMLIonLoadingElement]  => [res, loader]),
                    catchError((err) => from(loader.dismiss()).pipe(mergeMap(() => throwError(err))))
                )),
                mergeMap(([res, loader]: [T, HTMLIonLoadingElement]) => from(loader.dismiss()).pipe(map(() => res))),
            );
    }

    public dismissLastLoading(): Observable<void> {
        return (this.lastLoading
            ? from(this.lastLoading.dismiss()).pipe(
                catchError(() => of(undefined)),
                tap(() => {
                    this.lastLoading = undefined;
                }),
                map(() => undefined)
            )
            : of(undefined))
    }
}
