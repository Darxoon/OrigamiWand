export function* enumerate<T>(arr: T[]): Generator<[T, number], void, unknown> {
	for (let i = 0; i < arr.length; i++) {
		yield [arr[i], i]
	}
}
