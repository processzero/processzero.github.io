(() => {
  'use strict';
  const {API,clean}=window.PortfolioContent;
  const byId=id=>document.getElementById(id);
  let token=null,expiresAt=0,revision=0,loaded=false,dirty=false,saving=false,editor=null;
  const status=message=>{byId('save-status').textContent=message;};
  const markDirty=()=>{dirty=true;status('Unsaved changes');};
  async function api(action,options={}) {
    const response=await fetch(API+'/portfolio-'+action,{...options,cache:'no-store',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})}});
    const data=await response.json();
    if(!response.ok){const error=new Error(data.error||'Please try again.');error.status=response.status;error.retry=response.headers.get('Retry-After');throw error;}
    return data;
  }
  function setDocument(doc) {
    byId('site-title').textContent=doc.title;
    if(!editor){
      editor=new Quill('#body-editor',{theme:'bubble',formats:['bold','italic','underline','strike','link','list','indent','blockquote','code','header','script'],modules:{toolbar:[[{header:[2,3,false]}],['bold','italic','underline','link'],[{list:'bullet'},{list:'ordered'}],['clean']]}});
      editor.root.setAttribute('aria-label','Portfolio content');
      editor.on('text-change',(_delta,_old,source)=>{if(source==='user')markDirty();});
    }
    editor.clipboard.dangerouslyPasteHTML(clean(doc.html),'silent');
  }
  const documentValue=()=>({title:byId('site-title').textContent.trim(),html:editor.getSemanticHTML().replace(/&nbsp;|&#160;|\u00a0/g,' ')});
  function lock(message='') {
    token=null;expiresAt=0;byId('unlock-panel').hidden=false;byId('editor-panel').hidden=true;
    byId('unlock-error').textContent=message;byId('pin').value='';byId('pin').focus();
  }
  byId('unlock-form').addEventListener('submit',async event=>{
    event.preventDefault();const button=byId('unlock-button');button.disabled=true;byId('unlock-error').textContent='';
    try{
      const auth=await api('login',{method:'POST',body:JSON.stringify({pin:byId('pin').value})});
      token=auth.token;expiresAt=auth.expiresAt;byId('pin').value='';
      byId('editor-panel').hidden=false;
      if(!loaded){const latest=await api('content');revision=latest.revision;setDocument(latest.document);loaded=true;dirty=false;}
      byId('unlock-panel').hidden=true;status(dirty?'Unsaved changes':'Click text to edit. Select text to format or add a link.');
    }catch(error){token=null;byId('editor-panel').hidden=true;byId('unlock-error').textContent=error.message+(error.retry?' Wait about '+Math.ceil(Number(error.retry)/60)+' minutes.':'');}
    finally{button.disabled=false;}
  });
  byId('site-title').addEventListener('input',markDirty);
  byId('site-title').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();byId('site-title').blur();}});
  byId('save-button').addEventListener('click',async()=>{
    if(saving)return;
    if(!token||Date.now()>=expiresAt){lock('Your session expired. Unlock again; your unsaved edits stay in this tab.');return;}
    if(!byId('site-title').textContent.trim()){status('Please enter your name.');return;}
    saving=true;byId('save-button').disabled=true;status('Saving…');const snapshot=documentValue();
    try{
      const saved=await api('content',{method:'PUT',body:JSON.stringify({document:snapshot,revision})});revision=saved.revision;
      dirty=JSON.stringify(documentValue())!==JSON.stringify(snapshot);
      status(dirty?'Saved. You have more unsaved changes.':'Saved — your changes are live on aryammanb.github.io.');
    }catch(error){status(error.message);if(error.status===401)lock(error.message+' Your unsaved changes stay in this tab.');}
    finally{saving=false;byId('save-button').disabled=false;}
  });
  byId('logout-button').addEventListener('click',async()=>{
    if(dirty&&!confirm('Lock the editor? Your unsaved changes will stay in this tab.'))return;
    try{await api('logout',{method:'POST'});}catch{}
    lock();
  });
  addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
  document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'){event.preventDefault();if(token)byId('save-button').click();}});
})();
