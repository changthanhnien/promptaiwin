import React from 'react';
import { Feature, FeatureId } from '../types';

interface FeatureCardProps {
  feature: Feature;
  isSelected: boolean;
  onClick: (id: FeatureId) => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ feature, isSelected, onClick }) => {
  const Icon = feature.icon;
  
  return (
    <div 
      onClick={() => onClick(feature.id)}
      className={`
        relative overflow-hidden rounded-xl p-4 cursor-pointer transition-all duration-300 flex flex-col gap-3
        ${isSelected 
          ? 'bg-primary/10 border-primary/50 shadow-glow' 
          : 'bg-surface border-white/5 hover:border-white/10 hover:bg-surfaceHighlight'
        }
        border
      `}
    >
      <div className="flex items-center justify-between">
        <div className={`
          p-2.5 rounded-lg transition-all duration-300
          ${isSelected 
            ? 'bg-primary text-white' 
            : 'bg-slate-800/50 text-slate-400 group-hover:text-slate-200'
          }
        `}>
          <Icon size={20} />
        </div>
        
        {isSelected && (
          <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_currentColor]" />
        )}
      </div>
      
      <div>
        <h3 className={`font-semibold text-sm mb-1 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
            {feature.title}
        </h3>
        <p className={`text-xs leading-relaxed line-clamp-2 ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
            {feature.description}
        </p>
      </div>
    </div>
  );
};