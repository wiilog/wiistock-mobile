import {IconConfig} from '@common/components/panel/model/icon-config';
import {BadgeConfig} from "@common/components/badge/badge-config";

export interface TimelineConfig {
    title: string;
    disableList: boolean;
    elements: Array<{
        checked: boolean;
        clickable: boolean;
        rightBadge?: BadgeConfig;
        icon?: string;
        name: string;
        action?: (label: string) => void;
    }>;
    commonIcon?: IconConfig;
}
