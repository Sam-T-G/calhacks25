import { useState, useEffect } from 'react';
import { toast } from 'sonner@2.0.3';

interface VoiceAssistantProps {
  isActive: boolean;
  onClose: () => void;
}

export function VoiceAssistant({ isActive, onClose }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isActive) {
      setIsListening(true);
      
      // Simulate listening and processing
      setTimeout(() => {
        setIsListening(false);
        setIsProcessing(true);
        
        // Simulate response
        setTimeout(() => {
          setIsProcessing(false);
          toast.success('AI Assistant Response', {
            description: 'Response received! Continue using DoGood to earn more XP.'
          });
          onClose();
        }, 1500);
      }, 2000);
    }
  }, [isActive, onClose]);

  if (!isActive) return null;

  return (
    <>
      {/* Audio Waves Overlay - Centered in Screen */}
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="rounded-3xl p-8 shadow-2xl" style={{ backgroundColor: '#405169' }}>
          {/* Vintage Paper Texture Overlay */}
          <div 
            className="absolute inset-0 opacity-[0.1] pointer-events-none rounded-3xl"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
              mixBlendMode: 'multiply'
            }}
          />
          
          <div className="relative flex flex-col items-center gap-6">
            <h3 className="text-white text-center" style={{ fontFamily: 'Cooper Black, Cooper Std, serif', fontWeight: 900, fontSize: '20px' }}>
              AI Companion
            </h3>
            
            {/* Audio Wave Bars */}
            <div className="flex items-center gap-2">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 rounded-full"
                  style={{
                    backgroundColor: '#E8DC93',
                    height: isListening ? '32px' : '16px',
                    animation: isListening ? `wave 0.6s ease-in-out infinite ${i * 0.1}s` : 'none',
                    transition: 'height 0.3s ease'
                  }}
                />
              ))}
            </div>
            
            <p className="text-white text-center" style={{ fontFamily: 'Cooper Black, Cooper Std, serif', fontWeight: 700, fontSize: '16px' }}>
              {isListening ? 'Listening...' : 'Processing...'}
            </p>
            
            <p className="text-white/80 text-center text-sm" style={{ fontFamily: 'Cooper Black, Cooper Std, serif' }}>
              Powered by LiveKit
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes wave {
          0%, 100% { height: 16px; }
          50% { height: 48px; }
        }
      `}</style>
    </>
  );
}
