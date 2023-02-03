import {Injectable} from '@angular/core';

@Injectable()
export class ScssHelperService {
    private static readonly PREFIX: string = '--';
    private static readonly DEFAULT_VALUE: undefined = undefined;

    private style: CSSStyleDeclaration;

    public constructor() {
        this.style = window.getComputedStyle(document.body);
    }

    public getVariable(name: string): string|undefined {
        const value = this.style.getPropertyValue(`${ScssHelperService.PREFIX}${name}`);
        const trimmedValue = value && value.trim();
        return trimmedValue ? trimmedValue : ScssHelperService.DEFAULT_VALUE;
    }
}
