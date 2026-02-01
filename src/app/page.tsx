import { getEvents, getTodos, getTransactions } from "@/app/actions";
import { DashboardView } from "@/components/dashboard-view";

export default async function DashboardPage() {
  const events = await getEvents();
  const todos = await getTodos();
  const transactions = await getTransactions();

  return <DashboardView events={events} todos={todos} transactions={transactions} />;
}
