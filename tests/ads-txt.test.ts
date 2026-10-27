import test from 'node:test';
import assert from 'node:assert/strict';
import {GET} from '../app/ads.txt/route';

test('ads.txt does not fabricate an AdSense publisher',async()=>{
  const prev=process.env.ADSENSE_CLIENT;
  try{
    delete process.env.ADSENSE_CLIENT;
    const res=GET();
    assert.equal(res.headers.get('content-type'),'text/plain; charset=utf-8');
    assert(!(await res.text()).includes('DIRECT'));
    process.env.ADSENSE_CLIENT='ca-pub-123';
    assert(!(await GET().text()).includes('DIRECT'));
    process.env.ADSENSE_CLIENT='ca-pub-1234567890123456';
    assert.equal(await GET().text(),'google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n');
  }finally{
    if(prev===undefined)delete process.env.ADSENSE_CLIENT;
    else process.env.ADSENSE_CLIENT=prev;
  }
});
