import { 
  IconMessageCircle, 
  IconBriefcase, 
  IconUsers, 
  IconToolsKitchen, 
  IconHome, 
  IconBuilding, 
  IconStethoscope, 
  IconLayersSubtract, 
  IconAlertTriangle, 
  IconPencil, 
  IconBook, 
  IconMap, 
  IconWorld, 
  IconVolume, 
  IconVolumeOff, 
  IconTrash, 
  IconMicrophone, 
  IconCheck, 
  IconKey, 
  IconArrowRight,
  IconUser,
  IconSettings,
  IconMenu2,
  IconChevronLeft,
  IconCircleCheck,
  IconMoon,
  IconSun
} from '@tabler/icons-react';

const icons = {
  MessageCircle: IconMessageCircle,
  Briefcase: IconBriefcase,
  Users: IconUsers,
  Utensils: IconToolsKitchen,
  Home: IconHome,
  Building2: IconBuilding,
  Stethoscope: IconStethoscope,
  Layers: IconLayersSubtract,
  AlertTriangle: IconAlertTriangle,
  PenTool: IconPencil,
  BookOpen: IconBook,
  Map: IconMap,
  Globe: IconWorld,
  Volume2: IconVolume,
  VolumeX: IconVolumeOff,
  Trash2: IconTrash,
  Mic: IconMicrophone,
  Check: IconCheck,
  CheckCircle: IconCircleCheck,
  Key: IconKey,
  ArrowRight: IconArrowRight,
  User: IconUser,
  Settings: IconSettings,
  Menu: IconMenu2,
  ChevronLeft: IconChevronLeft,
  Moon: IconMoon,
  Sun: IconSun
};

export function Icon({ name, size = 20, color, ...props }) {
  const TablerIcon = icons[name] || IconMessageCircle;
  return <TablerIcon size={size} color={color} strokeWidth={1.5} {...props} />;
}
