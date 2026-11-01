import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import { createInteractionPolish } from '../interaction-polish.js';
import { addDeskEasterEggs } from '../desk-easter-eggs.js';
const nodes = new Map();
function node() {
 const classes = new Set();
 return { children: [], style: {}, hidden: false, textContent: '', attributes: {},
  append(child) { this.children.push(child); }, setAttribute(k,v) { this.attributes[k]=v; },
  classList: { toggle(k,on) { if(on) classes.add(k); else classes.delete(k); }, contains:k=>classes.has(k) },
  getContext:()=>new Proxy({}, { get:()=>()=>{} }),
 };
}
globalThis.document={body:node(), createElement:()=>node(), getElementById:id=>{
 if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);
}};
let view={started:true,ending:false,state:'first',activeCase:'017',docRead:false,currentLine:null,listening:false,archiveOpen:false,archiveHeard:false,overlay:false};
const ramps=[],notes=[];
const param=()=>({value:.025,cancelScheduledValues(){},setValueAtTime(v,t){ramps.push(['set',v,t])},linearRampToValueAtTime(v,t){ramps.push(['ramp',v,t])},exponentialRampToValueAtTime(v,t){ramps.push(['exp',v,t])}});
const audio={currentTime:10,createGain:()=>({gain:param(),connect(){},disconnect(){}}),createOscillator(){const o={frequency:param(),connect(){},disconnect(){},start(t){notes.push(['start',t])},stop(t){notes.push(['stop',t]);this.onended?.()}};return o},createStereoPanner:()=>({pan:{},connect(){},disconnect(){}})};
let inspected=0;
const polish=createInteractionPolish({getAudio:()=>({audio,master:{},humGain:{gain:param()}}),getView:()=>view,project:point=>({x:point[0]/3,y:0,z:0}),inspectArchive:()=>inspected++});
const anchors=document.body.children[0].children;
polish.update(0);assert.equal(anchors[0].hidden,false);assert(nodes.get('dossier-btn').classList.contains('guided-tool'));
view.docRead=true;polish.update(.1);assert.equal(anchors[0].hidden,true);assert.equal(anchors[1].hidden,false);
view.state='microphoneTraining';polish.update(.2);assert.equal(anchors[2].hidden,false);
view.state='archiveInspect';view.archiveOpen=true;view.activeCase='019';polish.update(.3);
assert.equal(anchors[3].hidden,false);assert.equal(anchors[4].hidden,false);
assert(anchors[3].textContent.endsWith('←'));assert(anchors[4].textContent.endsWith('→'));
anchors[3].onclick();assert.equal(inspected,1);assert(nodes.get('listen-btn').classList.contains('guided-tool'));
for(const key of ['listening','overlay','currentLine','ending']){view[key]=true;polish.update(Math.random()+1);assert(anchors.every(a=>a.hidden));view[key]=false;}
for(const method of ['archiveSound','calibrationSound','releaseSound','resetSound','restoreHum','noseHonk'])polish[method]();
assert(notes.some(([kind,t])=>kind==='start'&&t===10.8));
assert(ramps.some(([kind,v])=>kind==='ramp'&&v===0));assert(ramps.some(([kind,v])=>kind==='ramp'&&v===.025));
console.log('PASS equipment progression, directional archive markers, modal/listening/end hiding, sound scheduling');
const scene=new T.Scene(),targets=[];
const mesh=(geometry,material,x,y,z,parent=scene)=>{const o=new T.Mesh(geometry,material);o.position.set(x,y,z);parent.add(o);return o};
const mat=c=>new T.MeshStandardMaterial({color:c});
const box=(w,h,d,x,y,z,m,p)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z,p);
const cyl=(a,b,h,x,y,z,m,n=12,p)=>mesh(new T.CylinderGeometry(a,b,h,n),m,x,y,z,p);
const ball=(r,x,y,z,m,p,d=1)=>mesh(new T.IcosahedronGeometry(r,d),m,x,y,z,p);
const {bear,booklet}=addDeskEasterEggs(T,scene,{mesh,box,cyl,ball,mat,target(o,kind){o.userData.action=kind;targets.push(o);return o},texture(draw,w,h){draw(new Proxy({},{get:()=>()=>{}}),w,h);return [new T.Texture()]}});
assert.equal(bear.parent,scene);assert.equal(booklet.parent,scene);assert(targets.some(o=>o.userData.action==='bear'));assert(targets.some(o=>o.userData.action==='brochure'));
scene.updateMatrixWorld(true);
const ray=new T.Raycaster(new T.Vector3(-2.12,1.35,5.8),new T.Vector3(0,0,-1));
assert(ray.intersectObjects(targets).some(hit=>hit.object.userData.action==='bear'));
assert(bear.position.x < -1.8);assert(booklet.position.x>.7);
console.log('PASS original bear/brochure geometry, interactive targets, nose hitbox raycast');
