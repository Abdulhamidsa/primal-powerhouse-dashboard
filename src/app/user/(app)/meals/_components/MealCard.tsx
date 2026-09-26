import Image from 'next/image';
import { ChefHatIcon as ChefHat, ClockIcon as Clock, UsersIcon as Users } from '@phosphor-icons/react/ssr';
import { getMealImageDelivery } from '@/features/meals/utils/mealImageDelivery';

export function MealCard({
  assignment,
  getDayName,
  onOpen,
}: {
  assignment: {
    id: string;
    dayOfWeek: number;
    scheduledTime?: string;
    mealPlan: { name: string };
    meal: {
      id: string;
      name: string;
      description: string;
      prepTime: number;
      cookTime: number;
      servings: number;
      difficulty: string;
      imageUrl?: string;
    };
  };
  getDayName: (d: number) => string;
  onOpen: () => void;
}) {
  const totalTime = (assignment.meal.prepTime ?? 0) + (assignment.meal.cookTime ?? 0);

  const fallback = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=60';

  const imageSrc = assignment.meal.imageUrl?.trim() ? assignment.meal.imageUrl : fallback;
  const image = getMealImageDelivery(imageSrc, 'card');

  const subtitleLeft = `${getDayName(assignment.dayOfWeek)} • ${assignment.mealPlan.name}`;
  const subtitleRight = assignment.scheduledTime ? assignment.scheduledTime : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={e => (e.key === 'Enter' ? onOpen() : null)}
      className={[
        'group overflow-hidden rounded-3xl border border-border bg-card',
        'transition-all hover:shadow-md active:translate-y-0',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      ].join(' ')}
    >
      <div className="relative h-44 w-full">
        <Image
          src={image.src}
          alt={assignment.meal.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={false}
          unoptimized={image.unoptimized}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-2xl bg-black/35 backdrop-blur">
          <ChefHat aria-hidden="true" focusable="false" size={16} className="text-white/90" />
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="truncate rounded-full bg-black/35 px-3 py-1 text-[11px] text-white/90 backdrop-blur">
            {subtitleLeft}
          </span>
          {subtitleRight ? (
            <span className="shrink-0 rounded-full bg-black/35 px-3 py-1 text-[11px] text-white/90 backdrop-blur">
              {subtitleRight}
            </span>
          ) : null}
        </div>
      </div>

      <div className="p-4">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-foreground">{assignment.meal.name}</h3>
          {assignment.meal.description ? (
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{assignment.meal.description}</p>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <MetaChip icon={<Clock aria-hidden="true" focusable="false" size={12} />} label={`${totalTime}m`} />
          <MetaChip icon={<Users aria-hidden="true" focusable="false" size={12} />} label={`${assignment.meal.servings} servings`} />
          <MetaChip label={assignment.meal.difficulty} />
        </div>
      </div>
    </div>
  );
}

function MetaChip({ icon, label }: { icon?: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 px-2.5 py-1 text-[11px] text-muted-foreground">
      {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      <span className="leading-none">{label}</span>
    </span>
  );
}
