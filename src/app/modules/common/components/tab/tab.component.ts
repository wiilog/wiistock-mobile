import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {TabConfig} from './tab-config';


@Component({
    selector: 'wii-tab',
    templateUrl: 'tab.component.html',
    styleUrls: ['./tab.component.scss']
})
export class TabComponent implements OnInit {

    @Input()
    public activeKey: number;

    @Input()
    public config: TabConfig[];

    @Output()
    public activeKeyChange: EventEmitter<number>;

    public constructor() {
        this.activeKeyChange = new EventEmitter<number>();
    }

    public ngOnInit(): void {
        if (!this.config || this.config.length === 0) {
            throw new Error('Invalid config');
        }
    }

    public onTabClicked(key: number): void {
        if (this.activeKey !== key) {
            this.activeKey = key;
            this.activeKeyChange.emit(key);
        }
    }
}
