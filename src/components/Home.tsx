import { Hand, Target, TrendingUp, MousePointerClick, Mic, ExternalLink } from 'lucide-react';

interface HomeProps {
  xpPoints: number;
  onNavigate: (section: string) => void;
  onVoiceAssistant: () => void;
}

export function Home({ xpPoints, onNavigate, onVoiceAssistant }: HomeProps) {
  
  const categories = [
    {
      id: 'serve',
      title: 'serve',
      icon: Hand,
      bgColor: '#9D5C45'
    },
    {
      id: 'productivity',
      title: 'be productive',
      icon: Target,
      bgColor: '#3B3766'
    },
    {
      id: 'self-improve',
      title: 'self-improve',
      icon: TrendingUp,
      bgColor: '#4A5A3C'
    },
    {
      id: 'shop',
      title: 'shop',
      icon: MousePointerClick,
      bgColor: '#4A3B35'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 py-16 relative" style={{ backgroundColor: '#E8DC93' }}>
      {/* Vintage Paper Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
          mixBlendMode: 'multiply'
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="flex items-baseline justify-center -space-x-1">
            <span 
              className="text-[64px] leading-none tracking-tight"
              style={{ 
                fontFamily: 'Cooper Black, Cooper Std, serif',
                fontWeight: 900,
                color: '#405169',
                textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              DO
            </span>
            <span 
              className="text-[52px] leading-none -ml-1"
              style={{ 
                fontFamily: 'Brush Script MT, cursive',
                fontWeight: 400,
                fontStyle: 'italic',
                color: '#405169',
                textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              good
            </span>
          </div>
        </div>

        {/* XP Counter */}
        <div 
          className="w-full rounded-full px-5 py-2 mb-6 shadow-sm"
          style={{ 
            backgroundColor: '#405169',
            boxShadow: '0 2px 4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}
        >
          <div className="flex items-center justify-between">
            <span 
              className="text-white text-[13px]" 
              style={{ 
                fontFamily: 'Cooper Black, Cooper Std, serif',
                fontWeight: 700,
                letterSpacing: '0.3px'
              }}
            >
              XP Points
            </span>
            <span 
              className="text-white text-[16px]" 
              style={{ 
                fontFamily: 'Cooper Black, Cooper Std, serif',
                fontWeight: 900,
                letterSpacing: '0.3px'
              }}
            >
              {xpPoints.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col gap-3 w-full mb-10">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => onNavigate(category.id)}
                className="rounded-full px-5 py-4 flex items-center justify-center gap-3 transition-all active:scale-95 shadow-md hover:shadow-lg"
                style={{ 
                  backgroundColor: category.bgColor,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)'
                }}
              >
                <Icon className="w-6 h-6 text-white flex-shrink-0" strokeWidth={2} />
                <span 
                  className="text-white text-[18px] text-center" 
                  style={{ 
                    fontFamily: 'Cooper Black, Cooper Std, serif',
                    fontWeight: 700,
                    letterSpacing: '0.3px'
                  }}
                >
                  {category.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Yerba Madre Button */}
        <a
          href="https://yerbamadre.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full px-5 py-3 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 w-full"
          style={{
            backgroundColor: '#6B8E23',
            boxShadow: '0 4px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}
        >
          <ExternalLink className="w-5 h-5 text-white" strokeWidth={2} />
          <span
            className="text-white text-[14px] text-center"
            style={{
              fontFamily: 'Cooper Black, Cooper Std, serif',
              fontWeight: 700,
              letterSpacing: '0.3px'
            }}
          >
            visit Yerba Madre
          </span>
        </a>

        {/* Voice Assistant Trigger */}
        <button
          onClick={onVoiceAssistant}
          className="rounded-full px-5 py-3 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 w-full mt-6"
          style={{
            backgroundColor: '#405169',
            boxShadow: '0 4px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}
        >
          <Mic className="w-5 h-5 text-white" strokeWidth={2} />
          <span
            className="text-white text-[14px] text-center"
            style={{
              fontFamily: 'Cooper Black, Cooper Std, serif',
              fontWeight: 700,
              letterSpacing: '0.3px'
            }}
          >
            speak with DoGood companion
          </span>
        </button>
      </div>
    </div>
  );
}
