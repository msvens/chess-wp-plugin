/**
 * Which fields the two overview blocks render.
 *
 * An overview exists to let you scan many items, so not every field is on
 * offer: participant names, and a tournament's invitation / registration /
 * schedule text, would each turn one card into a wall of text and defeat the
 * component. Those are not toggleable at all rather than off by default.
 *
 * showParticipantCount can only ever *subtract*. Whether participants are public
 * is the owner's decision on the group or tournament itself
 * (`rc_show_participants`); this toggle lets a page author additionally hide the
 * count on a crowded overview. The two are ANDed, never ORed, so an overview can
 * never reveal a count the owner has hidden — see participantsVisible().
 *
 * The participant *names* are not on offer at any setting: they only ever appear
 * on the item's own detail page, which these blocks do not render.
 *
 * Defaults reproduce what the cards rendered before these toggles existed, so
 * blocks already placed on a page are unchanged. Keys match the block.json
 * attribute names exactly — one vocabulary end to end, so there is no mapping
 * between PHP and the client that could drift.
 */

export interface TrainingGroupFields {
	showDescription: boolean;
	showSchedule: boolean;
	showSemester: boolean;
	showLocation: boolean;
	showTrainers: boolean;
	showContact: boolean;
	showStatus: boolean;
	showParticipantCount: boolean;
}

export interface TournamentFields {
	showStatus: boolean;
	showCategory: boolean;
	showDates: boolean;
	showDescription: boolean;
	showSsfBadge: boolean;
	showLocation: boolean;
	showTimeControl: boolean;
	showParticipantCount: boolean;
}

export const TRAINING_GROUP_FIELD_DEFAULTS: TrainingGroupFields = {
	showDescription: true,
	showSchedule: true,
	showSemester: true,
	showLocation: false,
	showTrainers: false,
	showContact: false,
	showStatus: false,
	showParticipantCount: true,
};

export const TOURNAMENT_FIELD_DEFAULTS: TournamentFields = {
	showStatus: true,
	showCategory: true,
	showDates: true,
	showDescription: true,
	showSsfBadge: true,
	showLocation: false,
	showTimeControl: false,
	showParticipantCount: true,
};

/**
 * Read the `data-fields` JSON a block's render.php emits.
 *
 * Anything missing or malformed falls back to the defaults, so a block saved
 * before a field existed keeps rendering exactly as it did.
 *
 * @param raw      The attribute value, or undefined when absent.
 * @param defaults The field set for this block.
 * @return A complete field set.
 */
export function parseFields< T extends object >(
	raw: string | undefined,
	defaults: T
): T {
	if ( ! raw ) {
		return { ...defaults };
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse( raw );
	} catch {
		return { ...defaults };
	}

	if ( ! parsed || typeof parsed !== 'object' || Array.isArray( parsed ) ) {
		return { ...defaults };
	}

	const source = parsed as Record< string, unknown >;
	const result = { ...defaults } as Record< string, unknown >;
	for ( const key of Object.keys( defaults ) ) {
		if ( typeof source[ key ] === 'boolean' ) {
			result[ key ] = source[ key ];
		}
	}
	return result as T;
}
