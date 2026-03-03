export type EventCategory =
	| 'training'
	| 'tournament'
	| 'junior'
	| 'allsvenskan'
	| 'skolschack'
	| 'other';

export interface CalendarEvent {
	id: string;
	title: string;
	startDate: string;
	endDate: string;
	description?: string;
	location?: string;
	category: EventCategory;
	source: 'cms' | 'ssf';
	parentId?: string;
	link?: string;
	linkLabel?: string;
}

export type Language = 'en' | 'sv';
