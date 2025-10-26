/**
 * User Preferences Configuration
 *
 * Currently using no preferences to generate random diverse activities.
 *
 * To enable personalized activities:
 * 1. Uncomment and customize the preferences below
 * 2. The activities will be tailored to your interests
 */

import { UserPreferences } from "../types/serve";

/**
 * Default: No preferences = Random diverse activities
 *
 * Uncomment and customize to enable personalized activities:
 */
export const userPreferences: UserPreferences = {
	// Uncomment to personalize:
	// interests: ['environment', 'education', 'animals'],
	// location: 'Your City, State',
	// availableHours: 5,
	// preferredDays: ['Saturday', 'Sunday'],
	// causes: ['Climate Action', 'Youth Programs'],
};
