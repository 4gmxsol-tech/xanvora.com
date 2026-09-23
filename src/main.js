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

const ground=new THREE.Mesh(
  new THREE.PlaneGeometry(120,120),
  new THREE.MeshStandardMaterial({color:0x274b32,roughness:1})
);
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);

const grid=new THREE.GridHelper(80,40,0x5b7d69,0x375044);
grid.position.y=.01;scene.add(grid);

function cube({x,y,z,sx,sy,sz,color,emissive=0}){
  const mesh=new THREE.Mesh(
    new THREE.BoxGeometry(sx,sy,sz),
    new THREE.MeshStandardMaterial({color,emissive})
  );
  mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
  return mesh;
}

function makeTree(x,z){
  const trunk=new THREE.Mesh(
    new THREE.CylinderGeometry(.35,.5,3,12),
    new THREE.MeshStandardMaterial({color:0x6b4329})
  );
  trunk.position.set(x,1.5,z);trunk.castShadow=true;scene.add(trunk);

  const crown=new THREE.Mesh(
    new THREE.SphereGeometry(2.1,18,14),
    new THREE.MeshStandardMaterial({color:0x3d8a4c})
  );
  crown.position.set(x,3.7,z);crown.castShadow=true;scene.add(crown);
}
makeTree(-6,-3);makeTree(6,-7);

const player=cube({x:0,y:.75,z:5,sx:1,sy:1.5,sz:1,color:0x3aa7ff});
const npc=cube({x:0,y:1,z:-2,sx:1,sy:2,sz:1,color:0xffc14d,emissive:0x3d2500});
const npcHead=new THREE.Mesh(
  new THREE.SphereGeometry(.55,16,12),
  new THREE.MeshStandardMaterial({color:0xffd89a})
);
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
  const hits=raycaster.intersectObjects([npc,npcHead],true);
  if(hits.length)setStatus('Guardian: "I am listening. Give me a command."');
});

function buildHouseNearTree(){
  if(house)scene.remove(house);
  house=new THREE.Group();

  const base=new THREE.Mesh(
    new THREE.BoxGeometry(3.2,1.7,3.2),
    new THREE.MeshStandardMaterial({color:0x8f6a4b})
  );
  base.position.y=.85;base.castShadow=true;base.receiveShadow=true;house.add(base);

  const roof=new THREE.Mesh(
    new THREE.ConeGeometry(2.55,1.8,4),
    new THREE.MeshStandardMaterial({color:0x8d2f39})
  );
  roof.rotation.y=Math.PI/4;roof.position.y=2.6;roof.castShadow=true;house.add(roof);

  const door=new THREE.Mesh(
    new THREE.BoxGeometry(.75,1.1,.12),
    new THREE.MeshStandardMaterial({color:0x3c2414})
  );
  door.position.set(0,.55,1.62);house.add(door);

  house.position.set(-4.2,0,-3.2);scene.add(house);
}

async function planCommand(raw){
  const text=raw.trim();
  if(!text)return null;

  // Xanvora's command boundary is intentionally structured:
  // natural-language intent -> validated game action.
  // A remote AI provider can be plugged into planCommand later without
  // exposing an API key in the static frontend.
  const lower=text.toLowerCase();

  if((lower.includes("build")||lower.includes("create")||lower.includes("make"))&&lower.includes("house")){
    return {action:"create_building",type:"house",location:"near_tree"};
  }
  if((lower.includes("guard")||lower.includes("guardian")||lower.includes("protect"))&&
     (lower.includes("robot")||lower.includes("npc"))){
    return {action:"set_guardian",enabled:true};
  }
  if(lower.includes("clear")||lower.includes("reset")||lower.includes("remove house")){
    return {action:"reset_world"};
  }
  return null;
}

function executeGameAction(action){
  if(!action)return false;

  switch(action.action){
    case "create_building":
      if(action.type==="house"){
        buildHouseNearTree();
        setStatus("Xanvora created a house near the tree.");
        return true;
      }
      break;
    case "set_guardian":
      guardianMode=Boolean(action.enabled);
      setStatus(guardianMode
        ? "The robot is now in guardian mode."
        : "The robot left guardian mode.");
      return true;
    case "reset_world":
      if(house){scene.remove(house);house=null}
      guardianMode="idle";
      setStatus("World reset.");
      return true;
  }
  return false;
}

async function handleCommand(raw){
  const command=raw.trim();
  if(!command)return;
  setStatus("Xanvora is interpreting your intent…");

  const action=await planCommand(command);
  if(executeGameAction(action))return;

  setStatus("I understood the request, but this prototype does not have a validated game action for it yet.");
}

