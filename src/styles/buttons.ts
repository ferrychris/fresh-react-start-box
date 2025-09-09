// Centralized button styles for landing page consistency
// Usage: import { primaryButton, secondaryButton, iconButton } from '@/styles/buttons';

export const primaryButton = [
  'inline-flex items-center justify-center',
  'px-8 py-3',
  'rounded-[20px]',
  'text-white text-sm font-bold',
  'bg-gradient-to-r from-purple-600 to-orange-500',
  'hover:from-purple-700 hover:to-orange-600',
  'transition-all duration-300',
  'shadow-2xl border border-white/20 backdrop-blur-sm',
  'ring-1 ring-white/10 hover:ring-white/20',
  'motion-reduce:transition-none'
].join(' ');

export const secondaryButton = [
  'inline-flex items-center justify-center',
  'px-6 py-3',
  'rounded-[20px]',
  'font-semibold',
  'text-white/90',
  'bg-white/10 hover:bg-white/15',
  'border border-white/20',
  'backdrop-blur-sm',
  'transition-all duration-300',
  'ring-1 ring-white/10 hover:ring-white/20'
].join(' ');

export const outlineButton = [
  'inline-flex items-center justify-center',
  'px-8 py-4',
  'rounded-[20px]',
  'font-semibold',
  'text-fedex-orange',
  'border-2 border-fedex-orange hover:bg-fedex-orange hover:text-white',
  'transition-all duration-300',
  'shadow-lg hover:shadow-xl hover:scale-105'
].join(' ');

export const cardPrimaryButton = [
  'flex-1 px-4 py-2',
  'rounded-[20px] text-sm font-semibold',
  'text-white',
  'bg-gradient-to-r from-purple-600 to-orange-500',
  'hover:from-purple-700 hover:to-orange-600',
  'transition-colors'
].join(' ');

export const iconButton = [
  'px-4 py-2 rounded-[20px]',
  'text-sm font-semibold',
  'transition-colors',
  'bg-gray-200 hover:bg-gray-300 text-gray-700',
  'dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white'
].join(' ');
