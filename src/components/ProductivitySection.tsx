import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
	ArrowLeft,
	Timer,
	CheckCircle,
	Bell,
	Calendar,
	Play,
	Pause,
	RotateCcw,
	AlertCircle,
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { Badge } from "./ui/badge";
import { PhotoVerification } from "./PhotoVerification";

interface ProductivitySectionProps {
	onBack: () => void;
	onEarnXP: (points: number) => void;
}

export function ProductivitySection({
	onBack,
	onEarnXP,
}: ProductivitySectionProps) {
	const [taskName, setTaskName] = useState("");
	const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
	const [isRunning, setIsRunning] = useState(false);
	const [customMinutes, setCustomMinutes] = useState("25");
	const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
	const [showError, setShowError] = useState(false);

	// Suggested tasks based on "calendar data" - limit to 2
	const allSuggestedTasks = [
		{
			id: "t1",
			title: "Review Q4 Budget Report",
			lastDone: "12 days ago",
			xp: 80,
			category: "Work",
			color: "#3B3766",
		},
		{
			id: "t2",
			title: "Team 1-on-1 Meetings",
			lastDone: "8 days ago",
			xp: 100,
			category: "Work",
			color: "#3B3766",
		},
	];

	const suggestedTasks = allSuggestedTasks.filter(
		(task) => !completedTasks.has(task.id)
	);

	const handleTaskClick = (title: string) => {
		setTaskName(title);
	};

	useEffect(() => {
		let interval: number | undefined;
		if (isRunning && timeLeft > 0) {
			interval = window.setInterval(() => {
				setTimeLeft((prev) => prev - 1);
			}, 1000);
		} else if (timeLeft === 0 && isRunning) {
			setIsRunning(false);
			const xpEarned = Math.floor(parseInt(customMinutes) * 2);
			onEarnXP(xpEarned);
			toast.success(`Timer completed! You earned ${xpEarned} XP!`, {
				description: taskName || "Great focus session!",
			});
		}
		return () => {
			if (interval) clearInterval(interval);
		};
	}, [isRunning, timeLeft, customMinutes, taskName, onEarnXP]);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs
			.toString()
			.padStart(2, "0")}`;
	};

	const handleStartTimer = () => {
		if (!taskName.trim()) {
			setShowError(true);
			setTimeout(() => setShowError(false), 3000);
			return;
		}

		if (!isRunning && timeLeft === parseInt(customMinutes) * 60) {
			// Starting fresh timer
			setIsRunning(true);
		} else {
			setIsRunning(!isRunning);
		}
	};

	const handleReset = () => {
		setIsRunning(false);
		setTimeLeft(parseInt(customMinutes) * 60);
	};

	const handleSetTimer = (minutes: string) => {
		const mins = parseInt(minutes) || 25;
		setCustomMinutes(minutes);
		if (!isRunning) {
			setTimeLeft(mins * 60);
		}
	};

	const handleTaskComplete = (taskId: string, xp: number, title: string) => {
		setCompletedTasks((prev) => new Set(prev).add(taskId));
		onEarnXP(xp);
		toast.success(`Task completed! +${xp} XP`, {
			description: title,
		});
	};

	const progress =
		((parseInt(customMinutes) * 60 - timeLeft) /
			(parseInt(customMinutes) * 60)) *
		100;

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

			<div className="relative z-10 max-w-4xl mx-auto">
				<Button
					variant="ghost"
					onClick={onBack}
					className="mb-4 -ml-2 hover:bg-white/20"
					style={{
						color: "#405169",
						fontFamily: "Cooper Black, Cooper Std, serif",
						fontWeight: 700,
					}}>
					<ArrowLeft className="w-4 h-4 mr-2" />
					Back
				</Button>

				<div className="mb-6">
					<h1
						className="mb-1"
						style={{
							fontFamily: "Cooper Black, Cooper Std, serif",
							fontWeight: 900,
							fontSize: "32px",
							color: "#405169",
						}}>
						Be Productive
					</h1>
					<p
						className="text-sm opacity-70"
						style={{
							fontFamily: "Cooper Black, Cooper Std, serif",
							color: "#405169",
						}}>
						Stay focused and accomplish
					</p>
				</div>

				{/* Focus Timer */}
				<Card
					className="p-5 mb-6 border-0 shadow-md relative"
					style={{ backgroundColor: "#FAF7EB" }}>
					{/* Error message */}
					{showError && (
						<div
							className="absolute -top-2 left-0 right-0 mx-4 p-3 rounded-lg shadow-lg z-10 flex items-center gap-2"
							style={{ backgroundColor: "#9D5C45" }}>
							<AlertCircle className="w-4 h-4 text-white flex-shrink-0" />
							<p
								className="text-white text-sm"
								style={{
									fontFamily: "Cooper Black, Cooper Std, serif",
									fontWeight: 700,
								}}>
								Please enter what you're working on first!
							</p>
						</div>
					)}

					<div className="flex items-center gap-2 mb-4">
						<Timer className="w-5 h-5" style={{ color: "#3B3766" }} />
						<h3
							style={{
								fontFamily: "Cooper Black, Cooper Std, serif",
								fontWeight: 900,
								fontSize: "20px",
								color: "#405169",
							}}>
							Focus Timer
						</h3>
					</div>

					<div className="mb-4">
						<Input
							placeholder="What are you working on? *"
							value={taskName}
							onChange={(e) => setTaskName(e.target.value)}
							className="mb-3 h-10 border-2"
							style={{
								borderColor: "#C4B77D",
								backgroundColor: "#FFFFFF",
								fontFamily: "Cooper Black, Cooper Std, serif",
							}}
						/>
						<div className="flex gap-2 items-center text-sm">
							<span
								className="text-xs opacity-70"
								style={{
									color: "#405169",
									fontFamily: "Cooper Black, Cooper Std, serif",
								}}>
								Duration:
							</span>
							<Input
								type="number"
								value={customMinutes}
								onChange={(e) => handleSetTimer(e.target.value)}
								className="w-16 h-9 text-sm border-2"
								style={{
									borderColor: "#C4B77D",
									backgroundColor: "#FFFFFF",
									fontFamily: "Cooper Black, Cooper Std, serif",
								}}
								min="1"
								max="180"
								disabled={isRunning}
							/>
							<span
								className="text-xs opacity-70"
								style={{
									color: "#405169",
									fontFamily: "Cooper Black, Cooper Std, serif",
								}}>
								minutes
							</span>
						</div>
					</div>

					<div className="text-center mb-4">
						<div
							className="text-5xl mb-3"
							style={{
								fontFamily: "Cooper Black, Cooper Std, serif",
								fontWeight: 900,
								color: "#405169",
							}}>
							{formatTime(timeLeft)}
						</div>
						<div
							className="w-full rounded-full h-2 mb-4"
							style={{ backgroundColor: "#D4C883" }}>
							<div
								className="h-2 rounded-full transition-all duration-1000"
								style={{ width: `${progress}%`, backgroundColor: "#3B3766" }}
							/>
						</div>
					</div>

					<div className="flex gap-2 justify-center">
						<Button
							onClick={handleStartTimer}
							className="h-10 flex-1 border-0"
							style={{
								backgroundColor: "#3B3766",
								fontFamily: "Cooper Black, Cooper Std, serif",
								fontWeight: 700,
								boxShadow: "0 4px 6px rgba(0,0,0,0.15)",
							}}>
							{isRunning ? (
								<>
									<Pause className="w-4 h-4 mr-2" />
									Pause
								</>
							) : (
								<>
									<Play className="w-4 h-4 mr-2" />
									Start
								</>
							)}
						</Button>
						<Button
							onClick={handleReset}
							variant="outline"
							className="h-10 flex-1"
							style={{
								borderColor: "#C4B77D",
								backgroundColor: "#FFFFFF",
								color: "#405169",
								fontFamily: "Cooper Black, Cooper Std, serif",
								fontWeight: 700,
							}}>
							<RotateCcw className="w-4 h-4 mr-2" />
							Reset
						</Button>
					</div>
				</Card>

				{/* Suggested Tasks */}
				<div className="mb-4 flex items-center gap-2">
					<Calendar className="w-5 h-5" style={{ color: "#3B3766" }} />
					<h3
						style={{
							fontFamily: "Cooper Black, Cooper Std, serif",
							fontWeight: 900,
							fontSize: "20px",
							color: "#405169",
						}}>
						Suggested Tasks
					</h3>
				</div>
				<p
					className="mb-4 text-sm opacity-70"
					style={{
						fontFamily: "Cooper Black, Cooper Std, serif",
						color: "#405169",
					}}>
					Based on your calendar
				</p>

				<div className="space-y-3">
					{suggestedTasks.map((task) => (
						<Card
							key={task.id}
							className="p-4 border-0 shadow-md relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
							style={{ backgroundColor: "#FAF7EB" }}
							onClick={() => handleTaskClick(task.title)}>
							{/* Category color overlay */}
							<div
								className="absolute top-0 left-0 bottom-0 w-1"
								style={{ backgroundColor: task.color }}
							/>
							<div className="flex flex-col gap-3 pl-2">
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-2 flex-wrap">
										<h4
											style={{
												fontFamily: "Cooper Black, Cooper Std, serif",
												fontWeight: 900,
												fontSize: "18px",
												color: "#405169",
											}}>
											{task.title}
										</h4>
										<Badge
											variant="outline"
											className="border-0"
											style={{
												backgroundColor: task.color,
												color: "white",
												fontFamily: "Cooper Black, Cooper Std, serif",
												fontWeight: 700,
											}}>
											{task.category}
										</Badge>
									</div>
									<div
										className="flex items-center gap-1 text-sm opacity-70"
										style={{ color: "#405169" }}>
										<Bell className="w-4 h-4" />
										<span
											style={{ fontFamily: "Cooper Black, Cooper Std, serif" }}>
											Last completed {task.lastDone}
										</span>
									</div>
								</div>
								<div className="flex items-center gap-2 justify-between">
									<Badge
										className="border-0"
										style={{
											backgroundColor: task.color,
											color: "white",
											fontFamily: "Cooper Black, Cooper Std, serif",
											fontWeight: 700,
										}}>
										+{task.xp} XP
									</Badge>
									<div onClick={(e) => e.stopPropagation()}>
										<PhotoVerification
											taskTitle={task.title}
											xpReward={task.xp}
											onVerified={() =>
												handleTaskComplete(task.id, task.xp, task.title)
											}
											buttonOnly={true}
										/>
									</div>
								</div>
							</div>
						</Card>
					))}
				</div>
			</div>
		</div>
	);
}
