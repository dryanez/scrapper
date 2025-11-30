// List of cute animal profile pictures
const ANIMAL_AVATARS = [
  "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=150&h=150&fit=crop&crop=faces",  // Dog
  "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=150&h=150&fit=crop&crop=faces",  // Cat
  "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=150&h=150&fit=crop&crop=faces",  // Rabbit
  "https://images.unsplash.com/photo-1504595403659-9088ce801e29?w=150&h=150&fit=crop&crop=faces",  // Panda
  "https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=150&h=150&fit=crop&crop=faces",   // Dog 2
  "https://images.unsplash.com/photo-1415369629372-26f2fe60c467?w=150&h=150&fit=crop&crop=faces",  // Lion
  "https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=150&h=150&fit=crop&crop=faces",  // Tiger
  "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=150&h=150&fit=crop&crop=faces",  // Red Panda
  "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=150&h=150&fit=crop&crop=faces",  // Cat 2
  "https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=150&h=150&fit=crop&crop=faces",  // Dog 3
  "https://images.unsplash.com/photo-1534567110043-f0708d2b1dc9?w=150&h=150&fit=crop&crop=faces",  // Koala
  "https://images.unsplash.com/photo-1539681136235-02c504e2057d?w=150&h=150&fit=crop&crop=faces",  // Squirrel
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop&crop=faces",   // Fox
  "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=150&h=150&fit=crop&crop=faces",  // Hedgehog
  "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=150&h=150&fit=crop&crop=faces",  // Raccoon
  "https://images.unsplash.com/photo-1571566882372-1598d88abd90?w=150&h=150&fit=crop&crop=faces",  // Owl
  "https://images.unsplash.com/photo-1618826411640-d6df44dd3f7a?w=150&h=150&fit=crop&crop=faces",  // Penguin
  "https://images.unsplash.com/photo-1589952283406-b53a7d1347e8?w=150&h=150&fit=crop&crop=faces",  // Bear
  "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=150&h=150&fit=crop&crop=faces",  // Deer
  "https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=150&h=150&fit=crop&crop=faces",  // Elephant
];

// Generate a consistent animal avatar based on doctor ID
export const getAnimalAvatar = (doctorId, doctorName = '') => {
  if (!doctorId) {
    // Fallback to name-based if no ID
    const nameHash = doctorName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return ANIMAL_AVATARS[nameHash % ANIMAL_AVATARS.length];
  }
  
  // Create a simple hash from the doctor ID
  const hash = doctorId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return ANIMAL_AVATARS[hash % ANIMAL_AVATARS.length];
};