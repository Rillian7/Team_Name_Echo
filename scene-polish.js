// Відлуння — additional scene dressing, camera feedback and authored staging.
// All geometry is created locally. No network textures or external assets are required.
export function createScenePolish(T,scene,api){
  const {box,cyl,ball,rod,mesh,mat,light,echo,body,glass,cracks,headEcho,shutters,hiddenEchoes,sideLights}=api;
  const nickel=mat(0x788c80,.46,.65),charcoal=mat(0x15241f,.76,.18),enamel=mat(0x41534a,.65,.25);
  const bone=mat(0xb6c3ad,.88,.08),brass=mat(0x938365,.44,.65);
  const phosphor=new T.MeshBasicMaterial({color:0x9de3c0,transparent:true,opacity:.74,depthWrite:false});
  const dimPhosphor=new T.MeshBasicMaterial({color:0x8dbfaa,transparent:true,opacity:.3,depthWrite:false});
  const signalAmber=new T.MeshBasicMaterial({color:0xf4bc74,transparent:true,opacity:.76,depthWrite:false});
  const signalRed=new T.MeshBasicMaterial({color:0xef8b75,transparent:true,opacity:.6,depthWrite:false});
  const fx={archive:0,archiveTarget:0,stress:0,stressTarget:0,flash:0,caseId:'018',listening:0};
  function flatPanel(w,h,x,y,z,draw,resolution=512){
    const c=document.createElement('canvas');c.width=resolution;c.height=Math.round(resolution*h/w);
    const g=c.getContext('2d');draw(g,c.width,c.height);
    const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
    const surface=new T.MeshBasicMaterial({map:tex,side:T.DoubleSide,transparent:true,depthWrite:false});
    const plane=mesh(new T.PlaneGeometry(w,h),surface,x,y,z);
    plane.castShadow=false;return {plane,canvas:c,ctx:g,texture:tex};
  }
  const sign=(title,small,x,y,z,w=1.4,h=.35)=>flatPanel(w,h,x,y,z,(g,W,H)=>{
    g.fillStyle='#142a23';g.fillRect(0,0,W,H);
    g.fillStyle='#a3bdab';g.fillRect(0,0,W,3);g.fillRect(0,H-3,W,2);
    g.fillStyle='#cae9cf';g.font=`700 ${Math.round(H*.41)}px monospace`;g.fillText(title,16,H*.54);
    g.fillStyle='#719c86';g.font=`${Math.round(H*.19)}px monospace`;g.fillText(small,16,H*.82);
  });
  // The wall grid is familiar, but finer mechanics make it a functioning laboratory.
  for(const x of [-5.88,5.88]){
    for(let z=-6.4;z<5.4;z+=1.35){
      box(.052,.82,.46,x,3.37,z,charcoal);
      for(let i=0;i<5;i++)box(.058,.018,.35,x,3.14+i*.105,z,nickel);
    }
    for(let z=-6;z<5;z+=2.1){box(.15,.13,.32,x,2.45,z,enamel);}
  }
  // Floor inlays, containment-circle service rails and safety hatching.
  const yellow=mat(0x907b55,.9,.03);
  for(let i=0;i<12;i++){
    const z=-5.7+i*.88;
    for(const x of [-3.37,3.37]){
      const mark=box(.11,.009,.48,x,-.039,z,yellow);
      mark.rotation.y=.48;
    }
  }
  for(const s of [-1,1]){
    for(let i=0;i<3;i++){
      const p=box(.055,.014,1.05,s*(1.22+i*.17),-.031,-1.3,enamel);p.rotation.y=0;
    }
  }
  // Rear bulkhead and layered panels.
  for(const x of [-4.75,-3.75,3.75,4.75]){
    box(.64,2.52,.10,x,1.45,-6.74,charcoal);
    box(.49,2.32,.018,x,1.45,-6.67,enamel);
    for(let y=.5;y<2.4;y+=.38)box(.38,.02,.018,x,y,-6.65,nickel);
  }
  sign('ECHO / UNIT 04','AUTHORIZED PERSONNEL ONLY',-4.05,3.46,-6.63,2.1,.42);
  // A real service readout updates when the dossier changes.
  const readout=flatPanel(1.64,.53,-.65,2.85,-6.67,()=>{});
  function drawReadout(t=0){
    const g=readout.ctx,W=readout.canvas.width,H=readout.canvas.height;
    g.fillStyle='#071711';g.fillRect(0,0,W,H);
    g.strokeStyle='#294d3d';for(let x=0;x<W;x+=36){g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke();}
    g.fillStyle='#b5dabe';g.font='700 30px monospace';g.fillText(`SUBJECT ${fx.caseId}`,22,43);
    g.fillStyle=fx.stressTarget>.2?'#e6af87':'#7cbb93';g.font='20px monospace';g.fillText(fx.stressTarget>.2?'SIGNAL DEVIATION':'RECONSTRUCTION ACTIVE',22,73);
    g.fillStyle='#7da892';g.font='15px monospace';g.fillText(`OP. 071    UNIT 04    ${Math.floor(t*3)%2?'●':'○'}`,22,103);
    readout.texture.needsUpdate=true;
  }
  drawReadout();
  sign('BIO-MEMETIC ARRAY','DO NOT DISCONNECT',2.05,3.46,-6.67,1.95,.35);
  // Scanner frame behind the subject: visible shape, not arbitrary decoration.
  const scanner=new T.Group();scanner.position.set(0,1.35,-2.7);scene.add(scanner);
  const torus=(rad,tube,material,rx=0)=>{const o=mesh(new T.TorusGeometry(rad,tube,8,64),material,0,0,0,scanner);o.rotation.x=rx;o.castShadow=false;return o;};
  torus(1.37,.054,charcoal);torus(1.29,.013,dimPhosphor);torus(1.12,.013,nickel);
  const scannerMarkers=[];
  for(let i=0;i<32;i++){
    const a=i*Math.PI*2/32;
    const tick=box(i%4===0?.095:.048,i%4===0?.019:.01,.01,Math.cos(a)*1.36,1.35+Math.sin(a)*1.36,-2.67,i%4===0?signalAmber:dimPhosphor);
    tick.rotation.z=a;scannerMarkers.push(tick);
  }
  for(let s of [-1,1]){
    rod([s*1.39,.12,-2.73],[s*1.39,2.8,-2.73],.04,nickel);
    box(.27,.17,.25,s*1.39,.30,-2.7,charcoal);
    box(.21,.17,.25,s*1.39,2.66,-2.7,charcoal);
  }
  // Layered circular base with tiny emissive registration notches.
  const platform=new T.Group();platform.position.set(0,.09,-1.3);scene.add(platform);
  for(const r of [.77,.88,.98]){
    const line=mesh(new T.TorusGeometry(r,.008,5,64),r===.88?signalAmber:dimPhosphor,0,0,0,platform);
    line.rotation.x=Math.PI/2;line.castShadow=false;
  }
  for(let i=0;i<12;i++){
    const a=i/12*2*Math.PI;
    const o=box(.13,.025,.04,Math.sin(a)*.93,.10,-1.3+Math.cos(a)*.93,brass);o.rotation.y=a;
  }
  // Proper arch-shaped side chamber frames, solid shutters, warning indicators.
  const shuttersOriginal=shutters.map(o=>o.position.y);
  for(const x of [-4.6,4.6]){
    const p=box(1.9,3.05,.22,x,2,.14,charcoal);
    // the shutter is in front of this supporting recess; leave hollow central opening
    p.visible=false;
    for(const s of [-1,1]){
      box(.14,3.1,.34,x+s*.88,2.02,.14,nickel);
      for(let y=.62;y<3.47;y+=.32)box(.04,.04,.05,x+s*.88,y,.36,brass);
    }
    box(1.9,.16,.34,x,3.63,.14,nickel);
    box(1.9,.16,.34,x,.43,.14,nickel);
    const n=x<0?'01':'02';
    sign(`ARCHIVE ${n}`,'ISOLATION BAY',x,3.82,.37,1.45,.26);
    box(.25,.085,.11,x+.72,.42,.39,signalRed);
  }
  // Extra vertical slats on shutters move with the parent, not pop out.
  shutters.forEach((s,i)=>{
    const original=s.material;
    s.material=mat(0x1b2c25,.7,.38);
    for(let j=0;j<8;j++){
      const rib=box(1.42,.055,.05,0,-1.16+j*.32,.092,j%2?enamel:nickel,s);
      rib.castShadow=false;
    }
  });
  // Subtle second glass layer helps the silhouettes read without realistic faces.
  const inner=new T.Group();body.add(inner);
  const innerMat=new T.MeshBasicMaterial({color:0x6ea896,transparent:true,opacity:.10,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide});
  const chest=mesh(new T.IcosahedronGeometry(.31,1),innerMat,0,1.45,-.01,inner);
  chest.scale.set(.88,1.05,.67);chest.castShadow=false;
  const heart=mesh(new T.OctahedronGeometry(.065,0),signalAmber,0,1.42,.105,inner);heart.castShadow=false;
  for(const [obj,scale] of [[new T.IcosahedronGeometry(.19,1),[.75,1.4,.82]]]){
    const core=mesh(obj,innerMat,0,2.14,0,inner);core.scale.set(...scale);core.castShadow=false;
  }
  // Living silhouette contours plus independently pulsing registration dots.
  const shellEdges=[];body.traverse(o=>{
    if(o.isLineSegments&&o.material?.color){shellEdges.push(o);}
  });
  const motes=[];
  const moteMaterial=new T.MeshBasicMaterial({color:0xa5d8c0,transparent:true,opacity:.33,depthWrite:false});
  // A few points of refracted light following the echo (not confetti).
  for(let i=0;i<24;i++){
    const a=i*2.399963,s=.45+(i%7)*.045;
    const shard=mesh(new T.TetrahedronGeometry(.009+(i%3)*.006),moteMaterial,
      Math.cos(a)*s,.3+(i%15)*.125,Math.sin(a)*s,body);
    shard.castShadow=false;motes.push({mesh:shard,phase:i*.81,origin:shard.position.clone()});
  }
  // Air particles between glass and operator, very low density and predictable cost.
  const dustCount=120,dustGeo=new T.BufferGeometry(),dustPos=new Float32Array(dustCount*3);
  let seed=82;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  for(let i=0;i<dustCount;i++){
    dustPos[i*3]=(random()-.5)*10;
    dustPos[i*3+1]=random()*3.6;
    dustPos[i*3+2]=-6+random()*9;
  }
  dustGeo.setAttribute('position',new T.BufferAttribute(dustPos,3));
  const dustMat=new T.PointsMaterial({color:0xa9c1ab,size:.022,transparent:true,opacity:.27,depthWrite:false,sizeAttenuation:true});
  const dust=new T.Points(dustGeo,dustMat);scene.add(dust);
  // Visual sound pulse: a short ring from the microphone, only when deliberately listening.
  const listeningRing=mesh(new T.TorusGeometry(.47,.012,6,48),signalAmber.clone(),0,1.8,-1.3);
  listeningRing.visible=false;listeningRing.castShadow=false;
  const skyLamp=light(0xb1fae0,0,0,2.8,-1.4,5);
  function setCase(id){fx.caseId=id;drawReadout();}
  function setStress(value){fx.stressTarget=value/100;drawReadout();fx.flash=1;}
  function setArchive(open){fx.archiveTarget=open?1:0;fx.flash=1.1;}
  function listenPulse(){fx.listening=1;fx.flash=.23;}
  function flash(){fx.flash=1;}
  function update(time,dt){
    const lerp=(a,b,k)=>a+(b-a)*Math.min(1,k);
    fx.archive=lerp(fx.archive,fx.archiveTarget,dt*1.65);
    fx.stress=lerp(fx.stress,fx.stressTarget,dt*3.5);
    fx.flash=Math.max(0,fx.flash-dt*2.5);
    fx.listening=Math.max(0,fx.listening-dt*.55);
    shutters.forEach((shutter,i)=>{
      shutter.position.y=shuttersOriginal[i]+fx.archive*3.1;
      shutter.visible=fx.archive<.995;
      hiddenEchoes[i].visible=fx.archive>.14;
      sideLights[i].intensity=fx.archive*(8+Math.sin(time*1.5+i)*1.4);
    });
    if(fx.archive>.05){hiddenEchoes.forEach((other,i)=>{
      other.rotation.y=Math.sin(time*.35+i)*.03;
      other.position.y=Math.sin(time*.7+i*2)*.012;
    });}
    scanner.rotation.z=Math.sin(time*.15)*.01;
    const pulse=Math.sin(time*1.4)*.12+.85;
    dimPhosphor.opacity=(.22+fx.stress*.18)*pulse;
    phosphor.opacity=.53+Math.sin(time*2)*.12;
    heart.rotation.y=time*.35;
    heart.scale.setScalar(1+Math.sin(time*2.4)*.14);
    innerMat.opacity=.075+Math.sin(time*1.8)*.025+fx.stress*.09;
    glass.emissiveIntensity=.3+fx.stress*.12+(fx.flash*.22);
    skyLamp.intensity=1.5+fx.stress*5+fx.flash*5;
    moteMaterial.opacity=.23+fx.stress*.24;
    motes.forEach(p=>{p.mesh.position.y=p.origin.y+Math.sin(time*.6+p.phase)*.017;});
    dust.rotation.y=Math.sin(time*.05)*.015;
    listeningRing.visible=fx.listening>.02;
    if(listeningRing.visible){
      const f=1+(1-fx.listening)*.9;listeningRing.scale.setScalar(f);
      listeningRing.material.opacity=.13+fx.listening*.45;
    }
    if(Math.floor(time*2)!==Math.floor((time-dt)*2))drawReadout(time);
  }
  return {update,setCase,setStress,setArchive,listenPulse,flash,fx};
}
