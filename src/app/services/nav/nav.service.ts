import {Injectable} from '@angular/core';
import {NavController, Platform} from '@ionic/angular';
import {from, mergeMap, Observable, of} from 'rxjs';
import {Router, NavigationStart} from '@angular/router';
import {NavPathEnum} from "@app/services/nav/nav-path.enum";
import {map} from "rxjs/operators";
import {NavParams} from "@app/services/nav/nav-params";

@Injectable({
    providedIn: 'root'
})
export class NavService {

    private stack: Array<{ path: NavPathEnum, params: NavParams }> = [];
    private justNavigated: boolean;

    public constructor(private platform: Platform,
                       private navController: NavController,
                       private router: Router) {
        this.router.events.subscribe(event => {
            if (event instanceof NavigationStart) {
                if (!this.justNavigated && this.stack.length) {
                    this.stack.pop();
                }

                this.justNavigated = false;
            }
        });
    }

    public push(path: NavPathEnum, params: NavParams = {}): Observable<boolean> {
        this.justNavigated = true;
        this.stack.push({path, params});

        return from(this.navController.navigateForward(path));
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
            this.spliceStack(this.stack.length - reverseIndex, params);

            return from(this.navController.navigateBack(path))
                .pipe(map(() => undefined));
        }
        else {
            this.stack.pop();
            return from(this.navController.pop()).pipe(
                mergeMap(() => (
                    number && number > 1
                        ? this.pop({number: number - 1})
                        : of(undefined)
                ))
            );
        }
    }

    public setRoot(path: NavPathEnum, params: NavParams = {}): Observable<boolean> {
        this.justNavigated = true;
        this.stack = [{path, params}];

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

    public currentPath(stackId?: number): NavPathEnum|undefined {
        const stackIndex = stackId !== undefined
            ? stackId
            : (this.stack.length - 1);
        return this.stack[stackIndex].path;
    }

    private spliceStack(index: number, newParams: NavParams = {}): void {
        // remove elements in stack after the request path params
        this.stack.splice(index);

        const stackElement = this.stack[this.stack.length - 1];
        if (stackElement) {
            stackElement.params = {
                ...(stackElement.params || {}),
                ...(newParams || {}),
            };
        }
    }

}
