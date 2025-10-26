import { useState, useEffect, useCallback } from "react";
import {
	LiveKitRoom,
	useVoiceAssistant,
	BarVisualizer,
	RoomAudioRenderer,
	useRoomContext,
} from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import "@livekit/components-styles";
import { contextService } from "../services/contextService";
import { toast } from "sonner";
import type { Section } from "../App";

interface VoiceAssistantProps {
	isActive: boolean;
	onClose: () => void;
	onNavigate?: (section: Section) => void;
	onExecuteAction?: (action: any) => void;
}

export function VoiceAssistant({
	isActive,
	onClose,
	onNavigate,
	onExecuteAction,
}: VoiceAssistantProps) {
	const [token, setToken] = useState<string>("");
	const [wsUrl, setWsUrl] = useState<string>("");
	const [isConnecting, setIsConnecting] = useState(false);
	const [error, setError] = useState<string>("");

	// Handle Claude orchestration commands from voice agent
	const handleClaudeCommand = useCallback(
		(payload: Uint8Array) => {
			try {
				const data = JSON.parse(new TextDecoder().decode(payload));
				console.log("[VoiceAssistant] Received Claude command:", data);

				// Log orchestration event
				contextService.logOrchestration(data.intent || "unknown", data);

				// Execute navigation
				if (data.navigation && onNavigate) {
					const page = data.navigation.page as Section;
					console.log("[VoiceAssistant] Navigating to:", page);
					onNavigate(page);
				}

				// Execute actions
				if (data.actions && onExecuteAction) {
					data.actions.forEach((action: any) => {
						console.log("[VoiceAssistant] Executing action:", action);
						onExecuteAction(action);
					});
				}

				// Apply UI updates
				if (data.ui_updates) {
					if (data.ui_updates.show_notification) {
						const notif = data.ui_updates.show_notification;
						const toastType = notif.type || "info";
						if (toastType === "success") {
							toast.success(notif.message);
						} else if (toastType === "error") {
							toast.error(notif.message);
						} else {
							toast.info(notif.message);
						}
					}
				}

				// Update context/preferences
				if (data.context_updates) {
					console.log(
						"[VoiceAssistant] Updating preferences:",
						data.context_updates
					);
					contextService.updatePreferences(data.context_updates);
				}
			} catch (err) {
				console.error("[VoiceAssistant] Failed to parse Claude command:", err);
			}
		},
		[onNavigate, onExecuteAction]
	);

	// Fetch LiveKit token when component becomes active
	useEffect(() => {
		if (isActive && !token) {
			fetchToken();
		}
	}, [isActive, token]);

	const fetchToken = async () => {
		setIsConnecting(true);
		setError("");

		try {
			// Get user context for the voice agent
			const userContext = contextService.getContextForVoice();

			// Pass context via query params to the token endpoint
			// The endpoint will embed it in room metadata for the voice agent
			const params = new URLSearchParams({
				userContext: userContext,
			});

			const response = await fetch(`/api/livekit-token?${params}`);

			if (!response.ok) {
				throw new Error("Failed to get LiveKit token");
			}

			const data = await response.json();
			setToken(data.token);
			setWsUrl(data.wsUrl);
		} catch (err) {
			console.error("Error fetching token:", err);
			setError("Failed to connect to voice assistant");
		} finally {
			setIsConnecting(false);
		}
	};

	const handleDisconnect = useCallback(() => {
		// Log the end of voice session
		contextService.logActivity(
			"voice_session_ended",
			"Ended DoGood Companion voice session"
		);

		setToken("");
		setWsUrl("");
		onClose();
	}, [onClose]);

	if (!isActive) return null;

	if (error) {
		return (
			<div
				className="fixed inset-0 z-50 flex items-center justify-center"
				style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
				<div
					className="rounded-3xl p-8 shadow-2xl max-w-md"
					style={{ backgroundColor: "#405169" }}>
					<div className="relative flex flex-col items-center gap-6">
						<h3
							className="text-white text-center"
							style={{
								fontFamily: "Cooper Black, Cooper Std, serif",
								fontWeight: 900,
								fontSize: "20px",
							}}>
							Connection Error
						</h3>
						<p
							className="text-white/80 text-center text-sm"
							style={{ fontFamily: "Cooper Black, Cooper Std, serif" }}>
							{error}
						</p>
						<button
							onClick={handleDisconnect}
							className="px-6 py-2 rounded-full text-white font-semibold"
							style={{ backgroundColor: "#9D5C45" }}>
							Close
						</button>
					</div>
				</div>
			</div>
		);
	}

	if (isConnecting || !token || !wsUrl) {
		return (
			<div
				className="fixed inset-0 z-50 flex items-center justify-center"
				style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
				<div
					className="rounded-3xl p-8 shadow-2xl"
					style={{ backgroundColor: "#405169" }}>
					<div className="relative flex flex-col items-center gap-6">
						<h3
							className="text-white text-center"
							style={{
								fontFamily: "Cooper Black, Cooper Std, serif",
								fontWeight: 900,
								fontSize: "20px",
							}}>
							Connecting...
						</h3>
						<div className="flex items-center gap-2">
							{[...Array(7)].map((_, i) => (
								<div
									key={i}
									className="w-2 rounded-full"
									style={{
										backgroundColor: "#E8DC93",
										height: "32px",
										animation: `wave 0.6s ease-in-out infinite ${i * 0.1}s`,
									}}
								/>
							))}
						</div>
					</div>
				</div>
				<style>{`
          @keyframes wave {
            0%, 100% { height: 16px; }
            50% { height: 48px; }
          }
        `}</style>
			</div>
		);
	}

	return (
		<>
			{/* Compact floating voice module - persistent across navigation */}
			<div
				className="fixed bottom-4 right-4 z-50"
				style={{ pointerEvents: "all" }}>
				<div
					className="rounded-2xl p-4 shadow-2xl"
					style={{
						backgroundColor: "#405169",
						width: "280px",
						maxHeight: "200px",
					}}>
					{/* Vintage Paper Texture Overlay */}
					<div
						className="absolute inset-0 opacity-[0.1] pointer-events-none rounded-2xl"
						style={{
							backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
							mixBlendMode: "multiply",
						}}
					/>

					<div className="relative flex flex-col items-center gap-2">
						<h3
							className="text-white text-center"
							style={{
								fontFamily: "Cooper Black, Cooper Std, serif",
								fontWeight: 900,
								fontSize: "14px",
							}}>
							DoGood Companion
						</h3>

						<LiveKitRoom
							token={token}
							serverUrl={wsUrl}
							connect={true}
							audio={true}
							video={false}
							onDisconnected={handleDisconnect}>
							<VoiceAssistantContent
								onEndConvo={handleDisconnect}
								onClaudeCommand={handleClaudeCommand}
							/>
						</LiveKitRoom>
					</div>
				</div>
			</div>
		</>
	);
}

