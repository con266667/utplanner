export type Section = {
    name: string;
    type: string;
    teachMethod: string;
    sectionNumber: string;
    meetingTimes: {
      start: {
        day: number;
        millisofday: number;
      };
      end: {
        day: number;
        millisofday: number;
      };
      building: {
        buildingCode: string;
        buildingRoomNumber: string;
        buildingRoomSuffix: string;
        buildingUrl: string;
        buildingName: null;
      };
      sessionCode: string;
      repetition: string;
      repetitionTime: string;
    }[];
    firstMeeting: null;
    instructors: {
      firstName: string;
      lastName: string;
    }[];
    currentEnrolment: number;
    maxEnrolment: number;
    subTitle: string;
    cancelInd: string;
    waitlistInd: string;
    deliveryModes: {
      session: string;
      mode: string;
    }[];
    currentWaitlist: number;
    enrolmentInd: string;
    tbaInd: string;
    openLimitInd: string;
    notes: any[];
    enrolmentControls: {
      yearOfStudy: string;
      post: {
        code: string;
        name: string;
      };
      subject: {
        code: string;
        name: string;
      };
      subjectPost: {
        code: string;
        name: string;
      };
      typeOfProgram: {
        code: string;
        name: string;
      };
      designation: {
        code: string;
        name: string;
      };
      primaryOrg: {
        code: string;
        name: string;
      };
      associatedOrg: {
        code: string;
        name: string;
      };
      secondOrg: {
        code: string;
        name: string;
      };
      adminOrg: {
        code: string;
        name: string;
      };
      collaborativeOrgGroupCode: string;
      quantity: number;
      sequence: number;
    }[];
    linkedMeetingSections: null;
  };
  
  export type Course = {
    id: string;
    name: string;
    ucName: null;
    code: string;
    sectionCode: string;
    campus: string;
    sessions: string[];
    sections: Section[];
    duration: null;
    cmCourseInfo: {
      description: string;
      title: string;
      levelOfInstruction: string;
      prerequisitesText: string;
      corequisitesText: string;
      exclusionsText: string;
      recommendedPreparation: string;
      note: null;
      division: string;
      breadthRequirements: string[] | null;
      distributionRequirements: string[] | null;
      publicationSections: string[];
      cmPublicationSections: {
        section: string;
        subSections: null;
      }[];
    };
    created: string;
    modified: null;
    lastSaved: number;
    primaryTeachMethod: string;
    faculty: {
      code: string;
      name: string;
    };
    coSec: {
      code: string;
      name: null;
    };
    department: {
      code: string;
      name: string;
    };
    title: null;
    maxCredit: number;
    minCredit: number;
    breadths: {
      org: {
        code: string;
        name: string;
      };
      breadthTypes: {
        kind: string;
        type: string;
        description: string;
        code: string;
      }[];
    }[];
    notes: any[];
    cancelInd: string;
    subscriptionTtb: boolean;
    subscriptionOpenData: boolean;
    tb1Active: boolean;
    tb2Active: boolean;
    fullyOnline: boolean;
  };

  export async function fetchCourse(courseCode: string): Promise<Course> {
    let res = await fetch('/api/get_courses', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
      },
      body: JSON.stringify({"courseCodeAndTitleProps":{"courseCode":courseCode,"courseTitle":"","courseSectionCode":""},"sessions":["20235F","20235S","20235", "20239", "20241", "20239-20241"],"divisions":["APSC","ARTSC","FPEH","MUSIC","ARCLA","ERIN","SCAR"],"direction":"asc"})
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch course ${courseCode}`);
    }
    return (await res.json()).payload[0];
  }