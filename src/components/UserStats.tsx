import React from "react";
import {
	ArrowLeft,
	TrendingUp,
	Target,
	CheckCircle,
	Clock,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
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

interface UserStatsProps {
	xpPoints: number;
	onBack: () => void;
}

export function UserStats({ xpPoints, onBack }: UserStatsProps) {
	// Mock in-progress tasks - in a real app, this would come from state management
	const inProgressTasks = [
		{
			id: "1",
			title: "Recycle 50 aluminum cans",
			category: "Serve",
			categoryColor: "#9D5C45",
			progress: 12,
			total: 50,
			xpPerUnit: 5,
			totalXP: 250,
			earnedXP: 60,
		},
		{
			id: "2",
			title: "Volunteer at Food Bank",
			category: "Serve",
			categoryColor: "#9D5C45",
			progress: 0,
			total: 1,
			xpPerUnit: 150,
			totalXP: 150,
			earnedXP: 0,
		},
		{
			id: "3",
			title: "Complete Deep Work Session",
			category: "Productivity",
			categoryColor: "#3B3766",
			progress: 0,
			total: 1,
			xpPerUnit: 100,
			totalXP: 100,
			earnedXP: 0,
		},
	];

	const completedTasks = [
		{
			id: "c1",
			title: "Plant Trees in Local Park",
			category: "Serve",
			categoryColor: "#9D5C45",
			xpEarned: 200,
			completedDate: "Today",
		},
		{
			id: "c2",
			title: "Morning Gym Session",
			category: "Self-Improve",
			categoryColor: "#4A5A3C",
			xpEarned: 100,
			completedDate: "Yesterday",
		},
	];

	const totalInProgressXP = inProgressTasks.reduce(
		(sum, task) => sum + task.totalXP,
		0
	);
	const totalEarnedXP = inProgressTasks.reduce(
		(sum, task) => sum + task.earnedXP,
		0
	);

	return (
		<div
			className="min-h-screen relative"
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
							style={{
								fontFamily: "Cooper Black, Cooper Std, serif",
								fontWeight: 900,
								fontSize: "28px",
								color: "#405169",
								marginBottom: "0",
							}}>
							Your Progress
						</h1>
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
				{/* XP Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
					<Card
						className="p-5 border-0 shadow-md"
						style={{ backgroundColor: "#FAF7EB" }}>
						<div className="flex items-center gap-3">
							<div
								className="p-3 rounded-xl"
								style={{ backgroundColor: "#405169" }}>
								<TrendingUp className="w-6 h-6 text-white" />
							</div>
							<div>
								<p
									className="text-xs opacity-70 mb-1"
									style={{
										fontFamily: "Cooper Black, Cooper Std, serif",
										color: "#405169",
									}}>
									Total XP
								</p>
								<p
									className="text-2xl"
									style={{
										fontFamily: "Cooper Black, Cooper Std, serif",
										fontWeight: 900,
										color: "#405169",
									}}>
									{xpPoints.toLocaleString()}
								</p>
							</div>
						</div>
					</Card>

					<Card
						className="p-5 border-0 shadow-md"
						style={{ backgroundColor: "#FAF7EB" }}>
						<div className="flex items-center gap-3">
							<div
								className="p-3 rounded-xl"
								style={{ backgroundColor: "#3B3766" }}>
								<Target className="w-6 h-6 text-white" />
							</div>
							<div>
								<p
									className="text-xs opacity-70 mb-1"
									style={{
										fontFamily: "Cooper Black, Cooper Std, serif",
										color: "#405169",
									}}>
									In Progress
								</p>
								<p
									className="text-2xl"
									style={{
										fontFamily: "Cooper Black, Cooper Std, serif",
										fontWeight: 900,
										color: "#405169",
									}}>
									{inProgressTasks.length}
								</p>
							</div>
						</div>
					</Card>

					<Card
						className="p-5 border-0 shadow-md"
						style={{ backgroundColor: "#FAF7EB" }}>
						<div className="flex items-center gap-3">
							<div
								className="p-3 rounded-xl"
								style={{ backgroundColor: "#4A5A3C" }}>
								<CheckCircle className="w-6 h-6 text-white" />
							</div>
							<div>
								<p
									className="text-xs opacity-70 mb-1"
									style={{
										fontFamily: "Cooper Black, Cooper Std, serif",
										color: "#405169",
									}}>
									Potential XP
								</p>
								<p
									className="text-2xl"
									style={{
										fontFamily: "Cooper Black, Cooper Std, serif",
										fontWeight: 900,
										color: "#405169",
									}}>
									+{totalInProgressXP}
								</p>
							</div>
						</div>
					</Card>
				</div>

				{/* In Progress Tasks */}
				<div className="mb-6">
					<div className="flex items-center gap-2 mb-4">
						<Clock className="w-5 h-5" style={{ color: "#405169" }} />
						<h2
							style={{
								fontFamily: "Cooper Black, Cooper Std, serif",
								fontWeight: 900,
								fontSize: "20px",
								color: "#405169",
							}}>
							In Progress
						</h2>
					</div>

					<div className="space-y-3">
						{inProgressTasks.map((task) => {
							const progressPercent = (task.progress / task.total) * 100;

							return (
								<Card
									key={task.id}
									className="p-5 border-0 shadow-md"
									style={{ backgroundColor: "#FAF7EB" }}>
									<div className="flex items-start justify-between mb-3">
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-1">
												<h3
													style={{
														fontFamily: "Cooper Black, Cooper Std, serif",
														fontWeight: 900,
														fontSize: "18px",
														color: "#405169",
													}}>
													{task.title}
												</h3>
												<Badge
													className="text-xs border-0"
													style={{
														backgroundColor: task.categoryColor,
														color: "white",
														fontFamily: "Cooper Black, Cooper Std, serif",
														fontWeight: 700,
													}}>
													{task.category}
												</Badge>
											</div>
											<p
												className="text-sm opacity-70 mb-3"
												style={{
													fontFamily: "Cooper Black, Cooper Std, serif",
													color: "#405169",
												}}>
												{task.progress} / {task.total} completed
											</p>
										</div>
										<div className="text-right">
											<p
												className="text-sm opacity-70"
												style={{
													fontFamily: "Cooper Black, Cooper Std, serif",
													color: "#405169",
												}}>
												Earned
											</p>
											<p
												className="text-lg"
												style={{
													fontFamily: "Cooper Black, Cooper Std, serif",
													fontWeight: 900,
													color: "#405169",
												}}>
												{task.earnedXP} / {task.totalXP} XP
											</p>
										</div>
									</div>

									<div className="space-y-2">
										<Progress value={progressPercent} className="h-3" />
										<div
											className="flex justify-between text-xs opacity-70"
											style={{
												color: "#405169",
												fontFamily: "Cooper Black, Cooper Std, serif",
											}}>
											<span>{Math.round(progressPercent)}% complete</span>
											<span>+{task.xpPerUnit} XP per unit</span>
										</div>
									</div>
								</Card>
							);
						})}

						{inProgressTasks.length === 0 && (
							<Card
								className="p-8 border-0 shadow-md text-center"
								style={{ backgroundColor: "#FAF7EB" }}>
								<p
									className="text-lg opacity-70"
									style={{
										fontFamily: "Cooper Black, Cooper Std, serif",
										color: "#405169",
									}}>
									No tasks in progress. Start a new activity!
								</p>
							</Card>
						)}
					</div>
				</div>

				{/* Recently Completed */}
				<div>
					<div className="flex items-center gap-2 mb-4">
						<CheckCircle className="w-5 h-5" style={{ color: "#4A5A3C" }} />
						<h2
							style={{
								fontFamily: "Cooper Black, Cooper Std, serif",
								fontWeight: 900,
								fontSize: "20px",
								color: "#405169",
							}}>
							Recently Completed
						</h2>
					</div>

					<div className="space-y-3">
						{completedTasks.map((task) => (
							<Card
								key={task.id}
								className="p-5 border-0 shadow-md"
								style={{ backgroundColor: "#FAF7EB" }}>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div
											className="p-2 rounded-full"
											style={{ backgroundColor: task.categoryColor }}>
											<CheckCircle className="w-5 h-5 text-white" />
										</div>
										<div>
											<h3
												style={{
													fontFamily: "Cooper Black, Cooper Std, serif",
													fontWeight: 900,
													fontSize: "16px",
													color: "#405169",
												}}>
												{task.title}
											</h3>
											<p
												className="text-xs opacity-70"
												style={{
													fontFamily: "Cooper Black, Cooper Std, serif",
													color: "#405169",
												}}>
												{task.completedDate}
											</p>
										</div>
									</div>
									<Badge
										className="text-sm border-0"
										style={{
											backgroundColor: "#4A5A3C",
											color: "white",
											fontFamily: "Cooper Black, Cooper Std, serif",
											fontWeight: 700,
										}}>
										+{task.xpEarned} XP
									</Badge>
								</div>
							</Card>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
