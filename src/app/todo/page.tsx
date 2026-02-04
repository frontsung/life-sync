import { TodoView } from "@/components/todo/todo-view";
// import { getTodos } from "@/app/actions"; // Removed import

export default async function TodoPage() {
  // const todos = await getTodos(); // Removed call

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-8">
      <TodoView /* todos={todos} */ />
    </div>
  );
}
