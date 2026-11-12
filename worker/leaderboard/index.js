const cors={
 "Access-Control-Allow-Origin":"https://xanvora.com",
 "Access-Control-Allow-Methods":"GET, POST, OPTIONS",
 "Access-Control-Allow-Headers":"Content-Type",
 "Access-Control-Max-Age":"86400"
};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});
const cleanName=v=>String(v||"Rookie").normalize("NFKC").replace(/[^a-zA-Z0-9 _.-]/g,"").trim().slice(0,18)||"Rookie";
export default {async fetch(req,env){
 if(req.method==="OPTIONS")return new Response(null,{headers:cors});
 if(!env.DB)return json({error:"Leaderboard database is not configured"},503);
 const u=new URL(req.url);
 if(u.pathname==="/health"&&req.method==="GET")return json({ok:true,service:"xanvora-leaderboard"});
 if(u.pathname==="/leaderboard"&&req.method==="GET"){
  const rows=await env.DB.prepare("SELECT player_name, score, coins, near_misses, created_at FROM scores ORDER BY score DESC, created_at ASC LIMIT 50").all();
  return json({entries:rows.results||[]});
 }
 if(u.pathname==="/score"&&req.method==="POST"){
  let b;try{b=await req.json()}catch{return json({error:"Invalid JSON"},400)}
  const name=cleanName(b.name),score=Math.floor(Number(b.score)),coins=Math.floor(Number(b.coins)||0),near=Math.floor(Number(b.near)||0);
  if(!Number.isSafeInteger(score)||score<1||score>1000000||coins<0||coins>100000||near<0||near>100000)return json({error:"Invalid score payload"},400);
  const ip=req.headers.get("CF-Connecting-IP")||"unknown";
  const recent=await env.DB.prepare("SELECT COUNT(*) AS n FROM scores WHERE ip_hash=? AND created_at > datetime('now','-1 minute')").bind(await hash(ip)).first();
  if((recent?.n||0)>=8)return json({error:"Please wait before submitting another run"},429);
  await env.DB.prepare("INSERT INTO scores(player_name,score,coins,near_misses,ip_hash) VALUES(?,?,?,?,?)").bind(name,score,coins,near,await hash(ip)).run();
  return json({ok:true,name,score});
 }
 return json({error:"Not found"},404);
}};
async function hash(s){const bytes=new TextEncoder().encode(s+"|xanvora-neon-leaderboard-v1");const digest=await crypto.subtle.digest("SHA-256",bytes);return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("")}
