import {IconConfig} from '@common/components/panel/model/icon-config';
import {BadgeConfig} from "@common/components/badge/badge-config";


export interface ListPanelItemConfig {
    infos: {
        [name: string]: {
            label?: string;
            value?: string;
            emergency?: boolean;
            color?: string;
        };
    };
    loading?: boolean;
    disabled?: boolean;
    color?: string;
    backgroundColor?: string;
    pressAction?: (infos: {[name: string]: {label?: string; value?: string;};}) => void;
    rightIcon?: IconConfig;
    rightIconBase64?: string;
    leftIcon?: IconConfig;
    rightButton?: {
        text: string;
        color?: string;
        action?: () => void;
    };
    sliding?: boolean;
    badge?: BadgeConfig;
    slidingConfig?: {
        left: Array<{
            label: string,
            color: string,
            action: () => void
        }>,
        right: Array<{
            label: string,
            color: string,
            action: () => void
        }>,
    },
    selected?: boolean;
    textRight?: {
        label: string;
        size?: string;
    };
}
