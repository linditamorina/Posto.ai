import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface Post {
  id: number;
  hook: string;
  caption: string;
}

interface CalendarProps {
  posts: Post[];
  month: string;
}

const MarketingCalendar = ({ posts, month }: CalendarProps) => {
  // Shpërndajmë postimet nëpër ditë (p.sh. çdo 2-3 ditë)
  const events = posts.map((post, index) => {
    const day = (index * 2) + 1; // E nisim nga dita 1, pastaj dita 3, 5...
    return {
      id: post.id,
      title: post.hook,
      start: new Date(2026, 2, day), // Mars 2026 (Muaji 2 në JS sepse nis nga 0)
      end: new Date(2026, 2, day),
      allDay: true,
      resource: post.caption
    };
  });

  return (
    <div className="h-[600px] bg-slate-900 p-4 rounded-xl border border-slate-700 mt-8">
      <h3 className="text-white text-xl font-bold mb-4 capitalize">Kalendari i Postimeve - {month}</h3>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500, color: 'white' }}
        views={['month', 'week']}
        onSelectEvent={(event: { resource: any; }) => alert(event.resource)}
        className="custom-calendar"
      />
      <style jsx global>{`
        .rbc-calendar { color: #cbd5e1; }
        .rbc-event { background-color: #6366f1; border-radius: 4px; }
        .rbc-off-range-bg { background-color: #1e293b; }
        .rbc-today { background-color: #334155; }
      `}</style>
    </div>
  );
};

export default MarketingCalendar;