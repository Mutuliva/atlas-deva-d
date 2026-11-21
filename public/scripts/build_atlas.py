"""Build the local, offline atlas from OpenMapTiles data and Terrarium elevation tiles.
Geometry uses a 5120-unit Web Mercator sheet, starting at z14 tile 9232,5834.
"""
import os, glob, math, json, base64, io, random, html
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
import contourpy
import mapbox_vector_tile as mvt
from shapely.geometry import shape, LineString, box
from shapely.ops import linemerge
from collections import defaultdict

CACHE='/tmp/deva-data'
OUT='public/map'
os.makedirs(OUT,exist_ok=True)
S=1024
N=5120
random.seed(34)
tiles={}
for f in glob.glob(CACHE+'/pbf/*.pbf'):
    t=tuple(map(int,os.path.basename(f)[:-4].split('_')))
    tiles[t]=mvt.decode(open(f,'rb').read(),default_options={'y_coord_down':True})

def coords(ls):
    return ' '.join(f'{x*.25:.1f},{y*.25:.1f}' for x,y in ls)

def path(g):
    c,t=g['coordinates'],g['type']
    if t=='Polygon': return ''.join('M'+coords(a)+'Z' for a in c)
    if t=='MultiPolygon':return ''.join('M'+coords(a)+'Z' for poly in c for a in poly)
    if t=='LineString':return 'M'+coords(c)
    if t=='MultiLineString':return ''.join('M'+coords(a) for a in c)
    return ''

def elem(o,fill,stroke='none',width=0,extra=''):
    return f'<path d="{path(o["geometry"])}" fill="{fill}" stroke="{stroke}" stroke-width="{width}" {extra}/>'

