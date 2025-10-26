// Types for Serve Section Activities

export interface CommunityOpportunity {
	id: string;
	title: string;
	location: string;
	distance: string;
	xp: number;
	duration: string;
	date: string;
	time: string;
	requiresMultiple?: boolean; // If true, requires multiple completions
	totalRequired?: number; // Total number of completions needed
	progressDescription?: string; // e.g., "cans recycled", "meals served"
}

export interface CrisisAlert {
	id: string;
	title: string;
	urgency: "high" | "medium" | "low";
	location: string;
	xp: number;
	volunteers: number;
	date: string;
	time: string;
	requiresMultiple?: boolean;
	totalRequired?: number;
	progressDescription?: string;
}

export interface MiniGame {
	id: string;
	title: string;
	description: string;
	xp: number;
	icon: string;
	date: string;
	time: string;
	requiresMultiple?: boolean;
	totalRequired?: number;
	progressDescription?: string;
}

export interface ServeActivities {
	communityOpportunities: CommunityOpportunity[];
	crisisAlerts: CrisisAlert[];
	miniGames: MiniGame[];
}

export interface UserPreferences {
	interests?: string[];
	location?: string;
	availableHours?: number;
	preferredDays?: string[];
	causes?: string[];
}
