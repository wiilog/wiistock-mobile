import {IconColor} from '@common/components/icon/icon-color';

export interface IconConfig {
    name: string;
    color?: IconColor;
    customColor?: string;
    action?: () => void;
    width?: string|number;
    height?: string|number;
}
