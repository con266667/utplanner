import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Browse.css"
import { Course } from "./Course";
import { useLocalStorage } from "usehooks-ts";

function Browse() {
    let facultyCode = useParams()["*"];
    let navigate = useNavigate();
    
    const listInnerRef = useRef<HTMLDivElement>(null);

    const [courseResults, setCourseResults] = useLocalStorage<Course[]>('courseResults', []);
    let loading = false;
    let nextPage = 1;
    const [selectedCourseCodes, setSelectedCourseCodes] = useLocalStorage<string[]>('selectedCourseCodes', []);
    let selectedYear = "";

    async function getCourses() {
        let req: any = {
            "departmentProps":[],
            "sessions":["20235F","20235S","20235", "20239", "20241", "20239-20241"],
            "divisions":[facultyCode],
            "page":nextPage++,
            "pageSize":20,
            "direction":"asc"
        }

        if (selectedYear != "") {
            req["courseLevels"] = [selectedYear]
        }

        let res = await fetch('/api/get_courses_page', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req)
        });
        let json = await res.json();
        setCourseResults((e)=>[...e, ...json.payload.pageableCourse.courses]);
        loading = false;
    }

    function courseClicked(courseCode: string) {
        if (selectedCourseCodes.includes(courseCode)) {
            setSelectedCourseCodes((e)=>e.filter((c) => c !== courseCode));
        } else {
            setSelectedCourseCodes([...selectedCourseCodes, courseCode]);
        }
    }

    function onScroll() {
        if (document.documentElement.scrollHeight - (window.innerHeight + document.documentElement.scrollTop) < 200 && !loading) {
            loading = true;
            getCourses();
        }
    }

    function clearCourses() {
        setCourseResults([]);
        nextPage = 1;
    }

    function selectYear(courseLevel: string) {
        selectedYear = courseLevel;
        clearCourses();
        getCourses();
    }

    useEffect(() => {
        if (courseResults.length === 0) {
            getCourses();
        }
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, [facultyCode]);

    return (
        <div className="browse">
            <h1>Browse</h1>
            <div className="filters">
                {/* <div className="filter">
                    <h2>Faculty</h2>
                    <select>
                        <option value="all">All</option>
                        <option value="APSC">Engineering</option>
                        <option value="">Arts & Science</option>
                    </select>
                </div> */}
                <div className="filter">
                    <h2>Year</h2>
                    <select onChange={(e) => selectYear(e.target.value)}>
                        <option value="">All</option>
                        <option value="100/A">1</option>
                        <option value="200/B">2</option>
                        <option value="300/C">3</option>
                        <option value="400/D">4</option>
                        <option value="5+">5+</option>
                    </select>
                </div>
            </div>
            <div className="results" ref={listInnerRef}>
                {courseResults.map((course) => (
                    <div className="course" key={course.code}>
                        <div className="info" onClick={()=>navigate("/courses/" + course.code)}>
                            <h2>{course.name}</h2>
                            <h3>{course.code}</h3>
                        </div>
                        <button onClick={()=>courseClicked(course.code)}>
                            {selectedCourseCodes.includes(course.code) ? "Remove" : "Add"}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Browse;