import type { Language } from './types';

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
	};
	calendar: {
		title: string;
		subtitle: string;
		today: string;
		noEvents: string;
		time: string;
		location: string;
		moreEvents: string;
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

const translations: Record< Language, Translations > = {
	en: {
		training: {
			title: 'Training',
			subtitle: 'Training groups and round-robin tournaments.',
			participants: 'Participants',
			sessions: 'Sessions',
			standings: 'Standings',
			attendance: 'Attendance',
			pairings: 'Pairings',
			round: 'Round',
			result: 'Result',
			present: 'Present',
			absent: 'Absent',
			points: 'Points',
			played: 'Played',
			wins: 'W',
			draws: 'D',
			losses: 'L',
			rating: 'Rating',
			classical: 'Classical',
			rapid: 'Rapid',
			blitz: 'Blitz',
			bye: 'Bye',
			semester: 'Semester',
			startSession: 'Start Session',
			saveAttendance: 'Save Attendance',
			saveResults: 'Save Results',
			addParticipant: 'Add Participant',
			removeParticipant: 'Remove',
			noGroups: 'No training groups yet.',
			tournament: 'Tournament',
			active: 'Active',
			inactive: 'Inactive',
			notes: 'Notes',
			saveNotes: 'Save Notes',
			rank: '#',
			name: 'Name',
			search: 'Search...',
			backToGroup: 'Back to group',
			backToList: 'Back to training',
			ratingUnavailable: 'N/A',
			notPlayed: 'Not played',
			createGroup: 'Create Group',
			groupName: 'Group Name',
			description: 'Description',
			timeControl: 'Time Control',
			hasTournament: 'Has Tournament',
			schedule: 'Schedule',
			startDate: 'Start Date',
			endDate: 'End Date',
			location: 'Location',
			event: 'Event',
			newEvent: 'New Event',
			selectEvent: 'Select event...',
			noSchedule: 'No schedule linked.',
			excludedDates: 'Excluded Dates',
			addExclusion: 'Exclude',
			cancelled: 'Cancelled',
			trainers: 'Trainers',
			contact: 'Contact',
			tournamentLink: 'Tournament (schack.se)',
			generateRounds: 'Generate Rounds',
			regenerateRounds: 'Regenerate Rounds',
			regenerateWarning:
				'Regenerating rounds will erase existing results. Continue?',
			board: 'Board',
			white: 'White',
			black: 'Black',
			noResult: '—',
			everyWeek: 'Every',
			everyOtherWeek: 'Every other',
		},
		calendar: {
			title: 'Calendar',
			subtitle: 'Upcoming events and activities at SK Rockaden.',
			today: 'Today',
			noEvents: 'No events this day.',
			time: 'Time',
			location: 'Location',
			moreEvents: 'more',
			days: {
				mon: 'Mon',
				tue: 'Tue',
				wed: 'Wed',
				thu: 'Thu',
				fri: 'Fri',
				sat: 'Sat',
				sun: 'Sun',
			},
			eventCategories: {
				training: 'Training',
				tournament: 'Tournament',
				junior: 'Junior',
				allsvenskan: 'Allsvenskan',
				skolschack: 'School Chess',
				other: 'Other',
			},
			allCategories: 'All',
			recurring: 'Recurring',
			weekly: 'Weekly',
			biweekly: 'Biweekly',
		},
		ranking: {
			title: 'Ranking List',
			ratingPeriod: 'Rating Period',
			eloType: 'ELO Type',
			memberType: 'Member Type',
			standard: 'Standard',
			rapid: 'Rapid',
			blitz: 'Blitz',
			all: 'All',
			women: 'Women',
			juniors: 'Juniors',
			cadets: 'Cadets',
			veterans: 'Veterans',
			minors: 'Minors',
			kids: 'Kids',
			rank: '#',
			titleCol: 'Title',
			firstName: 'First Name',
			lastName: 'Last Name',
			rating: 'Rating',
			showing: 'Showing',
			players: 'players',
			noPlayers: 'No players found.',
			of: 'of',
		},
		common: {
			loading: 'Loading...',
			save: 'Save',
			cancel: 'Cancel',
			confirm: 'Confirm',
			delete: 'Delete',
			edit: 'Edit',
			add: 'Add',
		},
	},
	sv: {
		training: {
			title: 'Träning',
			subtitle: 'Träningsgrupper och rundturneringar.',
			participants: 'Deltagare',
			sessions: 'Tillfällen',
			standings: 'Ställning',
			attendance: 'Närvaro',
			pairings: 'Lottning',
			round: 'Rond',
			result: 'Resultat',
			present: 'Närvarande',
			absent: 'Frånvarande',
			points: 'Poäng',
			played: 'Spelade',
			wins: 'V',
			draws: 'R',
			losses: 'F',
			rating: 'Rating',
			classical: 'Klassiskt',
			rapid: 'Rapid',
			blitz: 'Blixt',
			bye: 'Bye',
			semester: 'Termin',
			startSession: 'Starta tillfälle',
			saveAttendance: 'Spara närvaro',
			saveResults: 'Spara resultat',
			addParticipant: 'Lägg till deltagare',
			removeParticipant: 'Ta bort',
			noGroups: 'Inga träningsgrupper ännu.',
			tournament: 'Turnering',
			active: 'Aktiv',
			inactive: 'Inaktiv',
			notes: 'Anteckningar',
			saveNotes: 'Spara anteckningar',
			rank: '#',
			name: 'Namn',
			search: 'Sök...',
			backToGroup: 'Tillbaka till gruppen',
			backToList: 'Tillbaka till träning',
			ratingUnavailable: 'Saknas',
			notPlayed: 'Ej spelat',
			createGroup: 'Skapa grupp',
			groupName: 'Gruppnamn',
			description: 'Beskrivning',
			timeControl: 'Tidskontroll',
			hasTournament: 'Har turnering',
			schedule: 'Schema',
			startDate: 'Startdatum',
			endDate: 'Slutdatum',
			location: 'Plats',
			event: 'Händelse',
			newEvent: 'Ny händelse',
			selectEvent: 'Välj händelse...',
			noSchedule: 'Inget schema kopplat.',
			excludedDates: 'Undantagna datum',
			addExclusion: 'Undanta',
			cancelled: 'Inställd',
			trainers: 'Tränare',
			contact: 'Kontakt',
			tournamentLink: 'Turnering (schack.se)',
			generateRounds: 'Generera ronder',
			regenerateRounds: 'Generera om ronder',
			regenerateWarning:
				'Att generera om ronder raderar befintliga resultat. Fortsätta?',
			board: 'Bord',
			white: 'Vit',
			black: 'Svart',
			noResult: '—',
			everyWeek: 'Varje',
			everyOtherWeek: 'Varannan',
		},
		calendar: {
			title: 'Kalender',
			subtitle: 'Kommande evenemang och aktiviteter på SK Rockaden.',
			today: 'Idag',
			noEvents: 'Inga händelser denna dag.',
			time: 'Tid',
			location: 'Plats',
			moreEvents: 'till',
			days: {
				mon: 'Mån',
				tue: 'Tis',
				wed: 'Ons',
				thu: 'Tor',
				fri: 'Fre',
				sat: 'Lör',
				sun: 'Sön',
			},
			eventCategories: {
				training: 'Träning',
				tournament: 'Turnering',
				junior: 'Junior',
				allsvenskan: 'Allsvenskan',
				skolschack: 'Skolschack',
				other: 'Övrigt',
			},
			allCategories: 'Alla',
			recurring: 'Återkommande',
			weekly: 'Varje vecka',
			biweekly: 'Varannan vecka',
		},
		ranking: {
			title: 'Rankinglista',
			ratingPeriod: 'Rankingperiod',
			eloType: 'Elo-typ',
			memberType: 'Medlemstyp',
			standard: 'Standard',
			rapid: 'Rapid',
			blitz: 'Blixt',
			all: 'Alla',
			women: 'Kvinnor',
			juniors: 'Juniorer',
			cadets: 'Kadetter',
			veterans: 'Veteraner',
			minors: 'Minorer',
			kids: 'Barn',
			rank: '#',
			titleCol: 'Titel',
			firstName: 'Förnamn',
			lastName: 'Efternamn',
			rating: 'Rating',
			showing: 'Visar',
			players: 'spelare',
			noPlayers: 'Inga spelare hittades.',
			of: 'av',
		},
		common: {
			loading: 'Laddar...',
			save: 'Spara',
			cancel: 'Avbryt',
			confirm: 'Bekräfta',
			delete: 'Ta bort',
			edit: 'Redigera',
			add: 'Lägg till',
		},
	},
};

export function getTranslation( language: Language ): Translations {
	return translations[ language ];
}
