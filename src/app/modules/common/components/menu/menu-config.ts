import {IconColor} from '@common/components/icon/icon-color';

export interface MenuConfig {
    icon: string;
    iconColor?: IconColor;
    label: string;
    action?: () => void;
}

export enum ColumnNumber {
    TWO,
    THREE
}
