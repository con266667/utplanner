import React, { useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

function App() {

  const fetchGreeting = async () => {
    // Post with name
    const response = await fetch('api/greetings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'World' })
    });
    const greeting = await response.text();
    console.log(greeting);
  };

  useEffect(() => {
    fetchGreeting();
  }, []);

  return (
    <div className="App">
      
    </div>
  );
}

export default App;
