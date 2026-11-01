/** Fragments follow the actual posed surface, including head and visible hair. */
export function createGlassShatter(T,scene) {
 let shards=[],elapsed=0,done=null,material=null;
 function start(root,complete) {
  if(done)return;
  root.updateWorldMatrix(true,true);
  const source=root.getObjectByName('Echo / breathing pivot')?.children.find(o=>o.isMesh)?.material;
  const cells=new Map(),p=new T.Vector3();
  root.traverseVisible(object=>{
   if(!object.isMesh||!object.geometry?.attributes.position||object.material!==source)return;
   const geometry=object.geometry,positions=geometry.attributes.position,index=geometry.index;
   const count=index?index.count:positions.count;
   for(let i=0;i+2<count;i+=3) {
    const triangle=[],center=new T.Vector3();
    for(let j=0;j<3;j++) {
     p.fromBufferAttribute(positions,index?index.getX(i+j):i+j).applyMatrix4(object.matrixWorld);
     triangle.push(p.x,p.y,p.z);center.add(p);
    }
    center.multiplyScalar(1/3);
    const key=[Math.floor(center.x/.19),Math.floor(center.y/.2),Math.floor(center.z/.19)].join('/');
    if(!cells.has(key))cells.set(key,[]);cells.get(key).push(...triangle);
   }
  });
  material=source?.clone()||new T.MeshPhysicalMaterial({color:0xd4fff4,roughness:.04,metalness:0});
  material.transparent=true;material.opacity=.9;material.depthWrite=false;
  material.side=T.DoubleSide;material.vertexColors=false;material.transmission=.25;material.emissiveIntensity=0;
  // The intact figure's custom shader requires colors; fragments use native glass.
  material.onBeforeCompile=()=>{};material.customProgramCacheKey=()=> 'echo-shard-native-glass';
  let n=0;
  for(const values of cells.values()) {
   const center=new T.Vector3();for(let i=0;i<values.length;i+=3)center.add(new T.Vector3(values[i],values[i+1],values[i+2]));
   center.multiplyScalar(3/values.length);
   for(let i=0;i<values.length;i+=3){values[i]-=center.x;values[i+1]-=center.y;values[i+2]-=center.z;}
   const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(values,3));geometry.computeVertexNormals();
   const mesh=new T.Mesh(geometry,material);mesh.position.copy(center);scene.add(mesh);
   const phase=n++*2.399963;
   shards.push({mesh,velocity:new T.Vector3(Math.sin(phase)*.12,.05+Math.cos(phase)*.04,Math.cos(phase)*.09),spin:new T.Vector3(Math.sin(phase)*.7,Math.cos(phase)*.8,.35*Math.sin(phase+.4)),landed:false});
  }
  root.visible=false;elapsed=0;done=complete;
 }
 function update(dt) {
  if(!done)return;
  elapsed+=dt;
  for(const s of shards) {
   if(s.landed)continue;
   s.velocity.y-=1.1*dt;s.mesh.position.addScaledVector(s.velocity,dt);
   s.mesh.rotation.x+=s.spin.x*dt;s.mesh.rotation.y+=s.spin.y*dt;s.mesh.rotation.z+=s.spin.z*dt;
   if(s.mesh.position.y<.13){s.mesh.position.y=.13;s.landed=true;s.mesh.rotation.x=Math.PI/2;}
  }
  material.opacity=.9*Math.max(0,1-Math.max(0,elapsed-2.5)/1.2);
  if(elapsed<3.8)return;
  for(const s of shards){scene.remove(s.mesh);s.mesh.geometry.dispose();}material.dispose();shards=[];
  const callback=done;done=null;callback();
 }
 return {start,update,get count(){return shards.length}};
}
