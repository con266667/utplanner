import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import './Timetable.css';
import './TimetableListView.css';
import { Course } from './Course';
import { useLocalStorage } from 'usehooks-ts';

const Timetable = forwardRef((props: any, ref: any) => {
    let [events, setEvents] = useLocalStorage<any[]>('events', []);

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
        let courses: Course[] = [];
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
        if (courseCodes.length === 0) {
            setEvents([]);
            return;
        }
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
        let _schedule = schedule(courses);
        console.log(_schedule.cost);
        events = events.filter((event) => _schedule.data[event.courseCode][event.type].sectionNumber === event.sectionNumber);
        events = events.filter((event, index, self) => self.findIndex((e) => e.courseCode === event.courseCode && e.type === event.type && e.sectionNumber === event.sectionNumber && e.startMillis === event.startMillis && e.day === event.day) === index);
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

function cost(courses: Course[], schedule: Schedule, costCache: Map<string, number>) {
    let scheduleString = JSON.stringify(schedule);
    if (!costCache.has(scheduleString)) {
        costCache.set(scheduleString, numberOfCollisions(allEventsInSchedule(courses, schedule)));
    }
    return costCache.get(scheduleString)!;
}

function iterateSchedule(schedule: Schedule) {
    let newSchedule = Object.assign({}, schedule);
    let randomCourseCode = Object.keys(newSchedule.data)[Math.floor(Math.random() * Object.keys(newSchedule.data).length)];
    let randomSectionType = Object.keys(newSchedule.data[randomCourseCode])[Math.floor(Math.random() * Object.keys(newSchedule.data[randomCourseCode]).length)];
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

function buildRandomSchedule(courses: Course[], costCache: Map<string, number>) {
    let schedule: Schedule = {
        cost: 0,
        data: {}
    };
    for (let course of courses) {
        schedule.data[course.code] = {};
        for (let section of course.sections) {
            if (!schedule.data[course.code].hasOwnProperty(section.type)) {
                schedule.data[course.code][section.type] = {
                    sectionNumber: section.sectionNumber,
                    otherSectionNumbers: course.sections.filter((otherSection) => otherSection.type === section.type).map((otherSection) => otherSection.sectionNumber).filter((otherSectionCode) => otherSectionCode !== section.sectionNumber)
                };
            }
        }
    }
    schedule.cost = cost(courses, schedule, costCache);
    return schedule;
}

function schedule(courses: Course[]) {
    let bestSchedule = buildRandomSchedule(courses, new Map());
    let costCache = new Map();
    costCache.set(JSON.stringify(bestSchedule), bestSchedule.cost);
    
    for (let i = 0; i < 10; i++) { // Number of generations
        let bestOfPrevGen = JSON.parse(JSON.stringify(bestSchedule));
        for (let j = 0; j < 4; j++) { // Number of schedules per generation
            let newSchedule = JSON.parse(JSON.stringify(bestOfPrevGen));
            for (let k = 0; k < 100; k++) { // Number of iterations per generation
                newSchedule = iterateSchedule(JSON.parse(JSON.stringify(newSchedule)));
                newSchedule.cost = cost(courses, newSchedule, costCache);
                if (newSchedule.cost < bestSchedule.cost) {
                    bestSchedule = Object.assign({}, newSchedule);
                }
            }
        }
    }

    return bestSchedule;
}

type Schedule = {
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