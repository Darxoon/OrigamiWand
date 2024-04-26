export type MenuStripEntry = { name: string, onClick: () => void }

export interface MenuCategory {
    title: string
    items: MenuStripEntry[]
}
