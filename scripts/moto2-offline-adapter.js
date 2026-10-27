// Guest-only offline adapter: no remote accounts, advertising or online score claims.
window.ID={getLoginStatus:function(cb){cb({status:'not_authorized'})},login:function(cb){if(cb)cb(null)},api:function(route,method,data,cb){if(cb)cb({jsondata:'{}'})},GameAPI:{Leaderboards:{save:function(d,cb){if(cb)cb({})},list:function(){}},Achievements:{save:function(d,cb){if(cb)cb({})},list:function(){}}}};
window.showNextAd=function(){};
window.myDispatchEvent=function(name){document.getElementById('content').dispatchEvent(new Event(name))};
