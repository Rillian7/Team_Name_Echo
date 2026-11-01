/** Comfort gradually erodes with authored anomalies; no external audio or timers. */
export function createAtmosphere({ getAudio, getView, getLights }) {
 let bed=null, peak=0, nextNote=0, noteIndex=0, mixKey='', lastHumKey='';
 const melody=[261.63,329.63,392,329.63,293.66,349.23,329.63,261.63];
 function smooth(param,value,audio,seconds=.45) {
  param.cancelScheduledValues(audio.currentTime);
  param.setTargetAtTime(value,audio.currentTime,seconds);
 }
 function init(audio,master) {
  const noise=audio.createBuffer(1,audio.sampleRate*3,audio.sampleRate);
  const values=noise.getChannelData(0);
  let brown=0;
  for(let i=0;i<values.length;i++) { brown=(brown+(Math.random()*2-1)*.035)/1.02;values[i]=brown*3; }
  const source=audio.createBufferSource(),filter=audio.createBiquadFilter();
  const air=audio.createGain(),music=audio.createGain();
  source.buffer=noise;source.loop=true;filter.type='lowpass';filter.frequency.value=950;
  air.gain.value=music.gain.value=0;
  source.connect(filter);filter.connect(air);air.connect(master);music.connect(master);source.start();
  bed={air,music,source,filter};nextNote=audio.currentTime+.1;
 }
 function update(time,dt) {
  const v=getView(),{audio,master,humGain}=getAudio();
  peak=Math.max(peak,v.damage||0);
  const quiet=v.archiveHeard&&['truth','release','archiveReviewed'].includes(v.state);
  const {warm,ceiling}=getLights();
  const warmth=quiet?30:peak>=48?17:peak>=20?21:27;
  warm.intensity+=(warmth-warm.intensity)*Math.min(1,dt*1.2);
  if(quiet&&!v.ending)ceiling.intensity+=(14-ceiling.intensity)*Math.min(1,dt*.8);
  if(!audio||!master||!v.started)return;
  if(!bed)init(audio,master);
  const duck=v.listening ? .08 : v.talking ? .32 : 1;
  const silent=v.ending||quiet||v.state==='release'||v.state==='archiveOpening'||v.state==='archiveInspect'||v.state==='archiveResponse';
  const comfort=peak>=48?.12:peak>=20?.45:1;
  const key=[silent,comfort,duck].join(':');
  if(key!==mixKey) {
   smooth(bed.air.gain,silent?0:.055*comfort*duck,audio);
   smooth(bed.music.gain,silent?0:.16*comfort*duck,audio);
   mixKey=key;
  }
  // Preserve ending sound envelopes scheduled by interaction-polish.
  if(!v.ending&&v.state!=='release') {
   const humKey=[silent,duck,quiet].join(':');
   if(humKey!==lastHumKey) {
    if(humGain)smooth(humGain.gain,quiet?0:silent?.002:.025*duck,audio);
    lastHumKey=humKey;
   }
  }
  if(silent||audio.currentTime<nextNote)return;
  nextNote=audio.currentTime+.78;
  const index=noteIndex++;
  if(peak>=48&&index%4!==0||peak>=20&&index%3===1)return;
  // Piano-like hammer attack and independently decaying string partials.
  const fundamental=melody[index%melody.length];
  const now=audio.currentTime;
  for (const [multiple,level,decay] of [[1,.6,3.2],[2,.23,1.8],[3,.09,1.1],[4.01,.045,.65],[6.02,.018,.24]]) {
   const osc=audio.createOscillator(),envelope=audio.createGain();
   osc.type='sine';osc.frequency.value=fundamental*multiple;
   envelope.gain.setValueAtTime(0,now);
   envelope.gain.linearRampToValueAtTime(level,now+.006);
   envelope.gain.exponentialRampToValueAtTime(.0001,now+decay);
   osc.connect(envelope);envelope.connect(bed.music);
   osc.onended=()=>{osc.disconnect();envelope.disconnect();};
   osc.start();osc.stop(now+decay+.05);
  }
 }
 return {update};
}
