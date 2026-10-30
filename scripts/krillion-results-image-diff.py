from PIL import Image,ImageChops
from pathlib import Path
import numpy as np,json
folder=Path(__file__).resolve().parents[1]/'docs/evidence/krillion-results-20261030'
reference=Image.open(folder/'original-top-1363x936.jpg').convert('RGB')
regions={'header':(434,20,915,150),'dive_log':(434,345,915,670),'bearing':(434,680,915,846),'sky':(0,0,1363,515)}
report={'viewport':[1363,936],'notes':['Identical viewport; no resizing.','MAE is mean absolute RGB error on 0–255 scale; threshold rate uses max RGB difference >20.','Score digits, global-vs-local distribution, round-5 outcome, dynamic mascot and live countdown are masked.','Scenery animation, different page widths and missing ad gutter still affect metrics. These numbers do not certify parity.'],'comparisons':{}}
for name in ['before','after']:
 image=Image.open(folder/(name+'-top-1363x936.jpg')).convert('RGB')
 assert image.size==reference.size
 side=Image.new('RGB',(reference.width*2,reference.height));side.paste(reference);side.paste(image,(reference.width,0));side.save(folder/(name+'-side-by-side.jpg'),quality=85)
 Image.blend(reference,image,.5).save(folder/(name+'-overlay-50.jpg'),quality=90)
 d=np.abs(np.asarray(reference).astype(float)-np.asarray(image).astype(float))
 mask=np.ones((reference.height,reference.width),dtype=bool)
 for x0,y0,x1,y1 in [(440,65,610,150),(430,150,920,345),(715,375,790,670),(970,80,1040,165)]:mask[y0:y1,x0:x1]=False
 row={}
 for region,(x0,y0,x1,y1) in regions.items():
  values=d[y0:y1,x0:x1][mask[y0:y1,x0:x1]]
  row[region]={'mae':round(float(values.mean()),3),'pixels_over_20_percent':round(float((values.max(axis=1)>20).mean()*100),2),'evaluated_pixels':len(values)}
 report['comparisons'][name]=row
(folder/'masked-difference-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
