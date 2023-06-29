import React from "react";
import './CourseConf.css';

export type CourseConfiguration = {
    courseCode: string,
    courseName: string,
    courseDescription: string,
    selectedSections: {
        [key: string]: string
    }
}

function CourseConf(props: any, conf: CourseConfiguration, setConf: (conf: CourseConfiguration) => void) {
    return (
        <div>
            <h2>{conf.courseCode}</h2>
            <h3>{conf.courseName}</h3>
            <p>{conf.courseDescription}</p>
        </div>
    );
}

export default CourseConf;