def features(t,k):return tiles[t].get(k,{}).get('features',[])
def begin():return [f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{N}" height="{N}" viewBox="0 0 {N} {N}">']

def alltiles(fn):
    a=[]
    for t in sorted(tiles):
        x,y=(t[0]-9232)*S,(t[1]-5834)*S
        a.append(f'<svg x="{x}" y="{y}" width="1024" height="1024" viewBox="0 0 1024 1024" overflow="hidden">');a+=fn(t);a.append('</svg>')
    return a

defs='''<defs>
<pattern id="farms" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(26)"><rect width="9" height="9" fill="#e5e5d0"/><path d="M0 0V9" stroke="#d8dbc2" stroke-width="1.35"/></pattern>
<pattern id="water" width="69" height="32" patternUnits="userSpaceOnUse"><rect width="69" height="32" fill="#9bc6cf"/><path d="M4 10q7 -1.8 14 0t13 0M38 25q6 -1.5 13 0t12 0" fill="none" stroke="#d8e8e6" stroke-width="1.3" opacity=".67"/></pattern>
<pattern id="grove" width="89" height="73" patternUnits="userSpaceOnUse"><g fill="#b0c09f" stroke="#8ca482" stroke-width=".85" stroke-linejoin="round" opacity=".83"><path d="m13 17-3 5h1l-2.3 4.2h8.4L15 22h1zM58 37l-2.5 5h1L54 46h7.8L59 42h1.2zM73 9l-2.2 4.5h.9L69.5 17h6.5l-2-3.5h1z"/><path d="M30 55q-4-.5-3-3.5-1-2 1-3 0-3 3-3t3 3q3 1 1 3.5 1 3-5 3zM79 63q-3-.5-2.5-3-1-2 1-3 1-4 4-2 2 1 1.5 3.5 2 3-4 4.5z"/></g><g stroke="#8ca482" stroke-width=".9"><path d="M13 26v3m45 17v2.5M73 17v2m-42 36v3m48 5v2"/></g><g fill="#94a689" opacity=".6"><circle cx="7" cy="51" r=".9"/><circle cx="46" cy="12" r=".7"/><circle cx="40" cy="64" r="1"/><circle cx="69" cy="54" r=".6"/></g></pattern>
<pattern id="parkDots" width="14" height="17" patternUnits="userSpaceOnUse"><circle cx="3" cy="4" r=".7" fill="#a2b58e"/><circle cx="10" cy="12" r=".8" fill="#a2b58e"/></pattern></defs>'''
base=begin()+[defs,'<rect width="5120" height="5120" fill="#eeeade"/>']

def ground(t):
    a=[]
    for o in features(t,'landuse'):
        cl=o['properties'].get('class'); color={'residential':'#eae6db','industrial':'#e3e0d5','railway':'#deded3','commercial':'#e4e0d3','pitch':'#c5d0ad','stadium':'#c6d1b7','cemetery':'#d0d6bf','school':'#e1dece','hospital':'#e9dbd2','college':'#e2dfcc','university':'#dfdec9','playground':'#d7d9bb','quarry':'#dedacd'}.get(cl,'#e2dfd2')
        a.append(elem(o,color))
    for o in sorted(features(t,'landcover'),key=lambda o: o['properties'].get('class')=='wood'):
        cl=o['properties'].get('class'); fill={'wood':'#b7c9a3','grass':'#d3debf','farmland':'url(#farms)','rock':'#d6d3bc','sand':'#e6ddc6','wetland':'#d1dcca'}.get(cl,'#d2d9bd'); a.append(elem(o,fill))
    return a
base+=alltiles(ground)
# The hillshade and contour lines are derived from elevation, not decorative rings.
dem=np.zeros((3*256,3*256),dtype=np.float32)
for f in glob.glob(CACHE+'/dem/*.png'):
    tx,ty=map(int,os.path.basename(f)[:-4].split('_'));z=np.asarray(Image.open(f).convert('RGB')).astype(float);z=z[:,:,0]*256+z[:,:,1]+z[:,:,2]/256-32768
    xx=(tx-4616)*256; yy=(ty-2917)*256;dem[yy:yy+256,xx:xx+256]=z
dem=gaussian_filter(dem[:640,:640],1.05)
dy,dx=np.gradient(dem);texture=(dx*.72+dy*.65)*.85;texture=np.clip(texture,-20,22)
rgba=np.zeros((640,640,4),dtype='uint8');rgba[:,:,:3]=np.where(texture[:,:,None]>0,np.array([255,253,227]),np.array([68,88,56]));rgba[:,:,3]=np.minimum(abs(texture)*9.8,110)
buf=io.BytesIO();Image.fromarray(rgba).save(buf,'PNG');terrain=begin()+['<image width="5120" height="5120" href="data:image/png;base64,'+base64.b64encode(buf.getvalue()).decode()+'"/>']
cont=contourpy.contour_generator(x=np.arange(640)*8,y=np.arange(640)*8,z=dem)
for h in range(200,675,6):
    pp=[]
    for a in cont.lines(h):
        if len(a)<5:continue
        l=LineString(a).simplify(.55)
        pp.append('M'+' '.join(f'{x:.1f},{y:.1f}' for x,y in l.coords))
    if pp:terrain.append(f'<path d="{"".join(pp)}" fill="none" stroke="#83926c" stroke-width="{1.35 if h%30==0 else .96}" opacity="{.56 if h%30==0 else .41}"/>')
def tree_layer(t):
    a=[]
    for o in features(t,'landcover'):
        if o['properties'].get('class')=='wood':a.append(elem(o,'url(#grove)'))
        if o['properties'].get('subclass')=='park':a.append(elem(o,'url(#parkDots)'))
    return a
terrain.insert(1,defs);terrain+=alltiles(tree_layer);terrain.append('</svg>');open(OUT+'/terrain.svg','w').write(''.join(terrain))
base.append('</svg>');open(OUT+'/land.svg','w').write(''.join(base))
streets=begin()+[defs]
def infrastructure(t):
    a=[]
    for o in features(t,'waterway'):a.append(elem(o,'none','#b3cbd0',1.6))
    for o in features(t,'water'):a.append(elem(o,'url(#water)' if o['properties'].get('class')=='river' else '#b0cbd0','#9abdc2',.9))
    for o in features(t,'building'):
        h=o['properties'].get('render_height') or 0;a.append(elem(o,'#d8d2c3' if h<15 else '#d1cabc','#c7c1b4',.56))
    roads=features(t,'transportation');a.append('<g stroke-linecap="round" stroke-linejoin="round">')
    widths={'motorway':10,'trunk':9.1,'primary':9,'secondary':8.5,'tertiary':7.5,'minor':5.8,'service':3.8,'track':2.9,'path':1.7,'rail':2.5,'transit':2}
    for step in ['outline','fill']:
        for o in sorted(roads,key=lambda o:widths.get(o['properties'].get('class'),2)):
            cl=o['properties'].get('class');w=widths.get(cl,2.5)
            if cl=='rail':continue
            if o['geometry']['type'] in ('Polygon','MultiPolygon'):
                if step=='fill':a.append(elem(o,'#eeeadf'))
                continue
            if cl in ('path','track'):
                if step=='fill':a.append(elem(o,'none','#b3b49c' if cl=='track' else '#b0ad97',w*.8,'stroke-dasharray="3 3"'))
            elif step=='outline':a.append(elem(o,'none','#c9c3b2' if cl in ['primary','secondary','trunk'] else '#d2cdbd',w+1.8))
            else:a.append(elem(o,'none','#f9e6b8' if cl in ['primary','trunk','motorway'] else '#fffdf1',w))
    for o in roads:
        if o['properties'].get('class')=='rail':
            a.append(elem(o,'none','#a9a79c',1.7));a.append(elem(o,'none','#f7f5e8',1,'stroke-dasharray="5 5"'))
    a.append('</g>');return a
streets+=alltiles(infrastructure);streets.append('</svg>');open(OUT+'/streets.svg','w').write(''.join(streets))
labels=begin();labels.append('<g font-family="Arial, sans-serif" fill="#858175" font-size="12" letter-spacing=".35" paint-order="stroke" stroke="#f1eee3" stroke-width="3.3" stroke-linejoin="round">')
# One label on the longest road segment, collision-aware and oriented for reading.
roads={}
for t in tiles:
    for o in features(t,'transportation_name'):
        name=o['properties'].get('name','');cl=o['properties'].get('class','')
        if not name or cl not in ['tertiary','primary','secondary','minor','trunk']:continue
        lines=o['geometry']['coordinates'];lines=[lines] if o['geometry']['type']=='LineString' else lines
        for pts in lines:
            a=np.array(pts)*.25+np.array([(t[0]-9232)*S,(t[1]-5834)*S]); line=LineString(a)
            if name not in roads or line.length>roads[name][0].length:roads[name]=(line,cl)
occupied=[];n=0
for name,(ln,cl) in sorted(roads.items(),key=lambda x:((x[1][1] in ['primary','secondary']),x[1][0].length),reverse=True):
    name=name.replace('Strada ','Str. ').replace('Bulevardul ','Bd. ').replace('Aleea ','Al. ')
    if len(name)>34:continue
    if ln.length<len(name)*7.2:continue
    mid=ln.interpolate(.5,normalized=True);x,y=mid.x,mid.y
    if any((x-X)**2+(y-Y)**2<106**2 for X,Y in occupied):continue
    occupied.append((x,y));a=list(ln.coords)
    if a[-1][0]<a[0][0]:a.reverse()
    d='M'+' '.join(f'{x:.1f},{y:.1f}' for x,y in a);n+=1
    labels.append(f'<defs><path id="r{n}" d="{d}"/></defs><text font-size="{16.8 if cl in ["primary","secondary"] else 14}"><textPath xlink:href="#r{n}" startOffset="50%" text-anchor="middle">{html.escape(name)}</textPath></text>')
labels+=['</g>', '<g font-family="Georgia, serif" text-anchor="middle">',
'<text x="2520" y="2630" font-size="57" letter-spacing="12" fill="#6c6d5e" stroke="#eeeade" stroke-width="5" paint-order="stroke">DEVA</text>',
'<text x="1860" y="2195" fill="#607a53" font-style="italic" font-size="25" transform="rotate(-16 1860 2195)">Dealul Cetății</text>',
'<text x="1850" y="2220" fill="#7c8971" font-family="Arial" letter-spacing="2.5" font-size="11" transform="rotate(-16 1850 2220)">REZERVAȚIE NATURALĂ</text>',
'<defs><path id="river-name" d="M2980 1355Q2975 1460 3072 1525T3340 1675"/></defs><text fill="#547e8b" font-style="italic" font-size="25" letter-spacing="2.1"><textPath xlink:href="#river-name" startOffset="45%">Râul Mureș</textPath></text>',
'<text x="2270" y="1440" fill="#91977d" font-family="Arial" font-size="15" letter-spacing="5">LUNCA MUREȘULUI</text>',
'</g></svg>'];open(OUT+'/labels.svg','w').write(''.join(labels))
# A paper grain tile for the atlas and its marginalia.
rng=np.random.default_rng(12);im=np.zeros((120,120,4),dtype='uint8');v=rng.normal(120,32,(120,120));im[:,:,:3]=v[:,:,None];im[:,:,3]=28;Image.fromarray(im).save(OUT+'/paper.png')
print('Atlas complete:',[(s,round(os.stat(OUT+'/'+s).st_size/1024)) for s in os.listdir(OUT)])
