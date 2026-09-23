import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const canvas=document.querySelector("#game");
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x07111a);
scene.fog=new THREE.Fog(0x07111a,18,70);

const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,200);
camera.position.set(0,10,15);

const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;

scene.add(new THREE.HemisphereLight(0x9bc7ff,0x203020,1.8));
const sun=new THREE.DirectionalLight(0xffffff,2.4);
sun.position.set(8,18,6);sun.castShadow=true;scene.add(sun);

const ground=new THREE.Mesh(new THREE.PlaneGeometry(120,120),new THREE.MeshStandardMaterial({color:0x274b32,roughness:1}));
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const grid=new THREE.GridHelper(80,40,0x5b7d69,0x375044);
grid.position.y=.01;scene.add(grid);

function cube({x,y,z,sx,sy,sz,color,emissive=0}){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),new THREE.MeshStandardMaterial({color,emissive}));
  mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);return mesh;
}
function makeTree(x,z){
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.35,.5,3,12),new THREE.MeshStandardMaterial({color:0x6b4329}));
  trunk.position.set(x,1.5,z);trunk.castShadow=true;scene.add(trunk);
  const crown=new THREE.Mesh(new THREE.SphereGeometry(2.1,18,14),new THREE.MeshStandardMaterial({color:0x3d8a4c}));
  crown.position.set(x,3.7,z);crown.castShadow=true;scene.add(crown);
}
makeTree(-6,-3);makeTree(6,-7);

const player=cube({x:0,y:.75,z:5,sx:1,sy:1.5,sz:1,color:0x3aa7ff});
const npc=cube({x:0,y:1,z:-2,sx:1,sy:2,sz:1,color:0xffc14d,emissive:0x3d2500});
const npcHead=new THREE.Mesh(new THREE.SphereGeometry(.55,16,12),new THREE.MeshStandardMaterial({color:0xffd89a}));
npcHead.position.set(0,2.35,-2);npcHead.castShadow=true;scene.add(npcHead);

let house=null;
let guardianMode="idle";
const keys=new Set();
addEventListener("keydown",e=>keys.add(e.key.toLowerCase()));
addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));

const raycaster=new THREE.Raycaster();
const pointer=new THREE.Vector2();
canvas.addEventListener("click",event=>{
  pointer.x=(event.clientX/innerWidth)*2-1;
  pointer.y=-(event.clientY/innerHeight)*2+1;
  raycaster.setFromCamera(pointer,camera);
  if(raycaster.intersectObjects([npc,npcHead],true).length)setStatus('Guardian: "I am listening. Give me a command."');
});

function buildHouseNearTree(){
  if(house)scene.remove(house);
  house=new THREE.Group();
  const base=new THREE.Mesh(new THREE.BoxGeometry(3.2,1.7,3.2),new THREE.MeshStandardMaterial({color:0x8f6a4b}));
  base.position.y=.85;base.castShadow=true;base.receiveShadow=true;house.add(base);
  const roof=new THREE.Mesh(new THREE.ConeGeometry(2.55,1.8,4),new THREE.MeshStandardMaterial({color:0x8d2f39}));
  roof.rotation.y=Math.PI/4;roof.position.y=2.6;roof.castShadow=true;house.add(roof);
  const door=new THREE.Mesh(new THREE.BoxGeometry(.75,1.1,.12),new THREE.MeshStandardMaterial({color:0x3c2414}));
  door.position.set(0,.55,1.62);house.add(door);
  house.position.set(-4.2,0,-3.2);scene.add(house);
}

function executeGameAction(action){
  if(!action)return false;
  switch(action.action){
    case "create_building":
      if(action.type==="house"){buildHouseNearTree();setStatus("Xanvora created a house near the tree.");return true;}
      break;
    case "set_guardian":
      guardianMode=Boolean(action.enabled);
      setStatus(guardianMode?"The robot is now in guardian mode.":"The robot left guardian mode.");
      return true;
    case "reset_world":
      if(house){scene.remove(house);house=null}
      guardianMode="idle";setStatus("World reset.");return true;
  }
  return false;
}

const AI_API_URL=window.XANVORA_AI_API_URL||"";
async function planWithRemoteAI(raw){
  if(!AI_API_URL)return null;
  const response=await fetch(AI_API_URL,{
    method:"POST",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({command:raw})
  });
  if(!response.ok)throw new Error("AI planner request failed");
  const data=await response.json();
  return data.action||null;
}

function planCommandLocally(raw){
  const text=raw.trim().toLowerCase();
  if(!text)return null;
  if((text.includes("build")||text.includes("create")||text.includes("make"))&&text.includes("house"))
    return {action:"create_building",type:"house",location:"near_tree"};
  if((text.includes("guard")||text.includes("guardian")||text.includes("protect"))&&(text.includes("robot")||text.includes("npc")))
    return {action:"set_guardian",enabled:true};
  if(text.includes("clear")||text.includes("reset")||text.includes("remove house"))
    return {action:"reset_world"};
  return null;
}

async function planCommand(raw){
  if(AI_API_URL)return planWithRemoteAI(raw);
  return planCommandLocally(raw);
}

async function handleCommand(raw){
  const command=raw.trim();
  if(!command)return;
  setStatus(AI_API_URL?"Xanvora is asking the AI planner…":"Xanvora is interpreting your intent…");
  try{
    const action=await planCommand(command);
    if(executeGameAction(action))return;
    setStatus("No validated game action matched that request yet.");
  }catch(error){
    console.error(error);
    setStatus("AI planner unavailable. Local command mode remains available.");
  }
}

document.querySelector("#command-form").addEventListener("submit",async event=>{
  event.preventDefault();
  const input=document.querySelector("#command");
  const command=input.value;
  input.value="";
  await handleCommand(command);
});

function setStatus(message){document.querySelector("#status").textContent=message;}

addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});

function animate(){
  requestAnimationFrame(animate);
  const speed=.12;
  if(keys.has("w")||keys.has("arrowup"))player.position.z-=speed;
  if(keys.has("s")||keys.has("arrowdown"))player.position.z+=speed;
  if(keys.has("a")||keys.has("arrowleft"))player.position.x-=speed;
  if(keys.has("d")||keys.has("arrowright"))player.position.x+=speed;
  camera.lookAt(player.position.x,0,player.position.z-2);
  if(guardianMode==="idle")npc.rotation.y+=.003;
  else npc.rotation.y=Math.sin(performance.now()*.001)*.35;
  npcHead.position.x=npc.position.x;npcHead.position.z=npc.position.z;
  renderer.render(scene,camera);
}
animate();
