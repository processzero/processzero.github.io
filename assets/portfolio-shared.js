(() => {
  'use strict';
  const API='https://processzero-content-api.aryammanbhatia.chatgpt.site/api';
  const clean=html=>DOMPurify.sanitize(html,{
    ALLOWED_TAGS:['p','br','strong','b','em','i','u','s','ol','ul','li','a','blockquote','code','h2','h3','sub','sup'],
    ALLOWED_ATTR:['href','title'],ALLOW_DATA_ATTR:false,
  }).replace(/&nbsp;|&#160;|\u00a0/g,' ');
  function enhanceEmails(root) {
    root.querySelectorAll('a[href^="mailto:"]').forEach(link=>{
      if(link.closest('.email-contact'))return;
      const address=decodeURIComponent(link.getAttribute('href').slice(7).split('?')[0]);
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))return;
      const details=document.createElement('details');details.className='email-contact';
      const summary=document.createElement('summary');summary.textContent=link.textContent||'email';
      const panel=document.createElement('div');panel.className='email-panel';
      const addressLink=document.createElement('a');addressLink.href='mailto:'+address;addressLink.textContent=address;
      const actions=document.createElement('div');actions.className='email-actions';
      const copy=document.createElement('button');copy.type='button';copy.textContent='Copy address';
      const app=document.createElement('a');app.href='mailto:'+address;app.textContent='Email app';
      const gmail=document.createElement('a');gmail.href='https://mail.google.com/mail/?view=cm&fs=1&to='+encodeURIComponent(address);gmail.target='_blank';gmail.rel='noopener noreferrer';gmail.textContent='Gmail';
      const status=document.createElement('p');status.className='email-status';status.setAttribute('role','status');
      copy.addEventListener('click',async()=>{
        try{await navigator.clipboard.writeText(address);status.textContent='Email address copied.';}
        catch{const range=document.createRange();range.selectNodeContents(addressLink);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);status.textContent='Address selected. Press Ctrl+C or ⌘C to copy.';}
      });
      details.addEventListener('keydown',event=>{if(event.key==='Escape'){details.open=false;summary.focus();}});
      actions.append(copy,app,gmail);panel.append(addressLink,actions,status);details.append(summary,panel);
      const social=link.closest('p');if(social)social.classList.add('social-links');
      link.replaceWith(details);
    });
  }
  function render(doc) {
    if(!doc||typeof doc.title!=='string'||typeof doc.html!=='string')return;
    const main=document.querySelector('main');const title=document.createElement('h1');title.textContent=doc.title;
    const template=document.createElement('template');template.innerHTML=clean(doc.html);
    main.replaceChildren(title,template.content);document.title=doc.title;enhanceEmails(main);
  }
  window.PortfolioContent=Object.freeze({API,clean,render,enhanceEmails});
})();
