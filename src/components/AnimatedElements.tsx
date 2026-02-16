'use client';

import { useState, useCallback, ReactNode } from 'react';

interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'ripple' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function AnimatedButton({
  children,
  onClick,
  className = '',
  variant = 'default',
  disabled = false,
  type = 'button'
}: AnimatedButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = useCallback(() => {
    if (!disabled) setIsPressed(true);
  }, [disabled]);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
  }, []);

  const baseClasses = 'transition-all duration-150 ease-out select-none';
  
  const variantClasses = {
    default: 'btn-press',
    ripple: 'btn-ripple',
    danger: 'btn-press hover:bg-red-50'
  };

  const pressedClasses = isPressed ? 'scale-95 opacity-90' : 'scale-100 opacity-100';

  return (
    <button
      type={type}
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${pressedClasses} ${className}`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {children}
    </button>
  );
}

// Animated Card Component
interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  isDeleting?: boolean;
  deleteDirection?: 'left' | 'right';
}

export function AnimatedCard({
  children,
  className = '',
  onClick,
  isDeleting = false,
  deleteDirection = 'left'
}: AnimatedCardProps) {
  const deleteClass = isDeleting 
    ? (deleteDirection === 'left' ? 'card-deleting' : 'card-deleting-right')
    : '';

  return (
    <div
      onClick={onClick}
      className={`card-press ${deleteClass} ${className}`}
      style={{ 
        WebkitTapHighlightColor: 'transparent',
        willChange: isDeleting ? 'transform, opacity, max-height' : 'auto'
      }}
    >
      {children}
    </div>
  );
}

// Animated Icon Button
interface IconButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  title?: string;
  variant?: 'default' | 'delete';
}

export function IconButton({
  children,
  onClick,
  className = '',
  title,
  variant = 'default'
}: IconButtonProps) {
  const baseClasses = 'p-2 rounded-full transition-all duration-150 ease-out select-none';
  const variantClasses = variant === 'delete' 
    ? 'delete-btn text-gray-400 hover:text-red-600' 
    : 'icon-btn text-gray-600 hover:bg-gray-100';

  return (
    <button
      onClick={onClick}
      title={title}
      className={`${baseClasses} ${variantClasses} ${className}`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {children}
    </button>
  );
}

// Animated Tab
interface AnimatedTabProps {
  children: ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function AnimatedTab({
  children,
  isActive = false,
  onClick,
  className = ''
}: AnimatedTabProps) {
  return (
    <button
      onClick={onClick}
      className={`tab-press relative overflow-hidden transition-colors duration-150 ${
        isActive ? 'text-white' : 'text-gray-600'
      } ${className}`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <span className="relative z-10">{children}</span>
      {isActive && (
        <span className="absolute inset-0 bg-red-600" />
      )}
    </button>
  );
}

// Fade In Animation Wrapper
interface FadeInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, className = '' }: FadeInProps) {
  return (
    <div
      className={`stagger-in ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// Shake Animation Wrapper (for errors)
interface ShakeProps {
  children: ReactNode;
  shouldShake?: boolean;
  className?: string;
}

export function Shake({ children, shouldShake = false, className = '' }: ShakeProps) {
  return (
    <div className={`${shouldShake ? 'shake' : ''} ${className}`}>
      {children}
    </div>
  );
}
