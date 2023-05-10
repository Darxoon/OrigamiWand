import { PUBLIC_TRACE } from "$env/static/public";

namespace logging {
	const traceEnabled = !!parseInt(PUBLIC_TRACE)
	
	/**
	 * Will log a message to the console only if PUBLIC_TRACE environment variable is set to 1.
	 * Good for logging verbose and usually irrelevant data like state changes.
	 * @param values Arguments to log; will be passed on to console.log(...)
	 */
	export function trace(...values: any[]) {
		if (traceEnabled) {
			console.log(...values)
		}
	}
}

export default logging
