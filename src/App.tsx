import React, { useRef, useState } from 'react';
import './App.css';
import Menu3Filled from './icons/List';
import Menu7Filled from './icons/Menu';
import ListFilled from './icons/Week';
import Timetable from './Timetable';
import { click } from '@testing-library/user-event/dist/click';
import { useLocalStorage } from 'usehooks-ts';

function App() {
  const [multiselectState, setMultiselectState] = useState(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchedCourses, setSearchedCourses] = useState<any[]>([]); // [{code: "ESC180", title: "Introduction to Programming for Engineers", ...}
  const [selectedCourseCodes, setSelectedCourseCodes] = useLocalStorage<string[]>('selectedCourseCodes', []);
  const timetableRef = useRef<any>();

  let cachedSearches: {[key: string]: any} = {};

  const searchCourses = async (search: string) => {
    if (search === "") {
      setSearchedCourses([]);
      return;
    }

    // // DEV
    // setSearchedCourses([
    //   {
    //     "code": "ESC180",
    //     "name": "Introduction to Programming",
    //   },
    //   {
    //     "code": "ESC190",
    //     "name": "Data Structures and Algorithms",
    //   }
    // ]);
    // return;


    let params = new URLSearchParams();
    params.append("term", search);
    params.set("upperThreshold", "200");
    params.set("lowerThreshold", "50");
    params.set("divisions", "APSC");

    if (cachedSearches[params.toString()]) {
      setSearchedCourses(cachedSearches[params.toString()]);
      return;
    }

    const response = await fetch('api/search_courses?' + params.toString());
    let json = (await response.json()).payload.codesAndTitles;

    json = json.filter((course: any, index: number, self: any[]) =>
      index === self.findIndex((c: any) => (
        c.code === course.code
      ))
    );

    cachedSearches[params.toString()] = json;
    setSearchedCourses(json);
  }

  function onSearchInput(event: React.ChangeEvent<HTMLInputElement>) {
    searchCourses(event.target.value);
    setSearchTerm(event.target.value);
  }

  function clearSearch() {
    searchCourses("");
    setSearchTerm("");
  }

  function courseClicked(course: string) {
    if (selectedCourseCodes.includes(course)) {
      timetableRef.current?.updateTimetable(selectedCourseCodes.filter((c) => c !== course));
      setSelectedCourseCodes(selectedCourseCodes.filter((c) => c !== course));
    } else {
      timetableRef.current?.updateTimetable([...selectedCourseCodes, course]);
      setSelectedCourseCodes([...selectedCourseCodes, course]);
    }
  }

  return (
    <div className="App">
      <input value={searchTerm} type="text" id='' placeholder='Search Courses' onInput={onSearchInput} />
      <h2 className={`search-clear ${searchedCourses.length===0 ? 'invisible' : ''}`} onClick={clearSearch}>×</h2>
      <div className={`selected-courses ${selectedCourseCodes.length === 0 ? 'invisible' : ''}`} >
        {selectedCourseCodes.map((course) =>
          <div key={course} className='course'>
            <span>{course}</span>
            <h2 onClick={()=>courseClicked(course)}>×</h2>
          </div>
        )}
        <div>⠀</div>
      </div>

      <div className='searched-courses'>
        {searchedCourses.map((course) => 
          <React.Fragment key={course.code}>
              <div className="course">
                <div className="info">
                  <h2>{course.name}</h2>
                  <p>{course.code}</p>
                </div>
                  <button className="add" onClick={()=>courseClicked(course.code)}>{
                    selectedCourseCodes.includes(course.code) ? "Remove" : "Add"
                  } </button>
              </div>
              <hr />
            </React.Fragment>
        )}
      </div>

      <div className={`multiselect ${selectedCourseCodes.length === 0 ? 'invisible' : ''}`}>
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

      <Timetable timetableType={multiselectState} ref={timetableRef} />
    </div>
  );
}

export default App;
