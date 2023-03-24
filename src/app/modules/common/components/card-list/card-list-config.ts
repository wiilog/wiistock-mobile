import {IconConfig} from '@common/components/panel/model/icon-config';
import {ListPanelItemConfig} from '@common/components/panel/model/list-panel/list-panel-item-config';
import {BadgeConfig} from '@common/components/badge/badge-config';

export interface CardListConfig {
    badges?: Array<BadgeConfig>;
    title?: {label?: string; value?: string;} | Array<{label?: string; value?: string;}>;
    titleFlex?: boolean;
    content: Array<{
        label?: string;
        value?: string;
        itemConfig?: ListPanelItemConfig;
    }>;
    table?: {
        title: string;
        values: Array<string>;
    };
    customColor?: string;
    rightIcon?: IconConfig;
    action?: () => void;
    info?: string;
    error?: string;
    itemBoldValues?: Array<string>;
}
