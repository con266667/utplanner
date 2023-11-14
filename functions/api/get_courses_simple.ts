export const onRequestPost = async (context) => {
  const init = {
    headers: {
        "content-type": "application/json;charset=UTF-8",
    },
  };

  var myHeaders = new Headers();
  myHeaders.append("Accept", "application/json, text/plain, */*");
  myHeaders.append("Content-Type", "application/json");

  var body = await context.request.json();

  // If departmentProps is not specified, set it to []
  if (!body.departmentProps) {
    body.departmentProps = [];
  }

  // If sessions is not specified, set it to ["20239","20241","20239-20241"]
  if (!body.sessions) {
    body.sessions = ["20239","20241","20239-20241"];
  }

  // If divisions is not specified, set it to ["APSC","ARTSC","FPEH","MUSIC","ARCLA"]
  if (!body.divisions) {
    body.divisions = ["APSC","ARTSC","FPEH","MUSIC","ARCLA"];
  }

  // If page is not specified, set it to 1
  if (!body.page) {
    body.page = 1;
  }

  // If pageSize is not specified, set it to 10
  if (!body.pageSize) {
    body.pageSize = 10;
  }

  if (body.search) {
    body.courseCodeAndTitleProps = {
      "courseCode": "",
      "courseTitle": body.search,
      "courseSectionCode": "",
      "searchCourseDescription": true
    }
    body.search = undefined;
  }


  var response = await fetch("https://api.easi.utoronto.ca/ttb/getPageableCourses", {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(body),
  })
  var data = await response.json();
  if (data.payload == null) {
    return new Response(JSON.stringify([]), init);
  }
  data = data.payload.pageableCourse.courses;

  var importantData: any[] = [];

  for (var i = 0; i < data.length; i++) {
    importantData.push({
      "code": data[i].code,
      "name": data[i].name,
      "meetingTimes": data[i].sections.map((section) => {
        return {
          "type": section.type,
          "meetingTimes": section.meetingTimes.map((meetingTime) => {
            return {
              "start": {
                "day": meetingTime.start.day,
                "hour": meetingTime.start.millisofday / 3600000,
              },
              "end": {
                "day": meetingTime.end.day,
                "hour": meetingTime.end.millisofday / 3600000,
              },
              "building": meetingTime.building.buildingCode,
              "repetition": meetingTime.repetition,
              "repetitionTime": meetingTime.repetitionTime
            }
          })
        }
      })
    })
  }

  var json = JSON.stringify(importantData);
  return new Response(json, init);

};