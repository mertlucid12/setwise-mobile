import React from 'react';
import Activity from 'lucide-react-native/icons/activity';
import Anvil from 'lucide-react-native/icons/anvil';
import Award from 'lucide-react-native/icons/award';
import BicepsFlexed from 'lucide-react-native/icons/biceps-flexed';
import CalendarDays from 'lucide-react-native/icons/calendar-days';
import ChartColumn from 'lucide-react-native/icons/chart-column';
import Check from 'lucide-react-native/icons/check';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import ChevronUp from 'lucide-react-native/icons/chevron-up';
import ChevronsUp from 'lucide-react-native/icons/chevrons-up';
import CircleAlert from 'lucide-react-native/icons/circle-alert';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import CircleUser from 'lucide-react-native/icons/circle-user';
import Clock from 'lucide-react-native/icons/clock';
import Dumbbell from 'lucide-react-native/icons/dumbbell';
import Eye from 'lucide-react-native/icons/eye';
import EyeOff from 'lucide-react-native/icons/eye-off';
import Flame from 'lucide-react-native/icons/flame';
import Footprints from 'lucide-react-native/icons/footprints';
import Grid3x3 from 'lucide-react-native/icons/grid-3x3';
import Heart from 'lucide-react-native/icons/heart';
import Hourglass from 'lucide-react-native/icons/hourglass';
import Info from 'lucide-react-native/icons/info';
import Key from 'lucide-react-native/icons/key';
import Lightbulb from 'lucide-react-native/icons/lightbulb';
import List from 'lucide-react-native/icons/list';
import Lock from 'lucide-react-native/icons/lock';
import LogOut from 'lucide-react-native/icons/log-out';
import Mail from 'lucide-react-native/icons/mail';
import MailOpen from 'lucide-react-native/icons/mail-open';
import Mars from 'lucide-react-native/icons/mars';
import Medal from 'lucide-react-native/icons/medal';
import PersonStanding from 'lucide-react-native/icons/person-standing';
import Plus from 'lucide-react-native/icons/plus';
import Ruler from 'lucide-react-native/icons/ruler';
import Scale from 'lucide-react-native/icons/scale';
import Search from 'lucide-react-native/icons/search';
import Send from 'lucide-react-native/icons/send';
import Shield from 'lucide-react-native/icons/shield';
import Sparkles from 'lucide-react-native/icons/sparkles';
import Sprout from 'lucide-react-native/icons/sprout';
import Swords from 'lucide-react-native/icons/swords';
import Trash2 from 'lucide-react-native/icons/trash-2';
import TrendingDown from 'lucide-react-native/icons/trending-down';
import TrendingUp from 'lucide-react-native/icons/trending-up';
import Triangle from 'lucide-react-native/icons/triangle';
import Trophy from 'lucide-react-native/icons/trophy';
import User from 'lucide-react-native/icons/user';
import Venus from 'lucide-react-native/icons/venus';
import X from 'lucide-react-native/icons/x';
import { colors } from '@/theme';

/**
 * Single icon surface for the app, backed by Lucide.
 *
 * Lucide is geometric with a uniform stroke, which suits the warrior
 * direction far better than Ionicons' rounded iOS-style glyphs, and it's the
 * same set the web dashboard uses (lucide-react) so both platforms show
 * identical marks.
 *
 * Keys are kept as the app's existing icon vocabulary rather than Lucide's
 * component names, so call sites read the same and the swap stayed a rename.
 * The map is exhaustive by design: `IconName` is derived from it, so a typo
 * or a missing entry is a compile error rather than a blank icon at runtime.
 *
 * Lucide ships no brand marks, so the Google logo on the auth screen still
 * comes from @expo/vector-icons - it's the one glyph this set can't cover.
 */
const ICONS = {
  add: Plus,
  'alert-circle': CircleAlert,
  barbell: Dumbbell,
  'barbell-outline': Dumbbell,
  'body-outline': Shield,
  bulb: Lightbulb,
  calendar: CalendarDays,
  'calendar-outline': CalendarDays,
  checkmark: Check,
  'checkmark-circle': CircleCheck,
  'chevron-back': ChevronLeft,
  'chevron-down': ChevronDown,
  'chevron-forward': ChevronRight,
  'chevron-up': ChevronUp,
  close: X,
  'ellipse-outline': Ruler,
  'eye-off-outline': EyeOff,
  'eye-outline': Eye,
  female: Venus,
  'finger-print-outline': Info,
  'fitness-outline': Activity,
  flame: Flame,
  'footsteps-outline': Footprints,
  'grid-outline': Grid3x3,
  heart: Heart,
  'help-circle-outline': Info,
  hourglass: Hourglass,
  key: Key,
  'leaf-outline': Sprout,
  list: List,
  'lock-closed-outline': Lock,
  'log-out-outline': LogOut,
  'mail-outline': Mail,
  'mail-unread-outline': MailOpen,
  male: Mars,
  'medal-outline': Medal,
  'person-circle': CircleUser,
  'person-outline': User,
  'scale-outline': Scale,
  search: Search,
  send: Send,
  sparkles: Sparkles,
  'stats-chart': ChartColumn,
  'time-outline': Clock,
  'trash-outline': Trash2,
  'trending-down': TrendingDown,
  'trending-up': TrendingUp,
  'triangle-outline': Triangle,
  trophy: Trophy,
  'walk-outline': PersonStanding,
  // Warrior-flavoured marks, mostly muscle-group tags.
  biceps: BicepsFlexed,
  lats: ChevronsUp,
  anvil: Anvil,
  swords: Swords,
  award: Award,
} as const;

export type IconName = keyof typeof ICONS;

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  /** Heavier than Lucide's default 2 so marks hold their weight on dark. */
  strokeWidth?: number;
}

export default function Icon({ name, size = 18, color = colors.textSecondary, strokeWidth = 2.4 }: Props) {
  const Glyph = ICONS[name];
  return <Glyph size={size} color={color} strokeWidth={strokeWidth} />;
}
