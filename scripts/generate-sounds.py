# Genera i suoni dell app in public/sounds (varianti a/b/c). Uso: python3 scripts/generate-sounds.py
# Richiede numpy, scipy e ffmpeg.
import numpy as np, subprocess, os
from scipy.signal import butter, sosfilt, fftconvolve
SR = 44100
rng = np.random.default_rng(7)

def t(d): return np.arange(int(SR*d))/SR
def env(d, a=0.004, decay=0.3):
    x = t(d); e = np.exp(-x/decay); e[:int(SR*a)] *= np.linspace(0,1,int(SR*a)); return e
def lp(x, fc, order=2): return sosfilt(butter(order, fc, 'low', fs=SR, output='sos'), x)
def hp(x, fc, order=2): return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x)
def place(buf, sig, at):
    sig = sig.copy(); n = min(len(sig), int(SR*0.04)); sig[-n:] *= 0.5*(1+np.cos(np.linspace(0,np.pi,n)))
    i = int(SR*at); buf[i:i+len(sig)] += sig[:max(0, len(buf)-i)]; return buf

_ir = None
def reverb(x, wet=0.18, length=0.9):
    global _ir
    if _ir is None:
        n = t(length); _ir = rng.standard_normal(len(n)) * np.exp(-n/0.28); _ir = lp(_ir, 5000); _ir /= np.abs(_ir).sum()**0.5*8
    y = fftconvolve(x, _ir)[:len(x)]
    return (1-wet)*x + wet*y/ (np.abs(y).max()+1e-9) * np.abs(x).max()

def marimba(f, d=0.7, bright=1.0):
    x = t(d)
    s = np.sin(2*np.pi*f*x)*env(d,0.002,0.28) \
      + 0.35*bright*np.sin(2*np.pi*f*3.93*x)*env(d,0.001,0.05) \
      + 0.12*bright*np.sin(2*np.pi*f*9.2*x)*env(d,0.001,0.018)
    click = lp(rng.standard_normal(len(x)),3000)*env(d,0.0005,0.004)*0.15
    return s+click

def bell(f, d=1.2, idx=2.2, ratio=2.0):
    x = t(d); I = idx*np.exp(-x/0.15)
    return np.sin(2*np.pi*f*x + I*np.sin(2*np.pi*f*ratio*x)) * env(d,0.003,0.45)

def pluck(f, d=0.5, damp=0.996):
    N = int(SR/f); buf = rng.uniform(-1,1,N); out = np.zeros(int(SR*d))
    for i in range(len(out)):
        out[i] = buf[i%N]; buf[i%N] = damp*0.5*(buf[i%N]+buf[(i+1)%N])
    return lp(out, 6000)

def soft_tone(f, d, glide=1.0, decay=0.12, shape='sine'):
    x = t(d); fr = f*np.power(glide, x/d); ph = 2*np.pi*np.cumsum(fr)/SR
    s = np.sin(ph) if shape=='sine' else np.tanh(3*np.sin(ph))
    return s*env(d,0.004,decay)

def finish(x, peak_db, name, tail=0.03):
    n=int(SR*tail); x[-n:] *= np.linspace(1,0,n); x[:int(SR*0.001)] *= np.linspace(0,1,int(SR*0.001))
    x = x/np.abs(x).max()*10**(peak_db/20)
    wav=f'{name}.wav'
    from scipy.io import wavfile; wavfile.write(wav, SR, (x*32767).astype(np.int16))
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',wav,'-ac','1','-b:a','96k',os.path.join(OUT, f'{name}.mp3')],check=True)
    os.remove(wav)

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'sounds')
os.makedirs(OUT, exist_ok=True)
N = lambda m: 440*2**((m-69)/12)  # midi -> Hz

# ---------- CORRECT ----------
b=np.zeros(int(SR*0.9)); place(b, marimba(N(76)),0); place(b, marimba(N(83)),0.09)
finish(reverb(b,0.15),-3,'correct-a')                       # marimba, quinta ascendente
b=np.zeros(int(SR*1.3)); place(b, bell(N(79)),0); place(b, 0.8*bell(N(86)),0.07)
finish(reverb(hp(b,200),0.22),-3,'correct-b')               # campanella morbida
b=np.zeros(int(SR*0.8)); place(b, pluck(N(72),0.5),0)
for i,m in enumerate([84,88,91]): place(b, 0.35*bell(N(m),0.5,1.0,3.0), 0.05+0.045*i)
finish(reverb(b,0.18),-3,'correct-c')                       # pizzico + scintilla

# ---------- WRONG (gentili, più bassi di volume) ----------
b=np.zeros(int(SR*0.55)); place(b, lp(marimba(N(55),0.4,0.4),1800),0); place(b, lp(marimba(N(52),0.45,0.4),1500),0.11)
finish(reverb(b,0.1),-7,'wrong-a')                          # "tonk" di legno discendente
b=np.zeros(int(SR*0.45)); place(b, lp(soft_tone(N(50),0.42,0.8,0.09,'square'),900),0)
finish(b,-8,'wrong-b')                                      # buzz ovattato breve
b=np.zeros(int(SR*0.7)); place(b, bell(N(67),0.45,1.2,1.0),0); place(b, bell(N(61),0.55,1.2,1.0),0.13)
finish(reverb(lp(b,2500),0.15),-7,'wrong-c')                # due note morbide, tritono giù

# ---------- COMPLETE ----------
b=np.zeros(int(SR*1.8))
for i,m in enumerate([72,76,79,84]): place(b, marimba(N(m),0.8), 0.09*i)
for m in [72,76,79,84]: place(b, 0.5*marimba(N(m),1.3), 0.42)
finish(reverb(b,0.2),-2,'complete-a')
b=np.zeros(int(SR*2.2))
for i,m in enumerate([67,72,76,79]): place(b, bell(N(m),1.0), 0.1*i)
for m in [72,76,79,84]: place(b, 0.45*bell(N(m),1.6,1.5), 0.45)
finish(reverb(hp(b,200),0.25),-2,'complete-b')
b=np.zeros(int(SR*1.6))
for i,m in enumerate([60,64,67,72]): place(b, pluck(N(m),0.6), 0.075*i)
for i,m in enumerate([84,88,91,96]): place(b, 0.3*bell(N(m),0.7,1.0,3.0), 0.35+0.05*i)
finish(reverb(b,0.2),-2,'complete-c')

# ---------- CLICK ----------
x=t(0.05); c=lp(rng.standard_normal(len(x)),4000)*env(0.05,0.0005,0.006)+0.5*np.sin(2*np.pi*1400*x)*env(0.05,0.0005,0.01)
finish(c,-14,'click-a',0.005)
finish(place(np.zeros(int(SR*0.08)),0.6*marimba(N(91),0.08,0.3),0),-14,'click-b',0.01)
