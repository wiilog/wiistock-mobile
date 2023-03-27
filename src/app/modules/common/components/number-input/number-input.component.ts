import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
    selector: 'wii-number-input',
    templateUrl: 'number-input.component.html',
    styleUrls: ['./number-input.component.scss']
})

export class NumberInputComponent {

    @Input()
    public label: string;

    @Input()
    public value: number;

    @Input()
    public min: number = 0;

    @Input()
    public max: number = Number.MAX_VALUE;

    @Output()
    public valueChange: EventEmitter<number>;

    public constructor() {
        this.valueChange = new EventEmitter<number>();
    }

    public onInputUpdated(mode: 'minus' | 'plus'): void {
        if (mode === 'minus' && this.value > this.min) {
            this.value--;
        }
        if (mode === 'plus' && this.value < this.max) {
            this.value++;
        }
        this.emitValueChange();
    }

    public emitValueChange() {
        this.valueChange.emit(this.value);
    }
}