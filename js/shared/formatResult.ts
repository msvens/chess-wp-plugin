/**
 * Rendering of SDK result codes into display strings.
 *
 * The SDK hands back structure (`ParsedResultDisplay`: numeric scores plus a
 * `kind`); the labels and the score formatting are ours, so they can be
 * translated and stay consistent across every view that shows a result.
 *
 * Mirrors sthlmschack-reimagined's `src/lib/results/formatResult.ts` so the
 * official results read the same in both places.
 *
 * `w.o` is deliberately NOT translated — it is universal chess notation.
 */
import {
	parseResultDisplay,
	resolveIndividualResult,
	type ParsedResultDisplay,
	type TournamentRoundResultDto,
} from '@msvens/schack-se-sdk';
import type { Translations } from './translations';

/** Universal chess notation for a walkover — intentionally not translated. */
const WALKOVER_SUFFIX = 'w.o';

export interface ResultLabels {
	/** Standalone label for a postponed game (it has no score). */
	postponed: string;
	/** Suffix for an adjudicated result, e.g. "0 - 0 domslut". */
	adjudicated: string;
	/** Suffix for a half-point tourist bye, e.g. "½ Frirond". */
	bye: string;
	/** Shown when there is no usable result. */
	noResult: string;
}

/**
 * Collect the result labels from a translation bundle.
 *
 * @param t The `training` translation block.
 */
export function getResultLabels( t: Translations[ 'training' ] ): ResultLabels {
	return {
		postponed: t.postponed,
		adjudicated: t.adjudicated,
		bye: t.bye,
		noResult: '—',
	};
}

/**
 * Render a point value: half points as ½, everything else as-is.
 *
 * @param points Points in the result's own point system.
 */
export function formatScore( points: number ): string {
	return points === 0.5 ? '½' : String( points );
}

/**
 * Render a parsed result. Scores come from the SDK as numbers in the result's
 * own point system, so this works unchanged for Schackfyran (3-2-1) and the
 * 3-1-0 system.
 *
 * @param parsed The SDK's structured result.
 * @param labels Translated labels.
 */
export function formatResult(
	parsed: ParsedResultDisplay,
	labels: ResultLabels
): string {
	const { home, away, kind } = parsed;

	if ( kind === 'postponed' ) {
		return labels.postponed;
	}
	// 'none' means NOT_SET, an unknown code, or a 0-0 points fallback.
	if ( kind === 'none' || home === null || away === null ) {
		return labels.noResult;
	}

	// A tourist bye is one-sided: the player is awarded the draw value, there is
	// no opponent score to show.
	if ( kind === 'tourist_bye' ) {
		return `${ formatScore( home ) } ${ labels.bye }`;
	}

	const score = `${ formatScore( home ) } - ${ formatScore( away ) }`;
	if ( kind === 'walkover' ) {
		return `${ score } ${ WALKOVER_SUFFIX }`;
	}
	if ( kind === 'adjudicated' ) {
		return `${ score } ${ labels.adjudicated }`;
	}
	return score;
}

/**
 * Render a single result code (one game/board).
 *
 * @param resultCode The SSF result code.
 * @param labels     Translated labels.
 */
export function formatResultCode(
	resultCode: number,
	labels: ResultLabels
): string {
	return formatResult( parseResultDisplay( resultCode ), labels );
}

/**
 * Render an individually-paired round row.
 *
 * Prefers the game's result code and falls back to the row's points when that
 * code is `NOT_SET` or unknown — so a legitimately zero result (a double
 * forfeit, an adjudicated 0-0) is no longer flattened to a dash.
 *
 * Do not pass a team match row — team tournaments link out instead of being
 * rendered here.
 *
 * @param row    The round-result row.
 * @param labels Translated labels.
 */
export function formatIndividualRowResult(
	row: Pick<
		TournamentRoundResultDto,
		'homeResult' | 'awayResult' | 'games'
	>,
	labels: ResultLabels
): string {
	return formatResult( resolveIndividualResult( row ), labels );
}
