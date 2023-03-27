import {Injectable} from '@angular/core';
import {NavController, Platform} from '@ionic/angular';
import {from, Observable} from 'rxjs';
import {Router, NavigationStart} from '@angular/router';
import {LoadingController} from '@ionic/angular';
import {NavPathEnum} from "@app/services/nav/nav-path.enum";
import {map} from "rxjs/operators";

@Injectable({
    providedIn: 'root'
})
export class NavService {
    private stack: Array<{ path: string, params: any }> = [];
    private justNavigated: boolean;

    public constructor(private platform: Platform,
                       private loader: LoadingController,
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

    public push(path: NavPathEnum, params: any = {}): Observable<boolean> {
        this.removeLoaders();

        this.justNavigated = true;
        this.stack.push({path, params});

        return from(this.navController.navigateForward(path));
    }

    public pop(options?: { path: NavPathEnum, params?: any}): Observable<void> {
        this.removeLoaders();

        this.justNavigated = true;

        const {path, params} = options || {};

        if (!path) {
            this.stack.pop();
            return from(this.navController.pop());
        } else {
            const reversedParamStack = [...this.stack].reverse();
            reversedParamStack.shift();

            const lastIndex = reversedParamStack.findIndex((param) => param.path === path);

            if (lastIndex === -1) {
                throw new Error(`Could not find route ${path}`);
            }

            const index = lastIndex + 1;
            this.stack.splice(this.stack.length - index, index);

            const currentParams = this.stack[this.stack.length - 1].params;
            for (const [key, value] of Object.entries(params || {})) {
                currentParams[key] = value;
            }

            return from(this.navController.navigateBack(path)).pipe(map(() => undefined));
        }
    }

    public setRoot(path: string, params: any = {}): Observable<boolean> {
        this.removeLoaders();

        this.justNavigated = true;
        this.stack = [params];

        return from(this.navController.navigateRoot(path));
    }

    public params<T = any>(paramsId?: number): T {
        const stacked = paramsId !== undefined
            ? (this.stack[paramsId] || {})
            : this.stack[this.stack.length - 1];
        return stacked.params;
    }

    public param<T = any>(key: string): T {
        return this.stack[this.stack.length - 1].params[key];
    }

    private removeLoaders() {
        this.loader.getTop().then(loader => {
            if(loader) {
                this.loader.dismiss();
            }
        });
    }

}
