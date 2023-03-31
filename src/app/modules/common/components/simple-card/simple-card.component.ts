import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

export type SimpleCardTitle = {
    title: string;
    image?: string;
    position: `left` | `right`;
}

@Component({
    selector: 'wii-simple-card',
    templateUrl: './simple-card.component.html',
    styleUrls: ['./simple-card.component.scss'],
})
export class SimpleCardComponent implements OnInit {

    @Input()
    public titles: Array<SimpleCardTitle> | SimpleCardTitle | string;

    @Input()
    public color: string;

    @Input()
    public disabled: boolean;

    @Output()
    public click: EventEmitter<void> = new EventEmitter();

    @Input()
    public stackedRightContent: boolean = false;

    public leftTitles: Array<SimpleCardTitle>;
    public rightTitles: Array<SimpleCardTitle>;

    ngOnInit() {
        if(Array.isArray(this.titles)) {
            this.leftTitles = this.titles.filter(title => title.position === `left`);
            this.rightTitles = this.titles.filter(title => title.position === `right`);
        } else if(typeof this.titles === `string`) {
            this.leftTitles = [{
                title: this.titles,
                position: `left`,
            }];
        } else {
            if(this.titles.position === `left`) {
                this.leftTitles = [this.titles];
            } else {
                this.rightTitles = [this.titles];
            }
        }
    }

    public onClick(): void {
        if(!this.disabled) {
            this.click.emit();
        }
    }

}
