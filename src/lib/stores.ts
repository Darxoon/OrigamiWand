import { writable } from "svelte/store";

export const openedMenu = writable<string | null>(null)
export const loadedAutosave = writable<boolean>(false)
