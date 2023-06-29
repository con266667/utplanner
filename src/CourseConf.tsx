import React, { useEffect } from "react";
import './CourseConf.css';
import { useParams } from "react-router-dom";
import { useLocalStorage } from "usehooks-ts";
import { fetchCourse } from "./Course";

export type CourseConfiguration = {
    courseCode: string,
    courseName: string,
    courseDescription: string,
    selectedSections: {
        [key: string]: string
    },
    sectionsAvailable: {
        [key: string]: string[]
    }
}

function CourseConf(props: any) {

    let code = useParams()["*"];
    const [courseConfigurations, setCourseConfigurations] = useLocalStorage<{[key: string]: CourseConfiguration}>('courseConfigurations', {});

    async function setDefaultCourseConfiguration() {
        if (code === undefined) return;
        if (courseConfigurations[code] !== undefined) return;

        let course = await fetchCourse(code!);
        if (course === undefined) return;
        let courseConfiguration: CourseConfiguration = {
            courseCode: course.code,
            courseName: course.name,
            courseDescription: course.cmCourseInfo.description,
            selectedSections: {},
            sectionsAvailable: {}
        }
        course.sections.forEach(section => {
            if (courseConfiguration.sectionsAvailable[section.type] === undefined) {
                courseConfiguration.sectionsAvailable[section.type] = [section.sectionNumber];
            } else {
                courseConfiguration.sectionsAvailable[section.type].push(section.sectionNumber);
            }
        });
        setCourseConfigurations({
            ...courseConfigurations,
            [code!]: courseConfiguration
        });
    }

    useEffect(() => {
        setDefaultCourseConfiguration();
    }, []);

    function selectSection(sectionType: string, sectionName: string) {
        if (code === undefined) return;
        let courseConfiguration = courseConfigurations[code!];
        if (sectionName === "AUTO") {
            delete courseConfiguration.selectedSections[sectionType];
        } else {
            courseConfiguration.selectedSections[sectionType] = sectionName;
        }
        setCourseConfigurations({
            ...courseConfigurations,
            [code!]: courseConfiguration
        });
    }

    return (
        <div className="course-conf">
            {
                courseConfigurations[code!] !== undefined &&
                <div>
                    <h1>{courseConfigurations[code!].courseName}</h1>
                    <p>{courseConfigurations[code!].courseDescription.length > 200 ? courseConfigurations[code!].courseDescription.substring(0,197) + "..." : courseConfigurations[code!].courseDescription}</p>
                    <h2>Schedule Options</h2>
                    {
                        Object.keys(courseConfigurations[code!].sectionsAvailable).map(sectionType => {
                            return (
                                <div className="section-select" key={sectionType}>
                                    <h3>{sectionType}</h3>
                                    <select
                                    defaultValue={courseConfigurations[code!].selectedSections[sectionType] ?? "AUTO"} 
                                    onChange={(e) => selectSection(sectionType, e.target.value)}>
                                        <option>AUTO</option>
                                        {
                                            courseConfigurations[code!].sectionsAvailable[sectionType].sort().map(sectionName => {
                                                return (
                                                    <option key={sectionName}>{sectionName}</option>
                                                );
                                            })
                                        }
                                    </select>
                                </div>
                            );
                        })
                    }
                </div>
            }
        </div>
    );
}

export default CourseConf;