(() => {
  'use strict';
  const API='https://processzero-content-api.aryammanbhatia.chatgpt.site/api';
  let token=null,expiresAt=0,revision=0,loaded=false,dirty=false,saving=false,authorUrl='';
  const editors=[];
  const byId=id=>document.getElementById(id);
  const status=message=>{byId('save-status').textContent=message;};
  const markDirty=()=>{dirty=true;status('Unsaved changes');};
  const htmlClean=html=>DOMPurify.sanitize(html,{ALLOWED_TAGS:['p','br','strong','b','em','i','u','s','ol','ul','li','a','blockquote','code','h2','h3','sub','sup'],ALLOWED_ATTR:['href','title'],ALLOW_DATA_ATTR:false});
  const formats=['bold','italic','underline','strike','link','list','indent','blockquote','code','header'];
  const toolbar=[['bold','italic','link'],[{list:'ordered'},{list:'bullet'}],[{indent:'-1'},{indent:'+1'}],['clean']];
  const inlineOptions={theme:'bubble',formats,modules:{toolbar:[['bold','italic','link']]}};
  const introEditor=new Quill('#intro-editor',inlineOptions);
  introEditor.on('text-change',(_delta,_old,source)=>{if(source==='user')markDirty();});
  for(let i=0;i<3;i++) {
    const editor=new Quill('#section-editor-'+i,{theme:'snow',formats,modules:{toolbar}});
    editor.root.setAttribute('aria-label',['The Problem content','Plan content','QnA content'][i]);
    editor.on('text-change',(_delta,_old,source)=>{if(source==='user')markDirty();});
    editors.push(editor);
  }
  introEditor.root.setAttribute('aria-label','Opening paragraph');
  document.querySelectorAll('details[name="sections"]').forEach(section=>section.addEventListener('toggle',()=>{
    if(section.open)window.scrollTo({top:0,left:0,behavior:'instant'});
  }));
  document.querySelectorAll('[contenteditable="plaintext-only"]').forEach(el=>{
    el.addEventListener('input',markDirty);
    el.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();el.blur();}});
    el.addEventListener('click',event=>event.stopPropagation());
  });
  async function api(path,options={}) {
    const response=await fetch(API+path,{...options,cache:'no-store',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...options.headers}});
    const data=await response.json();
    if(!response.ok){const error=new Error(data.error||'Please try again.');error.status=response.status;error.retry=response.headers.get('Retry-After');throw error;}
    return data;
  }
  function setDocument(doc) {
    byId('site-title').textContent=doc.title;
    byId('author-name').textContent=doc.author;
    authorUrl=doc.authorUrl;byId('author-url').value=authorUrl;
    introEditor.clipboard.dangerouslyPasteHTML(htmlClean(doc.intro),'silent');
    doc.sections.forEach((section,i)=>{
      byId('section-title-'+i).textContent=section.title;
      editors[i].clipboard.dangerouslyPasteHTML(htmlClean(section.html),'silent');
    });
  }
  const documentValue=()=>({
    title:byId('site-title').textContent.trim(),author:byId('author-name').textContent.trim(),authorUrl,
    intro:introEditor.getSemanticHTML(),
    sections:editors.map((editor,i)=>({title:byId('section-title-'+i).textContent.trim(),html:editor.getSemanticHTML()})),
  });
  function lock(message='') {
    token=null;expiresAt=0;
    byId('unlock-panel').hidden=false;byId('editor-panel').hidden=true;
    byId('unlock-error').textContent=message;byId('pin').value='';byId('pin').focus();
  }
  byId('unlock-form').addEventListener('submit',async event=>{
    event.preventDefault();const button=byId('unlock-button');button.disabled=true;
    byId('unlock-error').textContent='';
    try {
      const auth=await api('/login',{method:'POST',body:JSON.stringify({pin:byId('pin').value})});
      token=auth.token;expiresAt=auth.expiresAt;byId('pin').value='';
      if(!loaded){
        const latest=await api('/content');revision=latest.revision;setDocument(latest.document);loaded=true;dirty=false;
      }
      byId('unlock-panel').hidden=true;byId('editor-panel').hidden=false;
      status(dirty?'Unsaved changes':'');
    } catch(error) {
      token=null;
      byId('unlock-error').textContent=error.message+(error.retry?' Wait about '+Math.ceil(Number(error.retry)/60)+' minutes.':'');
    } finally {button.disabled=false;}
  });
  byId('save-button').addEventListener('click',async()=>{
    if(saving)return;
    if(!token||Date.now()>=expiresAt){lock('Your session expired. Unlock to save your changes.');return;}
    saving=true;byId('save-button').disabled=true;status('Saving…');
    const snapshot=documentValue();
    try {
      const saved=await api('/content',{method:'PUT',body:JSON.stringify({document:snapshot,revision})});
      revision=saved.revision;
      // Do not replace the editor or discard text typed while a request was in flight.
      dirty=JSON.stringify(documentValue())!==JSON.stringify(snapshot);
      status(dirty?'Saved. You have more unsaved changes.':'Saved — your changes are live.');
    } catch(error) {
      status(error.message);
      if(error.status===401)lock(error.message+' Your unsaved changes are kept in this tab.');
    } finally {saving=false;byId('save-button').disabled=false;}
  });
  byId('logout-button').addEventListener('click',async()=>{
    if(dirty&&!confirm('You have unsaved changes. Lock the editor? They will stay in this tab.'))return;
    try{await api('/logout',{method:'POST'});}catch{}
    lock();
  });
  byId('author-link-toggle').addEventListener('click',()=>{
    byId('author-link-field').hidden=!byId('author-link-field').hidden;
    if(!byId('author-link-field').hidden)byId('author-url').focus();
  });
  byId('author-url').addEventListener('input',()=>{authorUrl=byId('author-url').value;markDirty();});
  addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
  document.addEventListener('keydown',event=>{
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'){event.preventDefault();if(token)byId('save-button').click();}
  });
})();
