export const onRequestPost = async (context) => {
  const init = {
    headers: {
        "content-type": "application/json;charset=UTF-8",
    },
  };

  var myHeaders = new Headers();
  myHeaders.append("Accept", "application/json, text/plain, */*");
  myHeaders.append("Content-Type", "application/json");

  var requestJson = await context.request.json()
  var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(requestJson),
  };

  var response = await fetch("https://api.easi.utoronto.ca/ttb/getCourses", requestOptions)
  var json = JSON.stringify(await response.json());
  return new Response(json, init);

};