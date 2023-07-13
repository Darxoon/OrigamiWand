export function clickToKeyboardListener(onClick: () => void) {
	return (e: KeyboardEvent) => {
		if (e.key == " " || e.key == "Enter") {
			onClick()
			e.preventDefault()
			e.stopPropagation()
		}
	}
}

export function nonnativeButton(node: HTMLElement, onActivate: () => void): SvelteActionReturnType {
	node.role = "button"
	node.tabIndex = 0
	
	let keyboardListener = clickToKeyboardListener(onActivate)
	node.addEventListener('click', onActivate, true)
	node.addEventListener('keyup', keyboardListener)
	
	return {
		update(newOnActivate: () => void) {
			node.removeEventListener('click', onActivate, true)
			node.removeEventListener('keyup', keyboardListener)
			
			onActivate = newOnActivate
			keyboardListener = clickToKeyboardListener(onActivate)
			node.addEventListener('click', onActivate, true)
			node.addEventListener('keyup', keyboardListener)
		},
		
		destroy() {
			delete node.role
			delete node.tabIndex
			
			node.removeEventListener('click', onActivate, true)
			node.removeEventListener('keyup', keyboardListener)
		}
	}
}