function VoiceAssistantContent({
	onEndConvo,
	onClaudeCommand,
}: {
	onEndConvo: () => void;
	onClaudeCommand: (payload: Uint8Array) => void;
}) {
	const { state, audioTrack } = useVoiceAssistant();
	const room = useRoomContext();

	// Listen for data messages from voice agent using correct RoomEvent enum
	useEffect(() => {
		if (!room) {
			console.log("[VoiceAssistant] No room available yet");
			return;
		}

		console.log("[VoiceAssistant] Setting up data listener");

		const handleData = (
			payload: Uint8Array,
			participant?: any,
			kind?: number
		) => {
			console.log("[VoiceAssistant] Data received!", {
				payloadLength: payload.length,
				participant: participant?.identity,
				kind,
			});
			onClaudeCommand(payload);
		};

		room.on(RoomEvent.DataReceived, handleData);
		console.log("[VoiceAssistant] Data listener registered");

		return () => {
			console.log("[VoiceAssistant] Cleaning up data listener");
			room.off(RoomEvent.DataReceived, handleData);
		};
	}, [room, onClaudeCommand]);

	return (
		<div className="flex flex-col items-center gap-2 w-full">
			{/* Audio Renderer - handles playback */}
			<RoomAudioRenderer />

			{/* Compact Audio Visualizer */}
			<div className="w-full flex justify-center" style={{ height: "40px" }}>
				{audioTrack && (
					<BarVisualizer
						state={state}
						barCount={5}
						trackRef={audioTrack}
						className="voice-assistant-visualizer"
					/>
				)}
				{!audioTrack && (
					<div className="flex items-center gap-1">
						{[...Array(5)].map((_, i) => (
							<div
								key={i}
								className="w-1.5 rounded-full"
								style={{
									backgroundColor: "#E8DC93",
									height: state === "listening" ? "20px" : "8px",
									animation:
										state === "listening"
											? `wave 0.6s ease-in-out infinite ${i * 0.1}s`
											: "none",
									transition: "height 0.3s ease",
								}}
							/>
						))}
					</div>
				)}
			</div>

			{/* Compact State Display */}
			<p
				className="text-white text-center"
				style={{
					fontFamily: "Cooper Black, Cooper Std, serif",
					fontWeight: 700,
					fontSize: "12px",
				}}>
				{state === "listening" && "Listening..."}
				{state === "thinking" && "Thinking..."}
				{state === "speaking" && "Speaking..."}
				{!state || state === "initializing" ? "Ready!" : ""}
			</p>

			{/* Compact End Button */}
			<button
				onClick={onEndConvo}
				className="rounded-full px-3 py-1 flex items-center justify-center gap-1 shadow-md hover:shadow-lg transition-all active:scale-95"
				style={{
					backgroundColor: "#9D5C45",
					fontFamily: "Cooper Black, Cooper Std, serif",
					fontWeight: 700,
					color: "white",
					fontSize: "11px",
					letterSpacing: "0.2px",
				}}>
				End
			</button>

			<style>{`
        @keyframes wave {
          0%, 100% { height: 8px; }
          50% { height: 20px; }
        }
        .voice-assistant-visualizer {
          width: 100%;
          max-width: 200px;
        }
      `}</style>
		</div>
	);
}
