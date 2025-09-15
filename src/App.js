import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import TodoApp from './components/TodoApp';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/todo" element={<TodoApp />} />
      </Routes>
    </Router>
  );
}

export default App;