import Image from 'next/image';
import { CalendarDotsIcon as CalendarDays, ClockIcon as Clock, FilmSlateIcon as Film, FileTextIcon as FileText, PlusCircleIcon as PlusCircle, TrashIcon as Trash2 } from '@phosphor-icons/react/ssr';
import { cx, iosCardStyle, iosPanel, iosPanelStyle } from '../../lib/ui';
import { VideoAssignment } from '@/types/video';
import { formatDuration } from '@/helpers';
import { JSX } from 'react/jsx-dev-runtime';

export function VideosTab({
  assignments,
  onAssign,
  onRemove,
}: {
  assignments: VideoAssignment[];
  onAssign: () => void;
  onRemove: (assignmentId: string) => Promise<void>;
}) {
  return (
    <section className={cx(iosPanel, 'p-5 sm:p-6')} style={iosPanelStyle}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <h3 className="text-lg sm:text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
          Assigned Videos
        </h3>

        <button
          onClick={onAssign}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition active:scale-[0.99]"
          style={{ background: 'var(--color-accent)', color: 'var(--color-text)' }}
        >
          <PlusCircle size={18} />
          Assign Videos
        </button>
      </div>

      {assignments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {assignments.map(a => {
            if (!a.video) return null;

            return (
              <div key={a.id} className="border rounded-2xl p-4 transition shadow-sm" style={iosCardStyle}>
                <div className="flex items-start gap-3">
                  {a.video.thumbnailUrl ? (
                    <div
                      className="relative w-20 h-16 rounded-xl overflow-hidden flex-shrink-0 border"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      <Image
                        src={a.video.thumbnailUrl}
                        alt={a.video.title}
                        className="object-cover"
                        fill
                        sizes="80px"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-20 h-16 rounded-xl flex items-center justify-center flex-shrink-0 border"
                      style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                    >
                      <Film className="w-8 h-8" style={{ color: 'var(--color-accent)' }} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                      {a.video.title}
                    </h4>

                    <div
                      className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} /> {formatDuration(a.video.duration)}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{a.video.difficulty}</span>
                      <span>•</span>
                      <span className="capitalize">{a.video.category}</span>
                    </div>

                    <div className="mt-2 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={10} /> Assigned: {new Date(a.assignedDate).toLocaleDateString()}
                      </span>
                    </div>

                    {a.notes && (
                      <div
                        className="mt-2 text-[11px] p-2 rounded-xl border"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-accent)',
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <FileText size={12} className="mt-[2px]" />
                          <span className="leading-snug">{a.notes}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onRemove(a.id)}
                    className="p-2 rounded-xl border transition active:scale-[0.99]"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-accent)',
                    }}
                    title="Remove assignment"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Film size={56} style={{ color: 'var(--color-text-muted)' }} />}
          title="No Videos Assigned"
          subtitle="This client does not have any assigned videos yet."
          buttonLabel="Assign First Video"
          onClick={onAssign}
        />
      )}
    </section>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
  buttonLabel,
  onClick,
}: {
  icon: JSX.Element;
  title: string;
  subtitle: string;
  buttonLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="text-center py-12">
      <div className="mb-4 flex justify-center">{icon}</div>
      <h3 className="text-base sm:text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
        {title}
      </h3>
      <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
        {subtitle}
      </p>
      <button
        onClick={onClick}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition active:scale-[0.99]"
        style={{ background: 'var(--color-accent)', color: 'var(--color-text)' }}
      >
        <PlusCircle size={18} />
        {buttonLabel}
      </button>
    </div>
  );
}
