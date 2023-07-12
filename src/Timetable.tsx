import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import './Timetable.css';
import './TimetableListView.css';
import './TimetableWeekView.css';
import './TimetableDayView.css';
import { Course, fetchCourse } from './Course';
import { useLocalStorage } from 'usehooks-ts';
import { CourseConfiguration } from './CourseConf';
import { useNavigate } from 'react-router-dom';

const Timetable = forwardRef((props: any, ref: any) => {
    const navigate = useNavigate();
    let [events, setEvents] = useLocalStorage<{[session: string]: any[]}>('events', {
        "Summer": [],
        "20239": [],
        "20241": []
    });
    let [dayViewSelectedDay, setDayViewSelectedDay] = useLocalStorage<number>('dayViewSelectedDay', 1);
    const [courseConfigurations, setCourseConfigurations] = useLocalStorage<{[key: string]: CourseConfiguration}>('courseConfigurations', {});
    const [currentSchedule, setCurrentSchedule] = useLocalStorage<Schedule>('currentSchedule', {id:'', cost:0, data:{}});
    const [selectedOptimization, setSelectedOptimization] = useLocalStorage<string>('selectedOptimization', "Late Start");
    const [selectedCourseCodes, setSelectedCourseCodes] = useLocalStorage<{[session:string]: string[]}>('selectedCourseCodes', {
        "Summer": [],
        "20239": [],
        "20241": []
    });
    const [selectedSession, setSelectedSession] = useLocalStorage<string>('selectedSession', "Summer");


    let allTimes = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

    useImperativeHandle(ref, () => ({
        updateTimetable: (courseCodes: string[], selectedOptimization: string, selectedSession: string) => {
            setupTimetable(courseCodes, selectedOptimization, selectedSession);
        }
    }));

    function hourToTimeString(hour: number) {
        if (hour === 12) {
            return "12";
        }
        if (hour > 12) {
            return (hour - 12) + "";
        }
        return hour + "";
    }

    function millisOfDayToHour(millisOfDay: number) {
        return Math.floor(millisOfDay / 3600000);
    }

    function allDaysInSchedule() {
        return (events[selectedSession] ?? []).map((event) => event.day).filter((day, index, self) => self.indexOf(day) === index).sort();
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

    function dayNumberToShortDayName(dayNumber: number) {
        return dayNumberToDayName(dayNumber).substring(0, 3);
    }

    async function loadCourses(courseCodes: string[]) {
        let courses: Course[] = [];
        for (let courseCode of courseCodes) {
            let course = await fetchCourse(courseCode);
            if (course !== undefined) {
                courses.push(course);
            }
        }
        return courses ?? [];
    }

    function setDefaultCourseConfiguration(course: Course) {
        setCourseConfigurations((prevCourseConfigurations) => {
            let newCourseConfigurations = Object.assign({}, prevCourseConfigurations);
            newCourseConfigurations[course.code] = {
                courseCode: course.code,
                courseName: course.name,
                courseDescription: course.cmCourseInfo.description,
                selectedSections: {},
                sectionsAvailable: {}
            };
            course.sections.forEach(section => {
                if (newCourseConfigurations[course.code].sectionsAvailable[section.type] === undefined) {
                    newCourseConfigurations[course.code].sectionsAvailable[section.type] = [section.sectionNumber];
                } else {
                    newCourseConfigurations[course.code].sectionsAvailable[section.type].push(section.sectionNumber);
                }
            });
            return newCourseConfigurations;
        });
    }

    async function setupTimetable(courseCodes: string[], selectedOptimization: string, selectedSession: string, newCourseConfigurations: {[key: string]: CourseConfiguration} = courseConfigurations) {
        if (courseCodes.length === 0) {
            setEvents((prevEvents) => {
                let newEvents = Object.assign({}, prevEvents);
                newEvents[selectedSession] = [];
                return newEvents;
            });
            return;
        }
        let courses = await loadCourses(courseCodes);
        events[selectedSession] = [];
        for (let course of courses) {
            if (!courseConfigurations[course.code]) {
                setDefaultCourseConfiguration(course);
            }
            for (let section of course.sections) {
                for (let meetingTime of section.meetingTimes) {
                    events[selectedSession].push({
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
        events[selectedSession].sort((a, b) => a.startMillis - b.startMillis);
        let _schedule = schedule(courses, selectedOptimization, newCourseConfigurations);
        setCurrentSchedule(_schedule);
        console.log(_schedule);
        events[selectedSession] = events[selectedSession].filter((event) => _schedule.data[event.courseCode][event.type].sectionNumber === event.sectionNumber);
        events[selectedSession] = events[selectedSession].filter((event, index, self) => self.findIndex((e) => e.courseCode === event.courseCode && e.type === event.type && e.sectionNumber === event.sectionNumber && e.startMillis === event.startMillis && e.day === event.day) === index);
        setEvents((prevEvents) => {
            let newEvents = Object.assign({}, prevEvents);
            newEvents[selectedSession] = events[selectedSession];
            return newEvents;
        });
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
        // setupTimetable(["MAT185H1", "ESC102H1", "ESC190H1", "ESC195H1", "MSE160H1", "ECE159H1"]);
        let newCourseConf = JSON.parse(localStorage.getItem('courseConfigurations') ?? "{}") as {[key: string]: CourseConfiguration};
        let newSelectedCourseCodes = JSON.parse(localStorage.getItem('selectedCourseCodes') ?? "{}") as {[key: string]: string[]};
        let newSelectedSession = JSON.parse(localStorage.getItem('selectedSession') ?? '"Summer"') as string;

        if (courseConfigurations !== newCourseConf) {
            setCourseConfigurations(newCourseConf);
        }

        if (selectedCourseCodes !== newSelectedCourseCodes && Object.keys(newSelectedCourseCodes).length !== 0) {
            setSelectedCourseCodes(newSelectedCourseCodes);
        }

        if (selectedSession !== newSelectedSession) {
            console.log(newSelectedSession);
            // setSelectedSession(newSelectedSession);
        }
        
        if (currentSchedule.id !== scheduleID(newSelectedCourseCodes[selectedSession] ?? [], selectedOptimization, newCourseConf)) {
            setupTimetable(newSelectedCourseCodes[selectedSession], selectedOptimization, selectedSession);
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
                                {(events[selectedSession] ?? []).filter((event) => event.day === day).map((event) => {
                                    return (
                                        <div className="event" key={JSON.stringify(event)} onClick={()=>navigate("courses/" + event.courseCode)}>
                                            <h3>{event.courseName}</h3>
                                            <h4>{event.name}</h4>
                                            <p>{millisToString(event.startMillis)} - {millisToString(event.endMillis)}</p>
                                        </div>
                                    )
                                }
                                )}
                            </div>
                        )
                    })}
                </div>
            }

            {
                props.timetableType === 1 &&
                <div className="week-view">
                    <div className="times">
                    {
                        allTimes.map((time) => {
                            return (
                                <div className="time" key={time}>
                                    <h2>{hourToTimeString(time)}</h2>
                                    <hr/>
                                </div>
                            )
                        })
                    }
                    </div>
                    <div className='events'>
                        {
                            allDaysInSchedule().map((day) => {
                                return (
                                    <div className="day" key={day}>
                                        <h2>{dayNumberToShortDayName(day).toUpperCase()}</h2>
                                        {
                                            allTimes.map((time) => 
                                                <div className='events-holder' key={time}>
                                                    {
                                                        (events[selectedSession] ?? []).filter((event) => event.day === day && time === millisOfDayToHour(event.startMillis)).map((event) => 
                                                            <div className="event" onClick={()=>navigate("courses/" + event.courseCode)} key={JSON.stringify(event)} style={{ "--length": millisOfDayToHour(event.endMillis - event.startMillis)}  as React.CSSProperties}>
                                                                <h3>{event.courseCode.substring(0,6)}</h3>
                                                                <h4>{event.name}</h4>
                                                            </div>
                                                        )
                                                    }
                                                </div>
                                            )
                                        }
                                    </div>
                                )
                            })
                        }
                    </div>
                </div>
            }

            {
                props.timetableType === 2 &&
                <div className="day-view">
                    <div className='header'>
                        <button disabled={dayViewSelectedDay <= 1} onClick={()=>dayViewSelectedDay > 1 && setDayViewSelectedDay((d)=>--d)}>‹</button>
                        <h1>{dayNumberToDayName(dayViewSelectedDay)}</h1>
                        <button disabled={dayViewSelectedDay >= 5} onClick={()=>dayViewSelectedDay < 5 && setDayViewSelectedDay((d)=>++d)}>›</button>
                    </div>
                    <div className='times'>
                        {
                            allTimes.map((time) => {
                                return (
                                    <div className="time" key={time}>
                                        <h2>{hourToTimeString(time)}</h2>
                                        <hr/>
                                    </div>
                                )
                            })
                        }
                    </div>
                    <div className='events'>
                    {
                        allTimes.map((time) => 
                            <div className='events-holder' key={time}>
                                {
                                    (events[selectedSession] ?? []).filter((event) => event.day === dayViewSelectedDay && time === millisOfDayToHour(event.startMillis)).map((event) => 
                                        <div className="event" onClick={()=>navigate("courses/" + event.courseCode)} key={JSON.stringify(event)} style={{ "--length": millisOfDayToHour(event.endMillis - event.startMillis)}  as React.CSSProperties}>
                                            <h3>{event.courseName}</h3>
                                            <h4>{event.name}</h4>
                                        </div>
                                    )
                                }
                            </div>
                        )
                    }
                    </div>
                </div>
            }
        </div>
    );
});

// type Events = Map<number, any[]>;

function numberOfCollisions(events: any[]) {
    let collisions = 0;
    for (let i = 0; i < events.length; i++) {
        for (let j = i + 1; j < events.length; j++) {
            if (events[i].day === events[j].day && events[i].startMillis < events[j].endMillis && events[i].endMillis > events[j].startMillis) {
                collisions++;
            }
        }
    }
    return collisions;
}

function averageStartTime(sortedEvents: any[]) {
    let total = 0;
    for (let day of [1, 2, 3, 4, 5]) {
        let events = sortedEvents.filter((event) => event.day === day);
        if (events.length > 0) {
            total += events[0].startMillis;
        }
    }
    return (total) / 3600000;
}

function averageEndTime(sortedEvents: any[]) {
    let total = 0;
    for (let day of [1, 2, 3, 4, 5]) {
        let events = sortedEvents.filter((event) => event.day === day);
        if (events.length > 0) {
            total += events[events.length - 1].endMillis;
        }
    }
    return (total) / 3600000;
}

function numberOfDays(events: any[]) {
    let days = new Set<number>();
    for (let event of events) {
        days.add(event.day);
    }
    return days.size;
}

function allEventsInSchedule(courses: Course[], schedule: Schedule) {
    let events: any[] = [];
    let eventIds = new Set<string>();
    for (let course of courses) {
        for (let section of course.sections) {
            for (let meetingTime of section.meetingTimes) {
                if (schedule.data[course.code][section.type].sectionNumber === section.sectionNumber) {
                    if (!eventIds.has(course.code + section.type + section.sectionNumber + meetingTime.start.millisofday + meetingTime.end.millisofday + meetingTime.start.day)) {
                        events.push({
                            "startMillis": meetingTime.start.millisofday,
                            "endMillis": meetingTime.end.millisofday,
                            "day": meetingTime.start.day,
                        });
                        eventIds.add(course.code + section.type + section.sectionNumber + meetingTime.start.millisofday + meetingTime.end.millisofday + meetingTime.start.day);
                    }
                }
            }
        }
    }
    return events;
}

function selectedCost(courses: Course[], schedule: Schedule, selectedOptimization: string) {
    switch (selectedOptimization) {
        case "Late Start":
            return lateStartCost(courses, schedule);
        case "Early End":
            return earlyEndCost(courses, schedule);
        case "Fewer Days":
            return numberOfDays(allEventsInSchedule(courses, schedule)) * 4;
        default:
            return 0;
    }
}

function cost(courses: Course[], schedule: Schedule, costCache: Map<string, number>, selectedOptimization: string) {
    let scheduleString = JSON.stringify(schedule);
    if (!costCache.has(scheduleString)) {
        let _cost = numberOfCollisions(allEventsInSchedule(courses, schedule)) * 200 + selectedCost(courses, schedule, selectedOptimization);
        costCache.set(scheduleString, _cost);
    }
    return costCache.get(scheduleString)!;
}

function lateStartCost(courses: Course[], schedule: Schedule) {
    return 21*5 - averageStartTime(allEventsInSchedule(courses, schedule).sort((a, b) => a.startMillis - b.startMillis));
}

function earlyEndCost(courses: Course[], schedule: Schedule) {
    return averageEndTime(allEventsInSchedule(courses, schedule).sort((a, b) => a.endMillis - b.endMillis));
}

function iterateSchedule(schedule: Schedule, courseConfigurations: {[key: string]: CourseConfiguration}) {
    let newSchedule = JSON.parse(JSON.stringify(schedule)) as Schedule;
    let randomCourseCode = Object.keys(newSchedule.data)[Math.floor(Math.random() * Object.keys(newSchedule.data).length)];
    let randomSectionType = Object.keys(newSchedule.data[randomCourseCode])[Math.floor(Math.random() * Object.keys(newSchedule.data[randomCourseCode]).length)];
    
    if (courseConfigurations[randomCourseCode] && courseConfigurations[randomCourseCode].selectedSections.hasOwnProperty(randomSectionType)) {
        return newSchedule;
    }

    let currentSectionCode = newSchedule.data[randomCourseCode][randomSectionType].sectionNumber;
    let randomOtherSectionCode = newSchedule.data[randomCourseCode][randomSectionType].otherSectionNumbers[Math.floor(Math.random() * newSchedule.data[randomCourseCode][randomSectionType].otherSectionNumbers.length)];
    
    if (randomOtherSectionCode === undefined) {
        return newSchedule;
    }

    newSchedule.data[randomCourseCode][randomSectionType].sectionNumber = randomOtherSectionCode;
    newSchedule.data[randomCourseCode][randomSectionType].otherSectionNumbers = newSchedule.data[randomCourseCode][randomSectionType].otherSectionNumbers.filter((otherSectionNumber) => otherSectionNumber !== randomOtherSectionCode);
    newSchedule.data[randomCourseCode][randomSectionType].otherSectionNumbers.push(currentSectionCode);
    return newSchedule;
}

function buildRandomSchedule(courses: Course[], costCache: Map<string, number>, selectedOptimization: string, courseConfigurations: {[key: string]: CourseConfiguration}) {
    let schedule: Schedule = {
        cost: 0,
        data: {},
        id: ''
    };

    for (let course of courses) {
        schedule.data[course.code] = {};
        for (let section of course.sections) {
            if (!schedule.data[course.code].hasOwnProperty(section.type)) {
                if (courseConfigurations[course.code] && courseConfigurations[course.code].selectedSections.hasOwnProperty(section.type)) {
                    schedule.data[course.code][section.type] = {
                        sectionNumber: courseConfigurations[course.code].selectedSections[section.type],
                        otherSectionNumbers: course.sections.filter((otherSection) => otherSection.type === section.type).map((otherSection) => otherSection.sectionNumber).filter((otherSectionCode) => otherSectionCode !== courseConfigurations[course.code].selectedSections[section.type])
                    };
                } else {
                    schedule.data[course.code][section.type] = {
                        sectionNumber: section.sectionNumber,
                        otherSectionNumbers: course.sections.filter((otherSection) => otherSection.type === section.type).map((otherSection) => otherSection.sectionNumber).filter((otherSectionCode) => otherSectionCode !== section.sectionNumber)
                    };
                }
            }
        }
    }
    schedule.cost = cost(courses, schedule, costCache, selectedOptimization);
    return schedule;
}

function scheduleID(courseCodes: string[], selectedOptimization: string, courseConfigurations: {[key: string]: CourseConfiguration}) {
    return JSON.stringify(courseConfigurations) + selectedOptimization + courseCodes.sort().join('');
}

function schedule(courses: Course[], selectedOptimization: string, courseConfigurations: {[key: string]: CourseConfiguration}) {
    let bestSchedule = buildRandomSchedule(courses, new Map(), selectedOptimization, courseConfigurations);
    let costCache = new Map();
    costCache.set(JSON.stringify(bestSchedule), bestSchedule.cost);
    
    for (let i = 0; i < 10; i++) { // Number of generations
        let bestOfPrevGen = JSON.parse(JSON.stringify(bestSchedule));
        for (let j = 0; j < 6; j++) { // Number of schedules per generation
            let newSchedule = JSON.parse(JSON.stringify(bestOfPrevGen));
            for (let k = 0; k < 150; k++) { // Number of iterations per generation
                newSchedule = iterateSchedule(newSchedule, courseConfigurations);
                newSchedule.cost = cost(courses, newSchedule, costCache, selectedOptimization);
                if (newSchedule.cost < bestSchedule.cost) {
                    bestSchedule = Object.assign({}, newSchedule);
                }
            }
        }
    }

    bestSchedule.id = scheduleID(courses.map((course) => course.code), selectedOptimization, courseConfigurations);

    return bestSchedule;
}

type Schedule = {
    id: string,
    cost: number,
    data: {
        [courseCode: string]: {
            [sectionType: string]: {
                sectionNumber: string,
                otherSectionNumbers: string[]
            }
        }
    }
}; // Map<courseCode, Map<sectionType, {}>>

export default Timetable;