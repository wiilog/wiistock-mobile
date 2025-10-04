export interface Translation {
    id: number,
    topMenu: string,
    menu: string,
    subMenu: string,
    label: string,
    translation: string
}

export type Translations = {[label: string]: string};
