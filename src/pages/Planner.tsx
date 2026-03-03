import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimer } from '@/context/TimerContext';
import { Todo } from '@/lib/types';

const Planner = () => {
  const { subjects, todos, addTodo, toggleTodo, formatTime } = useTimer();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [addingForSubject, setAddingForSubject] = useState<string | null>(null);
  const [todoInput, setTodoInput] = useState('');

  // Generate week days around selected date
  const getWeekDays = (center: Date) => {
    const start = new Date(center);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Monday start
    start.setDate(start.getDate() + diff);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays(selectedDate);
  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const isToday = (date: Date) => {
    const now = new Date();
    return date.toDateString() === now.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const prevWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    setSelectedDate(d);
  };

  const nextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    setSelectedDate(d);
  };

  const handleAddTodo = async (subjectId: string) => {
    if (todoInput.trim()) {
      await addTodo(subjectId, todoInput.trim());
      setTodoInput('');
      setAddingForSubject(null);
    }
  };

  // Group todos by subject
  const subjectsWithTodos = subjects.map(subject => ({
    ...subject,
    todos: todos.filter((t: Todo) => t.subjectId === subject.id),
  }));

  const completedCount = todos.filter((t: Todo) => t.completed).length;
  const totalCount = todos.length;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Planner</h2>
        {totalCount > 0 && (
          <div className="text-xs text-neutral-muted font-mono">
            {completedCount}/{totalCount} completed
          </div>
        )}
      </div>

      {/* Week Navigation */}
      <div className="ypt-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevWeek}
            className="p-1 hover:bg-white/5 rounded-lg text-neutral-muted hover:text-white transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <h3 className="text-sm font-bold text-white">
            {selectedDate.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </h3>
          <button
            onClick={nextWeek}
            className="p-1 hover:bg-white/5 rounded-lg text-neutral-muted hover:text-white transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((date, i) => (
            <button
              key={i}
              onClick={() => setSelectedDate(date)}
              className={cn(
                'flex flex-col items-center py-2.5 rounded-xl transition-all',
                isSelected(date)
                  ? 'bg-primary text-white'
                  : isToday(date)
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-neutral-muted hover:bg-white/5'
              )}
            >
              <span className="text-[10px] font-semibold uppercase mb-1">{dayNames[i]}</span>
              <span className="text-sm font-bold">{date.getDate()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tasks by Subject */}
      <div className="space-y-4">
        {subjectsWithTodos.map(subject => (
          <div key={subject.id} className="ypt-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className={cn('w-3 h-3 rounded-full', subject.color)} />
                <h4 className="text-sm font-bold text-white">{subject.name}</h4>
                <span className="text-[10px] text-neutral-muted/50 font-mono">
                  {formatTime(subject.todayTime)}
                </span>
              </div>
              <button
                onClick={() => setAddingForSubject(
                  addingForSubject === subject.id ? null : subject.id
                )}
                className="p-1 rounded-lg text-neutral-muted/40 hover:text-primary hover:bg-primary/5 transition-all"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Add todo input */}
            {addingForSubject === subject.id && (
              <div className="flex gap-2 mb-3">
                <input
                  autoFocus
                  type="text"
                  value={todoInput}
                  onChange={(e) => setTodoInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTodo(subject.id);
                    if (e.key === 'Escape') {
                      setAddingForSubject(null);
                      setTodoInput('');
                    }
                  }}
                  placeholder="Add a study task..."
                  className="ypt-input text-sm py-2"
                />
                <button
                  onClick={() => handleAddTodo(subject.id)}
                  className="px-3 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors shrink-0"
                >
                  <Plus size={16} />
                </button>
              </div>
            )}

            {/* Todo items */}
            {subject.todos.length > 0 ? (
              <div className="space-y-1">
                {subject.todos.map((todo: Todo) => (
                  <div
                    key={todo.id}
                    onClick={() => toggleTodo(subject.id, todo.id)}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/[0.02] cursor-pointer group transition-colors"
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0',
                        todo.completed
                          ? 'bg-primary border-primary text-white'
                          : 'border-neutral-muted/30 group-hover:border-primary/50'
                      )}
                    >
                      {todo.completed && <Check size={10} strokeWidth={3} />}
                    </div>
                    <span
                      className={cn(
                        'text-sm transition-all',
                        todo.completed
                          ? 'line-through text-neutral-muted/40'
                          : 'text-white/80'
                      )}
                    >
                      {todo.title}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-neutral-muted/30 py-2 pl-2">
                No tasks yet
              </div>
            )}
          </div>
        ))}

        {subjects.length === 0 && (
          <div className="ypt-card p-12 text-center">
            <div className="text-neutral-muted text-sm">
              Create subjects first to add study tasks
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Planner;
