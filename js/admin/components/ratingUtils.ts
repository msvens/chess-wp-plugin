import type { Translations } from '../../shared';
import type { SsfRatingInfo } from '../types';

export function ratingForTimeControl(
	r: SsfRatingInfo,
	timeControl: string
): number {
	switch ( timeControl ) {
		case 'rapid':
			return r.rapidRating;
		case 'blitz':
			return r.blitzRating;
		default:
			return r.rating;
	}
}

export function ratingLabel( timeControl: string, t: Translations ): string {
	switch ( timeControl ) {
		case 'rapid':
			return t.training.rapid;
		case 'blitz':
			return t.training.blitz;
		default:
			return t.training.classical;
	}
}
