import {IconConfig} from '@common/components/panel/model/icon-config';
import {BadgeConfig} from "@common/components/badge/badge-config";

export interface CustomListConfig {
    disableList: boolean;
    elements: Array<{
        checked: boolean;
        rightBadge?: BadgeConfig;
        icon?: string;
        name: string;
        action?: (label: string) => void;
    }>;
    commonIcon?: IconConfig;
}
