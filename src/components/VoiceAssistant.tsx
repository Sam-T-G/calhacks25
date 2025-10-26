interface VoiceAssistantProps {
	isActive: boolean;
	onClose: () => void;
}

export function VoiceAssistant({ isActive, onClose }: VoiceAssistantProps) {
	if (!isActive) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white p-8 rounded-lg shadow-xl text-center">
				<p className="text-lg mb-4">Voice Assistant feature coming soon!</p>
				<button
					onClick={onClose}
					className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
					Close
				</button>
			</div>
		</div>
	);
}
