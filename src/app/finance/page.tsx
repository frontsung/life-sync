import { FinanceView } from "@/components/finance/finance-view";
import { getTransactions } from "@/app/actions";

export default async function FinancePage() {
  const transactions = await getTransactions();

  return <FinanceView transactions={transactions} />;
}
