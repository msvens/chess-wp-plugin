<?php
/**
 * Plugin help page.
 *
 * @package Rockaden
 */

namespace Rockaden\Admin;

/**
 * Registers and renders the Rockaden help admin page.
 */
class HelpPage {

	private const PAGE_SLUG = 'rockaden-chess-help';

	/**
	 * Register a hidden admin page (no sidebar entry).
	 */
	public static function register_page(): void {
		add_submenu_page(
			'',
			__( 'Rockaden Help', 'rockaden-chess' ),
			__( 'Help', 'rockaden-chess' ),
			'edit_posts',
			self::PAGE_SLUG,
			[ self::class, 'render' ]
		);
	}

	/**
	 * Render the help page.
	 */
	public static function render(): void {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return;
		}
		?>
		<div class="wrap">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>

			<p>
				This page describes the features provided by the <strong>Rockaden Chess</strong> plugin:
				training management, calendar events, SSF integration, and Gutenberg blocks.
			</p>

			<hr />

			<?php
			self::render_overview();
			self::render_training();
			self::render_events();
			self::render_blocks();
			self::render_settings();
			?>
		</div>
		<?php
	}

	/**
	 * Overview section.
	 */
	private static function render_overview(): void {
		?>
		<h2>Overview</h2>
		<p>
			Rockaden Chess adds chess-club features to WordPress:
		</p>
		<ul>
			<li><strong>Training system</strong> &mdash; manage groups, participants, sessions, round-robin tournaments, and attendance.</li>
			<li><strong>Calendar events</strong> &mdash; create one-off or recurring events with category filtering.</li>
			<li><strong>SSF integration</strong> &mdash; proxy to the Swedish Chess Federation API for ratings, rankings, and event import.</li>
			<li><strong>Gutenberg blocks</strong> &mdash; embed calendars, standings, and training info in any page or post.</li>
		</ul>
		<?php
	}

	/**
	 * Training system section.
	 */
	private static function render_training(): void {
		?>
		<h2>Training System</h2>
		<p>
			The training manager is accessible from <strong>Rockaden &rarr; Training</strong> in the admin sidebar.
			It provides a single-page interface for managing groups, participants, and sessions.
		</p>

		<h3>Groups</h3>
		<p>
			A training group represents a recurring training activity (e.g. "Monday juniors").
			Each group has a name, optional description, schedule, location, and can be linked to a calendar event.
			You can also link a group to an <strong>SSF Tournament Group ID</strong> to pull tournament
			data (pairings, results, standings) directly from <code>member.schack.se</code>.
		</p>
		<table class="widefat striped">
			<thead>
				<tr>
					<th>Action</th>
					<th>Description</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Create group</td>
					<td>Click <em>Create Group</em> on the training page. Fill in name, schedule, and location. Optionally enter an SSF Tournament Group ID and click <em>Fetch from SSF</em> to import tournament data.</td>
				</tr>
				<tr>
					<td>Edit group</td>
					<td>Click a group name to open its detail view, then click <em>Edit</em>.</td>
				</tr>
				<tr>
					<td>Delete group</td>
					<td>Click <em>Delete</em> in the group detail view. This also removes all sessions.</td>
				</tr>
			</tbody>
		</table>

		<h3>Participants</h3>
		<p>
			Each group has a list of participants. Participants can be linked to SSF player IDs for
			automatic rating lookups. Use <em>Add Participant</em> in the group detail view.
		</p>

		<h3>Sessions</h3>
		<p>
			A session represents one meeting of a group. Sessions track:
		</p>
		<ul>
			<li><strong>Attendance</strong> &mdash; mark which participants were present.</li>
			<li><strong>Games</strong> &mdash; record round-robin pairings and results (generated using the Berger method).</li>
			<li><strong>Notes</strong> &mdash; free-text notes for the session.</li>
		</ul>
		<?php
	}

	/**
	 * Events section.
	 */
	private static function render_events(): void {
		?>
		<h2>Events</h2>
		<p>
			Events are managed under <strong>Events</strong> in the admin sidebar. Each event has a title,
			start/end date, optional location, URL, description, and a category.
		</p>

		<h3>Categories</h3>
		<table class="widefat striped">
			<thead>
				<tr>
					<th>Category</th>
					<th>Use for</th>
				</tr>
			</thead>
			<tbody>
				<tr><td>training</td><td>Regular training sessions</td></tr>
				<tr><td>tournament</td><td>Club or external tournaments</td></tr>
				<tr><td>meeting</td><td>Board meetings, annual meetings</td></tr>
				<tr><td>social</td><td>Social events, dinners</td></tr>
				<tr><td>other</td><td>Anything else</td></tr>
			</tbody>
		</table>

		<h3>Recurring Events</h3>
		<p>
			Events can recur <strong>weekly</strong> or <strong>biweekly</strong>. Set the recurrence
			pattern and an end date. The plugin automatically expands recurring events into individual
			occurrences when queried via the REST API or displayed in the calendar block.
		</p>
		<p>
			<strong>Excluded dates:</strong> You can exclude specific dates from a recurring series
			(e.g. holidays). Use the date picker in the event editor to add exclusions.
		</p>

		<h3>SSF Event Import</h3>
		<p>
			When editing an event, you can import event data from the SSF calendar. Click <em>Import SSF Event</em>
			in the event editor sidebar to search for and import events from <code>member.schack.se</code>.
			The imported data populates the event title, dates, and URL.
		</p>
		<?php
	}

	/**
	 * Blocks section.
	 */
	private static function render_blocks(): void {
		?>
		<h2>Gutenberg Blocks</h2>
		<p>
			The plugin provides five blocks, all found under the <strong>Rockaden</strong> category
			in the block inserter.
		</p>

		<table class="widefat striped">
			<thead>
				<tr>
					<th>Block</th>
					<th>Description</th>
					<th>Typical usage</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><strong>Calendar</strong></td>
					<td>Displays a monthly calendar with events. Supports category filtering and navigation between months. Server-rendered with React hydration for interactivity.</td>
					<td>Club calendar page</td>
				</tr>
				<tr>
					<td><strong>Ranking List</strong></td>
					<td>Shows SSF player ratings for club members. Fetches data from the SSF API using the configured club ID.</td>
					<td>Rankings or members page</td>
				</tr>
				<tr>
					<td><strong>Standings</strong></td>
					<td>Displays tournament standings from a training group's round-robin sessions. Select which group to show.</td>
					<td>Training group detail page</td>
				</tr>
				<tr>
					<td><strong>Training Group</strong></td>
					<td>Shows details for a single training group: schedule, participants, and upcoming sessions.</td>
					<td>Dedicated group page</td>
				</tr>
				<tr>
					<td><strong>Training Groups</strong></td>
					<td>Lists all training groups with summary information.</td>
					<td>Training overview page</td>
				</tr>
			</tbody>
		</table>
		<?php
	}

	/**
	 * Settings section.
	 */
	private static function render_settings(): void {
		$settings_url = admin_url( 'options-general.php?page=rockaden-chess-settings' );
		?>
		<h2>Settings</h2>
		<p>
			Plugin settings are located at
			<a href="<?php echo esc_url( $settings_url ); ?>">Settings &rarr; Rockaden</a>.
		</p>

		<table class="widefat striped">
			<thead>
				<tr>
					<th>Setting</th>
					<th>Description</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><strong>SSF Club ID</strong></td>
					<td>
						Your club's ID on <code>member.schack.se</code>. Required for the ranking list block
						and SSF event import. Find it in the URL when viewing your club on the SSF website.
					</td>
				</tr>
			</tbody>
		</table>
		<?php
	}
}
