const XANVORA_HOSTS = new Set(["xanvora.com","www.xanvora.com"]);
function isXanvora(url){
  try{return XANVORA_HOSTS.has(new URL(url).hostname)}catch{return false}
}
chrome.runtime.onMessage.addListener((message,sender)=>{
  if(!message || message.type!=="XANVORA_YANDEX_RESULTS") return;
  const payload={type:"XANVORA_LIVE_RESULTS",source:"yandex",capturedAt:new Date().toISOString(),pageUrl:sender.tab?.url||"",results:Array.isArray(message.results)?message.results:[],queryHints:Array.isArray(message.queryHints)?message.queryHints:[]};
  chrome.tabs.query({},tabs=>{
    for(const tab of tabs){
      if(tab.id && isXanvora(tab.url)) chrome.tabs.sendMessage(tab.id,payload).catch(()=>{});
    }
  });
});