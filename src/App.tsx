import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import Menu3Filled from './icons/List';
import Menu7Filled from './icons/Menu';
import ListFilled from './icons/Week';
import Timetable from './Timetable';
import { useLocalStorage } from 'usehooks-ts';
import SunHaze from './icons/Sunrise';
import SunDawnFilled from './icons/Sunset';
import Home from './icons/House';

function App() {
  const [multiselectState, setMultiselectState] = useState(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchedCourses, setSearchedCourses] = useState<any[]>([]); // [{code: "ESC180", title: "Introduction to Programming for Engineers", ...}
  const [selectedCourseCodes, setSelectedCourseCodes] = useLocalStorage<string[]>('selectedCourseCodes', []);
  const [optimizationsDropdownOpen, setOptimizationsDropdownOpen] = useState<boolean>(false);
  const [selectedOptimization, setSelectedOptimization] = useLocalStorage<string>('selectedOptimization', "Late Start"); // "Late Start", "Early Finish", "Fewer Days"
  const timetableRef = useRef<any>();

  let cachedSearches: {[key: string]: any} = {};

  let optimizations = ['Late Start', 'Early End', 'Fewer Days'];

  function optimizationIcon(optimization: string) {
    switch (optimization) {
      case 'Late Start':
        return <SunHaze />;
      case 'Early End':
        return <SunDawnFilled />;
      case 'Fewer Days':
        return <Home />;
      default:
        return <SunHaze />;
    }
  }

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
      timetableRef.current?.updateTimetable(selectedCourseCodes.filter((c) => c !== course), selectedOptimization);
      setSelectedCourseCodes(selectedCourseCodes.filter((c) => c !== course));
    } else {
      timetableRef.current?.updateTimetable([...selectedCourseCodes, course], selectedOptimization);
      setSelectedCourseCodes([...selectedCourseCodes, course]);
    }
  }

  useEffect(() => {
    document.addEventListener('click', (event) => {
      if (event.target instanceof HTMLElement) {
        if (event.target.closest('.optimizations-dropdown') === null) {
          setOptimizationsDropdownOpen(false);
        }
      }
    }, false);
  }, []);

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

      <div className='timetable-options'>
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
        <div className='optimizations-dropdown' onClick={()=>setOptimizationsDropdownOpen(true)}>
          {optimizationIcon(selectedOptimization)}
        </div>
        <div className={`optimizations-dropdown-options ${optimizationsDropdownOpen ? 'active' : ''}`}>
          {
            optimizations.map((optimization) =>
            <React.Fragment key={optimization}>
              <div className='optimization' onClick={()=>{
                setSelectedOptimization(optimization);
                timetableRef.current?.updateTimetable(selectedCourseCodes, optimization);
                setOptimizationsDropdownOpen(false);
              }}>
                <h3>{optimization}</h3>
                <div className='icon'>{optimizationIcon(optimization)}</div>
              </div>
              {optimization !== optimizations[optimizations.length-1] && <hr />}
            </React.Fragment>
            )
          }
        </div>
      </div>

      <Timetable timetableType={multiselectState} ref={timetableRef} />

      <button className='option-card' onClick={()=>window.location.href="mailto:me@connorw.org"}>
        <h2>Reach Out</h2>
      </button>
    </div>
  );
}

export default App;
