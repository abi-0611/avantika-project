import React from 'react';
import { motion } from 'motion/react';
import { Shield, ThumbsUp, ThumbsDown, Copy, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import RiskBadge from './RiskBadge';

interface ChatBubbleProps {
  key?: React.Key;
  message: {
    id: string;
    text: string;
    sender: string;
    timestamp: string;
    riskLevel?: string;
    riskCategory?: string;
  };
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.sender === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn("flex w-full group", isUser ? "justify-end" : "justify-start")}
    >
      <div className={cn("flex max-w-[85%] md:max-w-[75%] gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
        
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-primary/20">
            <Shield className="w-4 h-4 text-white" />
          </div>
        )}

        <div className="flex flex-col gap-1 min-w-0">
          <div className={cn(
            "px-5 py-3.5 text-[15px] leading-relaxed relative",
            isUser 
              ? "bg-gradient-to-br from-primary to-secondary text-white rounded-2xl rounded-tr-sm shadow-lg shadow-primary/20" 
              : "glass-panel rounded-2xl rounded-tl-sm"
          )}>
            <p className="whitespace-pre-wrap break-words">{message.text}</p>
            
            {/* Risk Badge for Bot Messages */}
            {!isUser && message.riskLevel && message.riskLevel !== 'Safe' && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <RiskBadge level={message.riskLevel} />
                {message.riskCategory && (
                  <span className="ml-2 text-xs text-text-secondary">Category: {message.riskCategory}</span>
                )}
              </div>
            )}
          </div>

          {/* Action Row & Timestamp */}
          <div className={cn(
            "flex items-center gap-3 text-xs text-text-secondary mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity",
            isUser ? "justify-end" : "justify-start"
          )}>
            <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            
            {!isUser && (
              <div className="flex items-center gap-2">
                <button className="hover:text-primary transition-colors p-1"><ThumbsUp className="w-3.5 h-3.5" /></button>
                <button className="hover:text-danger transition-colors p-1"><ThumbsDown className="w-3.5 h-3.5" /></button>
                <button className="hover:text-white transition-colors p-1"><Copy className="w-3.5 h-3.5" /></button>
                <button className="hover:text-white transition-colors p-1"><RefreshCw className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
