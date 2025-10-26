import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { ArrowLeft, Heart, Sparkles, CheckCircle } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./ui/alert-dialog";
import dgLogo from "../assets/images/dglogo.png";

interface ShopSectionProps {
	xpPoints: number;
	onBack: () => void;
	onSpendXP: (points: number) => boolean;
}

export function ShopSection({ xpPoints, onBack, onSpendXP }: ShopSectionProps) {
	const [selectedCharity, setSelectedCharity] = useState<
		(typeof charities)[0] | null
	>(null);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	const [donations, setDonations] = useState<Record<string, number>>({});
	const [totalDonatedAmount, setTotalDonatedAmount] = useState<number>(0);

	const charities = [
		{
			id: "c1",
			name: "Clean Water Initiative",
			description: "Provide clean drinking water to communities in need",
			category: "Environment",
			xpCost: 500,
			impact: "$5 donation",
			image:
				"https://images.unsplash.com/photo-1712471010531-bad62e5b357b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGVhbiUyMHdhdGVyJTIwd2VsbHxlbnwxfHx8fDE3NjEzNzM5MTZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
			color: "from-blue-500 to-cyan-500",
		},
		{
			id: "c2",
			name: "Education for All",
			description: "Support educational programs for underprivileged children",
			category: "Education",
			xpCost: 750,
			impact: "$7.50 donation",
			image:
				"https://images.unsplash.com/photo-1666281269793-da06484657e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlsZHJlbiUyMGVkdWNhdGlvbiUyMGNsYXNzcm9vbXxlbnwxfHx8fDE3NjE0MDYyMjR8MA&ixlib=rb-4.1.0&q=80&w=1080",
			color: "from-purple-500 to-indigo-500",
		},
		{
			id: "c3",
			name: "Food Bank Network",
			description: "Help fight hunger in local communities",
			category: "Hunger Relief",
			xpCost: 400,
			impact: "$4 donation",
			image:
				"https://images.unsplash.com/photo-1710092784814-4a6f158913b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kJTIwZG9uYXRpb24lMjBjb21tdW5pdHl8ZW58MXx8fHwxNzYxMzc2NjA5fDA&ixlib=rb-4.1.0&q=80&w=1080",
			color: "from-orange-500 to-red-500",
		},
		{
			id: "c4",
			name: "Animal Rescue Foundation",
			description: "Support rescue and rehabilitation of animals",
			category: "Animal Welfare",
			xpCost: 600,
			impact: "$6 donation",
			image:
				"https://images.unsplash.com/photo-1643786260462-8acc5e4fb89c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmltYWwlMjBzaGVsdGVyJTIwcmVzY3VlfGVufDF8fHx8MTc2MTM5MzAyNHww&ixlib=rb-4.1.0&q=80&w=1080",
			color: "from-green-500 to-emerald-500",
		},
		{
			id: "c5",
			name: "Medical Aid International",
			description: "Provide medical supplies and care to crisis zones",
			category: "Healthcare",
			xpCost: 1000,
			impact: "$10 donation",
			image:
				"https://images.unsplash.com/photo-1668874896975-7f874c90600a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwYWlkJTIwaGVhbHRoY2FyZXxlbnwxfHx8fDE3NjEzODY0NTl8MA&ixlib=rb-4.1.0&q=80&w=1080",
			color: "from-pink-500 to-rose-500",
		},
		{
			id: "c6",
			name: "Forest Conservation Fund",
			description: "Protect and restore endangered forests",
			category: "Environment",
			xpCost: 800,
			impact: "$8 donation",
			image:
				"https://images.unsplash.com/photo-1683665281529-90ea475286e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3Jlc3QlMjBjb25zZXJ2YXRpb24lMjBuYXR1cmV8ZW58MXx8fHwxNzYxMzMwOTk2fDA&ixlib=rb-4.1.0&q=80&w=1080",
			color: "from-teal-500 to-green-600",
		},
	];

	const handleDonate = (charity: (typeof charities)[0]) => {
		setSelectedCharity(charity);
		setShowConfirmDialog(true);
	};

	const confirmDonation = () => {
		if (selectedCharity && onSpendXP(selectedCharity.xpCost)) {
			setDonations((prev) => ({
				...prev,
				[selectedCharity.id]: (prev[selectedCharity.id] || 0) + 1,
			}));

			// Extract dollar amount from impact string (e.g., "$5 donation" -> 5)
			const dollarAmount = parseFloat(
				selectedCharity.impact.replace(/[^0-9.]/g, "")
			);
			setTotalDonatedAmount((prev) => prev + dollarAmount);

			toast.success("Thank you for your donation!", {
				description: `${selectedCharity.impact} sent to ${selectedCharity.name}`,
			});
		} else {
			toast.error("Insufficient XP", {
				description: `You need ${selectedCharity?.xpCost} XP to make this donation`,
			});
		}
		setShowConfirmDialog(false);
		setSelectedCharity(null);
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
						Shop
					</h1>
					<p
						className="text-sm opacity-70"
						style={{
							fontFamily: "Cooper Black, Cooper Std, serif",
							color: "#405169",
						}}>
						Redeem XP for donations
					</p>
				</div>

				{/* Stats Card */}
				<div className="grid grid-cols-2 gap-3 mb-6">
					<Card
						className="p-4 text-white border-0 shadow-md"
						style={{ backgroundColor: "#4A3B35" }}>
						<div className="flex items-center gap-2">
							<Sparkles className="w-6 h-6" />
							<div>
								<p
									className="opacity-90 mb-1 text-xs"
									style={{ fontFamily: "Cooper Black, Cooper Std, serif" }}>
									Available XP
								</p>
								<div
									className="text-2xl"
									style={{
										fontFamily: "Cooper Black, Cooper Std, serif",
										fontWeight: 900,
									}}>
									{xpPoints.toLocaleString()}
								</div>
							</div>
						</div>
					</Card>
					<Card
						className="p-4 text-white border-0 shadow-md"
						style={{ backgroundColor: "#9D5C45" }}>
						<div className="flex items-center gap-2">
							<Heart className="w-6 h-6" />
							<div>
								<p
									className="opacity-90 mb-1 text-xs"
									style={{ fontFamily: "Cooper Black, Cooper Std, serif" }}>
									Donated
								</p>
								<div
									className="text-2xl"
									style={{
										fontFamily: "Cooper Black, Cooper Std, serif",
										fontWeight: 900,
									}}>
									${totalDonatedAmount.toFixed(2)}
								</div>
							</div>
						</div>
					</Card>
				</div>

				{/* Charities Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{charities.map((charity) => {
						const donationCount = donations[charity.id] || 0;
						const canAfford = xpPoints >= charity.xpCost;

						return (
							<Card
								key={charity.id}
								className="overflow-hidden border-0 shadow-md"
								style={{ backgroundColor: "#FAF7EB" }}>
								<div className="h-28 overflow-hidden">
									<img
										src={charity.image}
										alt={charity.name}
										className="w-full h-full object-cover"
									/>
								</div>
								<div className="p-4">
									<div className="flex items-start justify-between mb-2">
										<Badge
											variant="secondary"
											className="text-xs border-0"
											style={{
												backgroundColor: "#D4C883",
												color: "#405169",
												fontFamily: "Cooper Black, Cooper Std, serif",
												fontWeight: 700,
											}}>
											{charity.category}
										</Badge>
										{donationCount > 0 && (
											<Badge
												className="text-xs border-0"
												style={{
													backgroundColor: "#9D5C45",
													color: "white",
													fontFamily: "Cooper Black, Cooper Std, serif",
													fontWeight: 700,
												}}>
												<CheckCircle className="w-3 h-3 mr-1" />
												{donationCount}x
											</Badge>
										)}
									</div>
									<h4
										className="mb-1"
										style={{
											fontFamily: "Cooper Black, Cooper Std, serif",
											fontWeight: 900,
											fontSize: "18px",
											color: "#405169",
										}}>
										{charity.name}
									</h4>
									<p
										className="mb-3 text-xs opacity-70"
										style={{
											fontFamily: "Cooper Black, Cooper Std, serif",
											color: "#405169",
										}}>
										{charity.description}
									</p>
									<div className="flex items-center justify-between mb-3 text-xs">
										<span
											className="opacity-70"
											style={{
												fontFamily: "Cooper Black, Cooper Std, serif",
												color: "#405169",
											}}>
											Impact:
										</span>
										<span
											className="text-sm"
											style={{
												fontFamily: "Cooper Black, Cooper Std, serif",
												fontWeight: 700,
												color: "#405169",
											}}>
											{charity.impact}
										</span>
									</div>
									<Button
										className="w-full h-10 border-0"
										style={{
											backgroundColor: canAfford ? "#4A3B35" : "#D4C883",
											fontFamily: "Cooper Black, Cooper Std, serif",
											fontWeight: 700,
											boxShadow: "0 4px 6px rgba(0,0,0,0.15)",
										}}
										onClick={() => handleDonate(charity)}
										disabled={!canAfford}>
										<Heart className="w-4 h-4 mr-2" />
										Donate {charity.xpCost} XP
									</Button>
								</div>
							</Card>
						);
					})}
				</div>

				{/* Confirmation Dialog */}
				<AlertDialog
					open={showConfirmDialog}
					onOpenChange={setShowConfirmDialog}>
					<AlertDialogContent
						className="max-w-[85%]"
						style={{ backgroundColor: "#FAF7EB" }}>
						<AlertDialogHeader>
							<AlertDialogTitle
								style={{
									fontFamily: "Cooper Black, Cooper Std, serif",
									fontWeight: 900,
									fontSize: "18px",
									color: "#405169",
								}}>
								Confirm Donation
							</AlertDialogTitle>
							<AlertDialogDescription
								style={{
									fontFamily: "Cooper Black, Cooper Std, serif",
									color: "#5A5A5A",
								}}>
								{selectedCharity && (
									<>
										You're about to donate{" "}
										<strong>{selectedCharity.xpCost} XP</strong> to{" "}
										<strong>{selectedCharity.name}</strong>. This will result in
										a <strong>{selectedCharity.impact}</strong>.
										<br />
										<br />
										Do you want to proceed?
									</>
								)}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel
								style={{
									fontFamily: "Cooper Black, Cooper Std, serif",
									fontWeight: 700,
								}}>
								Cancel
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={confirmDonation}
								style={{
									backgroundColor: "#4A3B35",
									fontFamily: "Cooper Black, Cooper Std, serif",
									fontWeight: 700,
								}}>
								Confirm Donation
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	);
}
