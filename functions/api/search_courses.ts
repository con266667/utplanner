export const onRequestGet = async (context) => {
    console.log(context.request.url.split("?")[1]);
    const init = {
      headers: {
          "content-type": "application/json;charset=UTF-8",
      },
    };
  
    var myHeaders = new Headers();
    myHeaders.append("Accept", "application/json, text/plain, */*");
    myHeaders.append("Content-Type", "application/json");

    var requestOptions = {
        method: 'GET',
        headers: myHeaders,
    };
  
    var response = await fetch("https://api.easi.utoronto.ca/ttb/getOptimizedMatchingCourseTitles?" + context.request.url.split("?")[1]
    , requestOptions)
    var json = JSON.stringify(await response.json());
    return new Response(json, init);
  };