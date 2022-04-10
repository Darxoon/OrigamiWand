import { onMount } from "svelte";
import { EventEmitter } from "events"
import type { TypeSafeEventEmitter } from "typesafe-event-emitter";
import type { DataType } from "paper-mario-elfs/elfBinary";

export interface ShowFieldOptionEventArgs {
    fieldName: string
    dataType: DataType
}

export let showFieldOptionEvent: TypeSafeEventEmitter<{show: ShowFieldOptionEventArgs}> = new EventEmitter()
