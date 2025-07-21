import {Injectable} from '@angular/core';
import {NavController, Platform} from '@ionic/angular';
import {from, lastValueFrom, merge, mergeMap, Observable, of} from 'rxjs';
import {Router, NavigationStart} from '@angular/router';
import {NavPathEnum} from "@app/services/nav/nav-path.enum";
import {map, tap} from "rxjs/operators";
import {NavParams} from "@app/services/nav/nav-params";
import {MainHeaderService} from "@app/services/main-header.service";
import {App} from "@capacitor/app";

@Injectable({
    providedIn: 'root'
})
export class NavService {

    private stack: Array<{ path: NavPathEnum, params: NavParams, pathParams: NavParams }> = [];
    private _popItem?: { path: NavPathEnum, params: NavParams, pathParams: NavParams };
    private _nextPopItem?: { path: NavPathEnum, params: NavParams, pathParams: NavParams };

    private justNavigated: boolean;

    public constructor(private navController: NavController,
                       private mainHeaderService: MainHeaderService,
                       private platform: Platform,
                       private router: Router) {
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationStart) {
                // event which is not triggered by NavService functions
                // like native back button action
                if (!this.justNavigated && this.stack.length) {
                    this.stack.pop();
                    this.syncPopItem();
                    this._nextPopItem = undefined;
                }

                this.justNavigated = false;
            }
        });
    }

    public push(path: NavPathEnum,
                params: NavParams = {},
                pathParams: NavParams = {}): Observable<boolean> {
        this.justNavigated = true;
        this.stack.push({path, params, pathParams});
        this._popItem = undefined;
        this._nextPopItem = undefined;

        let pathToNavigate: string = path;
        for (const [key, value] of Object.entries(pathParams)) {
            pathToNavigate = pathToNavigate.replace(`:${key}`, value);
        }

        return from(this.navController.navigateForward(pathToNavigate));
    }

    public pop(options?: { path: NavPathEnum, params?: NavParams} | {number: number}): Observable<void> {
        this.justNavigated = true;

        // @ts-ignore
        const {path, params, number} = options || {};

        if (path) {
            // get last corresponding element in stack matching given path
            const reversedParamStack = [...this.stack].reverse();
            const reverseIndex = reversedParamStack.findIndex((param) => param.path === path);

            if (reverseIndex === -1) {
                throw new Error(`Could not find route ${path}`);
            }

            // keep as last the found stacked element and remove the rest of the stack
            // remove elements in stack after the request path params
            this.stack.splice(this.stack.length - reverseIndex);
            const nextPopItem = this._nextPopItem?.path === path
                ? this._nextPopItem?.params
                : undefined

            this._popItem = {
                path,
                params: params || nextPopItem || {},
                pathParams: this.stack[this.stack.length - 1] || {},
            };
            this._nextPopItem = undefined;

            return from(this.navController.navigateBack(path))
                .pipe(map(() => undefined));
        }
        else {
            this.stack.pop();
            this._popItem = undefined;

            return from(this.navController.pop()
                .then(() => {
                    if(number && number > 1){
                        return lastValueFrom(this.pop({number: number - 1}));
                    } else {
                        this.syncPopItem();
                        this._nextPopItem = undefined;
                        return Promise.resolve(undefined);
                    }
                }));
        }
    }

    public setRoot(path: NavPathEnum,
                   params: NavParams = {},
                   pathParams: NavParams = {}): Observable<boolean> {
        this.justNavigated = true;
        this.stack = [{path, params, pathParams}];
        this._popItem = undefined;
        this._nextPopItem = undefined;

        return from(this.navController.navigateRoot(path));
    }

    public params(stackId?: number): NavParams {
        const stackIndex = stackId !== undefined
            ? stackId
            : (this.stack.length - 1);
        return this.stack[stackIndex].params || {};
    }

    public param<T = any>(key: string): T {
        const stackIndex = this.stack.length - 1;
        return this.stack[stackIndex].params[key];
    }

    public get popItem(): { path: NavPathEnum, params: NavParams }|undefined {
        return this._popItem;
    }

    public set nextPopItem( nextPopItem: { path: NavPathEnum, params: NavParams, pathParams?: NavParams }|undefined) {
        if (nextPopItem) {
            const {path, params, pathParams} = nextPopItem;
            this._nextPopItem = {
                path,
                params,
                pathParams: pathParams || {},
            };
        }
        else {
            this._nextPopItem = undefined;
        }

    }

    public currentPath(stackId?: number): NavPathEnum|undefined {
        const stackIndex = stackId !== undefined
            ? stackId
            : (this.stack.length - 1);
        return this.stack[stackIndex].path;
    }

    private syncPopItem(): void {
        // synchronise with the real page
        const destinationItem = this.stack[this.stack.length - 1];
        if (destinationItem) {
            const nextPopItemParams = this._nextPopItem?.path === destinationItem.path
                ? this._nextPopItem?.params
                : undefined;
            const nextPopItemPathParams = this._nextPopItem?.path === destinationItem.path
                ? this._nextPopItem?.params
                : undefined;
            this._popItem = {
                path: destinationItem.path,
                params: nextPopItemParams || {},
                pathParams: nextPopItemPathParams || {},
            };
        }
        else {
            this._popItem = undefined;
        }
    }
}
