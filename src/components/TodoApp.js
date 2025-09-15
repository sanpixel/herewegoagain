import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NODE_ENV === 'production' 
    ? `${process.env.REACT_APP_SITE_URL}/api`
    : 'http://localhost:3000/api';

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await fetch(`${API_URL}/todos`);
      if (response.ok) {
        const data = await response.json();
        setTodos(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch todos');
        setTodos([]);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
      setTodos([]);
    }
  };

  const addTodo = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
      });
      
      if (response.ok) {
        setInput('');
        await fetchTodos();
      } else {
        console.error('Failed to add todo');
      }
    } catch (error) {
      console.error('Error adding todo:', error);
    }
    setLoading(false);
  };

  const toggleTodo = async (id, completed) => {
    try {
      const response = await fetch(`${API_URL}/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed })
      });
      
      if (response.ok) {
        await fetchTodos();
      } else {
        console.error('Failed to toggle todo');
      }
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  const deleteTodo = async (id) => {
    try {
      const response = await fetch(`${API_URL}/todos/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchTodos();
      } else {
        console.error('Failed to delete todo');
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <Link 
            to="/"
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            ← Home
          </Link>
        </div>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            placeholder="Add a todo..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-black"
            disabled={loading}
          />
          <button
            onClick={addTodo}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '...' : 'Add'}
          </button>
        </div>

        <div className="space-y-2">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-2 p-2 border border-gray-200 rounded-md"
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id, todo.completed)}
                className="rounded"
              />
              <span 
                className={`flex-1 text-black ${todo.completed ? 'line-through text-gray-500' : ''}`}
              >
                {todo.text}
              </span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TodoApp;