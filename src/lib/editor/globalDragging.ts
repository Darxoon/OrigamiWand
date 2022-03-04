import EventEmitter from "events";
import { writable } from "svelte/store";
import type { TypeSafeEventEmitter } from "typesafe-event-emitter";

export interface Tab {
    name: string
    shortName: string
    component: any
    properties: any
    hasChildren: boolean
}

export const globalDraggedTab = writable<{tab: Tab, width: number}>(undefined)
export const wasDraggingGlobally = writable<boolean>(false)

export const globalDragEndEvent: TypeSafeEventEmitter<{end: void}> = new EventEmitter()
