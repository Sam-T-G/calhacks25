import { useState, useEffect } from "react";
import { Home } from "./components/Home";
import { ServeSection } from "./components/ServeSection";
import { ProductivitySection } from "./components/ProductivitySection";
import { SelfImproveSection } from "./components/SelfImproveSection";
import { ShopSection } from "./components/ShopSection";
import { UserStats } from "./components/UserStats";
import { VoiceAssistant } from "./components/VoiceAssistant";
import { Toaster } from "./components/ui/sonner";
import { userPreferences } from "./config/userPreferences";
import { contextService } from "./services/contextService";

export type Section =
	| "home"
	| "serve"
	| "productivity"
	| "self-improve"
	| "shop"
	| "stats";

export default function App() {
	const [currentSection, setCurrentSection] = useState<Section>("home");
	const [xpPoints, setXpPoints] = useState(2450);
	const [isVoiceAssistantActive, setIsVoiceAssistantActive] = useState(false);

	// Track page navigation
	useEffect(() => {
		const pageName =
			currentSection.charAt(0).toUpperCase() + currentSection.slice(1);
		contextService.trackPageVisit(pageName);
	}, [currentSection]);

	// Track voice assistant sessions
	useEffect(() => {
		if (isVoiceAssistantActive) {
			contextService.logActivity(
				"voice_session_started",
				"Started DoGood Companion voice session"
			);
		}
	}, [isVoiceAssistantActive]);

	const addXP = (points: number) => {
		setXpPoints((prev) => prev + points);
		const newTotal = xpPoints + points;
		contextService.getContext().totalXP = newTotal;
	};

	const spendXP = (points: number) => {
		if (xpPoints >= points) {
			setXpPoints((prev) => prev - points);
			return true;
		}
		return false;
	};

	// Handle voice navigation
	const handleVoiceNavigation = (section: Section) => {
		console.log("[App] Voice navigation to:", section);
		setCurrentSection(section);
	};

	// Handle voice-triggered actions from Claude orchestration
	const executeVoiceAction = (action: any) => {
		console.log("[App] Executing voice action:", action);

		switch (action.type) {
			case "generate_activities":
				// Activities will be auto-generated when navigating to serve section
				console.log("[App] Triggering activity generation");
				break;

			case "start_timer":
				// Navigate to productivity and timer will be available
				if (action.params?.minutes) {
					console.log(`[App] Starting ${action.params.minutes} minute timer`);
					setCurrentSection("productivity");
				}
				break;

			case "generate_self_improve":
				// Self-improve activities will be available on that page
				console.log("[App] Triggering self-improve generation");
				setCurrentSection("self-improve");
				break;

			case "update_preferences":
				// Context service handles this automatically
				console.log("[App] Preferences updated via context service");
				break;

			case "refresh_activities":
				// Force re-render of current section
				console.log("[App] Refreshing activities");
				break;

			default:
				console.log(`[App] Unknown action type: ${action.type}`);
		}
	};

	const renderSection = () => {
		switch (currentSection) {
			case "home":
				return (
					<Home
						xpPoints={xpPoints}
						onNavigate={handleVoiceNavigation}
						onVoiceAssistant={() => setIsVoiceAssistantActive(true)}
					/>
				);
			case "serve":
				return (
					<ServeSection
						onBack={() => setCurrentSection("home")}
						onEarnXP={addXP}
						userPreferences={userPreferences}
					/>
				);
			case "productivity":
				return (
					<ProductivitySection
						onBack={() => setCurrentSection("home")}
						onEarnXP={addXP}
					/>
				);
			case "self-improve":
				return (
					<SelfImproveSection
						onBack={() => setCurrentSection("home")}
						onEarnXP={addXP}
					/>
				);
			case "shop":
				return (
					<ShopSection
						xpPoints={xpPoints}
						onBack={() => setCurrentSection("home")}
						onSpendXP={spendXP}
					/>
				);
			case "stats":
				return (
					<UserStats
						xpPoints={xpPoints}
						onBack={() => setCurrentSection("home")}
					/>
				);
			default:
				return (
					<Home
						xpPoints={xpPoints}
						onNavigate={handleVoiceNavigation}
						onVoiceAssistant={() => setIsVoiceAssistantActive(true)}
					/>
				);
		}
	};

	return (
		<>
			<style>{`
				html, body {
					background-color: #E8DC93;
					overscroll-behavior: contain;
				}
			`}</style>
			<div
				className="min-h-screen relative"
				style={{ backgroundColor: "#E8DC93" }}>
				{renderSection()}
				<VoiceAssistant
					isActive={isVoiceAssistantActive}
					onClose={() => setIsVoiceAssistantActive(false)}
					onNavigate={handleVoiceNavigation}
					onExecuteAction={executeVoiceAction}
				/>
				<Toaster />
			</div>
		</>
	);
}
