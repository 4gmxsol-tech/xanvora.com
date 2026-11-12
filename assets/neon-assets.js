// NEON FRONTIER procedural asset pack — original, dependency-free Three.js geometry.
export function buildOutposts(THREE, worldGroup) {
  const mat = (color, emissive = 0x000000, metalness = .45, roughness = .55) =>
    new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: .8, metalness, roughness });
  const steel = mat(0x263b55, 0x07182b, .8);
  const dark = mat(0x101d31, 0x061326, .65);
  const cyan = mat(0x14cce8, 0x00bce8, .35, .3);
  const pink = mat(0xd92b9c, 0x9b075f, .4, .35);
  const white = mat(0xa7d9e8, 0x163e55, .25, .4);
  const box = (g, w, h, d, m, x, y, z) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
    o.position.set(x,y,z); o.castShadow = true; o.receiveShadow = true; g.add(o); return o;
  };
  const cylinder = (g, rt, rb, h, m, x, y, z, sides=8) => {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,sides),m);
    o.position.set(x,y,z); o.castShadow = true; g.add(o); return o;
  };
  const positions = [[-150,-115],[185,-90],[-220,190],[260,225],[20,-310],[390,30],[-390,-40]];
  positions.forEach(([x,z], idx) => {
    const g = new THREE.Group(); g.position.set(x,0,z); worldGroup.add(g);
    // Hexagonal landing platform with illuminated perimeter.
    cylinder(g, 15, 15, .7, dark, 0, .35, 0, 6);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(13.5,.22,8,48), idx%2 ? pink : cyan);
    rim.rotation.x = Math.PI/2; rim.position.y=.78; g.add(rim);
    // Central command shelter.
    box(g, 9, 5.5, 8, steel, 0, 3.4, -2);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(7,2.5,4),dark);
    roof.position.set(0,7.4,-2); roof.rotation.y=Math.PI/4; g.add(roof);
    box(g, 2.2, 3.2, .18, cyan, 0, 2.2, 2.08);
    // Side cargo modules and hazard stripes.
    [-1,1].forEach(side => {
      box(g, 4.2, 2.7, 3.5, side<0?dark:steel, side*9, 1.7, 1);
      box(g, 3.5, .16, .12, idx%2?pink:cyan, side*9, 2.45, 2.78);
      for(let k=0;k<3;k++) box(g,.12,1.8,.12,white,side*9-1.2+k*1.2,1.7,2.8);
    });
    // Signal mast, antenna dishes and beacon.
    cylinder(g,.28,.42,13,steel,7,7, -7,8);
    cylinder(g,1.1,1.1,.25,cyan,7,12.8,-7,12);
    const dish = new THREE.Mesh(new THREE.SphereGeometry(1.5,12,8,0,Math.PI*2,0,Math.PI/2),white);
    dish.position.set(7,11,-7); dish.rotation.x=-.5; g.add(dish);
    const beacon = new THREE.PointLight(idx%2?0xff35bd:0x00dfff,35,55);
    beacon.position.set(0,9,0); g.add(beacon);
    // Four perimeter pylons.
    for(let a=0;a<4;a++){
      const angle=a*Math.PI/2;
      const px=Math.cos(angle)*12, pz=Math.sin(angle)*12;
      cylinder(g,.35,.55,3.4,steel,px,1.8,pz,6);
      cylinder(g,.5,.5,.25,idx%2?pink:cyan,px,3.6,pz,8);
    }
  });
}
export function createDroneVisual(THREE, elite=false) {
  const g = new THREE.Group();
  const shellMat = new THREE.MeshStandardMaterial({
    color: elite ? 0xff8b35 : 0x8d2a9d,
    emissive: elite ? 0xff5a00 : 0x8a007d,
    emissiveIntensity: 1.15, metalness: .72, roughness: .28
  });
  const darkMat = new THREE.MeshStandardMaterial({color:0x14243c,metalness:.85,roughness:.25});
  const glowMat = new THREE.MeshBasicMaterial({color:elite?0xffd078:0xff56df});
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(elite?1.35:.85,1),shellMat);
  core.position.y=1.3; core.castShadow=true; g.add(core);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(.28,12,8),new THREE.MeshBasicMaterial({color:0xffffff}));
  eye.position.set(0,1.35,-.82); g.add(eye);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(elite?1.8:1.2,.075,8,32),glowMat);
  halo.rotation.x=Math.PI/2; halo.position.y=.48; g.add(halo);
  // Four articulated rotor pods make the silhouette read as a combat machine.
  for(let i=0;i<4;i++){
    const a=i*Math.PI/2, x=Math.cos(a)*(elite?2.05:1.45), z=Math.sin(a)*(elite?2.05:1.45);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(.16,.16,elite?1.65:1.15),darkMat);
    arm.position.set(x*.5,1.3,z*.5); arm.rotation.y=-a; g.add(arm);
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(.34,.42,.42,8),darkMat);
    pod.position.set(x,1.25,z); pod.castShadow=true; g.add(pod);
    const rotor = new THREE.Mesh(new THREE.TorusGeometry(.38,.045,6,18),glowMat);
    rotor.rotation.x=Math.PI/2; rotor.position.copy(pod.position); g.add(rotor);
  }
  const under = new THREE.PointLight(elite?0xff7900:0xff00c8,4,10);
  under.position.y=.2; g.add(under);
  return g;
}
