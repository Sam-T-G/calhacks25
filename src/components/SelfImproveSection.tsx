import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
	ArrowLeft,
	Brain,
	TrendingUp,
	Users,
	Dumbbell,
	Book,
	Heart,
	CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { PhotoVerification } from "./PhotoVerification";
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

interface SelfImproveSectionProps {
	onBack: () => void;
	onEarnXP: (points: number) => void;
}

export function SelfImproveSection({
	onBack,
	onEarnXP,
}: SelfImproveSectionProps) {
	const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
	const [taskProgress, setTaskProgress] = useState<Record<string, number>>({
		"gym-week": 3,
		"reading-week": 4,
		"meditation-week": 5,
	});

	const allPersonalizedTasks = [
		{
			id: "p1",
			title: "Hit the gym",
			description:
				"You haven't worked out in 4 days. A 30-minute session would be great!",
			xp: 100,
			icon: Dumbbell,
			color: "#9D5C45",
		},
		{
			id: "p2",
			title: "Catch up with Sarah",
			description:
				"It's been 3 weeks since you last connected with your friend Sarah.",
			xp: 80,
			icon: Users,
			color: "#3B3766",
		},
		{
			id: "p3",
			title: "Read for 20 minutes",
			description: 'Continue "Atomic Habits" - you\'re 60% through!',
			xp: 60,
			icon: Book,
			color: "#4A5A3C",
		},
		{
			id: "p4",
			title: "Practice meditation",
			description:
				"Your stress levels have been high. A 10-minute session can help.",
			xp: 70,
			icon: Brain,
			color: "#4A3B35",
		},
	];

	const personalizedTasks = allPersonalizedTasks.filter(
		(task) => !completedTasks.has(task.id)
	);

	const weeklyGoals = [
		{
			id: "gym-week",
			title: "Gym Sessions",
			current: 3,
			target: 4,
			xp: 200,
			icon: Dumbbell,
		},
		{
			id: "reading-week",
			title: "Reading Days",
			current: 4,
			target: 5,
			xp: 150,
			icon: Book,
		},
		{
			id: "meditation-week",
			title: "Meditation Days",
			current: 5,
			target: 7,
			xp: 180,
			icon: Brain,
		},
	];

	const handleComplete = (taskId: string, xp: number, title: string) => {
		if (!completedTasks.has(taskId)) {
			setCompletedTasks((prev) => new Set(prev).add(taskId));
			onEarnXP(xp);
			toast.success(`Amazing progress! +${xp} XP`, {
				description: title,
			});
		}
	};

	const handleGoalProgress = (goalId: string, xp: number, title: string) => {
		const goal = weeklyGoals.find((g) => g.id === goalId);
		if (goal && taskProgress[goalId] < goal.target) {
			setTaskProgress((prev) => ({
				...prev,
				[goalId]: prev[goalId] + 1,
			}));

			const newProgress = taskProgress[goalId] + 1;
			const earnedXP =
				newProgress === goal.target ? xp : Math.floor(xp / goal.target);

			onEarnXP(earnedXP);

			if (newProgress === goal.target) {
				toast.success(`Weekly goal completed! +${xp} XP`, {
					description: `${title} - You're on fire! 🔥`,
				});
			} else {
				toast.success(`Progress made! +${earnedXP} XP`, {
					description: `${newProgress}/${goal.target} ${title}`,
				});
			}
		}
	};

	return (
		<div
			className="min-h-screen p-6 md:p-8 relative"
			style={{ backgroundColor: "#E8DC93" }}>
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
							className="mb-0"
							style={{
								fontFamily: "Cooper Black, Cooper Std, serif",
								fontWeight: 900,
								fontSize: "28px",
								color: "#405169",
							}}>
							Self-Improve
						</h1>
						<p
							className="text-xs opacity-70 mt-0"
							style={{
								fontFamily: "Cooper Black, Cooper Std, serif",
								color: "#405169",
							}}>
							Build better habits and grow
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
				style={{ paddingTop: "140px" }}>
				{/* AI-Powered Insights */}
				<Card
					className="p-4 mb-6 text-white border-0 shadow-md"
					style={{ backgroundColor: "#4A5A3C" }}>
					<div className="flex items-start gap-3">
						<Brain className="w-5 h-5 sm:w-6 sm:h-6 mt-1 flex-shrink-0" />
						<div>
							<h3
								className="mb-2 text-white"
								style={{
									fontFamily: "Cooper Black, Cooper Std, serif",
									fontWeight: 900,
									fontSize: "18px",
								}}>
								Today's Insight
							</h3>
							<p
								className="opacity-90 text-sm"
								style={{ fontFamily: "Cooper Black, Cooper Std, serif" }}>
								You're most productive in the morning. Consider scheduling your
								gym session before 10 AM and reaching out to friends in the
								evening when you're more social.
							</p>
						</div>
					</div>
				</Card>

				{/* Personalized Tasks */}
				<div className="mb-6">
					<div className="flex items-center gap-2 mb-4">
						<TrendingUp className="w-5 h-5" style={{ color: "#4A5A3C" }} />
						<h3
							style={{
								fontFamily: "Cooper Black, Cooper Std, serif",
								fontWeight: 900,
								fontSize: "20px",
								color: "#405169",
							}}>
							Personalized for You
						</h3>
					</div>

					<div className="grid gap-3 grid-cols-1">
						{personalizedTasks.map((task) => {
							const Icon = task.icon;
							return (
								<Card
									key={task.id}
									className="p-4 border-0 shadow-md relative overflow-hidden"
									style={{ backgroundColor: "#FAF7EB" }}>
									{/* Category color overlay */}
									<div
										className="absolute top-0 left-0 bottom-0 w-1"
										style={{ backgroundColor: task.color }}
									/>
									<div className="flex flex-col gap-3 pl-2">
										<div className="flex items-start gap-3">
											<Icon
												className="w-5 h-5 mt-1 flex-shrink-0"
												style={{ color: task.color }}
											/>
											<div className="flex-1 min-w-0">
												<h4
													className="mb-1"
													style={{
														fontFamily: "Cooper Black, Cooper Std, serif",
														fontWeight: 900,
														fontSize: "18px",
														color: "#405169",
													}}>
													{task.title}
												</h4>
												<p
													className="text-sm opacity-70"
													style={{
														fontFamily: "Cooper Black, Cooper Std, serif",
														color: "#405169",
													}}>
													{task.description}
												</p>
											</div>
										</div>
										<div className="flex justify-between items-center gap-2">
											<Badge
												className="text-xs border-0"
												style={{
													backgroundColor: task.color,
													color: "white",
													fontFamily: "Cooper Black, Cooper Std, serif",
													fontWeight: 700,
												}}>
												+{task.xp} XP
											</Badge>
											<PhotoVerification
												taskTitle={task.title}
												xpReward={task.xp}
												onVerified={() =>
													handleComplete(task.id, task.xp, task.title)
												}
												buttonOnly={true}
											/>
										</div>
									</div>
								</Card>
							);
						})}
					</div>
				</div>

				{/* Weekly Goals */}
				<div className="mb-4 flex items-center gap-2">
					<Heart className="w-5 h-5" style={{ color: "#4A5A3C" }} />
					<h2
						style={{
							fontFamily: "Cooper Black, Cooper Std, serif",
							fontWeight: 900,
							fontSize: "20px",
							color: "#405169",
						}}>
						Weekly Goals
					</h2>
				</div>

				<div className="space-y-4">
					{weeklyGoals.map((goal) => {
						const Icon = goal.icon;
						const progress = (taskProgress[goal.id] / goal.target) * 100;
						const isComplete = taskProgress[goal.id] >= goal.target;

						return (
							<Card
								key={goal.id}
								className="p-5 border-0 shadow-md"
								style={{ backgroundColor: "#FAF7EB" }}>
								<div className="flex items-start gap-4 mb-3">
									<Icon className="w-5 h-5 mt-1" style={{ color: "#4A5A3C" }} />
									<div className="flex-1">
										<div className="flex justify-between items-start mb-2">
											<h4
												style={{
													fontFamily: "Cooper Black, Cooper Std, serif",
													fontWeight: 900,
													fontSize: "18px",
													color: "#405169",
												}}>
												{goal.title}
											</h4>
											<Badge
												className="border-0"
												style={{
													backgroundColor: "#4A5A3C",
													color: "white",
													fontFamily: "Cooper Black, Cooper Std, serif",
													fontWeight: 700,
												}}>
												+{goal.xp} XP
											</Badge>
										</div>
										<div className="mb-2">
											<div
												className="flex justify-between mb-1 text-sm opacity-70"
												style={{ color: "#405169" }}>
												<span
													style={{
														fontFamily: "Cooper Black, Cooper Std, serif",
													}}>
													{taskProgress[goal.id]} / {goal.target} completed
												</span>
												<span
													style={{
														fontFamily: "Cooper Black, Cooper Std, serif",
													}}>
													{Math.round(progress)}%
												</span>
											</div>
											<Progress value={progress} className="h-3" />
										</div>
									</div>
								</div>
								<div className="flex gap-2">
									{isComplete ? (
										<Button
											size="sm"
											disabled
											className="flex-1 border-0"
											style={{
												backgroundColor: "#D4C883",
												color: "#405169",
												fontFamily: "Cooper Black, Cooper Std, serif",
												fontWeight: 700,
											}}>
											<CheckCircle className="w-4 h-4 mr-2" />
											Completed!
										</Button>
									) : (
										<PhotoVerification
											taskTitle={goal.title}
											xpReward={Math.floor(goal.xp / goal.target)}
											onVerified={() =>
												handleGoalProgress(goal.id, goal.xp, goal.title)
											}
											buttonOnly={true}
										/>
									)}
								</div>
							</Card>
						);
					})}
				</div>
			</div>
		</div>
	);
}
