import type { Language } from './types';
import { __ } from '@wordpress/i18n';

export interface Translations {
	training: {
		title: string;
		subtitle: string;
		participants: string;
		sessions: string;
		standings: string;
		attendance: string;
		pairings: string;
		round: string;
		result: string;
		present: string;
		absent: string;
		points: string;
		played: string;
		wins: string;
		draws: string;
		losses: string;
		rating: string;
		classical: string;
		rapid: string;
		blitz: string;
		bye: string;
		semester: string;
		audience: string;
		audiences: {
			junior: string;
			adult: string;
			mixed: string;
		};
		startSession: string;
		saveAttendance: string;
		saveResults: string;
		addParticipant: string;
		removeParticipant: string;
		noGroups: string;
		tournament: string;
		active: string;
		inactive: string;
		notes: string;
		saveNotes: string;
		rank: string;
		name: string;
		search: string;
		backToGroup: string;
		backToList: string;
		ratingUnavailable: string;
		notPlayed: string;
		createGroup: string;
		groupName: string;
		description: string;
		timeControl: string;
		hasTournament: string;
		groupType: string;
		trainingOnly: string;
		tournamentOnly: string;
		trainingAndTournament: string;
		schedule: string;
		startDate: string;
		endDate: string;
		location: string;
		event: string;
		newEvent: string;
		selectEvent: string;
		noSchedule: string;
		excludedDates: string;
		addExclusion: string;
		cancelled: string;
		trainers: string;
		contact: string;
		tournamentLink: string;
		generateRounds: string;
		regenerateRounds: string;
		regenerateWarning: string;
		board: string;
		white: string;
		black: string;
		noResult: string;
		everyWeek: string;
		everyOtherWeek: string;
		showParticipants: string;
		showStandings: string;
		ssfGroupId: string;
		ssfTournamentGroupId: string;
		fetchFromSsf: string;
		ssfFetching: string;
		ssfFetchError: string;
		ssfPreviewConfirm: string;
		results: string;
		tiebreak: string;
		loadingResults: string;
		resultsFetchError: string;
	};
	tournament: {
		title: string;
		subtitle: string;
		createTournament: string;
		noTournaments: string;
		tournamentName: string;
		category: string;
		categories: {
			junior: string;
			youth: string;
			adult: string;
			senior: string;
			mixed: string;
		};
		status: string;
		statuses: {
			planned: string;
			active: string;
			completed: string;
		};
		format: string;
		formats: {
			roundRobin: string;
		};
		startDate: string;
		endDate: string;
		externalLink: string;
		linkedEvent: string;
		ssfBacked: string;
		ssfBackedHint: string;
		ssfBackedNote: string;
		overview: string;
		linkedTournament: string;
		noLinkedTournament: string;
		viewTournament: string;
		backToList: string;
		officialResult: string;
	};
	calendar: {
		title: string;
		subtitle: string;
		today: string;
		noEvents: string;
		time: string;
		location: string;
		moreEvents: string;
		month: string;
		week: string;
		day: string;
		days: {
			mon: string;
			tue: string;
			wed: string;
			thu: string;
			fri: string;
			sat: string;
			sun: string;
		};
		eventCategories: {
			training: string;
			tournament: string;
			junior: string;
			allsvenskan: string;
			skolschack: string;
			other: string;
		};
		allCategories: string;
		recurring: string;
		weekly: string;
		biweekly: string;
		edit: string;
		delete: string;
		deleteConfirm: string;
		deleteThisOnly: string;
		deleteSeries: string;
		createEvent: string;
	};
	carousel: {
		addImages: string;
		editImages: string;
		removeImage: string;
		moveUp: string;
		moveDown: string;
		noImages: string;
		displayMode: string;
		modes: { slider: string; carousel: string };
		autoplay: string;
		interval: string;
		visibleItems: string;
		aspectRatio: string;
		aspectRatios: {
			'16:9': string;
			'4:3': string;
			'1:1': string;
			'3:4': string;
			'9:16': string;
			auto: string;
		};
		imageFit: string;
		fits: { cover: string; contain: string };
		backdropStyle: string;
		backdrops: { blurred: string; black: string };
		constrain: string;
		constraints: { none: string; width: string; height: string };
		constraintWidth: string;
		constraintHeight: string;
		alignment: string;
		alignments: { left: string; center: string; right: string };
		prev: string;
		next: string;
		slideOf: string;
	};
	ranking: {
		title: string;
		ratingPeriod: string;
		eloType: string;
		memberType: string;
		standard: string;
		rapid: string;
		blitz: string;
		all: string;
		women: string;
		juniors: string;
		cadets: string;
		veterans: string;
		minors: string;
		kids: string;
		rank: string;
		titleCol: string;
		firstName: string;
		lastName: string;
		rating: string;
		showing: string;
		players: string;
		noPlayers: string;
		of: string;
	};
	common: {
		loading: string;
		save: string;
		cancel: string;
		confirm: string;
		delete: string;
		edit: string;
		add: string;
	};
}

