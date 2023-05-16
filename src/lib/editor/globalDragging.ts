import EventEmitter from "events";
import { writable } from "svelte/store";
import type { TypeSafeEventEmitter } from "typesafe-event-emitter";

export type DockDirection = 'left' | 'origin' | 'right'

export type TabID = Symbol

export interface Tab {
    id: TabID,
    parentId?: TabID,
    
    name: string
    
    isCompressed: boolean,
    
    component: any
    properties: any
    children: TabID[]
}

export const globalDraggedTab = writable<{ tab: Tab, baseMouseX: number }>(undefined)
export const tabWasAccepted = writable<Tab>(undefined)

export const globalDragEndEvent: TypeSafeEventEmitter<{end: void}> = new EventEmitter()

