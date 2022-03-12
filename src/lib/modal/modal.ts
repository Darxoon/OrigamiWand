import { writable } from "svelte/store";

export const modalVisible = writable<boolean>(false)
export const currentModal = writable<{ constructor: any, properties: object }>(null)

let onCloseCallback: (success: any) => void

export enum PopupButtonVariant {
	YesNo,
	Okay,
	None,
}


export function showModal<Success = any>(constructor: any, properties: object|undefined, onClose: (success: Success) => void): void;
export function showModal<Success = any>(constructor: any, properties?: object): Promise<Success>;

export function showModal(
	constructor: any, properties: object = {}, 
	onClose?: (success: any) => void,
) {
	modalVisible.set(true)
	currentModal.set({ constructor, properties })
	
	document.body.classList.add("noscroll")
	
	if (onClose) {
		onCloseCallback = onClose
	} else {
		return new Promise((resolve, reject) => {
			onCloseCallback = resolve
		})
	}
}

export function hideActiveModal(success: any) {
	document.body.classList.remove("noscroll")
	
	modalVisible.set(false)
	if (onCloseCallback)
		onCloseCallback(success)
}
