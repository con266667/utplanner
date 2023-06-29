import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Browse.css"
import { Course } from "./Course";
import { useLocalStorage } from "usehooks-ts";

function Browse() {
    let facultyCode = useParams()["*"];
    let navigate = useNavigate();
    
    let [courseResults, setCourseResults] = useState<Course[]>([]);
    const [selectedCourseCodes, setSelectedCourseCodes] = useLocalStorage<string[]>('selectedCourseCodes', []);

    async function getCourses() {
        let res = await fetch('/api/get_courses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "sessions":["20235F","20235S","20235", "20239", "20241", "20239-20241"],
                "divisions":[facultyCode]
            })
        });
        let json = await res.json();
        setCourseResults(json.payload);
    }

    function courseClicked(courseCode: string) {
        if (selectedCourseCodes.includes(courseCode)) {
            setSelectedCourseCodes((e)=>e.filter((c) => c !== courseCode));
        } else {
            setSelectedCourseCodes([...selectedCourseCodes, courseCode]);
        }
    }

    useEffect(() => {
        if (courseResults.length === 0) {
            getCourses();
        }
    }, [facultyCode]);

    return (
        <div className="browse">
            <h1>Browse</h1>
            <div className="results">
                {courseResults.map((course) => (
                    <div className="course" key={course.code}>
                        <div className="info" onClick={()=>navigate("/courses/" + course.code)}>
                            <h2>{course.name}</h2>
                            <h3>{course.code}</h3>
                        </div>
                        <button onClick={()=>courseClicked(course.code)}>
                            {selectedCourseCodes.includes(course.code) ? "Remove" : "Add"}
                        </button>
                        {/* <p>{course.cmCourseInfo.description.length > 50 ? course.cmCourseInfo.description.substring(0, 47) + "..." : course.cmCourseInfo.description}</p> */}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Browse;