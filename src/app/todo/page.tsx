import { TodoView } from "@/components/todo/todo-view";
import { getTodos } from "@/app/actions";

export default async function TodoPage() {
  const todos = await getTodos();

  return <TodoView todos={todos} />;
}
