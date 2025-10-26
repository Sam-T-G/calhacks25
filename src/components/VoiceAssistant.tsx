import { useState, useEffect, useCallback } from "react";
import {
	LiveKitRoom,
	useVoiceAssistant,
	BarVisualizer,
	RoomAudioRenderer,
	useDataChannel,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { contextService } from "../services/contextService";
import { Section } from "../App";

interface VoiceAssistantProps {
	isActive: boolean;
	onClose: () => void;
	onNavigate?: (section: Section) => void;
}

export function VoiceAssistant({ isActive, onClose, onNavigate }: VoiceAssistantProps) {
	const [token, setToken] = useState<string>("");
	const [wsUrl, setWsUrl] = useState<string>("");
	const [isConnecting, setIsConnecting] = useState(false);
	const [error, setError] = useState<string>("");

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
			const fullContext = contextService.getContext();

			// Sync context to MCP server for AI task generation
			await contextService.syncToMCP();

			// Pass context via query params to the token endpoint
			// The endpoint will embed it in room metadata for the voice agent
			const params = new URLSearchParams({
				userContext: userContext,
				sessionId: fullContext.sessionId,
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
			<div
				className="fixed inset-0 z-50 flex items-center justify-center"
				style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
				<div
					className="rounded-3xl p-8 shadow-2xl"
					style={{ backgroundColor: "#405169", minWidth: "400px" }}>
					{/* Vintage Paper Texture Overlay */}
					<div
						className="absolute inset-0 opacity-[0.1] pointer-events-none rounded-3xl"
						style={{
							backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
							mixBlendMode: "multiply",
						}}
					/>

					<div className="relative flex flex-col items-center gap-6">
						<h3
							className="text-white text-center"
							style={{
								fontFamily: "Cooper Black, Cooper Std, serif",
								fontWeight: 900,
								fontSize: "20px",
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
								onNavigate={onNavigate}
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
	onNavigate,
}: {
	onEndConvo: () => void;
	onNavigate?: (section: Section) => void;
}) {
	const { state, audioTrack, agentTranscript } = useVoiceAssistant();

	useDataChannel("agent_dispatch", (event) => {
		if (!event.payload) return;
		const eventName = (event.payload as any).event;
		if (eventName === "navigation_intent") {
			const section = (event.payload as any).section as Section;
			console.log(`[VoiceAssistant] Received navigation intent to ${section}`);
			if (onNavigate && section) {
				onNavigate(section);
				setTimeout(() => {
					onEndConvo();
				}, 1500);
			}
		} else if (eventName === "conversation_end_intent") {
			console.log(`[VoiceAssistant] Received conversation end intent`);
			onEndConvo();
		}
	});

	// Listen for agent transcripts for end of conversation
	useEffect(() => {
		if (!agentTranscript) return;

		const text = agentTranscript.toLowerCase();

		// End conversation if agent says goodbye
		if (
			text.includes("goodbye") ||
			text.includes("bye") ||
			text.includes("ending conversation")
		) {
			console.log("[VoiceAssistant] Detected conversation end");
			setTimeout(() => {
				onEndConvo();
			}, 1000);
		}
	}, [agentTranscript, onEndConvo]);

	return (
		<div className="flex flex-col items-center gap-6 w-full">
			{/* Audio Renderer - handles playback */}
			<RoomAudioRenderer />

			{/* Audio Visualizer */}
			<div className="w-full flex justify-center" style={{ height: "80px" }}>
				{audioTrack && (
					<BarVisualizer
						state={state}
						barCount={7}
						trackRef={audioTrack}
						className="voice-assistant-visualizer"
						options={{
							barColor: "#E8DC93",
							minHeight: 16,
						}}
					/>
				)}
				{!audioTrack && (
					<div className="flex items-center gap-2">
						{[...Array(7)].map((_, i) => (
							<div
								key={i}
								className="w-2 rounded-full"
								style={{
									backgroundColor: "#E8DC93",
									height: state === "listening" ? "32px" : "16px",
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

			{/* State Display */}
			<p
				className="text-white text-center"
				style={{
					fontFamily: "Cooper Black, Cooper Std, serif",
					fontWeight: 700,
					fontSize: "16px",
				}}>
				{state === "listening" && "Listening..."}
				{state === "thinking" && "Thinking..."}
				{state === "speaking" && "Speaking..."}
				{!state || state === "initializing" ? "Ready to help!" : ""}
			</p>

			{/* Powered by LiveKit */}
			<p
				className="text-white/80 text-center text-sm"
				style={{ fontFamily: "Cooper Black, Cooper Std, serif" }}>
				Powered by LiveKit
			</p>

			{/* End Convo Button */}
			<button
				onClick={onEndConvo}
				className="rounded-full px-6 py-2 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"
				style={{
					backgroundColor: "#9D5C45",
					fontFamily: "Cooper Black, Cooper Std, serif",
					fontWeight: 700,
					color: "white",
					fontSize: "14px",
					letterSpacing: "0.3px",
				}}>
				End Conversation
			</button>

			<style>{`
        @keyframes wave {
          0%, 100% { height: 16px; }
          50% { height: 48px; }
        }
        .voice-assistant-visualizer {
          width: 100%;
          max-width: 300px;
        }
      `}</style>
		</div>
	);
}
