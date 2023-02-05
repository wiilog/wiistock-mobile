import {Component, Input, ViewChild} from '@angular/core';
import {IonInfiniteScroll} from "@ionic/angular";


@Component({
    selector: 'wii-suggestion-list',
    templateUrl: 'suggestion-list.component.html',
    styleUrls: ['./suggestion-list.component.scss']
})
export class SuggestionListComponent {

    @ViewChild('infiniteScroll', {static: false})
    public infiniteScroll: IonInfiniteScroll;

    @Input()
    public title: string;

    @Input()
    public elements: Array<Array<{
        name: string;
        value: string|number;
    }>>;

    @Input()
    public loadMore: (infiniteScroll: IonInfiniteScroll) => void;
}
