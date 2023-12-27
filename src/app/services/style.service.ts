import {Injectable} from '@angular/core';
import {StatusBar} from "@capacitor/status-bar";
import {ScssHelperService} from "@app/services/scss-helper.service";

@Injectable({
    providedIn: 'root'
})
export class StyleService {

    private primaryColor?: string;
    private readonly darkColor?: string;

    public constructor(private scssHelper: ScssHelperService) {
        this.primaryColor = this.scssHelper.getVariable('ion-color-primary');
        this.darkColor = this.scssHelper.getVariable('ion-color-dark');
    }

    public updatePrimaryColor(color: string): void {
        const htmlEl = document.querySelector('html');
        htmlEl?.style.setProperty('--ion-color-primary', color);
    }

    public setStatusBarColor(pageWithHeader: boolean = true, customColor: string|undefined = undefined): void {
        this.primaryColor = customColor || this.primaryColor;
        const color = pageWithHeader ? this.primaryColor : this.darkColor;
        if (color) {
            StatusBar.setBackgroundColor({color});
        }
    }
}
