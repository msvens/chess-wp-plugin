import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import './event-metabox.css';
import apiFetch from '@wordpress/api-fetch';
import type {
	SsfTournament,
	SsfTournamentGroup,
	SsfTournamentClass,
	SsfLocalTime,
} from '../shared/ssfTypes';

const BASE = 'rockaden/v1';
const RESULTS_BASE = 'https://chess.msvens.com/results';

let fpStart: flatpickr.Instance | undefined;
let fpEnd: flatpickr.Instance | undefined;

function collectGroups(
	rootClasses: SsfTournamentClass[]
): SsfTournamentGroup[] {
	const result: SsfTournamentGroup[] = [];
	const walk = ( classes: SsfTournamentClass[] ) => {
		for ( const cls of classes ) {
			result.push( ...cls.groups );
			walk( cls.subClasses );
		}
	};
	walk( rootClasses );
	return result;
}

function ssfDateTimeToFlatpickr(
	dateStr: string,
	time?: SsfLocalTime | null
): string {
	if ( ! dateStr ) {
		return '';
	}
	const datePart = dateStr.slice( 0, 10 );
	if ( time ) {
		const h = String( time.hour ).padStart( 2, '0' );
		const m = String( time.minute ).padStart( 2, '0' );
		return `${ datePart } ${ h }:${ m }`;
	}
	return `${ datePart } 00:00`;
}

function escHtml( str: string ): string {
	const div = document.createElement( 'div' );
	div.textContent = str;
	return div.innerHTML;
}

/**
 * Insert an HTML link into the wp_editor (TinyMCE) description field.
 * Appends on a new line so multiple links can be added.
 *
 * @param url   The URL for the link.
 * @param label The visible link text.
 */
function insertLinkToEditor( url: string, label: string ): void {
	const linkHtml = `<a href="${ url }">→ ${ escHtml( label ) }</a>`;
	const editorId = 'rc_description';

	// Try TinyMCE (visual tab)
	const editor =
		typeof window.tinymce !== 'undefined'
			? window.tinymce.get( editorId )
			: null;

	if ( editor && ! editor.isHidden() ) {
		const existing = editor.getContent().trim();
		const separator = existing ? '\n' : '';
		editor.setContent( existing + separator + linkHtml );
		return;
	}

	// Fallback: text/HTML tab — append to textarea
	const textarea = document.getElementById(
		editorId
	) as HTMLTextAreaElement | null;
	if ( textarea ) {
		const existing = textarea.value.trim();
		const separator = existing ? '\n' : '';
		textarea.value = existing + separator + linkHtml;
	}
}

function applyToForm( tournament: SsfTournament ): void {
	// Title — always just tournament name
	const titleInput = document.getElementById(
		'title'
	) as HTMLInputElement | null;
	if ( titleInput && tournament.name ) {
		titleInput.value = tournament.name;
	}

	// Dates — tournament level
	if ( tournament.start && fpStart ) {
		fpStart.setDate( ssfDateTimeToFlatpickr( tournament.start ), true );
	}
	if ( tournament.end && fpEnd ) {
		fpEnd.setDate( ssfDateTimeToFlatpickr( tournament.end ), true );
	}

	// Location
	const locationInput = document.getElementById(
		'rc_location'
	) as HTMLInputElement | null;
	if ( locationInput ) {
		const parts = [ tournament.city, tournament.arena ].filter( Boolean );
		if ( parts.length ) {
			locationInput.value = parts.join( ', ' );
		}
	}

	// Category
	const categorySelect = document.getElementById(
		'rc_category'
	) as HTMLSelectElement | null;
	if ( categorySelect ) {
		categorySelect.value = 'tournament';
	}

	// Link — invitation URL
	const linkInput = document.getElementById(
		'rc_link'
	) as HTMLInputElement | null;
	if ( linkInput && tournament.invitationurl ) {
		linkInput.value = tournament.invitationurl;
	}

	const linkLabelInput = document.getElementById(
		'rc_link_label'
	) as HTMLInputElement | null;
	if ( linkLabelInput && tournament.invitationurl ) {
		linkLabelInput.value = 'Inbjudan';
	}

	// Recurring — uncheck
	const recurringCb = document.getElementById(
		'rc_is_recurring'
	) as HTMLInputElement | null;
	if ( recurringCb && recurringCb.checked ) {
		recurringCb.checked = false;
		recurringCb.dispatchEvent( new Event( 'change' ) );
	}

	// SSF IDs
	const ssfTournamentInput = document.getElementById(
		'rc_ssf_tournament_id'
	) as HTMLInputElement | null;
	if ( ssfTournamentInput ) {
		ssfTournamentInput.value = String( tournament.id );
	}
}

