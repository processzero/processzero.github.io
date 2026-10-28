(() => {
  'use strict';
  const API='https://processzero-content-api.aryammanbhatia.chatgpt.site/api';
  const clean=html=>DOMPurify.sanitize(html,{
    ALLOWED_TAGS:['p','br','strong','b','em','i','u','s','ol','ul','li','a','blockquote','code','h2','h3','sub','sup'],
    ALLOWED_ATTR:['href','title'],ALLOW_DATA_ATTR:false,
  }).replace(/&nbsp;|&#160;|\u00a0/g,' ');
  const bindSections=()=>document.querySelectorAll('details[name="sections"]').forEach(section=>{
    section.addEventListener('toggle',()=>{if(section.open)window.scrollTo({top:0,left:0,behavior:'instant'});});
  });
  function render(doc) {
    if(!doc||typeof doc.title!=='string'||typeof doc.author!=='string'||typeof doc.intro!=='string'||!Array.isArray(doc.sections)||doc.sections.length!==3||doc.sections.some(section=>typeof section.title!=='string'||typeof section.html!=='string'))throw new Error('Invalid content');
    document.querySelector('h1').textContent=doc.title;
    document.title=doc.title;
    const author=document.querySelector('.byline a');
    author.textContent=doc.author;
    author.href=/^https?:\/\//i.test(doc.authorUrl)?doc.authorUrl:'https://aryammanb.github.io/';
    document.querySelector('.intro').innerHTML=clean(doc.intro);
    document.querySelectorAll('details[name="sections"]').forEach((section,i)=>{
      section.querySelector('summary').textContent=doc.sections[i].title;
      let content=section.querySelector('.section-content');
      if(!content){
        [...section.children].filter(child=>child.tagName!=='SUMMARY').forEach(child=>child.remove());
        content=document.createElement('div');content.className='section-content';section.append(content);
      }
      content.innerHTML=clean(doc.sections[i].html);
    });
  }
  bindSections();
  const main=document.querySelector('main');
  const loading=document.getElementById('content-loading');
  const message=document.getElementById('content-status');
  const retry=document.getElementById('content-retry');
  async function load() {
    main.hidden=true;
    main.setAttribute('aria-busy','true');
    loading.hidden=false;
    message.textContent='Loading…';
    retry.hidden=true;
    try {
      const response=await fetch(API+'/content',{cache:'no-store',signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw new Error('Unavailable');
      const data=await response.json();
      render(data.document);
      main.setAttribute('aria-busy','false');
      main.hidden=false;
      loading.hidden=true;
    } catch {
      message.textContent='Couldn’t load the latest content.';
      retry.hidden=false;
    }
  }
  retry.addEventListener('click',load);
  load();
})();
