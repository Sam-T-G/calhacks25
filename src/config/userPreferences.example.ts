/**
 * User Preferences Configuration Example
 *
 * This file shows how to configure user preferences for personalized
 * community service activity generation.
 *
 * FUTURE IMPLEMENTATION:
 * - Users will be able to set these preferences through a settings UI
 * - Preferences will be stored in local storage or a backend
 * - Activities will be personalized based on these preferences
 */

import { UserPreferences } from "../types/serve";

/**
 * Example user preferences configuration
 *
 * To use this:
 * 1. Copy this file to `userPreferences.ts`
 * 2. Customize the values below
 * 3. Import and pass to ServeSection component
 */
export const userPreferences: UserPreferences = {
	// Topics and causes the user is interested in
	interests: [
		"environmental conservation",
		"education",
		"animal welfare",
		"food security",
		"homelessness",
	],

	// User's location (can be used to find nearby opportunities)
	location: "San Francisco, CA",

	// Average hours available per week
	availableHours: 5,

	// Preferred days of the week
	preferredDays: ["Saturday", "Sunday"],

	// Specific causes the user cares about
	causes: [
		"Climate Action",
		"Youth Mentorship",
		"Community Gardens",
		"Senior Care",
	],
};

/**
 * Example: Minimal preferences (more diverse activities)
 */
export const minimalPreferences: UserPreferences = {
	location: "San Francisco, CA",
};

/**
 * Example: No preferences (completely random activities)
 */
export const noPreferences: UserPreferences = {};
