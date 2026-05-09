import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '#/lib/supabase';
import { Box, CheckCheck } from 'lucide-react';

export const Route = createFileRoute('/test/todo')({
  loader: async () => {
    const { data: todos } = await supabase.from('todos').select()
    return { todos }
  },
  component: Home,
})

function Home() {
  const { todos } = Route.useLoaderData()

  return <div>
    <h1>Test</h1>
    <ul>
      {todos?.map((todo) => (
        <li key={todo.id} className="grid grid-cols-4 w-96">
          <p className="col-span-3">
            {todo.name}
          </p>
          <div>
            {
              todo.done ? <CheckCheck /> : <Box />
            }
          </div>
        </li>
      ))}
    </ul>
  </div>;
}
