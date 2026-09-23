const ALLOWED_ACTIONS = new Set(["create_building","set_guardian","reset_world"]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{"content-type":"application/json",...corsHeaders}
  });
}

const schema={
  type:"object",
  additionalProperties:false,
  properties:{
    action:{type:["string","null"],enum:["create_building","set_guardian","reset_world",null]},
    type:{type:["string","null"],enum:["house",null]},
    location:{type:["string","null"],enum:["near_tree",null]},
    enabled:{type:["boolean","null"]}
  },
  required:["action","type","location","enabled"]
};

export default {
  async fetch(request,env){
    if(request.method==="OPTIONS")return new Response(null,{headers:corsHeaders});
    if(request.method!=="POST")return json({error:"POST required"},405);

    let body;
    try{body=await request.json();}catch{return json({error:"Invalid JSON"},400);}
    const command=typeof body.command==="string"?body.command.trim():"";
    if(!command||command.length>500)return json({error:"Command must be 1-500 characters"},400);
    if(!env.OPENAI_API_KEY)return json({error:"OPENAI_API_KEY is not configured"},503);

    const prompt=[
      "You are Xanvora's game-command planner.",
      "Convert the player's natural-language request into exactly one safe structured game action.",
      "Allowed actions:",
      "create_building: only type=house, location=near_tree.",
      "set_guardian: controls the robot guardian mode; enabled=true for requests to guard/protect, false for requests to stop guarding.",
      "reset_world: clear/reset/remove the house or reset the world.",
      "If no allowed action is clearly requested, return action=null.",
      "Never invent other actions, coordinates, tools, or game entities.",
      "",
      "PLAYER COMMAND:",
      command
    ].join("\n");

    const upstream=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{
        "content-type":"application/json",
        "authorization":`Bearer ${env.OPENAI_API_KEY}`
      },
      body:JSON.stringify({
        model:env.OPENAI_MODEL||"gpt-5.6-luna",
        input:prompt,
        text:{format:{type:"json_schema",name:"xanvora_game_action",strict:true,schema}}
      })
    });

    if(!upstream.ok)return json({error:"AI provider request failed"},502);
    const result=await upstream.json();
    const outputText=result.output_text;
    if(typeof outputText!=="string")return json({error:"AI provider returned no structured output"},502);

    let action;
    try{action=JSON.parse(outputText);}catch{return json({error:"Planner returned invalid JSON"},502);}
    if(action.action!==null&&!ALLOWED_ACTIONS.has(action.action))return json({error:"Action rejected"},422);

    return json({action});
  }
};
