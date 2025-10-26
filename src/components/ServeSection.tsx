import React, { useState, useEffect, useCallback } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import {
	ArrowLeft,
	MapPin,
	AlertCircle,
	Clock,
	Calendar,
	RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import { PhotoVerification } from "./PhotoVerification";
import { claudeService } from "../services/claudeService";
import { ServeActivities, UserPreferences } from "../types/serve";
import dgLogo from "../assets/images/dglogo.png";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "./ui/alert-dialog";

interface ServeSectionProps {
	onBack: () => void;
	onEarnXP: (points: number) => void;
	userPreferences?: UserPreferences;
}

export function ServeSection({
	onBack,
	onEarnXP,
	userPreferences,
}: ServeSectionProps) {
	const [completedActivities, setCompletedActivities] = useState<Set<string>>(
		new Set()
	);
	const [activityProgress, setActivityProgress] = useState<Map<string, number>>(
		new Map()
	);
	const [activities, setActivities] = useState<ServeActivities | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isRegenerating, setIsRegenerating] = useState(false);
	const [pullDistance, setPullDistance] = useState(0);
	const [isPulling, setIsPulling] = useState(false);
	const [startY, setStartY] = useState(0);
	const [signedUpActivities, setSignedUpActivities] = useState<Set<string>>(
		new Set()
	);
	const [volunteerCounts, setVolunteerCounts] = useState<Map<string, number>>(
		new Map()
	);

	// Memoize loadActivities to prevent unnecessary re-renders
	const loadActivities = useCallback(async () => {
		setIsLoading(true);
		try {
			const generatedActivities = await claudeService.generateServeActivities(
				userPreferences
			);
			setActivities(generatedActivities);
		} catch (error) {
			console.error("Error loading activities:", error);
			toast.error("Failed to load activities", {
				description: "Please try again.",
			});
		} finally {
			setIsLoading(false);
		}
	}, [userPreferences]);

	// Load activities on mount
	useEffect(() => {
		loadActivities();
	}, [loadActivities]);

	const handleRegenerate = async () => {
		setIsRegenerating(true);
		try {
			const generatedActivities = await claudeService.generateServeActivities(
				userPreferences
			);
			setActivities(generatedActivities);
			toast.success("Activities refreshed!", {
				description: "New opportunities generated.",
			});
		} catch (error) {
			console.error("Error regenerating activities:", error);
			toast.error("Failed to refresh activities", {
				description: "Please try again.",
			});
		} finally {
			setIsRegenerating(false);
		}
	};

	// Pull-to-refresh functionality
	const handleTouchStart = (e: React.TouchEvent) => {
		const scrollElement = document.documentElement;
		const atBottom =
			scrollElement.scrollHeight - scrollElement.scrollTop <=
			scrollElement.clientHeight + 50;

		if (atBottom) {
			setStartY(e.touches[0].clientY);
			setIsPulling(true);
		}
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		if (!isPulling || isRegenerating) return;

		const currentY = e.touches[0].clientY;
		const distance = startY - currentY;

		if (distance > 0) {
			setPullDistance(Math.min(distance, 100));
		}
	};

	const handleTouchEnd = () => {
		if (isPulling && pullDistance >= 60 && !isRegenerating) {
			handleRegenerate();
		}

		setIsPulling(false);
		setPullDistance(0);
		setStartY(0);
	};

	const handleComplete = (
		id: string,
		scaledXP: number,
		requiresMultiple?: boolean,
		totalRequired?: number
	) => {
		if (requiresMultiple && totalRequired) {
			// Update progress
			const currentProgress = activityProgress.get(id) || 0;
			const newProgress = currentProgress + 1;

			setActivityProgress(new Map(activityProgress.set(id, newProgress)));

			// Award scaled XP for this completion
			onEarnXP(scaledXP);

			// Check if fully completed
			if (newProgress >= totalRequired) {
				setCompletedActivities(new Set(completedActivities).add(id));
				toast.success("Activity Fully Completed!", {
					description: `All ${totalRequired} completed! Amazing work!`,
				});
			}
			// Don't show toast here - the success dialog handles it
		} else {
			// Single completion - award full XP
			setCompletedActivities(new Set(completedActivities).add(id));
			onEarnXP(scaledXP);
		}
	};

	const handleSignUp = (
		id: string,
		volunteersNeeded: number,
		title: string
	) => {
		if (signedUpActivities.has(id)) {
			toast.error("Already signed up", {
				description: "You've already signed up for this opportunity!",
			});
			return;
		}

		const newCount = Math.max(0, volunteersNeeded - 1);
		setVolunteerCounts(new Map(volunteerCounts.set(id, newCount)));
		setSignedUpActivities(new Set(signedUpActivities).add(id));

		toast.success("Signed up successfully!", {
			description: `You're registered for ${title}`,
		});
	};

	// Filter out completed items
	const communityOpportunities =
		activities?.communityOpportunities.filter(
			(opp) => !completedActivities.has(opp.id)
		) || [];
	const crisisAlerts =
		activities?.crisisAlerts.filter(
			(alert) => !completedActivities.has(alert.id)
		) || [];
	const miniGames =
		activities?.miniGames.filter((game) => !completedActivities.has(game.id)) ||
		[];

	return (
		<div
			className="min-h-screen relative"
			style={{ backgroundColor: "#E8DC93" }}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}>
			{/* Vintage Paper Texture Overlay */}
			<div
				className="absolute inset-0 opacity-[0.15] pointer-events-none"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
					mixBlendMode: "multiply",
				}}
			/>

			{/* Fixed Header */}
			<div
				className="fixed top-0 left-0 right-0 z-50 px-6 md:px-8 py-4"
				style={{
					backgroundColor: "#E8DC93",
					boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
				}}>
				<div className="max-w-4xl mx-auto flex items-center justify-between">
					<Button
						variant="ghost"
						onClick={onBack}
						className="-ml-2 hover:bg-white/20"
						style={{
							color: "#405169",
							fontFamily: "Cooper Black, Cooper Std, serif",
							fontWeight: 700,
						}}>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back
					</Button>

					<div className="flex-1 text-center">
						<h1
							style={{
								fontFamily: "Cooper Black, Cooper Std, serif",
								fontWeight: 900,
								fontSize: "28px",
								color: "#405169",
								marginBottom: "2px",
							}}>
							Serve
						</h1>
						<p
							className="text-xs opacity-70"
							style={{
								fontFamily: "Cooper Black, Cooper Std, serif",
								color: "#405169",
								marginTop: "0",
							}}>
							Make a positive impact
						</p>
					</div>

					<AlertDialog>
						<AlertDialogTrigger asChild>
							<button className="cursor-pointer hover:opacity-80 transition-opacity">
								<img
									src={dgLogo}
									alt="DoGood Logo"
									className="h-12 w-auto drop-shadow-md"
								/>
							</button>
						</AlertDialogTrigger>
						<AlertDialogContent className="max-w-md">
							<AlertDialogHeader>
								<AlertDialogTitle
									style={{
										fontFamily: "Cooper Black, Cooper Std, serif",
										color: "#405169",
									}}>
									Return to Home?
								</AlertDialogTitle>
								<AlertDialogDescription
									style={{
										fontFamily: "Cooper Black, Cooper Std, serif",
										color: "#405169",
									}}>
									Are you sure you want to go back to the main landing page? Any
									unsaved progress may be lost.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel
									style={{
										fontFamily: "Cooper Black, Cooper Std, serif",
									}}>
									Cancel
								</AlertDialogCancel>
								<AlertDialogAction
									onClick={onBack}
									style={{
										backgroundColor: "#405169",
										fontFamily: "Cooper Black, Cooper Std, serif",
									}}>
									Go Home
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>

			{/* Content with top padding for fixed header */}
			<div
				className="relative z-10 max-w-4xl mx-auto px-6 md:px-8 pb-6"
				style={{ paddingTop: "110px" }}>
				{isLoading ? (
					<div
						className="flex items-center justify-center"
						style={{ height: "calc(100vh - 110px)", marginTop: "-110px" }}>
						<div className="text-center">
							<RefreshCw
								className="w-8 h-8 animate-spin mx-auto mb-2"
								style={{ color: "#405169" }}
							/>
							<p
								style={{
									fontFamily: "Cooper Black, Cooper Std, serif",
									color: "#405169",
								}}>
								Loading activities...
							</p>
						</div>
					</div>
				) : (
					<Tabs defaultValue="opportunities" className="w-full">
						<TabsList
							className="grid w-full grid-cols-3 mb-6"
							style={{ backgroundColor: "#D4C883" }}>
							<TabsTrigger
								value="opportunities"
								style={{
									fontFamily: "Cooper Black, Cooper Std, serif",
									fontWeight: 700,
								}}>
								Opportunities
							</TabsTrigger>
							<TabsTrigger
								value="crisis"
								style={{
									fontFamily: "Cooper Black, Cooper Std, serif",
									fontWeight: 700,
								}}>
								Alerts
							</TabsTrigger>
							<TabsTrigger
								value="games"
								style={{
									fontFamily: "Cooper Black, Cooper Std, serif",
									fontWeight: 700,
								}}>
								Games
							</TabsTrigger>
						</TabsList>

						<TabsContent value="opportunities" className="space-y-3">
							{communityOpportunities.length === 0 ? (
								<Card
									className="p-8 border-0 shadow-md text-center"
									style={{ backgroundColor: "#FAF7EB" }}>
									<p
										style={{
											fontFamily: "Cooper Black, Cooper Std, serif",
											color: "#405169",
										}}>
										All opportunities completed! Click refresh for new ones.
									</p>
								</Card>
							) : (
								communityOpportunities.map((opp) => (
									<Card
										key={opp.id}
										className="p-4 border-0 shadow-md"
										style={{ backgroundColor: "#FAF7EB" }}>
										<div className="flex flex-col gap-3">
											<div className="flex-1">
												<h3
													className="mb-2"
													style={{
														fontFamily: "Cooper Black, Cooper Std, serif",
														fontWeight: 900,
														fontSize: "18px",
														color: "#405169",
													}}>
													{opp.title}
												</h3>
												<div className="flex flex-col gap-2 mb-3 text-xs">
													<div
														className="flex items-center gap-1 opacity-70"
														style={{ color: "#405169" }}>
														<MapPin className="w-3 h-3 flex-shrink-0" />
														<span
															className="truncate"
															style={{
																fontFamily: "Cooper Black, Cooper Std, serif",
															}}>
															{opp.location}
														</span>
													</div>
													<div
														className="flex items-center gap-1 opacity-70"
														style={{ color: "#405169" }}>
														<Calendar className="w-3 h-3 flex-shrink-0" />
														<span
															style={{
																fontFamily: "Cooper Black, Cooper Std, serif",
															}}>
															{opp.date} • {opp.time}
														</span>
													</div>
													<div
														className="flex items-center gap-1 opacity-70"
														style={{ color: "#405169" }}>
														<Clock className="w-3 h-3 flex-shrink-0" />
														<span
															style={{
																fontFamily: "Cooper Black, Cooper Std, serif",
															}}>
															{opp.duration}
														</span>
													</div>
													{opp.isVolunteerOpportunity &&
														opp.volunteersNeeded !== undefined && (
															<div className="flex items-center gap-1">
																<Badge
																	className="text-xs border-0"
																	style={{
																		backgroundColor: "#3B3766",
																		color: "white",
																		fontFamily:
																			"Cooper Black, Cooper Std, serif",
																		fontWeight: 700,
																	}}>
																	{volunteerCounts.get(opp.id) ??
																		opp.volunteersNeeded}{" "}
																	volunteers needed
																</Badge>
															</div>
														)}
												</div>
												<Badge
													variant="secondary"
													className="text-xs border-0"
													style={{
														backgroundColor: "#D4C883",
														color: "#405169",
														fontFamily: "Cooper Black, Cooper Std, serif",
													}}>
													{opp.distance} away
												</Badge>
											</div>

											{/* Progress Bar for Multi-Step Activities */}
											{opp.requiresMultiple && opp.totalRequired && (
												<div className="space-y-1">
													<div className="flex justify-between text-xs">
														<span
															style={{
																fontFamily: "Cooper Black, Cooper Std, serif",
																color: "#405169",
															}}>
															{opp.progressDescription || "Progress"}
														</span>
														<span
															style={{
																fontFamily: "Cooper Black, Cooper Std, serif",
																color: "#405169",
																fontWeight: 700,
															}}>
															{activityProgress.get(opp.id) || 0} /{" "}
															{opp.totalRequired}
														</span>
													</div>
													<Progress
														value={
															((activityProgress.get(opp.id) || 0) /
																opp.totalRequired) *
															100
														}
														className="h-3"
													/>
												</div>
											)}

											<div className="flex items-center gap-2 justify-between">
												<Badge
													className="text-xs border-0"
													style={{
														backgroundColor: "#9D5C45",
														color: "white",
														fontFamily: "Cooper Black, Cooper Std, serif",
														fontWeight: 700,
													}}>
													+{opp.xp} XP{opp.requiresMultiple && " total"}
												</Badge>
												<div className="flex gap-2">
													{opp.isVolunteerOpportunity &&
														opp.volunteersNeeded !== undefined && (
															<Button
																size="sm"
																disabled={signedUpActivities.has(opp.id)}
																onClick={() =>
																	handleSignUp(
																		opp.id,
																		volunteerCounts.get(opp.id) ??
																			opp.volunteersNeeded!,
																		opp.title
																	)
																}
																className="border-0"
																style={{
																	backgroundColor: signedUpActivities.has(
																		opp.id
																	)
																		? "#D4C883"
																		: "#3B3766",
																	fontFamily: "Cooper Black, Cooper Std, serif",
																	fontWeight: 700,
																}}>
																{signedUpActivities.has(opp.id)
																	? "Signed Up"
																	: "Sign Up"}
															</Button>
														)}
													<PhotoVerification
														taskTitle={opp.title}
														taskDescription={`Volunteer at ${opp.location} for ${opp.duration}`}
														xpReward={
															opp.requiresMultiple && opp.totalRequired
																? Math.round(opp.xp / opp.totalRequired)
																: opp.xp
														}
														isMultiStep={opp.requiresMultiple}
														currentProgress={activityProgress.get(opp.id) || 0}
														totalRequired={opp.totalRequired || 1}
														onVerified={() =>
															handleComplete(
																opp.id,
																opp.requiresMultiple && opp.totalRequired
																	? Math.round(opp.xp / opp.totalRequired)
																	: opp.xp,
																opp.requiresMultiple,
																opp.totalRequired
															)
														}
														buttonOnly={true}
													/>
												</div>
											</div>
										</div>
									</Card>
								))
							)}
						</TabsContent>

						<TabsContent value="crisis" className="space-y-4">
							{crisisAlerts.length === 0 ? (
								<Card
									className="p-8 border-0 shadow-md text-center"
									style={{ backgroundColor: "#FAF7EB" }}>
									<p
										style={{
											fontFamily: "Cooper Black, Cooper Std, serif",
											color: "#405169",
										}}>
										All crisis alerts addressed! Click refresh for new ones.
									</p>
								</Card>
							) : (
								crisisAlerts.map((alert) => (
									<Card
										key={alert.id}
										className="p-4 border-0 shadow-md"
										style={{
											backgroundColor: "#FAF7EB",
											borderLeft: "4px solid #9D5C45",
										}}>
										<div className="flex flex-col gap-3">
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-2">
													<AlertCircle
														className="w-5 h-5"
														style={{ color: "#9D5C45" }}
													/>
													<h3
														style={{
															fontFamily: "Cooper Black, Cooper Std, serif",
															fontWeight: 900,
															fontSize: "18px",
															color: "#405169",
														}}>
														{alert.title}
													</h3>
												</div>
												<p
													className="mb-2 text-sm opacity-70"
													style={{
														fontFamily: "Cooper Black, Cooper Std, serif",
														color: "#405169",
													}}>
													{alert.location}
												</p>
												<div
													className="flex items-center gap-1 mb-3 text-xs opacity-70"
													style={{ color: "#405169" }}>
													<Calendar className="w-3 h-3 flex-shrink-0" />
													<span
														style={{
															fontFamily: "Cooper Black, Cooper Std, serif",
														}}>
														{alert.date} • {alert.time}
													</span>
												</div>
												<div className="flex gap-2 flex-wrap">
													<Badge
														className="border-0"
														style={{
															backgroundColor:
																alert.urgency === "high"
																	? "#9D5C45"
																	: "#D4C883",
															color:
																alert.urgency === "high" ? "white" : "#405169",
															fontFamily: "Cooper Black, Cooper Std, serif",
															fontWeight: 700,
														}}>
														{alert.urgency === "high" ? "Urgent" : "Needed"}
													</Badge>
													<Badge
														variant="outline"
														style={{
															fontFamily: "Cooper Black, Cooper Std, serif",
															borderColor: "#C4B77D",
															color: "#405169",
														}}>
														{alert.volunteers} volunteers
													</Badge>
												</div>
											</div>

											{/* Progress Bar for Multi-Step Activities */}
											{alert.requiresMultiple && alert.totalRequired && (
												<div className="space-y-1">
													<div className="flex justify-between text-xs">
														<span
															style={{
																fontFamily: "Cooper Black, Cooper Std, serif",
																color: "#405169",
															}}>
															{alert.progressDescription || "Progress"}
														</span>
														<span
															style={{
																fontFamily: "Cooper Black, Cooper Std, serif",
																color: "#405169",
																fontWeight: 700,
															}}>
															{activityProgress.get(alert.id) || 0} /{" "}
															{alert.totalRequired}
														</span>
													</div>
													<Progress
														value={
															((activityProgress.get(alert.id) || 0) /
																alert.totalRequired) *
															100
														}
														className="h-2"
													/>
												</div>
											)}

											<div className="flex items-center gap-2 justify-between">
												<Badge
													className="border-0"
													style={{
														backgroundColor: "#9D5C45",
														color: "white",
														fontFamily: "Cooper Black, Cooper Std, serif",
														fontWeight: 700,
													}}>
													+{alert.xp} XP{alert.requiresMultiple && " total"}
												</Badge>
												<PhotoVerification
													taskTitle={alert.title}
													taskDescription={`Help with ${alert.title} at ${alert.location}`}
													xpReward={
														alert.requiresMultiple && alert.totalRequired
															? Math.round(alert.xp / alert.totalRequired)
															: alert.xp
													}
													isMultiStep={alert.requiresMultiple}
													currentProgress={activityProgress.get(alert.id) || 0}
													totalRequired={alert.totalRequired || 1}
													onVerified={() =>
														handleComplete(
															alert.id,
															alert.requiresMultiple && alert.totalRequired
																? Math.round(alert.xp / alert.totalRequired)
																: alert.xp,
															alert.requiresMultiple,
															alert.totalRequired
														)
													}
													buttonOnly={true}
												/>
											</div>
										</div>
									</Card>
								))
							)}
						</TabsContent>

						<TabsContent value="games" className="space-y-4">
							{miniGames.length === 0 ? (
								<Card
									className="p-8 border-0 shadow-md text-center"
									style={{ backgroundColor: "#FAF7EB" }}>
									<p
										style={{
											fontFamily: "Cooper Black, Cooper Std, serif",
											color: "#405169",
										}}>
										All mini-games completed! Click refresh for new ones.
									</p>
								</Card>
							) : (
								miniGames.map((game) => (
									<Card
										key={game.id}
										className="p-4 border-0 shadow-md"
										style={{ backgroundColor: "#FAF7EB" }}>
										<div className="flex flex-col gap-3">
											<div className="flex gap-4 flex-1">
												<div
													className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0"
													style={{ backgroundColor: "#E8DC93" }}>
													<span className="text-2xl">{game.icon}</span>
												</div>
												<div className="flex-1 min-w-0">
													<h3
														className="mb-2"
														style={{
															fontFamily: "Cooper Black, Cooper Std, serif",
															fontWeight: 900,
															fontSize: "18px",
															color: "#405169",
														}}>
														{game.title}
													</h3>
													<p
														className="text-sm opacity-70 mb-2"
														style={{
															fontFamily: "Cooper Black, Cooper Std, serif",
															color: "#405169",
														}}>
														{game.description}
													</p>
													<div
														className="flex items-center gap-1 text-xs opacity-70"
														style={{ color: "#405169" }}>
														<Clock className="w-3 h-3 flex-shrink-0" />
														<span
															style={{
																fontFamily: "Cooper Black, Cooper Std, serif",
															}}>
															{game.time}
														</span>
													</div>
												</div>
											</div>

											{/* Progress Bar for Multi-Step Activities */}
											{game.requiresMultiple && game.totalRequired && (
												<div className="space-y-1">
													<div className="flex justify-between text-xs">
														<span
															style={{
																fontFamily: "Cooper Black, Cooper Std, serif",
																color: "#405169",
															}}>
															{game.progressDescription || "Progress"}
														</span>
														<span
															style={{
																fontFamily: "Cooper Black, Cooper Std, serif",
																color: "#405169",
																fontWeight: 700,
															}}>
															{activityProgress.get(game.id) || 0} /{" "}
															{game.totalRequired}
														</span>
													</div>
													<Progress
														value={
															((activityProgress.get(game.id) || 0) /
																game.totalRequired) *
															100
														}
														className="h-2"
													/>
												</div>
											)}

											<div className="flex items-center gap-2 justify-between">
												<Badge
													className="border-0"
													style={{
														backgroundColor: "#4A5A3C",
														color: "white",
														fontFamily: "Cooper Black, Cooper Std, serif",
														fontWeight: 700,
													}}>
													+{game.xp} XP{game.requiresMultiple && " total"}
												</Badge>
												<PhotoVerification
													taskTitle={game.title}
													taskDescription={game.description}
													xpReward={
														game.requiresMultiple && game.totalRequired
															? Math.round(game.xp / game.totalRequired)
															: game.xp
													}
													isMultiStep={game.requiresMultiple}
													currentProgress={activityProgress.get(game.id) || 0}
													totalRequired={game.totalRequired || 1}
													onVerified={() =>
														handleComplete(
															game.id,
															game.requiresMultiple && game.totalRequired
																? Math.round(game.xp / game.totalRequired)
																: game.xp,
															game.requiresMultiple,
															game.totalRequired
														)
													}
													buttonOnly={true}
												/>
											</div>
										</div>
									</Card>
								))
							)}
						</TabsContent>
					</Tabs>
				)}

				{/* Pull to Refresh Indicator */}
				{isPulling && (
					<div
						className="fixed bottom-0 left-0 right-0 flex justify-center py-4 transition-opacity"
						style={{
							backgroundColor: "#E8DC93",
							opacity: pullDistance / 100,
							pointerEvents: "none",
						}}>
						<div className="flex items-center gap-2">
							<RefreshCw
								className="w-5 h-5"
								style={{
									color: "#405169",
									transform: `rotate(${pullDistance * 3.6}deg)`,
								}}
							/>
							<span
								style={{
									fontFamily: "Cooper Black, Cooper Std, serif",
									fontWeight: 700,
									color: "#405169",
									fontSize: "14px",
								}}>
								{pullDistance >= 60
									? "Release to refresh"
									: "Pull up to refresh"}
							</span>
						</div>
					</div>
				)}

				{/* Refresh Button at Bottom of Content */}
				<div className="flex justify-center py-6 pb-12 mt-12">
					{isRegenerating && !isLoading ? (
						<div className="spinner-container">
							<div className="spinner-ring"></div>
							<div className="spinner-ring"></div>
							<div className="spinner-ring"></div>
							<div className="spinner-ring"></div>
							<div className="spinner-ring"></div>
						</div>
					) : !isLoading ? (
						<Button
							variant="ghost"
							onClick={handleRegenerate}
							className="hover:bg-white/30 transition-all rounded-full px-6 py-2"
							style={{
								color: "#405169",
								fontFamily: "Cooper Black, Cooper Std, serif",
								fontWeight: 700,
								fontSize: "16px",
							}}>
							<RefreshCw className="w-5 h-5 mr-2" />
							Refresh Activities
						</Button>
					) : null}
				</div>
				<style>{`
					.spinner-container {
						width: 50px;
						height: 50px;
						position: relative;
						display: flex;
						align-items: center;
						justify-content: center;
					}

					.spinner-ring {
						position: absolute;
						border: 3px solid #405169;
						border-radius: 50%;
						animation: spinner-rotate 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
					}

					.spinner-ring:nth-child(1) {
						width: 40px;
						height: 40px;
						border-color: #405169 transparent transparent transparent;
						animation-delay: -0.45s;
					}

					.spinner-ring:nth-child(2) {
						width: 32px;
						height: 32px;
						border-color: #3B3766 transparent transparent transparent;
						animation-delay: -0.3s;
					}

					.spinner-ring:nth-child(3) {
						width: 24px;
						height: 24px;
						border-color: #9D5C45 transparent transparent transparent;
						animation-delay: -0.15s;
					}

					.spinner-ring:nth-child(4) {
						width: 16px;
						height: 16px;
						border-color: #C4B77D transparent transparent transparent;
						animation-delay: 0s;
					}

					.spinner-ring:nth-child(5) {
						width: 8px;
						height: 8px;
						border-color: #D4C883 transparent transparent transparent;
						animation-delay: 0.15s;
					}

					@keyframes spinner-rotate {
						0% {
							transform: rotate(0deg);
						}
						100% {
							transform: rotate(360deg);
						}
					}
				`}</style>
			</div>
		</div>
	);
}
