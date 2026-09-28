const cors={"Access-Control-Allow-Origin":"https://xanvora.com","Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type"};
export default{async fetch(request,env){
 if(request.method==="OPTIONS")return new Response(null,{headers:cors});
 const url=new URL(request.url);
 if(url.pathname!=="/search"||request.method!=="POST")return json({error:"Not found"},404);
 if(!env.SERPAPI_KEY)return json({error:"Search connector is not configured."},503);
 const form=await request.formData(),image=form.get("image");
 if(!(image instanceof File))return json({error:"image file is required"},400);
 if(!image.type.startsWith("image/"))return json({error:"Only image files are accepted"},415);
 if(image.size>500*1024)return json({error:"Image must be 500 KB or smaller."},413);
 const upload=new FormData();upload.append("image",image,image.name||"upload");upload.append("api_key",env.SERPAPI_KEY);
 const up=await fetch("https://serpapi.com/image",{method:"POST",body:upload}),u=await up.json();
 if(!up.ok||u.error||!u.image_id)return json({error:u.error||"Image upload failed"},502);
 const p=new URLSearchParams({engine:"google_lens",image_id:u.image_id,type:"all",safe:"active",api_key:env.SERPAPI_KEY});
 const sr=await fetch("https://serpapi.com/search.json?"+p),d=await sr.json();
 if(!sr.ok||d.error)return json({error:d.error||"Visual search failed"},502);
 return json({engine:"google_lens",exact_matches:(d.exact_matches||[]).slice(0,20).map(x=>pick(x,"exact")),visual_matches:(d.visual_matches||[]).slice(0,20).map(x=>pick(x,"visual")),text:d.text||"",searched_at:new Date().toISOString()});
}};
function pick(x,kind){return{kind,title:x.title||"",source:x.source||"",link:x.link||"",thumbnail:x.thumbnail||""}}
function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}})}
