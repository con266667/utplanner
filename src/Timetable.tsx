import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import './Timetable.css';
import './TimetableListView.css';

const Timetable = forwardRef((props: any, ref: any) => {
    let [events, setEvents] = React.useState<any[]>([]);

    useImperativeHandle(ref, () => ({
        updateTimetable: (courseCodes: string[]) => {
            setupTimetable(courseCodes);
        }
    }));

    function allDaysInSchedule() {
        return events.map((event) => event.day).filter((day, index, self) => self.indexOf(day) === index).sort();
    }

    function dayNumberToDayName(dayNumber: number) {
        switch (dayNumber) {
            case 1:
                return "Monday";
            case 2:
                return "Tuesday";
            case 3:
                return "Wednesday";
            case 4:
                return "Thursday";
            case 5:
                return "Friday";
        }
        return "";
    }

    async function loadCourses(courseCodes: string[]) {
        let courses: any[] = [];
        for (let courseCode of courseCodes) {
            let res = await fetch('api/get_courses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({"courseCodeAndTitleProps":{"courseCode":courseCode,"courseTitle":"","courseSectionCode":""},"sessions":["20235", "20241"],"divisions":["APSC"],"direction":"asc"})
            });
            let json = await res.json();
            courses.push(json.payload[0]);
        }
        return courses;
    }

    async function setupTimetable(courseCodes: string[]) {
        let courses = await loadCourses(courseCodes);
        events = [];
        for (let course of courses) {
            for (let section of course.sections) {
                for (let meetingTime of section.meetingTimes) {
                    events.push({
                        "courseCode": course.code,
                        "courseName": course.name,
                        "name": section.name,
                        "type": section.type,
                        "teachMethod": section.teachMethod,
                        "sectionNumber": section.sectionNumber,
                        "startMillis": meetingTime.start.millisofday,
                        "endMillis": meetingTime.end.millisofday,
                        "day": meetingTime.start.day,
                    });
                }
            }
        }
        events.sort((a, b) => a.startMillis - b.startMillis);
        setEvents(Object.assign([], events));
    }

    function millisToString(millis: number) {
        let hours = Math.floor(millis / 3600000);
        let minutes = Math.floor((millis % 3600000) / 60000);
        let ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12;
        let minutesString = minutes < 10 ? '0' + minutes : minutes;
        return hours + ':' + minutesString + ' ' + ampm;
    }

    useEffect(() => {
        // setupTimetable(["MAT185H1"]);
        // console.log("Timetable mounted");
        return () => {
            // console.log("Timetable unmounted");
        }
    }, []);

    return (
        <div className="timetable">

            {
                props.timetableType === 0 &&
                <div className="list-view">
                    {allDaysInSchedule().map((day) => {
                        return (
                            <div className="day" key={day}>
                                <h2>{dayNumberToDayName(day)}</h2>
                                {events.filter((event) => event.day === day).map((event) => {
                                    return (
                                        <div className="event" key={JSON.stringify(event)}>
                                            <h3>{event.courseName}</h3>
                                            <h4>{event.name}</h4>
                                            <p>{millisToString(event.startMillis)} - {millisToString(event.endMillis)}</p>
                                        </div>
                                    )
                                }
                                )}
                            </div>
                        )
                    })
                    }
                </div>
            }
        </div>
    );
});

export default Timetable;