function renderPreview(
	tournament: SsfTournament,
	matchedGroupId: number | null,
	container: HTMLElement
): void {
	const groups = collectGroups( tournament.rootClasses );

	let html = '<div class="rc-ssf-preview-card">';
	html += `<div class="rc-ssf-preview-field"><strong>Tournament:</strong> ${ escHtml(
		tournament.name
	) }</div>`;

	if ( tournament.city || tournament.arena ) {
		const loc = [ tournament.city, tournament.arena ]
			.filter( Boolean )
			.join( ', ' );
		html += `<div class="rc-ssf-preview-field"><strong>Location:</strong> ${ escHtml(
			loc
		) }</div>`;
	}

	html += `<div class="rc-ssf-preview-field"><strong>Dates:</strong> ${ escHtml(
		tournament.start?.slice( 0, 10 ) || ''
	) } — ${ escHtml( tournament.end?.slice( 0, 10 ) || '' ) }</div>`;

	if ( tournament.invitationurl ) {
		html += `<div class="rc-ssf-preview-field"><strong>Invitation:</strong> ${ escHtml(
			tournament.invitationurl
		) }</div>`;
	}

	// Apply button for tournament-level fields
	html += `<div class="rc-ssf-preview-actions">`;
	html += `<button type="button" class="button button-primary rc-ssf-apply-btn">Apply</button>`;
	html += `</div>`;

	// Groups with "Add Link" buttons
	if ( groups.length > 0 ) {
		html += `<div class="rc-ssf-groups-list">`;
		html += `<div class="rc-ssf-preview-field"><strong>Groups:</strong></div>`;
		for ( const g of groups ) {
			const dates = `${ g.start?.slice( 0, 10 ) || '?' } — ${
				g.end?.slice( 0, 10 ) || '?'
			}`;
			const isMatched = g.id === matchedGroupId;
			html += `<div class="rc-ssf-group-item">`;
			html += `<span>${ escHtml( g.name ) } <small>(${ escHtml(
				dates
			) })</small></span>`;
			html += `<button type="button" class="button button-small rc-ssf-add-link-btn" data-group-id="${
				g.id
			}" data-group-name="${ escHtml( g.name ) }">${
				isMatched ? 'Add Link *' : 'Add Link'
			}</button>`;
			html += `</div>`;
		}
		html += `</div>`;
	}

	html += '</div>';
	container.innerHTML = html;

	// Wire up Apply button
	const applyBtn =
		container.querySelector< HTMLButtonElement >( '.rc-ssf-apply-btn' );
	if ( applyBtn ) {
		applyBtn.addEventListener( 'click', () => {
			applyToForm( tournament );

			// Also store SSF group ID if we matched one
			if ( matchedGroupId ) {
				const ssfGroupInput = document.getElementById(
					'rc_ssf_group_id'
				) as HTMLInputElement | null;
				if ( ssfGroupInput ) {
					ssfGroupInput.value = String( matchedGroupId );
				}
			}
		} );
	}

	// Wire up Add Link buttons
	container
		.querySelectorAll< HTMLButtonElement >( '.rc-ssf-add-link-btn' )
		.forEach( ( btn ) => {
			btn.addEventListener( 'click', () => {
				const gid = btn.dataset.groupId;
				const gname = btn.dataset.groupName || '';
				const url = `${ RESULTS_BASE }/${ tournament.id }/${ gid }`;
				insertLinkToEditor( url, gname );
				btn.textContent = 'Added!';
				btn.disabled = true;
			} );
		} );
}

async function handleSsfFetch(
	mode: 'group' | 'tournament',
	preview: HTMLElement
): Promise< void > {
	const input = document.getElementById(
		'rc_ssf_lookup_id'
	) as HTMLInputElement | null;
	if ( ! input ) {
		return;
	}

	const id = parseInt( input.value, 10 );
	if ( ! id || id <= 0 ) {
		preview.innerHTML =
			'<p class="rc-ssf-error">Enter a valid numeric ID.</p>';
		return;
	}

	preview.innerHTML = '<p>Fetching…</p>';

	const endpoint =
		mode === 'group'
			? `${ BASE }/ssf/tournament/group/id/${ id }`
			: `${ BASE }/ssf/tournament/tournament/id/${ id }`;

	try {
		const tournament: SsfTournament = await apiFetch( {
			path: endpoint,
		} );
		if ( tournament && tournament.id ) {
			renderPreview( tournament, mode === 'group' ? id : null, preview );
			return;
		}
		preview.innerHTML =
			'<p class="rc-ssf-error">No tournament data found.</p>';
	} catch {
		preview.innerHTML =
			'<p class="rc-ssf-error">Could not fetch data from SSF. Check the ID and try again.</p>';
	}
}

document.addEventListener( 'DOMContentLoaded', () => {
	const opts: flatpickr.Options.Options = {
		enableTime: true,
		time_24hr: true,
		dateFormat: 'Y-m-d H:i',
		allowInput: true,
	};

	const startInstances = flatpickr( '#rc_start_date', opts );
	const endInstances = flatpickr( '#rc_end_date', opts );
	fpStart = Array.isArray( startInstances )
		? startInstances[ 0 ]
		: startInstances;
	fpEnd = Array.isArray( endInstances ) ? endInstances[ 0 ] : endInstances;

	// Recurrence toggle.
	const cb = document.getElementById(
		'rc_is_recurring'
	) as HTMLInputElement | null;
	const recurrenceFields = document.getElementById( 'rc-recurrence-fields' );
	const excludedField = document.getElementById( 'rc-excluded-dates-field' );

	if ( cb ) {
		cb.addEventListener( 'change', () => {
			const show = cb.checked;
			if ( recurrenceFields ) {
				recurrenceFields.style.display = show ? '' : 'none';
			}
			if ( excludedField ) {
				excludedField.style.display = show ? '' : 'none';
			}
		} );
	}

	// SSF Import
	const fetchGroupBtn = document.getElementById( 'rc-ssf-fetch-group-btn' );
	const fetchTournamentBtn = document.getElementById(
		'rc-ssf-fetch-tournament-btn'
	);
	const preview = document.getElementById( 'rc-ssf-preview' );

	if ( preview ) {
		if ( fetchGroupBtn ) {
			fetchGroupBtn.addEventListener( 'click', () => {
				handleSsfFetch( 'group', preview );
			} );
		}
		if ( fetchTournamentBtn ) {
			fetchTournamentBtn.addEventListener( 'click', () => {
				handleSsfFetch( 'tournament', preview );
			} );
		}
	}
} );
