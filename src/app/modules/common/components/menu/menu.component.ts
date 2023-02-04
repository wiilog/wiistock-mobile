import {Component, Input, OnInit} from '@angular/core';
import {ColumnNumber, MenuConfig} from './menu-config';

@Component({
    selector: 'wii-menu',
    templateUrl: 'menu.component.html',
    styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
    public readonly ColumnNumber = ColumnNumber;

    @Input()
    public config: Array<MenuConfig>;

    @Input()
    public columns: number;

    public ngOnInit(): void {
        this.columns = this.config.length === 3 || this.config.length > 4 ? ColumnNumber.THREE : ColumnNumber.TWO;
    }

    public get firstPlaceholderDisplayed(): boolean {
        const columnLength = this.columnLength;
        return (
            columnLength !== -1
            && (this.config.length % columnLength !== 0)
        );
    }

    public get secondPlaceholderDisplayed(): boolean {
        const columnLength = this.columnLength;
        return (
            columnLength === 3
            && this.firstPlaceholderDisplayed
            && (this.config.length % columnLength === 1)
        );
    }

    public get columnLength(): number {
        return (
            this.columns === ColumnNumber.TWO ? 2 :
            this.columns === ColumnNumber.THREE ? 3 :
            -1
        );
    }

    public callAction({action}: MenuConfig): void {
        if (action) {
            action();
        }
    }
}
