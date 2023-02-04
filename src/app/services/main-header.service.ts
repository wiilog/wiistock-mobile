import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class MainHeaderService {

    private readonly _navigationChange$: Subject<any>;
    private readonly _title$: Subject<any>;
    private readonly _subTitle$: Subject<any>;

    public constructor() {
        this._navigationChange$ = new Subject<any>();
        this._subTitle$ = new Subject<any>();
    }

    public emitNavigationChange() {
        this._navigationChange$.next(undefined);
    }

    public get navigationChange$(): Observable<any> {
        return this._navigationChange$;
    }

    public emitTitle(subTitle: string) {
        this._title$.next(subTitle);
    }

    public get title$(): Observable<any> {
        return this._title$;
    }

    public emitSubTitle(subTitle: string) {
        this._subTitle$.next(subTitle);
    }

    public get subTitle$(): Observable<any> {
        return this._subTitle$;
    }
}
