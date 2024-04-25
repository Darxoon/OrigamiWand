import type { Tab } from "./globalDragging";
import type { PageContent } from "./fileEditor/page";

export class OpenWindowEvent {
	title: string
	content: PageContent
	
	/**
	 * Meant to be set by the EditorWindow where the event inevitably goes through.
	 */
	parentTab?: Tab
	
	constructor(title: string, content: PageContent) {
		this.title = title
		this.content = content
	}
}