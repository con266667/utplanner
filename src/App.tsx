import React, { useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import Menu3Filled from './icons/List';
import Menu7Filled from './icons/Menu';
import ListFilled from './icons/Week';

function App() {
  const [multiselectState, setMultiselectState] = React.useState(0);
  
  const fetchCourses = async () => {
    const response = await fetch('api/get_courses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({"courseCodeAndTitleProps":{"courseCode":"","courseTitle":"","courseSectionCode":""},"departmentProps":[{"division":"APSC","department":"Division of Engineering Science","type":"DEPARTMENT"}],"campuses":[],"sessions":["20239"],"requirementProps":[],"instructor":"","courseLevels":["200/B"],"deliveryModes":[],"dayPreferences":[],"timePreferences":[],"divisions":["APSC"],"creditWeights":[],"direction":"asc"})
    });
    const json = await response.json();
    console.log(json);
  };

  const selectedCourses = [
    "ESC180",
    "ESC190",
    "ESC194",
    "ESC195",
  ]

  useEffect(() => {
    // fetchCourses();
  }, []);

  function multiselectClick(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    console.log(event);
  }

  return (
    <div className="App">
      <input type="text" placeholder='Search' />
      <div className='selected-courses'>
        {selectedCourses.map((course) => {
          return (
          <div key={course} className='course'>
            <span>{course}</span>
            <h2>×</h2>
          </div>)
        })}
      </div>
      <div className='multiselect' onClick={multiselectClick}>
        <div className='select-box' style={{ "--multiselect-state": multiselectState, "--number-of-states": 3 } as React.CSSProperties}></div>
        <div className='icons'>
          <div className='icon' onClick={()=>setMultiselectState(0)}>
            <Menu3Filled />
          </div>
          <div className='icon' onClick={()=>setMultiselectState(1)}>
            <Menu7Filled />
          </div>
          <div className='icon' onClick={()=>setMultiselectState(2)}>
            <ListFilled />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
