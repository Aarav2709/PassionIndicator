import { useState } from 'react';
import { useTimer } from '@/context/TimerContext';
import { Check, Plus } from 'lucide-react';

export default function TodoList() {
  const {
    todos,
    addTodo,
    toggleTodo,
    subjects,
  } = useTimer();

  const [text, setText] = useState('');
  const [subject, setSubject] = useState(subjects[0]?.id || '');

  const handleAdd = async () => {
    if (!text.trim() || !subject) return;

    await addTodo(subject, text.trim());
    setText('');
  };

  return (
    <div className="rounded-[2rem] border border-[#1a1a1a] bg-[#080808] p-6">
      <h2 className="mb-4 text-lg text-white">
        Tasks
      </h2>

      <div className="mb-5 flex gap-2">
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="ypt-input max-w-[150px]"
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAdd();
            }
          }}
          placeholder="Add task"
          className="ypt-input flex-1"
        />

        <button
          className="ypt-btn-primary inline-flex items-center justify-center px-4"
          onClick={handleAdd}
        >
          <Plus size={15} />
        </button>
      </div>

      <div className="space-y-2">
        {todos.map((todo) => (
          <button
            key={todo.id}
            onClick={() => toggleTodo('', todo.id)}
            className="flex w-full items-center gap-3 text-left"
          >
            <div
              className={
                todo.completed
                  ? 'flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-black'
                  : 'h-5 w-5 rounded-full border border-white/20'
              }
            >
              {todo.completed && <Check size={14} />}
            </div>

            <span
              className={
                todo.completed
                  ? 'text-neutral-500 line-through'
                  : 'text-white'
              }
            >
              {todo.title}
            </span>
          </button>
        ))}

        {todos.length === 0 && (
          <p className="text-sm text-neutral-500">
            No tasks yet.
          </p>
        )}
      </div>
    </div>
  );
}