const translations: Translations = {
	training: {
		title: __( 'Training', 'rockaden-chess' ),
		subtitle: __(
			'Training groups and round-robin tournaments.',
			'rockaden-chess'
		),
		participants: __( 'Participants', 'rockaden-chess' ),
		sessions: __( 'Sessions', 'rockaden-chess' ),
		standings: __( 'Standings', 'rockaden-chess' ),
		attendance: __( 'Attendance', 'rockaden-chess' ),
		pairings: __( 'Pairings', 'rockaden-chess' ),
		round: __( 'Round', 'rockaden-chess' ),
		result: __( 'Result', 'rockaden-chess' ),
		present: __( 'Present', 'rockaden-chess' ),
		absent: __( 'Absent', 'rockaden-chess' ),
		points: __( 'Points', 'rockaden-chess' ),
		played: __( 'Played', 'rockaden-chess' ),
		wins: __( 'W', 'rockaden-chess' ),
		draws: __( 'D', 'rockaden-chess' ),
		losses: __( 'L', 'rockaden-chess' ),
		rating: __( 'Elo', 'rockaden-chess' ),
		classical: __( 'Classical', 'rockaden-chess' ),
		rapid: __( 'Rapid', 'rockaden-chess' ),
		blitz: __( 'Blitz', 'rockaden-chess' ),
		bye: __( 'Bye', 'rockaden-chess' ),
		semester: __( 'Semester', 'rockaden-chess' ),
		audience: __( 'Audience', 'rockaden-chess' ),
		audiences: {
			junior: __( 'Junior', 'rockaden-chess' ),
			adult: __( 'Adult', 'rockaden-chess' ),
			mixed: __( 'Mixed', 'rockaden-chess' ),
		},
		startSession: __( 'Start Session', 'rockaden-chess' ),
		saveAttendance: __( 'Save Attendance', 'rockaden-chess' ),
		saveResults: __( 'Save Results', 'rockaden-chess' ),
		addParticipant: __( 'Add Participant', 'rockaden-chess' ),
		removeParticipant: __( 'Remove', 'rockaden-chess' ),
		noGroups: __( 'No training groups yet.', 'rockaden-chess' ),
		tournament: __( 'Tournament', 'rockaden-chess' ),
		active: __( 'Active', 'rockaden-chess' ),
		inactive: __( 'Inactive', 'rockaden-chess' ),
		notes: __( 'Notes', 'rockaden-chess' ),
		saveNotes: __( 'Save Notes', 'rockaden-chess' ),
		rank: __( '#', 'rockaden-chess' ),
		name: __( 'Name', 'rockaden-chess' ),
		search: __( 'Search…', 'rockaden-chess' ),
		backToGroup: __( 'Back to group', 'rockaden-chess' ),
		backToList: __( 'Back to training', 'rockaden-chess' ),
		ratingUnavailable: __( '-', 'rockaden-chess' ),
		notPlayed: __( 'Not played', 'rockaden-chess' ),
		createGroup: __( 'Create Group', 'rockaden-chess' ),
		groupName: __( 'Group Name', 'rockaden-chess' ),
		description: __( 'Description', 'rockaden-chess' ),
		timeControl: __( 'Time Control', 'rockaden-chess' ),
		hasTournament: __( 'Has Tournament', 'rockaden-chess' ),
		groupType: __( 'Group Type', 'rockaden-chess' ),
		trainingOnly: __( 'Training', 'rockaden-chess' ),
		tournamentOnly: __( 'Tournament', 'rockaden-chess' ),
		trainingAndTournament: __( 'Training & Tournament', 'rockaden-chess' ),
		schedule: __( 'Schedule', 'rockaden-chess' ),
		startDate: __( 'Start Date', 'rockaden-chess' ),
		endDate: __( 'End Date', 'rockaden-chess' ),
		location: __( 'Location', 'rockaden-chess' ),
		event: __( 'Event', 'rockaden-chess' ),
		newEvent: __( 'New Event', 'rockaden-chess' ),
		selectEvent: __( 'Select event…', 'rockaden-chess' ),
		noSchedule: __( 'No schedule linked.', 'rockaden-chess' ),
		excludedDates: __( 'Excluded Dates', 'rockaden-chess' ),
		addExclusion: __( 'Exclude', 'rockaden-chess' ),
		cancelled: __( 'Cancelled', 'rockaden-chess' ),
		trainers: __( 'Trainers', 'rockaden-chess' ),
		contact: __( 'Contact', 'rockaden-chess' ),
		tournamentLink: __( 'Tournament (schack.se)', 'rockaden-chess' ),
		generateRounds: __( 'Generate Rounds', 'rockaden-chess' ),
		regenerateRounds: __( 'Regenerate Rounds', 'rockaden-chess' ),
		regenerateWarning: __(
			'Regenerating rounds will erase existing results. Continue?',
			'rockaden-chess'
		),
		board: __( 'Board', 'rockaden-chess' ),
		white: __( 'White', 'rockaden-chess' ),
		black: __( 'Black', 'rockaden-chess' ),
		noResult: __( '—', 'rockaden-chess' ),
		everyWeek: __( 'Every', 'rockaden-chess' ),
		everyOtherWeek: __( 'Every other', 'rockaden-chess' ),
		showParticipants: __( 'Show participants', 'rockaden-chess' ),
		showStandings: __( 'Show standings', 'rockaden-chess' ),
		ssfGroupId: __( 'SSF Group ID', 'rockaden-chess' ),
		ssfTournamentGroupId: __( 'SSF Tournament Group ID', 'rockaden-chess' ),
		fetchFromSsf: __( 'Fetch from SSF', 'rockaden-chess' ),
		ssfFetching: __( 'Fetching…', 'rockaden-chess' ),
		ssfFetchError: __( 'Could not fetch SSF data', 'rockaden-chess' ),
		ssfPreviewConfirm: __( 'Apply', 'rockaden-chess' ),
		results: __( 'Results', 'rockaden-chess' ),
		tiebreak: __( 'KP', 'rockaden-chess' ),
		loadingResults: __( 'Loading results…', 'rockaden-chess' ),
		resultsFetchError: __( 'Could not load results.', 'rockaden-chess' ),
	},
	tournament: {
		title: __( 'Tournaments', 'rockaden-chess' ),
		subtitle: __(
			'Tournaments at SK Rockaden — round-robin or SSF-backed.',
			'rockaden-chess'
		),
		createTournament: __( 'Create Tournament', 'rockaden-chess' ),
		noTournaments: __( 'No tournaments yet.', 'rockaden-chess' ),
		tournamentName: __( 'Tournament name', 'rockaden-chess' ),
		category: __( 'Category', 'rockaden-chess' ),
		categories: {
			junior: __( 'Junior', 'rockaden-chess' ),
			youth: __( 'Youth', 'rockaden-chess' ),
			adult: __( 'Adult', 'rockaden-chess' ),
			senior: __( 'Senior', 'rockaden-chess' ),
			mixed: __( 'Mixed', 'rockaden-chess' ),
		},
		status: __( 'Status', 'rockaden-chess' ),
		statuses: {
			planned: __( 'Planned', 'rockaden-chess' ),
			active: __( 'Active', 'rockaden-chess' ),
			completed: __( 'Completed', 'rockaden-chess' ),
		},
		format: __( 'Format', 'rockaden-chess' ),
		formats: {
			roundRobin: __( 'Round-robin', 'rockaden-chess' ),
		},
		startDate: __( 'Start date', 'rockaden-chess' ),
		endDate: __( 'End date', 'rockaden-chess' ),
		externalLink: __( 'External link', 'rockaden-chess' ),
		linkedEvent: __( 'Linked calendar event', 'rockaden-chess' ),
		ssfBacked: __( 'SSF tournament ID', 'rockaden-chess' ),
		ssfBackedHint: __(
			'If set, standings come from SSF (read-only). Leave empty for a Rockaden-managed tournament.',
			'rockaden-chess'
		),
		ssfBackedNote: __(
			'Standings are pulled from SSF. Local pairings/results are not used.',
			'rockaden-chess'
		),
		overview: __( 'Overview', 'rockaden-chess' ),
		linkedTournament: __( 'Linked tournament', 'rockaden-chess' ),
		noLinkedTournament: __( 'No tournament', 'rockaden-chess' ),
		viewTournament: __( 'View tournament', 'rockaden-chess' ),
		backToList: __( 'Back to tournaments', 'rockaden-chess' ),
		officialResult: __( 'Official result', 'rockaden-chess' ),
	},
	calendar: {
		title: __( 'Calendar', 'rockaden-chess' ),
		subtitle: __(
			'Upcoming events and activities at SK Rockaden.',
			'rockaden-chess'
		),
		today: __( 'Today', 'rockaden-chess' ),
		noEvents: __( 'No events this day.', 'rockaden-chess' ),
		time: __( 'Time', 'rockaden-chess' ),
		location: __( 'Location', 'rockaden-chess' ),
		moreEvents: __( 'more', 'rockaden-chess' ),
		month: __( 'Month', 'rockaden-chess' ),
		week: __( 'Week', 'rockaden-chess' ),
		day: __( 'Day', 'rockaden-chess' ),
		days: {
			mon: __( 'Mon', 'rockaden-chess' ),
			tue: __( 'Tue', 'rockaden-chess' ),
			wed: __( 'Wed', 'rockaden-chess' ),
			thu: __( 'Thu', 'rockaden-chess' ),
			fri: __( 'Fri', 'rockaden-chess' ),
			sat: __( 'Sat', 'rockaden-chess' ),
			sun: __( 'Sun', 'rockaden-chess' ),
		},
		eventCategories: {
			training: __( 'Training', 'rockaden-chess' ),
			tournament: __( 'Tournament', 'rockaden-chess' ),
			junior: __( 'Junior', 'rockaden-chess' ),
			allsvenskan: __( 'Allsvenskan', 'rockaden-chess' ),
			skolschack: __( 'School Chess', 'rockaden-chess' ),
			other: __( 'Other', 'rockaden-chess' ),
		},
		allCategories: __( 'All', 'rockaden-chess' ),
		recurring: __( 'Recurring', 'rockaden-chess' ),
		weekly: __( 'Weekly', 'rockaden-chess' ),
		biweekly: __( 'Biweekly', 'rockaden-chess' ),
		edit: __( 'Edit', 'rockaden-chess' ),
		delete: __( 'Delete', 'rockaden-chess' ),
		deleteConfirm: __( 'Delete this event?', 'rockaden-chess' ),
		deleteThisOnly: __( 'Just this one', 'rockaden-chess' ),
		deleteSeries: __( 'Whole series', 'rockaden-chess' ),
		createEvent: __( 'Create event', 'rockaden-chess' ),
	},
	carousel: {
		addImages: __( 'Add images', 'rockaden-chess' ),
		editImages: __( 'Edit images', 'rockaden-chess' ),
		removeImage: __( 'Remove', 'rockaden-chess' ),
		moveUp: __( 'Move up', 'rockaden-chess' ),
		moveDown: __( 'Move down', 'rockaden-chess' ),
		noImages: __( 'No images selected yet.', 'rockaden-chess' ),
		displayMode: __( 'Display mode', 'rockaden-chess' ),
		modes: {
			slider: __( 'Slider', 'rockaden-chess' ),
			carousel: __( 'Carousel', 'rockaden-chess' ),
		},
		autoplay: __( 'Auto-advance', 'rockaden-chess' ),
		interval: __( 'Interval (seconds)', 'rockaden-chess' ),
		visibleItems: __( 'Visible items', 'rockaden-chess' ),
		aspectRatio: __( 'Aspect ratio', 'rockaden-chess' ),
		aspectRatios: {
			'16:9': __( '16:9 (Landscape wide)', 'rockaden-chess' ),
			'4:3': __( '4:3 (Landscape)', 'rockaden-chess' ),
			'1:1': __( '1:1 (Square)', 'rockaden-chess' ),
			'3:4': __( '3:4 (Portrait)', 'rockaden-chess' ),
			'9:16': __( '9:16 (Portrait tall)', 'rockaden-chess' ),
			auto: __( 'Auto', 'rockaden-chess' ),
		},
		imageFit: __( 'Image fit', 'rockaden-chess' ),
		fits: {
			cover: __( 'Fill (crop edges)', 'rockaden-chess' ),
			contain: __( 'Fit whole image', 'rockaden-chess' ),
		},
		backdropStyle: __( 'Backdrop', 'rockaden-chess' ),
		backdrops: {
			blurred: __( 'Blurred image', 'rockaden-chess' ),
			black: __( 'Black bars', 'rockaden-chess' ),
		},
		constrain: __( 'Constrain size', 'rockaden-chess' ),
		constraints: {
			none: __( 'No limit (fill container)', 'rockaden-chess' ),
			width: __( 'By max width', 'rockaden-chess' ),
			height: __( 'By max height', 'rockaden-chess' ),
		},
		constraintWidth: __( 'Max width (px)', 'rockaden-chess' ),
		constraintHeight: __( 'Max height (px)', 'rockaden-chess' ),
		alignment: __( 'Alignment', 'rockaden-chess' ),
		alignments: {
			left: __( 'Left', 'rockaden-chess' ),
			center: __( 'Center', 'rockaden-chess' ),
			right: __( 'Right', 'rockaden-chess' ),
		},
		prev: __( 'Previous', 'rockaden-chess' ),
		next: __( 'Next', 'rockaden-chess' ),
		slideOf: __( 'Slide {n} of {total}', 'rockaden-chess' ),
	},
	ranking: {
		title: __( 'Ranking List', 'rockaden-chess' ),
		ratingPeriod: __( 'Rating Period', 'rockaden-chess' ),
		eloType: __( 'ELO Type', 'rockaden-chess' ),
		memberType: __( 'Member Type', 'rockaden-chess' ),
		standard: __( 'Standard', 'rockaden-chess' ),
		rapid: __( 'Rapid', 'rockaden-chess' ),
		blitz: __( 'Blitz', 'rockaden-chess' ),
		all: __( 'All', 'rockaden-chess' ),
		women: __( 'Women', 'rockaden-chess' ),
		juniors: __( 'Juniors', 'rockaden-chess' ),
		cadets: __( 'Cadets', 'rockaden-chess' ),
		veterans: __( 'Veterans', 'rockaden-chess' ),
		minors: __( 'Minors', 'rockaden-chess' ),
		kids: __( 'Kids', 'rockaden-chess' ),
		rank: __( '#', 'rockaden-chess' ),
		titleCol: __( 'Title', 'rockaden-chess' ),
		firstName: __( 'First Name', 'rockaden-chess' ),
		lastName: __( 'Last Name', 'rockaden-chess' ),
		rating: __( 'Rating', 'rockaden-chess' ),
		showing: __( 'Showing', 'rockaden-chess' ),
		players: __( 'players', 'rockaden-chess' ),
		noPlayers: __( 'No players found.', 'rockaden-chess' ),
		of: __( 'of', 'rockaden-chess' ),
	},
	common: {
		loading: __( 'Loading…', 'rockaden-chess' ),
		save: __( 'Save', 'rockaden-chess' ),
		cancel: __( 'Cancel', 'rockaden-chess' ),
		confirm: __( 'Confirm', 'rockaden-chess' ),
		delete: __( 'Delete', 'rockaden-chess' ),
		edit: __( 'Edit', 'rockaden-chess' ),
		add: __( 'Add', 'rockaden-chess' ),
	},
};

export function toLanguage( locale: string ): Language {
	return locale.startsWith( 'sv' ) ? 'sv' : 'en';
}

// The `language` parameter is kept for backwards-compat with existing
// call sites; gettext drives the active locale, so we ignore the arg.
export function getTranslation( language?: Language ): Translations {
	void language;
	return translations;
}
