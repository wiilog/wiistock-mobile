import {Component, Input} from '@angular/core';


@Component({
    selector: 'wii-main-loader',
    templateUrl: 'main-loader.component.html',
    styleUrls: ['./main-loader.component.scss']
})
export class MainLoaderComponent {

    private static readonly DEFAULT_MESSAGE: string = 'Chargement...';

    @Input()
    public loading: boolean;

    @Input()
    public message?: string;

    public get messageShown(): string {
        return this.message ? this.message : MainLoaderComponent.DEFAULT_MESSAGE;
    }
}
