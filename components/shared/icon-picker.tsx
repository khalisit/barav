'use client';

import * as React from 'react';
import * as LucideIcons from 'lucide-react';
import { Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/hooks/use-language';
import { cn } from '@/lib/utils';

// Curated list of beautiful, premium icons appropriate for categories
const CURATED_ICONS = [
  // Science & Tech
  'Atom', 'FlaskConical', 'Microscope', 'TestTube', 'Dna', 'Telescope', 'Brain', 'Code', 'Monitor', 'Smartphone', 'Cpu', 'Laptop', 'Database', 'Cloud', 'Server',
  // Geography & Nature
  'Globe', 'Map', 'Compass', 'MapPin', 'Mountain', 'Tent', 'Earth', 'Leaf', 'Bug', 'Bird', 'Fish', 'Trees', 'Flower', 'Flame', 'Droplet', 'Wind', 'Sun', 'Moon', 'CloudLightning',
  // Sports & Games
  'Dumbbell', 'Bike', 'Goal', 'Swords', 'Timer', 'Footprints', 'Medal', 'Trophy', 'Crown', 'Target', 'Zap',
  // Education & Math
  'BookOpen', 'GraduationCap', 'Lightbulb', 'Calculator', 'Percent', 'Sigma', 'Pi', 'Library',
  // History & Arts
  'Landmark', 'Hourglass', 'ScrollText', 'Palette', 'Brush', 'PenTool', 'Music', 'Piano', 'Guitar', 'Drum',
  // Entertainment & Media
  'Film', 'Clapperboard', 'Ticket', 'Tv', 'Camera', 'Image', 'Video', 'Headphones',
  // Communication
  'Languages', 'MessageCircle', 'Speech', 'Megaphone', 'Bell',
  // General UI
  'LayoutDashboard', 'Users', 'FolderTree', 'FileText', 'Settings', 'Star', 'Heart', 'Shield', 'Briefcase', 'ShoppingBag', 'ShoppingCart', 'CreditCard', 'Wallet', 'Gift', 'Calendar', 'Clock', 'Award', 'CheckCircle', 'Info', 'HelpCircle'
];

interface IconPickerProps {
  value?: string | null;
  onChange: (iconName: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const { language } = useLanguage();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const filteredIcons = React.useMemo(() => {
    if (!search) return CURATED_ICONS;
    return CURATED_ICONS.filter((icon) => icon.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  // Safely get the selected icon component
  const SelectedIcon = value ? (LucideIcons as any)[value] : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-start text-muted-foreground"
        >
          {SelectedIcon ? (
            <>
              <SelectedIcon className="me-2 h-4 w-4 text-foreground" />
              <span className="text-foreground">{value}</span>
            </>
          ) : (
            <>
              <Search className="me-2 h-4 w-4" />
              {language === 'ku' ? 'ئایکۆنێک هەڵبژێرە...' : 'Select an icon...'}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-2" align="start">
        <div className="flex items-center border-b px-2 pb-2">
          <Search className="me-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            className="flex h-8 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={language === 'ku' ? 'گەڕان بۆ ئایکۆن...' : 'Search icon...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <ScrollArea className="h-64 pt-2">
          <div className="grid grid-cols-5 gap-2 p-1">
            {filteredIcons.map((iconName) => {
              const IconComponent = (LucideIcons as any)[iconName];
              if (!IconComponent) return null;
              
              const isSelected = value === iconName;
              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => {
                    onChange(iconName);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-md border p-2 hover:bg-accent hover:text-accent-foreground transition-all",
                    isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-background"
                  )}
                  title={iconName}
                >
                  <IconComponent className="h-5 w-5" />
                </button>
              );
            })}
          </div>
          {filteredIcons.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">
              {language === 'ku' ? 'هیچ ئایکۆنێک نەدۆزرایەوە.' : 'No icons found.'}
            </p>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
