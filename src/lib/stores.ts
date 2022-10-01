import { writable } from "svelte/store";
import type EditorStrip from "./editor/EditorStrip.svelte";

export const openedMenu = writable<string | null>(null)
export const loadedAutosave = writable<boolean>(false)

export const globalEditorStrip = writable<EditorStrip>(null)
