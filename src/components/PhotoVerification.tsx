import React, { useState, useRef } from "react";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./ui/alert-dialog";
import { Camera, X, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { claudeService } from "../services/claudeService";
import {
	compressImage,
	isImageSizeValid,
	getImageSizeKB,
} from "../utils/imageUtils";

interface PhotoVerificationProps {
	taskTitle: string;
	taskDescription?: string;
	xpReward: number;
	onVerified: () => void;
	buttonOnly?: boolean;
	isMultiStep?: boolean;
	currentProgress?: number;
	totalRequired?: number;
}

export function PhotoVerification({
	taskTitle,
	taskDescription,
	xpReward,
	onVerified,
	buttonOnly = false,
	isMultiStep = false,
	currentProgress = 0,
	totalRequired = 1,
}: PhotoVerificationProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
	const [isVerifying, setIsVerifying] = useState(false);
	const [hasPhoto, setHasPhoto] = useState(false);
	const [errorDialogOpen, setErrorDialogOpen] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [errorTitle, setErrorTitle] = useState("");
	const [successDialogOpen, setSuccessDialogOpen] = useState(false);
	const [successMessage, setSuccessMessage] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleCameraClick = () => {
		// Trigger the file input click to open camera
		fileInputRef.current?.click();
	};

	const handleFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = async () => {
				try {
					let imageData = reader.result as string;

					// Check initial size
					const initialSizeKB = getImageSizeKB(imageData);

					// Compress if image is large (over 1MB)
					if (initialSizeKB > 1000) {
						toast.info("Compressing image...", {
							description: "Please wait a moment.",
						});

						imageData = await compressImage(imageData, 1024, 1024, 0.85);

						const compressedSizeKB = getImageSizeKB(imageData);
						console.log(
							`Image compressed: ${initialSizeKB.toFixed(
								0
							)}KB → ${compressedSizeKB.toFixed(0)}KB`
						);
					}

					// Validate final size
					if (!isImageSizeValid(imageData, 5000)) {
						toast.error("Image Too Large", {
							description:
								"Please use a smaller image. Try reducing quality or resolution.",
						});
						return;
					}

					// Auto-submit photo for verification immediately
					setSelectedPhoto(imageData);
					setHasPhoto(true);
					await verifyPhoto(imageData);
				} catch (error) {
					console.error("Error processing image:", error);
					toast.error("Image Processing Error", {
						description: "Could not process the image. Please try again.",
					});
				}
			};
			reader.onerror = () => {
				toast.error("Image Load Error", {
					description: "Could not read the image file.",
				});
			};
			reader.readAsDataURL(file);
		}
	};

	const verifyPhoto = async (imageData: string) => {
		setIsVerifying(true);

		try {
			const result = await claudeService.verifyPhotoCompletion(
				imageData,
				taskTitle,
				taskDescription,
				isMultiStep,
				currentProgress,
				totalRequired
			);

			if (result.verified) {
				// Success! Show success dialog
				setIsVerifying(false);
				setSuccessMessage(result.message);
				setSuccessDialogOpen(true);
				// Clean up photo
				setSelectedPhoto(null);
				setHasPhoto(false);
				if (fileInputRef.current) {
					fileInputRef.current.value = "";
				}
				// Call onVerified to update progress
				onVerified();
			} else {
				// Verification failed - Discard photo and show error
				setIsVerifying(false);
				setSelectedPhoto(null);
				setHasPhoto(false);
				if (fileInputRef.current) {
					fileInputRef.current.value = "";
				}
				setErrorTitle("Verification Failed");
				setErrorMessage(result.message);
				setErrorDialogOpen(true);
			}
		} catch (error) {
			setIsVerifying(false);
			setSelectedPhoto(null);
			setHasPhoto(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
			setErrorTitle("Verification Error");
			setErrorMessage("Could not verify photo. Please try again.");
			setErrorDialogOpen(true);
		}
	};

	return (
		<>
			<div className="flex gap-2">
				{/* Camera Icon - Hidden input with button trigger */}
				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					capture="environment"
					className="hidden"
					onChange={handleFileChange}
				/>
				<Button
					size="sm"
					type="button"
					onClick={handleCameraClick}
					disabled={isVerifying}
					className="h-9 border-0 px-3"
					style={
						buttonOnly
							? {
									backgroundColor: "#405169",
									fontFamily: "Cooper Black, Cooper Std, serif",
									fontWeight: 700,
									boxShadow: "0 4px 6px rgba(0,0,0,0.15)",
							  }
							: {}
					}
					variant={buttonOnly ? undefined : "outline"}>
					{isVerifying ? (
						<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
					) : (
						<Camera className="w-4 h-4" />
					)}
				</Button>
			</div>

			{/* Error Alert Dialog - Centered and Prominent */}
			<AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
				<AlertDialogContent className="max-w-md">
					<button
						onClick={() => setErrorDialogOpen(false)}
						className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
						aria-label="Close">
						<X className="w-5 h-5 text-gray-500" />
					</button>
					<AlertDialogHeader>
						<div className="flex items-center gap-3 mb-2">
							<div className="rounded-full bg-red-100 p-3">
								<AlertCircle className="w-6 h-6 text-red-600" />
							</div>
							<AlertDialogTitle className="text-xl font-semibold text-gray-900">
								{errorTitle}
							</AlertDialogTitle>
						</div>
						<AlertDialogDescription className="text-base text-gray-700 leading-relaxed">
							{errorMessage}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3">
							Try Again
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Success Alert Dialog - Same Style */}
			<AlertDialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
				<AlertDialogContent className="max-w-md">
					<button
						onClick={() => setSuccessDialogOpen(false)}
						className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
						aria-label="Close">
						<X className="w-5 h-5 text-gray-500" />
					</button>
					<AlertDialogHeader>
						<div className="flex items-center gap-3 mb-2">
							<div className="rounded-full bg-green-100 p-3">
								<CheckCircle className="w-6 h-6 text-green-600" />
							</div>
							<AlertDialogTitle className="text-xl font-semibold text-gray-900">
								Photo Verified!
							</AlertDialogTitle>
						</div>
						<AlertDialogDescription className="text-base text-gray-700 leading-relaxed">
							+{xpReward} XP • {successMessage}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3">
							Continue
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
