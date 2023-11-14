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


  var response = await fetch("https://api.easi.utoronto.ca/ttb/getPageableCourses", {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(await context.request.json())
  })
  var data = await response.json();
  data = data.payload.pageableCourse.courses;

  var importantData: any[] = [];

  // "sections": [
  //   {
  //       "name": "TUT0105",
  //       "type": "Tutorial",
  //       "teachMethod": "TUT",
  //       "sectionNumber": "0105",
  //       "meetingTimes": [
  //           {
  //               "start": {
  //                   "day": 4,
  //                   "millisofday": 64800000
  //               },
  //               "end": {
  //                   "day": 4,
  //                   "millisofday": 68400000
  //               },
  //               "building": {
  //                   "buildingCode": "BA",
  //                   "buildingRoomNumber": "",
  //                   "buildingRoomSuffix": "",
  //                   "buildingUrl": "https://map.utoronto.ca/?id=1809#!m/494470",
  //                   "buildingName": null
  //               },
  //               "sessionCode": "20239",
  //               "repetition": "WEEKLY",
  //               "repetitionTime": "ONCE_A_WEEK"
  //           },

  for (var i = 0; i < data.length; i++) {
    importantData.push({
      "code": data[i].code,
      "name": data[i].name,
      "meetingTimes": data[i].sections.map((section) => {
        return {
          "type": section.type,
          "meetingTimes": section.meetingTimes.map((meetingTime) => {
            return {
              "start": meetingTime.start,
              "end": meetingTime.end,
              "building": meetingTime.building,
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