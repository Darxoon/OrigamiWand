import EventEmitter from "events";
import type { ElfBinary } from "paper-mario-elfs/elfBinary";
import { writable } from "svelte/store";
import type { TypeSafeEventEmitter } from "typesafe-event-emitter";
import type { PageContent } from "./fileEditor/page";

export type DockDirection = 'left' | 'origin' | 'right'

export type TabID = Symbol

export interface Tab {
    id: TabID,
    parentId?: TabID,
    
    name: string
    isCompressed: boolean,
    children: TabID[]
    
    content: PageContent
}

export const globalDraggedTab = writable<{ tab: Tab, baseMouseX: number }>(undefined)
export const tabWasAccepted = writable<Tab>(undefined)

export const globalDragEndEvent: TypeSafeEventEmitter<{end: void}> = new EventEmitter()

