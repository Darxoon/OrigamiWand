import { writable } from "svelte/store";

export const openedMenu = writable<string | null>(null)