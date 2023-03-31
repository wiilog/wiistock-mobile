import {Injectable} from '@angular/core';
import * as moment from 'moment';

@Injectable({
    providedIn: 'root'
})
export class FormatService {

    public formatDate(date: string): string {
        return this.capitalize(moment(date, 'DD/MM/YYYY').format('dddd D MMMM YYYY'));
    }

    public capitalize(string: string): string {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

}
