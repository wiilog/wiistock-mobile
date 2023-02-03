import {NavPathEnum} from '@app/services/nav/nav-path.enum';

export interface TitleConfig {
    label?: string;
    pagePath: NavPathEnum;
    noBreadcrumb?: boolean,
    filter?: (data: Map<string, any>) => boolean;
    stackIndex?: number;
    paramsId?: number;
}
