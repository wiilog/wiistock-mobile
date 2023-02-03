import {Injectable} from '@angular/core';
import {CanDeactivate} from '@angular/router';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {Observable} from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class CanLeaveGuard implements CanDeactivate<any> {
    public canDeactivate(page: any): boolean | Observable<boolean> {
        return CanLeaveGuard.IsCanLeave(page)
            ? page.wiiCanLeave()
            : true;
    }

    private static IsCanLeave(page: any): page is CanLeave {
        return (
            page
            && ('wiiCanLeave' in page)
            && (typeof page.wiiCanLeave === 'function')
        );
    }
}
