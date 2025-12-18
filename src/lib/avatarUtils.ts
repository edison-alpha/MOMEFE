/**
 * Generate a consistent random avatar emoji based on wallet address
 * Only using circular emojis like in LiveTicker
 */
export const getAvatarFromAddress = (address: string): string => {
  // Only use circular colored emojis (same as LiveTicker)
  const avatars = [
    '🔵', '🟣', '⚪', '🟠', '🟢', 
    '🔴', '🟡', '🟤', '⚫'
  ];

  if (!address) return '🔵';

  // Use the address to generate a consistent index
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % avatars.length;
  return avatars[index];
};

/**
 * Generate avatar with gradient background based on address
 */
export const getAvatarGradient = (address: string): string => {
  const gradients = [
    'from-blue-500 to-blue-700',
    'from-purple-500 to-purple-700',
    'from-pink-500 to-pink-700',
    'from-orange-500 to-orange-700',
    'from-green-500 to-green-700',
    'from-red-500 to-red-700',
    'from-yellow-500 to-yellow-700',
    'from-indigo-500 to-indigo-700',
    'from-teal-500 to-teal-700',
    'from-cyan-500 to-cyan-700',
  ];

  if (!address) return 'from-[#A04545] to-[#8a3b3b]';

  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};
