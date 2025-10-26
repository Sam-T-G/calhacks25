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
import dgLogo from "../assets/images/dglogo.png";

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

	// Generic productive task suggestions for dropdown
	const taskSuggestions = [
		"Exercise",
		"Read a book",
		"Submit assignment",
		"Work on project",
		"Study for exam",
		"Practice hobby",
		"Meditate",
		"Write journal",
		"Learn new skill",
		"Review notes",
		"Plan week",
		"Organize workspace",
		"Practice instrument",
		"Code project",
		"Design mockup",
		"Write blog post",
		"Research topic",
		"Take online course",
		"Practice language",
		"Work on side project",
	];

	const [showSuggestions, setShowSuggestions] = useState(false);
	const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

	const handleTaskInputChange = (value: string) => {
		setTaskName(value);
		if (value.trim().length > 0) {
			const filtered = taskSuggestions.filter((suggestion) =>
				suggestion.toLowerCase().includes(value.toLowerCase())
			);
			setFilteredSuggestions(filtered);
			setShowSuggestions(filtered.length > 0);
		} else {
			setShowSuggestions(false);
		}
	};

	const selectSuggestion = (suggestion: string) => {
		setTaskName(suggestion);
		setShowSuggestions(false);
	};

	// Suggested tasks based on "calendar data" - 4 tasks
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
		{
			id: "t3",
			title: "Update Project Documentation",
			lastDone: "15 days ago",
			xp: 60,
			category: "Work",
			color: "#3B3766",
		},
		{
			id: "t4",
			title: "Exercise Routine",
			lastDone: "5 days ago",
			xp: 90,
			category: "Personal",
			color: "#4A5A3C",
		},
	];

	const suggestedTasks = allSuggestedTasks.filter(
		(task) => !completedTasks.has(task.id)
	);

	const handleTaskClick = (title: string) => {
		setTaskName(title);
		setShowSuggestions(false);
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
				<div className="flex items-center justify-between mb-6">
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
					<img
						src={dgLogo}
						alt="DoGood Logo"
						className="h-12 w-auto drop-shadow-md"
					/>
				</div>

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

				{/* Focus Timer - Modern Layout */}
				<Card
					className="p-6 mb-6 border-0 shadow-xl rounded-2xl relative overflow-hidden"
					style={{ backgroundColor: "#FAF7EB" }}>
					{/* Modern gradient accent */}
					<div
						className="absolute top-0 left-0 right-0 h-1"
						style={{
							background:
								"linear-gradient(90deg, #3B3766 0%, #9D5C45 50%, #4A5A3C 100%)",
						}}
					/>

					{/* Error message */}
					{showError && (
						<div
							className="absolute -top-3 left-4 right-4 p-3 rounded-xl shadow-lg z-20 flex items-center gap-2 animate-bounce"
							style={{ backgroundColor: "#9D5C45" }}>
							<AlertCircle className="w-4 h-4 text-white flex-shrink-0" />
							<span
								className="text-white text-sm"
								style={{
									fontFamily: "Cooper Black, Cooper Std, serif",
									fontWeight: 700,
								}}>
								Please enter a task name to start the timer
							</span>
						</div>
					)}

					{/* Header */}
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center gap-3">
							<div
								className="p-2 rounded-xl"
								style={{ backgroundColor: "#E8DC93" }}>
								<Timer className="w-6 h-6" style={{ color: "#3B3766" }} />
							</div>
							<h3
								style={{
									fontFamily: "Cooper Black, Cooper Std, serif",
									fontWeight: 900,
									fontSize: "24px",
									color: "#405169",
								}}>
								Focus Timer
							</h3>
						</div>
					</div>

					{/* Timer Display - Top */}
					<div className="text-center mb-8">
						<div
							className="text-9xl mb-4 tracking-tight"
							style={{
								fontFamily: "Cooper Black, Cooper Std, serif",
								fontWeight: 900,
								color: "#3B3766",
								textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
							}}>
							{formatTime(timeLeft)}
						</div>
						<div
							className="w-full rounded-full h-3 overflow-hidden"
							style={{ backgroundColor: "#E8DC93" }}>
							<div
								className="h-3 rounded-full transition-all duration-1000"
								style={{
									width: `${progress}%`,
									backgroundColor: "#3B3766",
								}}
							/>
						</div>
					</div>

					{/* Input Section - Middle */}
					<div className="mb-6 space-y-4">
						{/* Task Input with Suggestions */}
						<div className="relative">
							<label
								className="block mb-2 text-sm font-semibold"
								style={{
									color: "#405169",
									fontFamily: "Cooper Black, Cooper Std, serif",
								}}>
								What are you working on? *
							</label>
							<Input
								placeholder="Type or select a task..."
								value={taskName}
								onChange={(e) => handleTaskInputChange(e.target.value)}
								onFocus={() => {
									if (taskName.trim().length > 0) {
										const filtered = taskSuggestions.filter((suggestion) =>
											suggestion.toLowerCase().includes(taskName.toLowerCase())
										);
										setFilteredSuggestions(filtered);
										setShowSuggestions(filtered.length > 0);
									}
								}}
								onBlur={() => {
									// Delay to allow click on suggestion
									setTimeout(() => setShowSuggestions(false), 200);
								}}
								className="h-12 border-2 rounded-xl text-base shadow-sm"
								style={{
									borderColor: "#C4B77D",
									backgroundColor: "#FFFFFF",
									fontFamily: "Cooper Black, Cooper Std, serif",
								}}
							/>

							{/* Dropdown Suggestions */}
							{showSuggestions && filteredSuggestions.length > 0 && (
								<div
									className="absolute z-10 w-full mt-1 rounded-xl border-2 shadow-lg max-h-48 overflow-y-auto"
									style={{
										backgroundColor: "#FFFFFF",
										borderColor: "#C4B77D",
									}}>
									{filteredSuggestions.map((suggestion, index) => (
										<button
											key={index}
											onClick={() => selectSuggestion(suggestion)}
											className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0"
											style={{
												fontFamily: "Cooper Black, Cooper Std, serif",
												color: "#405169",
												borderColor: "#E8DC93",
											}}>
											{suggestion}
										</button>
									))}
								</div>
							)}
						</div>

						{/* Duration Selector */}
						<div className="flex items-center gap-3">
							<label
								className="text-sm font-semibold whitespace-nowrap"
								style={{
									color: "#405169",
									fontFamily: "Cooper Black, Cooper Std, serif",
								}}>
								Duration:
							</label>
							<Input
								type="number"
								value={customMinutes}
								onChange={(e) => handleSetTimer(e.target.value)}
								className="w-24 h-10 text-center border-2 rounded-xl font-bold"
								style={{
									borderColor: "#C4B77D",
									backgroundColor: "#FFFFFF",
									fontFamily: "Cooper Black, Cooper Std, serif",
									fontSize: "16px",
								}}
								min="1"
								max="120"
							/>
							<span
								className="text-sm font-semibold"
								style={{
									color: "#405169",
									fontFamily: "Cooper Black, Cooper Std, serif",
								}}>
								minutes
							</span>
							{/* Quick duration buttons */}
							<div className="flex gap-1 ml-auto">
								{[15, 25, 45].map((mins) => (
									<button
										key={mins}
										onClick={() => !isRunning && handleSetTimer(String(mins))}
										disabled={isRunning}
										className="px-3 py-1 rounded-lg text-xs font-bold transition-all hover:scale-105 disabled:opacity-50"
										style={{
											backgroundColor:
												customMinutes === String(mins) ? "#3B3766" : "#E8DC93",
											color:
												customMinutes === String(mins) ? "white" : "#405169",
											fontFamily: "Cooper Black, Cooper Std, serif",
										}}>
										{mins}m
									</button>
								))}
							</div>
						</div>
					</div>

					{/* Control Buttons - Bottom */}
					<div className="flex gap-3">
						<Button
							onClick={handleStartTimer}
							className="h-14 flex-1 border-0 rounded-xl text-base"
							style={{
								backgroundColor: "#3B3766",
								fontFamily: "Cooper Black, Cooper Std, serif",
								fontWeight: 700,
							}}>
							{isRunning ? (
								<>
									<Pause className="w-5 h-5 mr-2" />
									Pause
								</>
							) : (
								<>
									<Play className="w-5 h-5 mr-2" />
									Start Focus
								</>
							)}
						</Button>
						<Button
							onClick={handleReset}
							className="h-14 px-6 rounded-xl border-2"
							style={{
								borderColor: "#C4B77D",
								backgroundColor: "#FFFFFF",
								color: "#405169",
								fontFamily: "Cooper Black, Cooper Std, serif",
								fontWeight: 700,
							}}>
							<RotateCcw className="w-5 h-5" />
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
