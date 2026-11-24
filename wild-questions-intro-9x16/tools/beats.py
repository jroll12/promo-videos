import sys, json, subprocess, numpy as np
from scipy.signal import find_peaks, stft
sr=22050
raw=subprocess.run(["ffmpeg","-v","error","-i",sys.argv[1],"-ac","1","-ar",str(sr),"-f","f32le","-"],capture_output=True).stdout
x=np.frombuffer(raw,np.float32)
hop=256; f,t,Z=stft(x,sr,nperseg=1024,noverlap=1024-hop)
M=np.log1p(100*np.abs(Z))
flux=np.maximum(0,np.diff(M,axis=1)).sum(0); flux=np.concatenate([[0],flux])
fr=sr/hop
# low band (kick) flux
lo=f<150
lflux=np.concatenate([[0],np.maximum(0,np.diff(M[lo],axis=1)).sum(0)])
on=(flux-np.convolve(flux,np.ones(16)/16,'same')); on=np.maximum(on,0)
# tempo via autocorr in 100..160 bpm (the song is 125 bpm; 70..180 locks onto the 3-eighth shuffle at 83) on first 7.9s
n=int(7.9*fr); o=on[:n]-on[:n].mean()
ac=np.correlate(o,o,'full')[n-1:]
lags=np.arange(len(ac)); bpm=60*fr/np.maximum(lags,1)
mask=(bpm>100)&(bpm<160)
best=lags[mask][np.argmax(ac[mask])]; period=best/fr
print("period",period,"bpm",60/period)
# phase: maximize sum of onset at grid
best_phase,bs=0,-1
for ph in np.arange(0,period,1/fr):
    g=np.arange(ph,7.9,period); s=on[(g*fr).astype(int)].sum()
    if s>bs: bs,best_phase=s,ph
grid=np.arange(best_phase,8.0,period)
print("phase",best_phase); print("grid",np.round(grid,3).tolist())
pk,_=find_peaks(on,height=np.percentile(on,85),distance=int(0.1*fr))
print("onsets",np.round(pk/fr,3).tolist())
lp,_=find_peaks(lflux,height=np.percentile(lflux,90),distance=int(0.15*fr))
print("kicks",np.round(lp/fr,3).tolist())
# envelope end
env=np.abs(x); idx=np.where(env>0.01)[0]; print("last sound",idx[-1]/sr)
json.dump({"bpm":60/period,"period":period,"phase":best_phase,"grid":[round(g,3) for g in grid],"onsets":[round(p/fr,3) for p in pk],"kicks":[round(p/fr,3) for p in lp],"end":idx[-1]/sr},open(sys.argv[2],"w"),indent=1)
