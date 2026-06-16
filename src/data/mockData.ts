// Static category data - used only for form dropdowns and UI labels
// All mock users, posts, messages, conversations, and notifications have been removed
// The application now exclusively uses real data from Supabase

export const CATEGORIES = [
  "Em Alta", "Memes", "Games", "Tecnologia", "Entretenimento", "Educação"
];

export const HUMOR_STYLES = [
  "Nonsense", "Sátira", "Irônico", "Wholesome",
  "Dark Humor", "Meme Lover", "Reação", "Random"
];

// SVG icons for categories
const CategoryIcons: Record<string, string> = {
  "Em Alta": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M18 5l-5 5-4-4-6 6"/></svg>`,
  "Memes": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="9" r="1"/><circle cx="16" cy="9" r="1"/><path d="M9 16s1.5 2 7 2 7-2 7-2"/><circle cx="12" cy="12" r="10"/></svg>`,
  "Games": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M6 14h.01M14 14h.01"/></svg>`,
  "Tecnologia": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  "Entretenimento": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`,
  "Educação": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v10H6.5z"/><path d="M6.5 12v5"/></svg>`,
};

export const TRENDING_CATEGORIES = [
  { name: "Em Alta", count: "124K memes", icon: CategoryIcons["Em Alta"] },
  { name: "Memes", count: "89K memes", icon: CategoryIcons["Memes"] },
  { name: "Games", count: "76K memes", icon: CategoryIcons["Games"] },
  { name: "Tecnologia", count: "112K memes", icon: CategoryIcons["Tecnologia"] },
  { name: "Entretenimento", count: "45K memes", icon: CategoryIcons["Entretenimento"] },
  { name: "Educação", count: "203K memes", icon: CategoryIcons["Educação"] },
];
