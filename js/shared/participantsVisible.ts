// Whether a participant count / list should be shown publicly. Shared by
// training groups and tournaments so the two cannot drift apart.

/**
 * Two reasons to show nothing:
 *
 *  - the owner turned the list off — "0 deltagare" would read as "nobody is in
 *    this group" rather than "you can't see who is", which is the opposite of
 *    what the toggle is for;
 *  - there is nobody in it — a newly created group should not advertise that
 *    no one has signed up.
 *
 * `undefined` counts as visible, matching the server's rule that groups saved
 * before the toggle existed stay public.
 *
 * @param showParticipants The group's/tournament's visibility toggle.
 * @param activeCount      Number of active participants.
 * @return Whether to render a count or a participants list.
 */
export function participantsVisible(
	showParticipants: boolean | undefined,
	activeCount: number
): boolean {
	if ( showParticipants === false ) {
		return false;
	}
	return activeCount > 0;
}
