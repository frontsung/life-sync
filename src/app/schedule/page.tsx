import { CalendarView } from "@/components/calendar/calendar-view";
// import { getEvents } from "@/app/actions"; // Removed import

export default async function SchedulePage() {
  // const events = await getEvents(); // Removed call
  // console.log('Events from getEvents in SchedulePage:', events); // Removed log

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <CalendarView /* events={events} */ />
    </div>
  );
}
