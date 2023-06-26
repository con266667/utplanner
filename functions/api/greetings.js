// GET requests to /filename would return "Hello, world!"
export function onRequestGet(){
  return new Response("Hello, world!")
}
  
// POST requests to /filename with a JSON-encoded body would return "Hello, <name>!"
export async function onRequestPost({ request }) {
  const { name } = await request.json()
  return new Response(`Hello, ${name}!`)
}