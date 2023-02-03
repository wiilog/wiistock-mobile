import {Observable} from 'rxjs';

export interface CanLeave {
    wiiCanLeave(): boolean | Observable<boolean>;
}
