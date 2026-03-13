// Couleurs de l'application - Palette moderne et élégante
export const COLORS = {
  // Primary - Bleu professionnel moderne
  primary: '#3B82F6',       // Bleu vif et moderne
  primaryDark: '#2563EB',   // Bleu plus foncé
  primaryLight: '#DBEAFE',  // Bleu très clair

  // Secondary - Orange/Ambre chaleureux
  secondary: '#F59E0B',     // Ambre moderne
  secondaryDark: '#D97706',
  secondaryLight: '#FEF3C7',

  // Accent - Violet moderne
  accent: '#8B5CF6',
  accentLight: '#EDE9FE',

  // Status colors
  success: '#10B981',       // Vert moderne
  error: '#EF4444',         // Rouge moderne
  warning: '#F59E0B',       // Orange moderne
  info: '#3B82F6',

  // Backgrounds
  background: '#F9FAFB',    // Gris très clair
  backgroundDark: '#F3F4F6',
  surface: '#FFFFFF',
  surfaceHover: '#F9FAFB',

  // Text
  text: '#111827',          // Presque noir
  textSecondary: '#6B7280', // Gris moyen
  textLight: '#9CA3AF',     // Gris clair

  // Borders & Dividers
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  divider: '#E5E7EB',

  // Shadows
  shadow: '#00000015',
  shadowDark: '#00000030',

  // Basic
  white: '#FFFFFF',
  black: '#000000',
  dark: '#111827',  // Alias pour text (compatibilité)

  // Grays
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Catégorie colors
  lightGray: '#F3F4F6',
  mediumGray: '#D1D5DB',
  darkGray: '#4B5563',
};

// Catégories de services - IMPORTANT: Les labels doivent correspondre aux catégories du backend
export const SERVICE_CATEGORIES = [
  { id: 'plomberie', label: 'Plomberie', iconName: 'water-outline' },
  { id: 'electricite', label: 'Électricité', iconName: 'flash-outline' },
  { id: 'menuiserie', label: 'Menuiserie', iconName: 'construct-outline' },
  { id: 'maconnerie', label: 'Maçonnerie', iconName: 'business-outline' },
  { id: 'peinture', label: 'Peinture', iconName: 'color-palette-outline' },
  { id: 'carrelage', label: 'Carrelage', iconName: 'grid-outline' },
  { id: 'jardinage', label: 'Jardinage', iconName: 'leaf-outline' },
  { id: 'nettoyage', label: 'Nettoyage', iconName: 'sparkles-outline' },
  { id: 'demenagement', label: 'Déménagement', iconName: 'cube-outline' },
  { id: 'reparation', label: 'Réparation', iconName: 'hammer-outline' },
  { id: 'installation', label: 'Installation', iconName: 'settings-outline' },
  { id: 'climatisation', label: 'Climatisation', iconName: 'snow-outline' },
  { id: 'mecanique', label: 'Mécanique', iconName: 'cog-outline' },
];

// Statuts de demande de service
export const REQUEST_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'inProgress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Modes de demande
export const REQUEST_MODES = {
  DIRECT: 'direct',
  AUCTION: 'auction',
};

// Statuts de devis
export const QUOTE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
};

// Types de messages
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  LOCATION: 'location',
  SYSTEM: 'system',
};

// Statuts de message
export const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
};

// Niveaux d'urgence
export const URGENCY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

// Distance maximale de recherche (en km)
export const MAX_SEARCH_DISTANCE = 20;

// Types de profils utilisateur
export const USER_TYPES = {
  CLIENT: 'client',
  WORKER: 'worker',
};
