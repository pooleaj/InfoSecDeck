/* InfoSecDeck — Application Logic */
// ══════════════════════ NAVIGATION ══════════════════════
function showPage(p){
  document.querySelectorAll('.page').forEach(function(x){
    x.classList.remove('active');
    x.style.display='';
  });
  document.querySelectorAll('.nl').forEach(function(x){x.classList.remove('active');});
  var pg=document.getElementById('page-'+p);
  if(pg){
    pg.classList.add('active');
    pg.style.display='block';
  }
  var nav=document.getElementById('nav-'+p);
  if(nav)nav.classList.add('active');
  window.scrollTo(0,0);
  closeMobileNav();
  closeAllDrops();
  setActiveNav(p);
  // Close interview modal if open (prevent stuck overflow:hidden)
  var im=document.getElementById('iprep-modal');
  if(im&&im.classList.contains('open')){im.classList.remove('open');document.body.style.overflow='';}
  // Re-init hero animations when returning to home
  if (p === 'home') { heroRestartTyped(); }
  // Page-specific init hooks
  if(typeof _pageInits!=='undefined'&&_pageInits[p]){_pageInits[p]();}
}

// ══════════════════════ CAREER QUIZ ══════════════════════
// Scoring map: QUIZ_SCORES[questionIndex][optionIndex] = {key: points, ...}
var QUIZ_SCORES=[
  [{soc:3,de:2,vm:1},{de:3,as:2,cs:2,se:1},{pt:3,rt:2,vm:2},{grc:3,ciso:2,iam:1}],
  [{ir:3,ti:1,soc:1},{ma:3,rt:2,ir:2,ti:1},{ciso:3,grc:2},{se:3,cs:2,vm:2,iam:1}],
  [{as:3,de:2,cs:2,ma:1},{soc:2,se:2,ir:1,cs:1},{iam:2,vm:2,grc:1,ti:1},{grc:3,ciso:2,vm:1}],
  [{pt:3,rt:3,ma:2},{iam:3,sa:1,se:1},{cs:3,sa:2,se:1},{grc:3,ciso:2}],
  [{soc:3,ir:2},{de:2,se:2,as:1,cs:1,iam:1},{grc:3,ciso:2,ti:1,vm:2},{pt:3,rt:2,ma:1}],
  [{rt:2,pt:2,ma:2,ir:1},{de:3,soc:2,ti:2},{sa:3,se:2,vm:2},{grc:3,ciso:2}],
  [{as:3,se:2,cs:1,de:1},{se:2,cs:2,soc:1,iam:1},{grc:3,ciso:3,ti:1},{pt:3,rt:2,ma:2,soc:1}],
  [{grc:2,ciso:2,ti:3,ir:2},{soc:1,se:1,vm:1},{de:2,as:2,cs:2,ma:1},{pt:2,rt:1,vm:2}],
  [{ciso:3,grc:1},{sa:3,cs:2,as:1,iam:1},{rt:3,pt:2},{ti:3,ma:3,ir:2}],
  [{pt:2,rt:2,ma:2,soc:1},{grc:2,iam:2,ciso:1,vm:1},{as:3,de:2,se:2,cs:1},{ti:3,ir:2,soc:2,ma:1}],
  [{cs:3,sa:2,se:1},{as:2,de:1,se:2},{soc:1,iam:2,ir:1},{grc:2,ciso:2,vm:1}],
  [{rt:3,ma:2,ti:2},{grc:2,iam:2,vm:2},{as:3,se:2,cs:1},{ir:2,pt:2,de:1}],
  [{as:3,cs:2,se:1},{soc:2,de:2,ciso:1},{sa:3,grc:2,ti:1,vm:2},{rt:3,ma:3,pt:2}],
  [{soc:3,de:3,ti:1},{pt:3,rt:3},{cs:3,se:2,as:1},{iam:3,sa:1}],
  [{soc:2,de:2,se:1,iam:1},{ma:3,pt:2,rt:2},{grc:3,ciso:3},{as:2,cs:2,sa:3,se:2}]
];

var JT={
  soc:{title:'SOC Analyst',domain:'Security Operations',domainId:'soc',salary:'$65K – $95K',level:'Entry – Mid',icon:'🛡️',
    desc:'Monitor networks around the clock, triage security alerts, and investigate incidents using SIEM platforms and threat intelligence feeds.',
    daily:'Triaging alerts in Splunk or Microsoft Sentinel, investigating phishing emails, documenting incidents, and escalating high-severity events to senior analysts.'},
  de:{title:'Detection Engineer',domain:'Security Operations',domainId:'soc',salary:'$100K – $145K',level:'Mid – Senior',icon:'🔭',
    desc:'Build the detection logic that powers the entire SOC — writing SIEM rules, behavioral analytics queries, and threat hunt playbooks.',
    daily:'Writing and tuning detection rules, reducing alert noise and false positives, building automation pipelines, and collaborating closely with threat intelligence teams.'},
  ir:{title:'Incident Responder',domain:'Forensics & Threat Intel',domainId:'forensics',salary:'$90K – $135K',level:'Mid – Senior',icon:'🚨',
    desc:'Lead breach investigations from triage to recovery — performing digital forensics, coordinating eradication, and ensuring the organization learns from every incident.',
    daily:'Collecting and preserving digital evidence, building full attack timelines, eradicating malware from compromised systems, and writing detailed IR reports for leadership.'},
  ti:{title:'Threat Intelligence Analyst',domain:'Forensics & Threat Intel',domainId:'forensics',salary:'$85K – $130K',level:'Mid – Senior',icon:'🕵️',
    desc:'Track threat actors, monitor emerging attack campaigns, and produce actionable intelligence reports that guide the entire security organization\'s defensive decisions.',
    daily:'OSINT research and APT group tracking, indicator-of-compromise analysis, writing threat reports, and briefing leadership on current and emerging threat actors.'},
  pt:{title:'Penetration Tester',domain:'Offensive Security',domainId:'red',salary:'$95K – $145K',level:'Mid – Senior',icon:'🔴',
    desc:'Simulate real-world attacks against organizations to identify vulnerabilities before malicious attackers do — you have explicit authorization to break in.',
    daily:'Scoping and planning engagements, exploiting systems and web applications, pivoting through internal networks, and writing executive-quality findings reports.'},
  rt:{title:'Red Team Operator',domain:'Offensive Security',domainId:'red',salary:'$110K – $165K',level:'Senior – Principal',icon:'⚔️',
    desc:'Run full-scope adversary simulation campaigns that test whether an organization\'s people, processes, and technology can detect and respond to a real attacker.',
    daily:'Planning and executing multi-week covert operations, building custom C2 infrastructure, running social engineering scenarios, and briefing C-suite stakeholders.'},
  cs:{title:'Cloud Security Engineer',domain:'Cloud Security',domainId:'cloud',salary:'$110K – $165K',level:'Mid – Senior',icon:'☁️',
    desc:'Secure cloud environments across AWS, Azure, or GCP — from IAM policies and network architecture to runtime threat detection and incident response in the cloud.',
    daily:'Reviewing cloud misconfigurations with CSPM tools, hardening Kubernetes clusters, building automated security guardrails, and supporting DevOps teams on secure architecture.'},
  se:{title:'Security Engineer',domain:'Security Engineering',domainId:'eng',salary:'$100K – $155K',level:'Mid – Senior',icon:'⚙️',
    desc:'Build and operate the security infrastructure the entire organization relies on — firewalls, logging pipelines, identity systems, endpoint protection, and detection platforms.',
    daily:'Deploying and configuring security tools, automating security workflows using Python and Terraform, integrating new systems, and providing technical support to other security teams.'},
  sa:{title:'Security Architect',domain:'Security Engineering',domainId:'eng',salary:'$130K – $195K',level:'Senior – Principal',icon:'🏗️',
    desc:'Design the overall security strategy and technical framework for enterprise environments — from zero-trust architecture and cloud security to control frameworks and standards.',
    daily:'Leading architecture reviews and threat modeling sessions, designing zero-trust network frameworks, advising engineering teams on security design, and presenting to leadership.'},
  as:{title:'AppSec / DevSecOps Engineer',domain:'AppSec & DevSecOps',domainId:'appsec',salary:'$105K – $155K',level:'Mid – Senior',icon:'🔧',
    desc:'Embed security directly into the software development lifecycle — finding vulnerabilities in code and pipelines before they ever ship to production.',
    daily:'Reviewing pull requests for security issues, running SAST and DAST scans, building CI/CD security gates, writing secure coding guidelines, and training development teams.'},
  iam:{title:'IAM Engineer',domain:'Identity & Access Management',domainId:'iam',salary:'$95K – $150K',level:'Mid – Senior',icon:'🔐',
    desc:'Own the entire identity infrastructure — SSO, MFA, privileged access management, and the lifecycle of every human and machine identity in the organization.',
    daily:'Configuring Okta and Entra ID, managing CyberArk or BeyondTrust PAM platforms, building automated provisioning workflows, conducting access reviews, and auditing entitlements.'},
  grc:{title:'GRC Analyst',domain:'GRC & Compliance',domainId:'grc',salary:'$70K – $110K',level:'Entry – Mid',icon:'📋',
    desc:'Keep the organization compliant, accountable, and risk-aware — managing governance programs, writing security policies, and leading internal and external audits.',
    daily:'Conducting risk assessments against NIST and ISO 27001, writing and maintaining security policies, managing audit evidence requests, and tracking compliance metrics on dashboards.'},
  ciso:{title:'Security Manager / CISO Track',domain:'Leadership & Strategy',domainId:'grc',salary:'$130K – $220K+',level:'Senior – Executive',icon:'👔',
    desc:'Lead entire security programs — owning strategy, managing security teams, controlling budgets, and communicating risk clearly to board members and executive leadership.',
    daily:'Leading and growing the security team, building the annual security roadmap, presenting to the board, managing vendor relationships, and owning the overall security program budget.'},
  ma:{title:'Malware Analyst',domain:'Forensics & Threat Intel',domainId:'forensics',salary:'$95K – $155K',level:'Senior – Principal',icon:'🦠',
    desc:'Reverse-engineer malicious software at the assembly and code level to understand attacker capabilities, extract indicators of compromise, and build stronger defenses.',
    daily:'Disassembling malware samples using Ghidra and IDA Pro, running sandbox analyses, writing YARA and Sigma detection rules, and publishing technical research for the community.'},
  vm:{title:'Vulnerability Management Analyst',domain:'Security Operations',domainId:'soc',salary:'$80K – $120K',level:'Mid-Level',icon:'🔍',
    desc:'Systematically find, prioritize, and drive remediation of vulnerabilities across the entire enterprise before attackers can discover and exploit them.',
    daily:'Running Tenable or Qualys scans across the environment, risk-scoring CVEs using CVSS and EPSS, coordinating patch campaigns with engineering teams, and reporting metrics to leadership.'}
};

// ── quiz state ──
var qz={cur:0,ans:[]};

function quizInit(){
  qz={cur:0,ans:[]};
  // reset all selected options
  document.querySelectorAll('#home-quiz .qopt').forEach(function(el){el.classList.remove('selected');});
  // hide results, show nav
  var res=document.getElementById('quiz-results');
  if(res)res.style.display='none';
  var nav=document.getElementById('qnav');
  if(nav)nav.style.display='flex';
  quizShow(0);
}

function openHomeQuiz(){
  // If not on home page, navigate there first
  if(!document.getElementById('page-home').classList.contains('active')){showPage('home');}
  var s=document.getElementById('home-quiz');
  var btn=document.getElementById('quiz-toggle-btn');
  var wrap=btn?btn.closest('.hero-quiz-wrap'):null;
  if(!s)return;
  var isOpen=s.dataset.open==='1';
  if(isOpen){
    // Fade OUT
    s.style.opacity='0';
    s.dataset.open='0';
    s.classList.remove('quiz-visible');
    if(btn){var ar=btn.querySelector('.quiz-arrow');if(ar)ar.textContent='\u25BC';btn.classList.remove('quiz-open');}
    if(wrap)wrap.classList.remove('quiz-open');
    setTimeout(function(){s.style.display='none';s.style.opacity='';},340);
  } else {
    // Fade IN
    s.dataset.open='1';
    s.style.opacity='0';
    s.style.display='block';
    s.classList.add('quiz-visible');
    if(btn){var ar=btn.querySelector('.quiz-arrow');if(ar)ar.textContent='\u25B2';btn.classList.add('quiz-open');}
    if(wrap)wrap.classList.add('quiz-open');
    quizInit();
    requestAnimationFrame(function(){requestAnimationFrame(function(){
      s.style.opacity='1';
      // Measure connector gap before scrolling (layout gap is fixed)
      if(wrap&&btn){
        var btnRect=btn.getBoundingClientRect();
        var quizRect=s.getBoundingClientRect();
        var gap=quizRect.top-btnRect.bottom-2;
        wrap.style.setProperty('--connector-h',Math.max(24,Math.round(gap))+'px');
      }
      // Scroll so the top of the quiz card is visible (with nav offset) — slight delay for smooth feel
      setTimeout(function(){
        var rect=s.getBoundingClientRect();
        var target=window.pageYOffset+rect.top-68;
        window.scrollTo({top:Math.max(0,target),behavior:'smooth'});
      },80);
    });});
  }
}

function quizShow(n){
  var total=15;
  // hide all questions
  for(var i=0;i<total;i++){
    var el=document.getElementById('qq-'+i);
    if(el)el.style.display='none';
  }
  // show current
  var cur=document.getElementById('qq-'+n);
  if(cur)cur.style.display='block';
  // progress
  var pct=Math.round((n/total)*100);
  var bar=document.getElementById('qprog');
  if(bar)bar.style.width=pct+'%';
  var num=document.getElementById('qnum');
  if(num)num.textContent='Question '+(n+1)+' of '+total;
  var cnt=document.getElementById('qcount');
  if(cnt)cnt.textContent=(n+1)+' / '+total;
  // back button
  var back=document.getElementById('qbtn-back');
  if(back)back.style.visibility=n>0?'visible':'hidden';
  // next button
  var next=document.getElementById('qbtn-next');
  if(next){
    next.disabled=qz.ans[n]===undefined;
    next.textContent=n===total-1?'See Results \u2192':'Next \u2192';
  }
}

function quizPick(q,o){
  qz.ans[q]=o;
  var qEl=document.getElementById('qq-'+q);
  if(qEl){
    qEl.querySelectorAll('.qopt').forEach(function(el){el.classList.remove('selected');});
    var opts=qEl.querySelectorAll('.qopt');
    if(opts[o])opts[o].classList.add('selected');
  }
  var next=document.getElementById('qbtn-next');
  if(next)next.disabled=false;
}

function quizNext(){
  if(qz.ans[qz.cur]===undefined)return;
  if(qz.cur===14){quizShowResults();return;}
  qz.cur++;
  quizShow(qz.cur);
}

function quizBack(){
  if(qz.cur>0){qz.cur--;quizShow(qz.cur);}
}

function quizShowResults(){
  var sc={soc:0,de:0,ir:0,ti:0,pt:0,rt:0,cs:0,se:0,sa:0,as:0,iam:0,grc:0,ciso:0,ma:0,vm:0};
  for(var i=0;i<15;i++){
    if(qz.ans[i]===undefined)continue;
    var s=QUIZ_SCORES[i][qz.ans[i]];
    for(var k in s)sc[k]=(sc[k]||0)+s[k];
  }
  var sorted=Object.keys(sc).sort(function(a,b){return sc[b]-sc[a];});
  var top5=sorted.slice(0,5);
  var max=sc[sorted[0]]||1;
  var medalColors=['rgba(251,191,36,.16)','rgba(148,163,184,.1)','rgba(180,120,60,.1)','rgba(255,255,255,.04)','rgba(255,255,255,.03)'];
  var borderColors=['rgba(251,191,36,.38)','rgba(148,163,184,.22)','rgba(180,120,60,.22)','rgba(255,255,255,.08)','rgba(255,255,255,.07)'];
  var accentColors=['#fbbf24','#94a3b8','#b4783c','#6b7280','#6b7280'];
  var barColors=['linear-gradient(90deg,#fbbf24,#f59e0b)','linear-gradient(90deg,#94a3b8,#64748b)','linear-gradient(90deg,#c2773c,#92400e)','linear-gradient(90deg,var(--bl),var(--pu))','linear-gradient(90deg,var(--bl),var(--pu))'];
  var medals=['\uD83E\uDD47','\uD83E\uDD48','\uD83E\uDD49','4th','5th'];
  var cards=top5.map(function(id,i){
    var jt=JT[id];
    if(!jt)return '';
    var pct=Math.round((sc[id]/max)*100);
    var rankLabel=i<3?medals[i]:(i+1)+'th';
    return '<div class="qj-card" style="border-color:'+borderColors[i]+';background:'+medalColors[i]+';">'
      +'<div class="qjc-head">'
      +'<div class="qjc-rank" style="background:'+medalColors[i]+';border-color:'+borderColors[i]+';color:'+accentColors[i]+';">'+rankLabel+'</div>'
      +'<div style="flex:1;min-width:0;">'
      +'<div class="qjc-title">'+jt.icon+' '+jt.title+'</div>'
      +'<div class="qjc-meta"><span class="qjc-domain-tag">'+jt.domain+'</span><span class="qjc-sep"> &middot; </span><span class="qjc-level">'+jt.level+'</span></div>'
      +'</div>'
      +'<div class="qjc-pct" style="color:'+accentColors[i]+';">'+pct+'%<span class="qjc-pct-lbl">match</span></div>'
      +'</div>'
      +'<div class="qjc-bar-wrap"><div class="qjc-bar-fill" style="width:'+pct+'%;background:'+barColors[i]+';"></div></div>'
      +'<div class="qjc-desc">'+jt.desc+'</div>'
      +'<div class="qjc-daily"><span class="qjc-daily-lbl">Daily: </span>'+jt.daily+'</div>'
      +'<div class="qjc-footer">'
      +'<div class="qjc-salary">'+jt.salary+'</div>'
      +'<div class="qjc-actions">'
      +'<button class="qjc-btn-primary" style="border-color:'+borderColors[i]+';color:'+accentColors[i]+'" onclick="showPage(\'domains\')">Explore Domain &rarr;</button>'
      +'</div></div></div>';
  }).join('');
  // hide questions and nav, show results
  for(var i=0;i<15;i++){var el=document.getElementById('qq-'+i);if(el)el.style.display='none';}
  var nav=document.getElementById('qnav');
  if(nav)nav.style.display='none';
  var res=document.getElementById('quiz-results');
  if(res){
    res.innerHTML='<div style="text-align:center;margin-bottom:20px;"><div style="font-size:2rem;margin-bottom:8px;">\uD83C\uDFAF</div>'
      +'<div class="qr-title">Your Top 5 Cybersecurity Roles</div>'
      +'<div class="qr-sub">Based on your answers, here are the roles that best fit your strengths and working style.</div></div>'
      +'<div class="qj-cards">'+cards+'</div>'
      +'<div style="text-align:center;margin-top:28px;">'
      +'<button class="qretry" onclick="quizInit()">&#x21BA; Retake Quiz</button>'
      +'</div>';
    res.style.display='block';
  }
}

// ══════════════════════ CERT DATA ══════════════════════
var CERTS={
  'sec-plus':{name:'CompTIA Security+',issuer:'CompTIA · Exam SY0-701 · ~$404',tier:'Entry (Tier 1–2)',tierClass:'tier-entry',domains:['All Domains'],tags:['Vendor-neutral','DoD 8140','HR filter'],desc:'The industry\'s most recognized entry-level security certification. Required by many government and defense employers under DoD 8140. The HR filter for most entry-level security job listings. 5-year validity.',links:[{t:'rlc',l:'https://www.udemy.com/course/securityplus/',tx:'📚 Udemy – Dion Training SY0-701'},{t:'rlf',l:'https://www.professormesser.com/security-plus/sy0-701/',tx:'🎥 Prof. Messer (Free)'},{t:'rlb',l:'https://www.amazon.com/CompTIA-Security-Study-Guide-SY0-701/dp/1394211449/',tx:'📖 Mike Chapple Study Guide'}]},
  'net-plus':{name:'CompTIA Network+',issuer:'CompTIA · Exam N10-009 · ~$358',tier:'Entry (Tier 1–2)',tierClass:'tier-entry',domains:['All Domains'],tags:['Foundation','Vendor-neutral'],desc:'Recommended before Security+. Deep networking knowledge underpins nearly all technical security roles. Covers TCP/IP, routing, switching, VLANs, and troubleshooting.',links:[{t:'rlc',l:'https://www.udemy.com/course/comptia-network-cert-n10-008-the-total-course/',tx:'📚 Udemy – Mike Meyers'},{t:'rlf',l:'https://www.professormesser.com/network-plus/n10-009/',tx:'🎥 Prof. Messer (Free)'},{t:'rlb',l:'https://www.amazon.com/CompTIA-Network-Certification-N10-009-Edition/dp/1264269927/',tx:'📖 Mike Meyers All-in-One'}]},
  'google-cyber':{name:'Google Cybersecurity Certificate',issuer:'Google / Coursera · ~$50/month',tier:'Entry (Tier 1–2)',tierClass:'tier-entry',domains:['SOC','GRC'],tags:['Beginner-friendly','Self-paced'],desc:'Low-cost self-paced certificate covering security fundamentals, SIEM tools, Python basics, and Linux. Best lowest-barrier entry point. Not equivalent to Security+ for most hiring, but excellent for learning.',links:[{t:'rlc',l:'https://www.coursera.org/google-certificates/cybersecurity-certificate',tx:'📚 Coursera – Official Program'}]},
  'aws-ccp':{name:'AWS Cloud Practitioner',issuer:'Amazon Web Services · Exam CLF-C02 · ~$100',tier:'Entry (Tier 1–2)',tierClass:'tier-entry',domains:['Cloud'],tags:['Cloud on-ramp','AWS'],desc:'Essential first step for those targeting cloud security. Understand AWS architecture, services, and the shared responsibility model before the Solutions Architect or Security Specialty exams.',links:[{t:'rlc',l:'https://www.udemy.com/course/aws-certified-cloud-practitioner-new/',tx:'📚 Udemy – Stephane Maarek'},{t:'rlf',l:'https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/',tx:'🎥 AWS Free Digital Training'}]},
  'sc300':{name:'SC-300 – Identity & Access Administrator',issuer:'Microsoft · Exam SC-300 · ~$165',tier:'Mid-Level (Tier 2–3)',tierClass:'tier-mid',domains:['IAM'],tags:['IAM Track','Microsoft','Entra ID'],desc:'Most in-demand IAM cert. Covers SSO, conditional access, PIM, identity governance, and entitlement management in Entra ID. Essential for IAM Engineer roles in Microsoft environments.',links:[{t:'rlc',l:'https://www.udemy.com/course/sc-300-microsoft-identity-and-access-administrator/',tx:'📚 Udemy – SC-300 Course'},{t:'rlf',l:'https://learn.microsoft.com/en-us/credentials/certifications/identity-and-access-administrator/',tx:'🎥 Microsoft Learn (Free)'}]},
  'okta-pro':{name:'Okta Certified Professional',issuer:'Okta · certification.okta.com · Hands-on OIE Exam',tier:'Mid-Level (Tier 2–3)',tierClass:'tier-mid',domains:['IAM'],tags:['IAM Track','Vendor: Okta','Hands-on'],desc:'Step one of the Okta cert path. A hands-on exam on the Okta Identity Engine (OIE) platform. Required before pursuing the Administrator credential. Essential for Okta-deployed environments.',links:[{t:'rlf',l:'https://www.okta.com/learn/',tx:'🎥 Okta Training Portal'},{t:'rlc',l:'https://www.udemy.com/course/okta-certification-training/',tx:'📚 Udemy – Okta Admin Training'}]},
  'okta-admin':{name:'Okta Certified Administrator',issuer:'Okta · Requires active Professional cert',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['IAM'],tags:['IAM Track','Vendor: Okta'],desc:'Step two of the Okta path. Validates advanced administrative skills. Requires an active Okta Certified Professional credential. Highly valued in enterprises running Okta at scale.',links:[{t:'rlf',l:'https://www.okta.com/learn/',tx:'🎥 Okta Training Portal'}]},
  'cyberark-def':{name:'CyberArk Defender (PAM-DEF)',issuer:'CyberArk · Pearson VUE · ~$200 · 65 MCQ',tier:'Mid-Level (Tier 2–3)',tierClass:'tier-mid',domains:['IAM'],tags:['IAM/PAM Track','Vendor: CyberArk'],desc:'Second tier of CyberArk certs (after free Trustee). Validates PAS operations knowledge. 65 multiple-choice exam via Pearson VUE. The standard PAM engineer mid-career credential.',links:[{t:'rlf',l:'https://university.cyberark.com/',tx:'🎥 CyberArk University (Free)'},{t:'rlc',l:'https://www.udemy.com/course/cyberark-defender-certification-prep/',tx:'📚 Udemy – Defender Prep'}]},
  'cyberark-sen':{name:'CyberArk Sentry (PAM-SEN)',issuer:'CyberArk · Pearson VUE · ~$200',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['IAM'],tags:['IAM/PAM Track','Vendor: CyberArk'],desc:'Third tier of the CyberArk path. Validates deployment architecture and advanced configuration. Requires active Defender credential. Positions holder as a PAM solution architect.',links:[{t:'rlf',l:'https://university.cyberark.com/',tx:'🎥 CyberArk University (Free)'}]},
  'cyberark-guard':{name:'CyberArk Guardian',issuer:'CyberArk · Invitation-only · ~$2,250',tier:'Principal (Tier 4–5)',tierClass:'tier-principal',domains:['IAM'],tags:['IAM/PAM Track','Invitation-only'],desc:'The highest CyberArk credential. Invitation-only; requires active Defender + Sentry. Expert-level mastery. Positions holders as trusted PAM advisors and architects at enterprise scale.',links:[{t:'rlf',l:'https://university.cyberark.com/',tx:'🎥 CyberArk University'}]},
  'bt-admin':{name:'BeyondTrust University Admin Certs',issuer:'BeyondTrust · Requires ILT Course + 40-Q Exam · Valid 2 yrs',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['IAM'],tags:['IAM/PAM Track','Vendor: BeyondTrust','Requires ILT'],desc:'Product-specific admin certs for Password Safe, Privilege Management (EPM), and Privileged Remote Access (PRA). Requires instructor-led training first. Valid for 2 years.',links:[{t:'rlf',l:'https://www.beyondtrust.com/training',tx:'🎥 BeyondTrust Training Portal'}]},
  'cysa':{name:'CompTIA CySA+',issuer:'CompTIA · Exam CS0-003 · ~$393',tier:'Mid-Level (Tier 2–3)',tierClass:'tier-mid',domains:['SOC','AppSec'],tags:['SOC Track','DoD 8140'],desc:'Best intermediate cert for SOC analysts and threat hunters. Covers behavioral analytics, threat detection, and SIEM workflows. DoD 8140-approved. Good stepping stone to GCIH or GCFA.',links:[{t:'rlc',l:'https://www.udemy.com/course/comptiacysa/',tx:'📚 Udemy – Jason Dion CySA+'},{t:'rlb',l:'https://www.amazon.com/CompTIA-CySA-Study-Guide-CS0-003/dp/1394182694/',tx:'📖 Mike Chapple Study Guide'}]},
  'btl1':{name:'BTL1 – Blue Team Labs Level 1',issuer:'Security Blue Team · Hands-on Lab Exam',tier:'Mid-Level (Tier 2–3)',tierClass:'tier-mid',domains:['SOC','DFIR'],tags:['SOC Track','Hands-on','Lab-based'],desc:'Highly practical, scenario-based blue team cert. Not multiple choice — hands-on lab format. Covers SIEM analysis, phishing investigation, digital forensics fundamentals, and incident response.',links:[{t:'rlf',l:'https://blueteamlabs.online/',tx:'🆓 Free Practice Labs (BTLO)'},{t:'rlc',l:'https://www.securityblue.team/',tx:'📚 Security Blue Team Official'}]},
  'btl2':{name:'BTL2 – Blue Team Labs Level 2',issuer:'Security Blue Team · Advanced Lab Exam',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['SOC','DFIR'],tags:['SOC Track','Hands-on','Advanced'],desc:'Advanced practical blue team cert. Covers threat hunting, advanced DFIR, malware triage, and network forensics. The senior practitioner companion to BTL1.',links:[{t:'rlf',l:'https://blueteamlabs.online/',tx:'🆓 Free Practice Labs'},{t:'rlc',l:'https://www.securityblue.team/',tx:'📚 Security Blue Team Official'}]},
  'ceh':{name:'CEH – Certified Ethical Hacker',issuer:'EC-Council · ~$1,199',tier:'Mid-Level (Tier 2–3)',tierClass:'tier-mid',domains:['SOC','Offensive'],tags:['Government-recognized','Vendor: EC-Council'],desc:'Widely recognized by government and defense contractors. Less respected by security practitioners than OSCP/PNPT but fulfills DoD 8570 requirements for government roles.',links:[{t:'rlc',l:'https://www.udemy.com/course/certified-ethical-hacking-ceh/',tx:'📚 Udemy – CEH Prep'}]},
  'gcih':{name:'GCIH – Incident Handler',issuer:'GIAC / SANS · ~$949',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['SOC'],tags:['SOC/IR Track','SANS/GIAC'],desc:'Gold standard for senior SOC and incident response professionals. Covers incident handling and attacker techniques across the full attack lifecycle. SANS SEC504 is the official prep course.',links:[{t:'rlc',l:'https://www.sans.org/cyber-security-courses/hacker-techniques-incident-handling/',tx:'📚 SANS SEC504 (GCIH prep)'},{t:'rlf',l:'https://www.cyberdefenders.org/',tx:'🆓 CyberDefenders (Free Practice)'}]},
  'gcia':{name:'GCIA – Intrusion Analyst',issuer:'GIAC / SANS · ~$949',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['SOC'],tags:['SOC Track','SANS/GIAC','Network forensics'],desc:'Covers network traffic analysis, packet inspection, and intrusion detection. SANS SEC503 is the prep course. Valued for network security monitoring and detection engineering roles.',links:[{t:'rlc',l:'https://www.sans.org/cyber-security-courses/intrusion-detection-in-depth/',tx:'📚 SANS SEC503 (GCIA prep)'}]},
  'gdat':{name:'GDAT – Defending Advanced Threats',issuer:'GIAC / SANS · ~$949',tier:'Principal (Tier 4–5)',tierClass:'tier-principal',domains:['SOC'],tags:['SOC Track','SANS/GIAC','Advanced'],desc:'Advanced detection and response cert covering adversary tradecraft, threat hunting, and defense against sophisticated threat actors. For senior detection engineers and incident responders.',links:[{t:'rlf',l:'https://www.giac.org/certification/defending-advanced-threats-gdat/',tx:'🔗 GIAC Official Info'}]},
  'casp':{name:'CASP+ (CAS-004)',issuer:'CompTIA · ~$494 · No exp requirement for exam',tier:'Mid-Level / Senior',tierClass:'tier-senior',domains:['Security Eng.','SOC'],tags:['Vendor-neutral','DoD 8140'],desc:'CompTIA\'s advanced security cert. Practitioner-level content covering enterprise security architecture, risk management, and advanced cryptography. DoD 8140-approved for senior roles.',links:[{t:'rlc',l:'https://www.udemy.com/course/comptia-casp/',tx:'📚 Udemy – CASP+ Course'},{t:'rlb',l:'https://www.amazon.com/CompTIA-Advanced-Security-Practitioner-CAS-004/dp/1260468267/',tx:'📖 CASP+ Study Guide'}]},
  'cissp':{name:'CISSP',issuer:'ISC² · 5yr exp required · ~$749',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['Security Eng.','IAM','SOC','GRC','DFIR'],tags:['Universal Senior','DoD 8140','CISO Track','5yr exp'],desc:'The most recognized senior security certification globally. 8-domain coverage. Required or preferred for senior roles and the CISO track. 165,000+ holders worldwide. DoD 8140-approved. Passing without 5 years experience makes you an "Associate of ISC²".',links:[{t:'rlb',l:'https://www.amazon.com/CISSP-Official-ISC-Study-Guide/dp/1119786231/',tx:'📖 Official ISC² Study Guide'},{t:'rlb',l:'https://www.amazon.com/CISSP-All-One-Guide-Ninth/dp/1260467376/',tx:'📖 Shon Harris All-in-One'},{t:'rlc',l:'https://www.udemy.com/course/cissp-certification/',tx:'📚 Udemy – Thor Pedersen CISSP'}]},
  'cissp-issap':{name:'CISSP-ISSAP',issuer:'ISC² · Requires active CISSP',tier:'Principal (Tier 4–5)',tierClass:'tier-principal',domains:['Security Eng.','IAM'],tags:['Architecture Track','Requires CISSP'],desc:'CISSP concentration for security architects. Covers access control systems, cryptography, and security architecture design. For the Principal/Staff Architect track. Renewed with CISSP CPE credits.',links:[{t:'rlf',l:'https://www.isc2.org/Certifications/CISSP-Concentrations',tx:'🔗 ISC² Official Info'}]},
  'sabsa':{name:'SABSA SCF',issuer:'The SABSA Institute · Foundation Certificate',tier:'Principal / Executive',tierClass:'tier-principal',domains:['Security Eng.'],tags:['Architecture Track','Enterprise'],desc:'Enterprise security architecture framework. Business-driven approach used at large enterprises globally. Highly valued for Principal/Staff Architect and Director-level roles.',links:[{t:'rlb',l:'https://www.amazon.com/Enterprise-Security-Architecture-Business-Driven-Approach/dp/1578203430/',tx:'📖 Enterprise Security Architecture Book'},{t:'rlf',l:'https://sabsa.org/',tx:'🔗 SABSA Institute Official'}]},
  'togaf':{name:'TOGAF 10',issuer:'The Open Group · ~$550',tier:'Principal / Executive',tierClass:'tier-principal',domains:['Security Eng.'],tags:['Architecture Track','Enterprise'],desc:'Enterprise architecture framework widely adopted alongside SABSA. Valued for Security Architect and Principal roles at large enterprises. Two-part exam structure.',links:[{t:'rlc',l:'https://www.udemy.com/course/togaf-9-certification/',tx:'📚 Udemy – TOGAF Prep'},{t:'rlf',l:'https://www.opengroup.org/certifications/togaf',tx:'🔗 Open Group Official'}]},
  'aws-saa':{name:'AWS Solutions Architect Associate',issuer:'Amazon Web Services · Exam SAA-C03 · ~$150',tier:'Mid-Level (Tier 2–3)',tierClass:'tier-mid',domains:['Cloud'],tags:['Cloud foundation','Prerequisite'],desc:'The standard AWS foundation cert. Required before AWS Security Specialty. Covers architecture, compute, storage, networking, and security services. Recommended first step for cloud security careers.',links:[{t:'rlc',l:'https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/',tx:'📚 Udemy – Stephane Maarek SAA'},{t:'rlf',l:'https://aws.amazon.com/training/',tx:'🎥 AWS Free Training'}]},
  'az900':{name:'AZ-900 – Azure Fundamentals',issuer:'Microsoft · ~$165',tier:'Mid-Level (Tier 2–3)',tierClass:'tier-mid',domains:['Cloud'],tags:['Cloud on-ramp','Azure'],desc:'Entry-level Azure cert covering cloud concepts, Azure services, and the shared responsibility model. Good prerequisite before AZ-500 for those targeting Azure environments.',links:[{t:'rlf',l:'https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/',tx:'🎥 Microsoft Learn (Free)'}]},
  'gcp-ace':{name:'GCP Associate Cloud Engineer',issuer:'Google Cloud · ~$200',tier:'Mid-Level (Tier 2–3)',tierClass:'tier-mid',domains:['Cloud'],tags:['Cloud foundation','GCP'],desc:'Foundation cert for GCP environments. Covers deploying and managing applications on Google Cloud. Stepping stone to the Google Cloud Professional Security Engineer exam.',links:[{t:'rlf',l:'https://cloud.google.com/learn/certification/cloud-engineer',tx:'🔗 Google Cloud Official'}]},
  'aws-sec':{name:'AWS Security Specialty (SCS-C02)',issuer:'Amazon Web Services · ~$300',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['Cloud'],tags:['Cloud Security','30–40% Salary Premium'],desc:'Most in-demand cloud security cert in 2025. Holders report 30–40% salary premiums. Covers IAM, GuardDuty, Security Hub, KMS, CloudTrail, and incident response in AWS. Requires SAA-C03 first.',links:[{t:'rlc',l:'https://www.udemy.com/course/aws-certified-security-specialty/',tx:'📚 Udemy – Stephane Maarek SCS'},{t:'rlb',l:'https://www.amazon.com/AWS-Certified-Security-Study-Guide/dp/1119658810/',tx:'📖 AWS Security Study Guide'},{t:'rlf',l:'https://aws.amazon.com/training/learn-about/security/',tx:'🎥 AWS Free Security Training'}]},
  'az500':{name:'AZ-500 – Azure Security Engineer',issuer:'Microsoft · ~$165',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['Cloud'],tags:['Cloud Security','Azure'],desc:'Azure cloud security cert covering Defender for Cloud, Sentinel, Entra ID security, Key Vault, and network security. Essential for Microsoft-heavy environments.',links:[{t:'rlc',l:'https://www.udemy.com/course/az500-azure/',tx:'📚 Udemy – AZ-500 Course'},{t:'rlf',l:'https://learn.microsoft.com/en-us/credentials/certifications/azure-security-engineer/',tx:'🎥 Microsoft Learn (Free)'}]},
  'gcp-sec':{name:'GCP Professional Security Engineer',issuer:'Google Cloud · ~$200',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['Cloud'],tags:['Cloud Security','GCP'],desc:'Google Cloud security engineer cert. Covers designing and implementing a secure GCP infrastructure, including IAM, data protection, and compliance.',links:[{t:'rlf',l:'https://cloud.google.com/learn/certification/cloud-security-engineer',tx:'🔗 Google Cloud Official'}]},
  'ccsp':{name:'CCSP – Certified Cloud Security Professional',issuer:'ISC² · ~$599 · 5yr exp (cloud preferred)',tier:'Principal (Tier 4–5)',tierClass:'tier-principal',domains:['Cloud'],tags:['Cloud Security','Vendor-neutral'],desc:'Vendor-neutral cloud security cert covering cloud architecture, data security, legal frameworks, and operations. Often pursued alongside CISSP by cloud security architects.',links:[{t:'rlb',l:'https://www.amazon.com/CCSP-Certified-Cloud-Security-Professional/dp/1260455882/',tx:'📖 CCSP Study Guide'},{t:'rlc',l:'https://www.udemy.com/course/ccsp-video-course/',tx:'📚 Udemy – CCSP Course'}]},
  'bscp':{name:'Burp Suite Certified Practitioner',issuer:'PortSwigger · portswigger.net',tier:'Mid-Level (Tier 2–3)',tierClass:'tier-mid',domains:['AppSec'],tags:['AppSec Track','Hands-on Exam'],desc:'Practical AppSec cert based on the Web Security Academy labs. Hands-on exam — not multiple choice. Highly respected by practitioners for being genuinely difficult and practical.',links:[{t:'rlf',l:'https://portswigger.net/web-security',tx:'🆓 Web Security Academy (Free)'},{t:'rlf',l:'https://portswigger.net/burp/communitydownload',tx:'🔗 Burp Suite Community (Free)'}]},
  'gweb':{name:'GWEB – Web Application Defender',issuer:'GIAC / SANS · ~$949',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['AppSec'],tags:['AppSec Track','SANS/GIAC'],desc:'Senior web application security cert. Covers modern web vulnerabilities, defense techniques, and secure development lifecycle. SANS SEC522 is the prep course.',links:[{t:'rlc',l:'https://www.sans.org/cyber-security-courses/securing-web-application-technologies/',tx:'📚 SANS SEC542'},{t:'rlb',l:'https://www.amazon.com/Web-Application-Hackers-Handbook-Exploiting/dp/1118026470/',tx:'📖 Web App Hackers Handbook'}]},
  'csslp':{name:'CSSLP – Secure Software Lifecycle Professional',issuer:'ISC² · ~$599 · 4yr exp required',tier:'Senior / Principal',tierClass:'tier-senior',domains:['AppSec'],tags:['AppSec Track','Vendor-neutral'],desc:'Vendor-neutral cert for AppSec professionals. Covers security throughout the SDLC — from requirements to deployment. Valued for senior AppSec engineer and DevSecOps architect roles.',links:[{t:'rlf',l:'https://www.isc2.org/Certifications/CSSLP',tx:'🔗 ISC² Official Info'}]},
  'ejpt':{name:'eJPT – Junior Penetration Tester',issuer:'INE Security / eLearnSecurity · ~$200',tier:'Mid-Level (Tier 2–3)',tierClass:'tier-mid',domains:['Offensive'],tags:['Offensive Track','Entry practical'],desc:'Entry-level practical offensive cert. Good first step before PNPT or OSCP. Covers basic network and web penetration testing. Lab-based practical exam.',links:[{t:'rlc',l:'https://ine.com/certifications/ejpt-certification/',tx:'📚 INE eJPT Official'},{t:'rlf',l:'https://tryhackme.com/',tx:'🆓 TryHackMe (Practice)'}]},
  'pnpt':{name:'PNPT – Practical Network Penetration Tester',issuer:'TCM Security · ~$399 · 5-day practical exam',tier:'Mid-Level (Tier 2–3)',tierClass:'tier-mid',domains:['Offensive','AppSec'],tags:['Offensive Track','Practical Exam','Report required'],desc:'Excellent entry-level offensive cert. 5-day practical exam simulating a real-world engagement including a written executive report. Great stepping stone to OSCP. Highly respected by practitioners.',links:[{t:'rlc',l:'https://certifications.tcm-sec.com/pnpt/',tx:'📚 TCM Security Official'},{t:'rlf',l:'https://tryhackme.com/path/outline/jrpenetrationtester',tx:'🆓 TryHackMe Jr Pen Tester'}]},
  'oscp':{name:'OSCP – Offensive Security Certified Professional',issuer:'Offensive Security · PEN-200 · ~$1,499 · 24hr exam',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['Offensive'],tags:['Offensive Track','24hr Practical Exam','Gold standard'],desc:'Gold standard for penetration testers. A 24-hour practical exam in a live lab environment. Required or strongly preferred by most pen test employers. The single highest-signal offensive cert.',links:[{t:'rlc',l:'https://www.offensive-security.com/pen200-oscp/',tx:'📚 Official PEN-200'},{t:'rlc',l:'https://www.udemy.com/course/practical-ethical-hacking/',tx:'📚 TCM – Practical Ethical Hacking'},{t:'rlb',l:'https://www.amazon.com/Penetration-Testing-Hands-Introduction-Hacking/dp/1593275641/',tx:'📖 Georgia Weidman Book'},{t:'rlf',l:'https://app.hackthebox.com/',tx:'🆓 Hack The Box'}]},
  'crto':{name:'CRTO – Certified Red Team Operator',issuer:'Zero-Point Security · Lab-based exam',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['Offensive'],tags:['Red Team Track','Cobalt Strike','Lab-based'],desc:'Cobalt Strike-focused red team cert. Full attack lifecycle lab exam covering phishing, lateral movement, and exfiltration. Strong demand from internal red teams at large enterprises.',links:[{t:'rlc',l:'https://training.zeropointsecurity.co.uk/courses/red-team-ops',tx:'📚 ZeroPoint Security – Red Team Ops'},{t:'rlb',l:'https://www.amazon.com/Red-Team-Development-Operations-Practical/dp/B083XVG633/',tx:'📖 Red Team Operations Book'}]},
  'crto2':{name:'CRTO II – Advanced Red Team Operator',issuer:'Zero-Point Security · Advanced Lab exam',tier:'Principal (Tier 4–5)',tierClass:'tier-principal',domains:['Offensive'],tags:['Red Team Track','Advanced','Lab-based'],desc:'Advanced continuation of CRTO. Covers more complex adversary emulation techniques, custom tooling, and advanced evasion. For established red team practitioners.',links:[{t:'rlc',l:'https://training.zeropointsecurity.co.uk/',tx:'📚 ZeroPoint Security'}]},
  'osce3':{name:'OSCE3',issuer:'Offensive Security · Requires OSCP + 2 advanced certs',tier:'Principal (Tier 4–5)',tierClass:'tier-principal',domains:['Offensive'],tags:['Elite','Expert level','Bundle'],desc:'Elite Offensive Security credential requiring OSCP plus two advanced certs (OSWE, OSEP, or OSED). One of the most technically demanding credentials in offensive security.',links:[{t:'rlf',l:'https://www.offensive-security.com/osce3/',tx:'🔗 Offensive Security Official'}]},
  'gpen':{name:'GPEN – Penetration Tester',issuer:'GIAC / SANS · ~$949',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['Offensive'],tags:['Offensive Track','SANS/GIAC'],desc:'SANS-backed penetration testing cert. Covers network pen testing, password attacks, web application testing, and exploitation. Prep course is SANS SEC560.',links:[{t:'rlc',l:'https://www.sans.org/cyber-security-courses/network-penetration-testing-ethical-hacking/',tx:'📚 SANS SEC560 (GPEN prep)'}]},
  'cisa':{name:'CISA – Certified Information Systems Auditor',issuer:'ISACA · ~$575 members · 5yr exp recommended',tier:'Mid-Level (Tier 2–3)',tierClass:'tier-mid',domains:['GRC'],tags:['GRC Track','Audit','5yr exp preferred'],desc:'Gold standard for GRC and IT audit professionals. One of the highest-ROI certs for non-technical professionals entering security through the compliance/audit path. Valid 3 years.',links:[{t:'rlb',l:'https://www.amazon.com/CISA-Certified-Information-Systems-Auditor/dp/1260467783/',tx:'📖 CISA All-in-One'},{t:'rlc',l:'https://www.udemy.com/course/cisa-certification/',tx:'📚 Udemy – CISA Course'},{t:'rlf',l:'https://www.isaca.org/credentialing/cisa',tx:'🔗 ISACA Official'}]},
  'itil':{name:'ITIL 4 Foundation',issuer:'Axelos · ~$400',tier:'Mid-Level (Tier 2–3)',tierClass:'tier-mid',domains:['GRC'],tags:['GRC / IT Service'],desc:'IT service management framework widely adopted in regulated industries. Complements GRC careers and is often required for IT management roles in financial services and government.',links:[{t:'rlc',l:'https://www.udemy.com/course/itil-4-foundation-practice-exam/',tx:'📚 Udemy – ITIL 4 Prep'}]},
  'cism':{name:'CISM – Certified Information Security Manager',issuer:'ISACA · ~$575 members · 3–5yr exp req.',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['GRC'],tags:['Management Track','3–5yr exp'],desc:'The management-track equivalent of CISSP. Covers security program management, risk, incident response, and governance. Required or preferred for Security Manager and Director roles.',links:[{t:'rlb',l:'https://www.amazon.com/CISM-Certified-Information-Security-Manager/dp/126043399X/',tx:'📖 CISM All-in-One'},{t:'rlc',l:'https://www.udemy.com/course/cism-certification/',tx:'📚 Udemy – CISM Course'}]},
  'crisc':{name:'CRISC – Certified in Risk and Information Systems Control',issuer:'ISACA · ~$575 members · 3yr exp req.',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['GRC'],tags:['GRC / Risk Track','3yr exp'],desc:'Focused on IT risk identification, assessment, and control. Valued for GRC Director and CISO-track roles. Often paired with CISM. One of ISACA\'s four flagship certs.',links:[{t:'rlb',l:'https://www.amazon.com/CRISC-Certified-Information-Systems-Manager/dp/1260452700/',tx:'📖 CRISC Study Guide'},{t:'rlf',l:'https://www.isaca.org/credentialing/crisc',tx:'🔗 ISACA Official'}]},
  'iso27001':{name:'ISO 27001 Lead Implementer',issuer:'PECB / BSI · ANSI-accredited',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['GRC'],tags:['GRC Track','International'],desc:'Validates ability to design and lead an ISO 27001 ISMS implementation. Required for senior GRC consulting and Director-level compliance positions at global enterprises.',links:[{t:'rlc',l:'https://www.udemy.com/course/iso-27001-lead-implementer-preparation-course/',tx:'📚 Udemy – ISO 27001 Lead Impl.'},{t:'rlb',l:'https://www.amazon.com/ISO-27001-Controls-Practical-Information/dp/1787781496/',tx:'📖 ISO 27001 Controls Guide'}]},
  'cciso':{name:'CCISO – Certified CISO',issuer:'EC-Council · ~$999 · 5yr senior mgmt exp',tier:'Executive (Tier 5–6)',tierClass:'tier-exec',domains:['GRC'],tags:['Executive Track','CISO-specific'],desc:'The only cert designed specifically for CISOs. Covers five domains including governance, security programs, audit, and strategic planning. Requires 5 years in senior information security management.',links:[{t:'rlf',l:'https://ciso.eccouncil.org/cciso-certification/',tx:'🔗 EC-Council Official'}]},
  'gcfe':{name:'GCFE – Forensic Examiner',issuer:'GIAC / SANS · ~$949',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['DFIR'],tags:['DFIR Track','SANS/GIAC','Host forensics'],desc:'Host-based digital forensics cert. Covers Windows artifacts, registry forensics, browser forensics, and timeline analysis. SANS FOR500 is the official prep course.',links:[{t:'rlc',l:'https://www.sans.org/cyber-security-courses/windows-forensic-analysis/',tx:'📚 SANS FOR500 (GCFE prep)'},{t:'rlb',l:'https://www.amazon.com/Art-Memory-Forensics-Detecting-Malware/dp/1118825098/',tx:'📖 Art of Memory Forensics'}]},
  'gcfa':{name:'GCFA – Forensic Analyst',issuer:'GIAC / SANS · ~$949',tier:'Senior / Principal',tierClass:'tier-senior',domains:['DFIR'],tags:['DFIR Track','SANS/GIAC','Memory forensics'],desc:'Adds memory forensics, timeline analysis, and enterprise-scale investigation to GCFE skills. Industry benchmark for senior DFIR practitioners and incident responders at large organizations.',links:[{t:'rlc',l:'https://www.sans.org/cyber-security-courses/advanced-incident-response-threat-hunting-training/',tx:'📚 SANS FOR508 (GCFA prep)'},{t:'rlb',l:'https://www.amazon.com/Art-Memory-Forensics-Detecting-Malware/dp/1118825098/',tx:'📖 Art of Memory Forensics'},{t:'rlf',l:'https://github.com/volatilityfoundation/volatility3',tx:'🆓 Volatility3 (Free)'}]},
  'gcti':{name:'GCTI – Cyber Threat Intelligence',issuer:'GIAC / SANS · ~$949',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['DFIR'],tags:['Threat Intel Track','SANS/GIAC'],desc:'Validates threat intelligence skills including collection, analysis, and dissemination. Growing demand as organizations mature their intel programs. SANS FOR578 is the prep course.',links:[{t:'rlc',l:'https://www.sans.org/cyber-security-courses/cyber-threat-intelligence/',tx:'📚 SANS FOR578 (GCTI prep)'},{t:'rlf',l:'https://attack.mitre.org/',tx:'🆓 MITRE ATT&CK (Free)'}]},
  'grem':{name:'GREM – Reverse Engineering Malware',issuer:'GIAC / SANS · ~$949 · Elite',tier:'Principal (Tier 4–5)',tierClass:'tier-principal',domains:['DFIR'],tags:['DFIR/Malware Track','Elite','Assembly-level'],desc:'One of the most technically demanding certs in the industry. Covers static/dynamic malware analysis, Windows internals, and assembly-level code review. SANS FOR610 is the prep course.',links:[{t:'rlc',l:'https://www.sans.org/cyber-security-courses/reverse-engineering-malware-malware-analysis-tools-techniques/',tx:'📚 SANS FOR610 (GREM prep)'},{t:'rlb',l:'https://www.amazon.com/Practical-Malware-Analysis-Hands-Dissecting/dp/1593272901/',tx:'📖 Practical Malware Analysis'},{t:'rlf',l:'https://github.com/NationalSecurityAgency/ghidra',tx:'🔗 Ghidra (Free NSA Tool)'}]}
,
  'sc900':{name:'Microsoft SC-900',issuer:'Microsoft · Exam SC-900 · ~$165',tier:'Entry (Tier 1–2)',tierClass:'entry',domains:['IAM','Cloud'],tags:['Vendor-Specific','Microsoft','M365','Azure AD'],desc:'Microsoft Security, Compliance, and Identity Fundamentals. Entry-level Microsoft identity and security cert. Ideal starting point for the Azure IAM track before SC-300.',links:[{t:'rlc',l:'https://learn.microsoft.com/en-us/certifications/exams/sc-900',tx:'★ Microsoft Learn (Free)'}]},
  'isc2-cc':{name:'ISC² Certified in Cybersecurity (CC)',issuer:'ISC² · Free exam voucher available · Entry-level',tier:'Entry (Tier 1–2)',tierClass:'entry',domains:['SOC','GRC','General'],tags:['Vendor-Neutral','ISC²','Free','Entry'],desc:'Free entry-level credential from ISC². The CC demonstrates foundational security knowledge and is available with a free exam voucher through ISC²\'s One Million Certified initiative. Strong precursor to SSCP and CISSP.',links:[{t:'rlf',l:'https://www.isc2.org/certifications/cc',tx:'Free Course + Exam →'}]},
  'linux-plus':{name:'CompTIA Linux+',issuer:'CompTIA · Exam XK0-005 · ~$358',tier:'Entry (Tier 1–2)',tierClass:'entry',domains:['Security Eng.','General'],tags:['Vendor-Neutral','CompTIA','Linux'],desc:'Linux fundamentals and systems administration. Essential for security engineers working in Linux environments — which is most enterprise security infrastructure.',links:[{t:'rlc',l:'https://www.udemy.com/course/comptia-linux-plus/',tx:'★ Linux+ Course on Udemy'}]},
  'pentest-plus':{name:'CompTIA PenTest+',issuer:'CompTIA · Exam PT0-003 · ~$404',tier:'Entry-Mid (Tier 1–3)',tierClass:'entry',domains:['Offensive','AppSec'],tags:['Vendor-Neutral','CompTIA','Offensive','DoD 8140'],desc:'Vendor-neutral penetration testing cert. Covers planning, scoping, recon, exploitation, and reporting. DoD 8140 approved. Good stepping stone before OSCP.',links:[{t:'rlc',l:'https://www.udemy.com/course/comptia-pentest-course/',tx:'★ PenTest+ Prep Course'}]},
  'ciam':{name:'CIAM – Certified Identity & Access Manager',issuer:'Identity Management Institute · ~$395',tier:'Mid-Level (Tier 2–3)',tierClass:'mid',domains:['IAM'],tags:['Vendor-Neutral','IAM-Specific','Governance'],desc:'Vendor-neutral IAM management certification from the Identity Management Institute. Covers RBAC, identity governance, access provisioning, and lifecycle management. One of few dedicated vendor-neutral IAM credentials.',links:[{t:'rlf',l:'https://www.identitymanagementinstitute.org/ciam/',tx:'Learn More →'}]},
  'cidpro':{name:'CIDPRO – Certified Identity Professional',issuer:'Identity Defined Security Alliance (IDSA) / IDPro',tier:'Senior (Tier 3–4)',tierClass:'senior',domains:['IAM'],tags:['Vendor-Neutral','IAM-Specific','Directory Services'],desc:'Vendor-neutral senior IAM credential from IDPro. Covers directory services, federation protocols (SAML, OAuth, OIDC), identity governance, and privileged access. Designed by IAM practitioners for IAM practitioners.',links:[{t:'rlf',l:'https://idpro.org/cidpro/',tx:'Learn More →'}]},
  'sscp':{name:'SSCP – Systems Security Certified Practitioner',issuer:'ISC² · Exam SSCP · ~$249 · 1yr exp required',tier:'Mid-Level (Tier 2–3)',tierClass:'mid',domains:['Security Eng.','General'],tags:['Vendor-Neutral','ISC²','Operational'],desc:'ISC² operational security credential. Covers access controls, cryptography, network/communications security, risk identification, and incident response. Strong stepping stone to CISSP.',links:[{t:'rlc',l:'https://www.udemy.com/course/sscp-certification/',tx:'★ SSCP Course on Udemy'}]},
  'cipp':{name:'IAPP CIPP/US – Certified Information Privacy Professional',issuer:'IAPP · Exam ~$550 · No exp requirement',tier:'Mid-Level (Tier 2–3)',tierClass:'mid',domains:['GRC'],tags:['Vendor-Neutral','Privacy','IAPP','US Law'],desc:'The gold standard U.S. privacy law certification. Covers CCPA, HIPAA, FERPA, state privacy laws, and data governance. Essential for GRC roles with privacy program responsibilities.',links:[{t:'rlf',l:'https://iapp.org/certify/cippus/',tx:'Learn More at IAPP →'}]},
  'cipm':{name:'IAPP CIPM – Certified Information Privacy Manager',issuer:'IAPP · Exam ~$550',tier:'Senior (Tier 3–4)',tierClass:'senior',domains:['GRC'],tags:['Vendor-Neutral','Privacy','IAPP','Program Management'],desc:'Privacy program management credential from IAPP. Covers building and operating a privacy program, data governance, vendor management, and privacy by design. Expected for Privacy Officers and senior GRC roles.',links:[{t:'rlf',l:'https://iapp.org/certify/cipm/',tx:'Learn More at IAPP →'}]},
  'splunk-core':{name:'Splunk Core Certified User',issuer:'Splunk · Exam ~$130 · Entry-level',tier:'Mid-Level (Tier 2–3)',tierClass:'mid',domains:['SOC'],tags:['Vendor-Specific','Splunk','SIEM'],desc:'Entry Splunk SIEM cert. Highly demanded in SOC analyst job postings. Covers searches, reports, dashboards, and data inputs. Pairs well with CySA+ for a competitive SOC candidate profile.',links:[{t:'rlf',l:'https://www.splunk.com/en_us/training/certification-track/splunk-core-certified-user.html',tx:'Splunk Certification Info →'}]},
  'splunk-es':{name:'Splunk Enterprise Security Certified Admin',issuer:'Splunk · Advanced · $130',tier:'Senior (Tier 3–4)',tierClass:'senior',domains:['SOC'],tags:['Vendor-Specific','Splunk','SIEM','Advanced'],desc:'Advanced Splunk ES administration. Covers correlation searches, notable events, risk-based alerting, and threat hunting within Splunk ES. Highly valued at senior SOC and Detection Engineering roles.',links:[{t:'rlf',l:'https://www.splunk.com/en_us/training/certification-track/splunk-enterprise-security-certified-admin.html',tx:'Splunk Certification Info →'}]},
  'cellebrite':{name:'Cellebrite Certified Operator (CCO)',issuer:'Cellebrite · Vendor-specific · ~$1,000+',tier:'Mid-Level (Tier 2–3)',tierClass:'mid',domains:['DFIR'],tags:['Vendor-Specific','Mobile Forensics','Law Enforcement','Corporate IR'],desc:'Mobile device forensics certification from the industry leader. Covers physical and logical extractions from iOS and Android devices. Widely required for DFIR roles in law enforcement and corporate incident response teams.',links:[{t:'rlf',l:'https://cellebrite.com/en/training/',tx:'Cellebrite Training →'}]},
  'cciso':{name:'EC-Council CCISO – Certified Chief Information Security Officer',issuer:'EC-Council · ~$999 · 5yr exec exp required',tier:'Executive (Tier 5–6)',tierClass:'exec',domains:['GRC','All'],tags:['Vendor-Neutral','CISO','Executive','Governance'],desc:'CISO-specific executive credential. The only certification designed exclusively for CISOs and aspiring CISOs. Covers governance, risk, program management, finance, and core competencies of the security executive role.',links:[{t:'rlf',l:'https://ciso.eccouncil.org/',tx:'EC-Council CCISO Info →'}]},
  'gdat':{name:'GIAC Defending Advanced Threats (GDAT)',issuer:'GIAC/SANS · Exam ~$979 · Requires SANS course',tier:'Principal (Tier 4–5)',tierClass:'principal',domains:['SOC'],tags:['Vendor-Neutral','GIAC','SANS','Advanced Threats'],desc:'Advanced threat detection and response credential from GIAC. Covers advanced persistent threats, threat hunting, detection engineering, and adversary emulation. Senior-level SOC/IR practitioners.',links:[{t:'rlc',l:'https://www.giac.org/certifications/defending-advanced-threats-gdat/',tx:'GIAC GDAT Info →'}]},
  'iso27001-la':{name:'ISO 27001 Lead Auditor',issuer:'PECB / BSI · ~$1,500–$2,000',tier:'Principal (Tier 4–5)',tierClass:'principal',domains:['GRC'],tags:['Vendor-Neutral','ISO 27001','Audit','Compliance'],desc:'Auditing ISMS implementations against ISO 27001. Required for senior GRC consulting, compliance officer roles at multinationals, and organizations seeking ISO 27001 certification. Distinct from Lead Implementer.',links:[{t:'rlf',l:'https://pecb.com/en/education-and-certification-for-individuals/iso-iec-27001/lead-auditor',tx:'PECB ISO 27001 LA →'}]},
  'togaf':{name:'TOGAF 9/10 Enterprise Architecture',issuer:'The Open Group · ~$550 (combined exam)',tier:'Principal (Tier 4–5)',tierClass:'principal',domains:['Security Eng.'],tags:['Vendor-Neutral','Architecture','Enterprise','Framework'],desc:'Enterprise architecture framework widely used alongside SABSA for large-scale security architecture. Covers architecture development methodology, governance, and content framework. Expected at Principal Security Architect level.',links:[{t:'rlc',l:'https://www.udemy.com/course/togaf-training/',tx:'★ TOGAF Course on Udemy'}]},
  'osce3':{name:'OSCE3 – Offensive Security Expert',issuer:'Offensive Security · Requires OSED + OSEP + OSWE',tier:'Principal (Tier 4–5)',tierClass:'principal',domains:['Offensive'],tags:['Vendor-Neutral','OffSec','Expert','Advanced'],desc:'OffSec triple expert designation: requires passing OSED (exploit dev), OSEP (advanced evasion), and OSWE (advanced web attacks). Extremely advanced. Reserved for the most elite offensive security professionals.',links:[{t:'rlf',l:'https://www.offsec.com/courses/exp-401/',tx:'OffSec Expert Track →'}]},
  'crto2':{name:'CRTO II – Certified Red Team Lead',issuer:'Zero-Point Security · ~$499 · Follows CRTO',tier:'Principal (Tier 4–5)',tierClass:'principal',domains:['Offensive'],tags:['Vendor-Specific','Red Team','Advanced C2','Zero-Point'],desc:'Advanced red team operations cert following CRTO. Covers advanced C2 tradecraft, bypassing modern defenses, cross-forest AD attacks, and red team program leadership. Report-based exam.',links:[{t:'rlf',l:'https://training.zeropointsecurity.co.uk/courses/red-team-ops-ii',tx:'Zero-Point Security →'}]},
  'gwapt':{name:'GIAC Web Application Penetration Tester (GWAPT)',issuer:'GIAC/SANS · Exam ~$979',tier:'Mid-Senior (Tier 2–4)',tierClass:'mid',domains:['AppSec','Offensive'],tags:['Vendor-Neutral','GIAC','SANS','Web App'],desc:'SANS-backed web application penetration testing credential. Covers SQL injection, XSS, authentication attacks, and web app recon. Highly respected for AppSec and offensive security practitioners.',links:[{t:'rlf',l:'https://www.giac.org/certifications/web-application-penetration-tester-gwapt/',tx:'GIAC GWAPT Info →'}]},
  // ── New entries ──
  'gsec':{name:'GIAC Security Essentials (GSEC)',issuer:'GIAC/SANS · Exam ~$979 · Requires SANS course',tier:'Entry (Tier 1–2)',tierClass:'tier-entry',domains:['All Domains'],tags:['Vendor-Neutral','GIAC','SANS','Hands-on'],desc:'SANS-backed entry credential covering practical security skills including networking, cryptography, Linux, Windows security, and incident response. More technical and hands-on than Security+. Open-book exam format.',links:[{t:'rlc',l:'https://www.sans.org/cyber-security-courses/security-essentials-network-endpoint-cloud/',tx:'📚 SANS SEC401 (GSEC prep)'},{t:'rlf',l:'https://www.giac.org/certifications/security-essentials-gsec/',tx:'🔗 GIAC Official Info'}]},
  'ccd':{name:'CompTIA CCD – Cybersecurity Certified Defense',issuer:'CompTIA · Entry-level · ~$350',tier:'Entry (Tier 1–2)',tierClass:'tier-entry',domains:['SOC'],tags:['Vendor-Neutral','CompTIA','Blue Team'],desc:'Entry-level CompTIA credential covering core defensive security skills: threat triage, log monitoring, basic malware analysis, and incident escalation. Designed as the first blue-team cert on the CompTIA pathway.',links:[{t:'rlf',l:'https://www.comptia.org/',tx:'🔗 CompTIA Official'}]},
  'sc200':{name:'SC-200 – Microsoft Security Operations Analyst',issuer:'Microsoft · Exam SC-200 · ~$165',tier:'Mid-Level (Tier 2–3)',tierClass:'tier-mid',domains:['SOC'],tags:['Vendor-Specific','Microsoft','Sentinel','Defender'],desc:'Microsoft\'s SOC analyst certification. Covers Microsoft Defender XDR, Microsoft Sentinel, and Microsoft Defender for Cloud. Practical skills for managing security in Microsoft-heavy environments. Strong pairing with CySA+.',links:[{t:'rlf',l:'https://learn.microsoft.com/en-us/credentials/certifications/security-operations-analyst/',tx:'🎥 Microsoft Learn (Free)'},{t:'rlc',l:'https://www.udemy.com/course/sc-200-microsoft-security-operations-analyst/',tx:'📚 Udemy – SC-200 Prep'}]},
  'a-plus':{name:'CompTIA A+',issuer:'CompTIA · Exam Core 1 & Core 2 · ~$254 each',tier:'Entry (Tier 1–2)',tierClass:'tier-entry',domains:['All Domains'],tags:['Vendor-Neutral','CompTIA','IT Fundamentals'],desc:'The foundational IT cert covering hardware, operating systems, networking basics, troubleshooting, and IT support. The standard starting point for career changers entering IT/security from non-technical backgrounds. Two separate exams required.',links:[{t:'rlc',l:'https://www.udemy.com/course/comptia-a-core-1-220-1101-and-core-2-220-1102/',tx:'📚 Udemy – Professor Messer A+'},{t:'rlf',l:'https://www.professormesser.com/free-a-plus-training/220-1101/220-1101-video/220-1101-training-course/',tx:'🎥 Prof. Messer (Free)'}]},
  'cc-csp':{name:'ISC² CC + Cloud Practitioner Bundle',issuer:'ISC² (CC) + AWS/Azure · Entry combination',tier:'Entry (Tier 1–2)',tierClass:'tier-entry',domains:['Cloud'],tags:['Vendor-Neutral','Entry Combo','Cloud'],desc:'Strategic entry combination for cloud security careers: ISC² Certified in Cybersecurity (CC, free) paired with either AWS Cloud Practitioner or AZ-900. Together they signal cloud security intent to hiring managers without requiring deep experience.',links:[{t:'rlf',l:'https://www.isc2.org/certifications/cc',tx:'🔗 ISC² CC (Free)'},{t:'rlf',l:'https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/',tx:'🎥 AWS CCP Free Training'}]},
  'ewapt':{name:'INE eWAPT – Web Application Penetration Tester',issuer:'INE Security / eLearnSecurity · ~$400',tier:'Entry (Tier 1–2)',tierClass:'tier-entry',domains:['Offensive','AppSec'],tags:['Vendor-Specific','INE','Practical','Web App'],desc:'Fully practical web application penetration testing cert from INE Security. Covers OWASP Top 10, SQL injection, XSS, SSRF, and modern web exploitation. Lab-based exam — no multiple choice. A strong entry offensive credential.',links:[{t:'rlc',l:'https://ine.com/certifications/ewaptv2-certification/',tx:'📚 INE eWAPT Official'}]},
  'iso27001-a':{name:'ISO 27001 Foundation / Associate',issuer:'PECB / BSI · ~$350–$600',tier:'Entry (Tier 1–2)',tierClass:'tier-entry',domains:['GRC'],tags:['Vendor-Neutral','ISO 27001','GRC','Foundation'],desc:'Entry-level ISO 27001 credential. Covers the core concepts of an Information Security Management System (ISMS) based on ISO/IEC 27001. Ideal first step for GRC professionals before pursuing Lead Implementer or Lead Auditor.',links:[{t:'rlf',l:'https://pecb.com/en/education-and-certification-for-individuals/iso-iec-27001',tx:'🔗 PECB ISO 27001 Info'}]},
  'ace':{name:'AccessData Certified Examiner (ACE)',issuer:'Exterro (formerly AccessData) · FTK-based',tier:'Entry (Tier 1–2)',tierClass:'tier-entry',domains:['DFIR'],tags:['Vendor-Specific','Digital Forensics','FTK','AccessData'],desc:'Entry digital forensics certification for the FTK (Forensic Toolkit) platform. Covers forensic acquisition, file system analysis, email analysis, and basic artifact review. Widely recognized in law enforcement and corporate DFIR contexts.',links:[{t:'rlf',l:'https://www.exterro.com/forensics-training/',tx:'🔗 Exterro/FTK Training'}]},
  'gslc':{name:'GIAC Security Leadership (GSLC)',issuer:'GIAC/SANS · ~$979',tier:'Mid-Level (Tier 2–3)',tierClass:'tier-mid',domains:['GRC'],tags:['Vendor-Neutral','GIAC','SANS','Leadership'],desc:'SANS cert bridging technical security expertise and people management. Covers technical security controls, project management, security operations, and team leadership. Valuable for practitioners transitioning into security management.',links:[{t:'rlc',l:'https://www.giac.org/certifications/security-leadership-gslc/',tx:'🔗 GIAC GSLC Info'}]},
  'sc100':{name:'SC-100 – Microsoft Cybersecurity Architect',issuer:'Microsoft · Exam SC-100 · ~$165 · Expert-level',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['Security Eng.','Cloud'],tags:['Vendor-Specific','Microsoft','Expert-Level','Architecture'],desc:'Microsoft\'s expert-level security architecture credential. Requires prior SC-200, AZ-500, or SC-300. Covers Zero Trust strategy, governance, risk compliance, security operations architecture, and identity architecture across Azure and hybrid environments.',links:[{t:'rlf',l:'https://learn.microsoft.com/en-us/credentials/certifications/cybersecurity-architect-expert/',tx:'🎥 Microsoft Learn (Free)'},{t:'rlc',l:'https://www.udemy.com/course/sc-100-microsoft-cybersecurity-architect/',tx:'📚 Udemy – SC-100 Course'}]},
  'gced':{name:'GIAC Certified Enterprise Defender (GCED)',issuer:'GIAC/SANS · ~$979',tier:'Mid-Level (Tier 2–3)',tierClass:'tier-mid',domains:['Security Eng.'],tags:['Vendor-Neutral','GIAC','SANS','Enterprise'],desc:'SANS cert for security engineers and defenders. Covers network defense, endpoint security, hardening techniques, and defensive security architecture. Practical focus on building and maintaining enterprise defenses.',links:[{t:'rlc',l:'https://www.giac.org/certifications/certified-enterprise-defender-gced/',tx:'🔗 GIAC GCED Info'}]},
  'gnfa':{name:'GIAC Network Forensic Analyst (GNFA)',issuer:'GIAC/SANS · ~$979',tier:'Mid-Level (Tier 2–3)',tierClass:'tier-mid',domains:['DFIR'],tags:['Vendor-Neutral','GIAC','SANS','Network Forensics'],desc:'SANS cert covering network traffic analysis, deep packet inspection, and network artifact forensics. Uses Wireshark, Zeek/Bro, and NetworkMiner. Valuable for incident response and threat hunting roles requiring network evidence analysis.',links:[{t:'rlc',l:'https://www.giac.org/certifications/network-forensic-analyst-gnfa/',tx:'🔗 GIAC GNFA Info'}]},
  'ghas':{name:'GitHub Advanced Security (GHAS)',issuer:'GitHub · Exam · ~$200',tier:'Mid-Level (Tier 2–3)',tierClass:'tier-mid',domains:['AppSec'],tags:['Vendor-Specific','GitHub','DevSecOps','CI/CD'],desc:'GitHub\'s DevSecOps certification covering code scanning (CodeQL), secret scanning, dependency review, and supply chain security in CI/CD pipelines. Essential for AppSec engineers working in GitHub Enterprise environments.',links:[{t:'rlf',l:'https://education.github.com/experiences/github_advanced_security',tx:'🔗 GitHub Advanced Security'},{t:'rlf',l:'https://resources.github.com/security/advanced-security/',tx:'🎥 GitHub Security Docs (Free)'}]},
  'ecppt':{name:'INE eCPPT – Certified Professional Penetration Tester',issuer:'INE Security · ~$400 · Practical exam',tier:'Mid-Level (Tier 2–3)',tierClass:'tier-mid',domains:['Offensive'],tags:['Vendor-Specific','INE','Practical','Network Pentesting'],desc:'INE\'s advanced penetration testing credential. Covers full network penetration testing methodology, web application attacks, privilege escalation, lateral movement, and professional report writing. Strong stepping stone to OSCP.',links:[{t:'rlc',l:'https://ine.com/certifications/ecppt-certification/',tx:'📚 INE eCPPT Official'}]},
  'crea':{name:'CREA – Certified Reverse Engineering Analyst',issuer:'Mile2 / Various providers · Entry-level',tier:'Mid-Level (Tier 2–3)',tierClass:'tier-mid',domains:['DFIR'],tags:['Vendor-Neutral','Reverse Engineering','Malware Analysis'],desc:'Foundational reverse engineering credential. Covers assembly language basics, static and dynamic malware analysis, and use of disassembly tools. Good entry point before pursuing GREM for those entering the malware analysis track.',links:[{t:'rlf',l:'https://www.mile2.com/certified-reverse-engineering-analyst-crea/',tx:'🔗 CREA Cert Info'}]},
  'gstrt':{name:'GIAC Strategic Planning, Policy & Leadership (GSTRT)',issuer:'GIAC/SANS · ~$979',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['GRC'],tags:['Vendor-Neutral','GIAC','SANS','Leadership','Policy'],desc:'SANS cert covering security strategy, policy development, security program management, and leadership skills. Valuable for security managers, directors, and GRC professionals developing organizational security programs.',links:[{t:'rlc',l:'https://www.giac.org/certifications/strategic-planning-policy-leadership-gstrt/',tx:'🔗 GIAC GSTRT Info'}]},
  'sailpoint':{name:'SailPoint Certified Identity Professional',issuer:'SailPoint · Vendor certification · Tiered',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['IAM'],tags:['Vendor-Specific','SailPoint','IGA','Identity Governance'],desc:'SailPoint IIQ/IdentityNow platform certification for Identity Governance and Administration (IGA) implementation and administration. SailPoint is the market leader in enterprise IGA solutions. Strong demand in large enterprises.',links:[{t:'rlf',l:'https://university.sailpoint.com/',tx:'🔗 SailPoint University'}]},
  'gicsp':{name:'GIAC Industrial Cyber Security Professional (GICSP)',issuer:'GIAC/SANS · ~$979',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['Security Eng.'],tags:['Vendor-Neutral','GIAC','SANS','ICS','OT Security'],desc:'SANS cert specifically for ICS/OT/SCADA security professionals. Covers industrial protocols, ICS architecture, cyber-physical security, and defense strategies for energy, utilities, and manufacturing environments. High demand in critical infrastructure sectors.',links:[{t:'rlc',l:'https://www.giac.org/certifications/industrial-cyber-security-professional-gicsp/',tx:'🔗 GIAC GICSP Info'}]},
  'ccsk':{name:'CCSK – Certificate of Cloud Security Knowledge',issuer:'Cloud Security Alliance · ~$395 · Self-paced',tier:'Mid-Level (Tier 2–3)',tierClass:'tier-mid',domains:['Cloud'],tags:['Vendor-Neutral','CSA','Cloud Security','Foundation'],desc:'Cloud Security Alliance\'s foundational vendor-neutral cloud security certification. Covers the CSA Cloud Controls Matrix, security architecture, identity management, and data security. Good stepping stone to CCSP. Open-book 90-question exam.',links:[{t:'rlf',l:'https://cloudsecurityalliance.org/education/ccsk/',tx:'🔗 CSA CCSK Official'}]},
  'case':{name:'EC-Council CASE – Certified Application Security Engineer',issuer:'EC-Council · Java or .NET track · ~$400',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['AppSec'],tags:['Vendor-Neutral','EC-Council','Application Security','SDLC'],desc:'Application security engineering cert covering threat modeling, secure code review, SAST/DAST, secure SDLC, and penetration testing fundamentals for Java or .NET environments. Complements PNPT or eWAPT for AppSec roles.',links:[{t:'rlf',l:'https://www.eccouncil.org/train-certify/certified-application-security-engineer-case/',tx:'🔗 EC-Council CASE Info'}]},
  'iso-li':{name:'ISO 27001 Lead Implementer',issuer:'PECB / BSI · ~$1,500–$2,000',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['GRC'],tags:['Vendor-Neutral','ISO 27001','Implementation','Compliance'],desc:'Validates expertise in designing, implementing, and managing an ISO/IEC 27001 ISMS. Distinct from Lead Auditor. Required for senior GRC consulting, Head of Compliance, and Information Security Manager roles at global enterprises.',links:[{t:'rlc',l:'https://www.udemy.com/course/iso-27001-lead-implementer-preparation-course/',tx:'📚 Udemy – ISO 27001 Lead Impl.'}]},
  'cgeit':{name:'ISACA CGEIT – Certified in Governance of Enterprise IT',issuer:'ISACA · ~$575 members · 5yr exp required',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['GRC'],tags:['Vendor-Neutral','ISACA','IT Governance','Enterprise'],desc:'ISACA\'s IT governance credential. Covers governance frameworks, strategic alignment, value delivery, and risk management from an enterprise IT perspective. Valued for GRC Director, VP of Security, and CISO-track professionals.',links:[{t:'rlf',l:'https://www.isaca.org/credentialing/cgeit',tx:'🔗 ISACA CGEIT Info'}]},
  'gcfa-adv':{name:'GCFA + Memory Forensics Specialization',issuer:'GIAC/SANS · GCFA + FOR508',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['DFIR'],tags:['Vendor-Neutral','GIAC','SANS','Memory Forensics','Advanced'],desc:'Senior DFIR specialization path combining GCFA certification with deep Volatility/memory forensics expertise. Covers enterprise-scale incident response, timeline analysis, anti-forensics, and advanced persistent threat investigations.',links:[{t:'rlc',l:'https://www.sans.org/cyber-security-courses/advanced-incident-response-threat-hunting-training/',tx:'📚 SANS FOR508 (GCFA prep)'},{t:'rlf',l:'https://github.com/volatilityfoundation/volatility3',tx:'🆓 Volatility3 (Free)'}]},
  'mcfe':{name:'Magnet Forensics MCFE – Certified Forensics Examiner',issuer:'Magnet Forensics · Vendor certification',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['DFIR'],tags:['Vendor-Specific','Magnet Forensics','Digital Forensics','Investigation'],desc:'Magnet Forensics Axiom platform certification. Covers forensic acquisition, artifact analysis, mobile device forensics, and report generation using Magnet tools. Valued in enterprise DFIR, law enforcement, and e-discovery roles.',links:[{t:'rlf',l:'https://www.magnetforensics.com/training/',tx:'🔗 Magnet Forensics Training'}]},
  'osed':{name:'OSED – OffSec Exploit Developer',issuer:'Offensive Security · EXP-301 · ~$1,499 · 48hr exam',tier:'Principal (Tier 4–5)',tierClass:'tier-principal',domains:['Offensive'],tags:['Vendor-Neutral','OffSec','Exploit Dev','Windows'],desc:'OffSec\'s Windows exploit development certification. Covers buffer overflows, SEH exploitation, heap sprays, egghunters, and format string attacks. One of three certs required for OSCE3. Extremely demanding hands-on exam.',links:[{t:'rlf',l:'https://www.offsec.com/courses/exp-301/',tx:'🔗 OffSec OSED Official'}]},
  'cissp-issmp':{name:'CISSP-ISSMP – Information Security Management Professional',issuer:'ISC² · Requires active CISSP',tier:'Principal (Tier 4–5)',tierClass:'tier-principal',domains:['GRC'],tags:['Vendor-Neutral','ISC²','CISSP Concentration','Management'],desc:'CISSP concentration for security program managers and CISO-track professionals. Focuses on leadership, project management, risk management, and aligning security programs with business objectives. Renewed with CISSP CPE credits.',links:[{t:'rlf',l:'https://www.isc2.org/Certifications/CISSP-Concentrations',tx:'🔗 ISC² Official Info'}]},
  'cism-crisc':{name:'CISM + CRISC – Management & Risk Dual Path',issuer:'ISACA · Combined credential path',tier:'Principal (Tier 4–5)',tierClass:'tier-principal',domains:['GRC'],tags:['Vendor-Neutral','ISACA','Management','Risk Management'],desc:'ISACA\'s premier dual-credential path: CISM for security management combined with CRISC for risk management. The standard executive preparation track in GRC-heavy organizations. Positions holders for CISO, Director of Risk, and VP of Security roles.',links:[{t:'rlf',l:'https://www.isaca.org/credentialing/cism',tx:'🔗 ISACA CISM Info'},{t:'rlf',l:'https://www.isaca.org/credentialing/crisc',tx:'🔗 ISACA CRISC Info'}]},
  'ciam-adv':{name:'CIAM Advanced – Identity Management Leadership',issuer:'Identity Management Institute · Advanced level',tier:'Principal (Tier 4–5)',tierClass:'tier-principal',domains:['IAM'],tags:['Vendor-Neutral','IAM','Leadership','Enterprise'],desc:'Advanced IAM leadership and architecture certification from the Identity Management Institute. Covers enterprise IAM program management, Zero Trust identity strategy, advanced IGA governance, and executive reporting for identity programs.',links:[{t:'rlf',l:'https://www.identitymanagementinstitute.org/',tx:'🔗 IMI Official'}]},
  'gsom':{name:'GIAC Security Operations Manager (GSOM)',issuer:'GIAC/SANS · ~$979',tier:'Principal (Tier 4–5)',tierClass:'tier-principal',domains:['SOC'],tags:['Vendor-Neutral','GIAC','SANS','SOC Management'],desc:'SANS credential for SOC managers and leaders. Covers metrics and measurement, SOC team management, process improvement, tool selection, and executive-level reporting. Designed for those managing security operations teams.',links:[{t:'rlc',l:'https://www.giac.org/certifications/security-operations-manager-gsom/',tx:'🔗 GIAC GSOM Info'}]},
  'aws-pro':{name:'AWS Solutions Architect Professional',issuer:'Amazon Web Services · Exam SAP-C02 · ~$300',tier:'Principal (Tier 4–5)',tierClass:'tier-principal',domains:['Cloud'],tags:['Vendor-Specific','AWS','Advanced Architecture'],desc:'The most advanced AWS architecture certification. Covers complex, multi-account, enterprise-scale architectures including security, migration, and cost optimization. Requires SAA-C03 and 2+ years of hands-on AWS experience.',links:[{t:'rlc',l:'https://www.udemy.com/course/aws-solutions-architect-professional/',tx:'📚 Udemy – AWS Pro Arch'},{t:'rlf',l:'https://aws.amazon.com/certification/certified-solutions-architect-professional/',tx:'🔗 AWS Official'}]},
  'ccsp-plus':{name:'CCSP + Cloud Security Specialty',issuer:'ISC² + AWS/Azure/Google · Combined path',tier:'Principal (Tier 4–5)',tierClass:'tier-principal',domains:['Cloud'],tags:['Vendor-Neutral','ISC²','Cloud Security','Combined'],desc:'The industry-standard senior cloud security combination: CCSP (vendor-neutral, ISC²) paired with a cloud provider specialty cert (AWS SCS-C02, AZ-500, or GCP Security). Together they signal both architectural breadth and vendor depth.',links:[{t:'rlf',l:'https://www.isc2.org/Certifications/CCSP',tx:'🔗 ISC² CCSP Info'}]},
  'csslp-gweb':{name:'CSSLP + GWEB – Senior AppSec Path',issuer:'ISC² (CSSLP) + GIAC (GWEB) · Combined',tier:'Principal (Tier 4–5)',tierClass:'tier-principal',domains:['AppSec'],tags:['Vendor-Neutral','Combined Path','SDLC Governance','Web Security'],desc:'Senior AppSec specialization combining CSSLP (ISC² SDLC governance) with GWEB (SANS/GIAC web application security). Together they provide both the program management and technical depth expected at Staff AppSec Engineer or Principal roles.',links:[{t:'rlf',l:'https://www.isc2.org/Certifications/CSSLP',tx:'🔗 ISC² CSSLP Info'},{t:'rlf',l:'https://www.giac.org/certifications/web-application-defender-gweb/',tx:'🔗 GIAC GWEB Info'}]},
  'oswe':{name:'OSWE – OffSec Web Expert',issuer:'Offensive Security · WEB-300 · ~$1,499 · 48hr exam',tier:'Principal (Tier 4–5)',tierClass:'tier-principal',domains:['AppSec','Offensive'],tags:['Vendor-Neutral','OffSec','White-box','Web Exploitation'],desc:'OffSec\'s advanced web application security certification. White-box testing approach — you have source code access. Covers custom exploit development, authentication bypasses, and chaining web vulnerabilities. One of three certs for OSCE3.',links:[{t:'rlf',l:'https://www.offsec.com/courses/web-300/',tx:'🔗 OffSec OSWE Official'}]},
  'crtl':{name:'CRTL – OffSec Red Team Lead',issuer:'Offensive Security · RTL-100 · Lab-based',tier:'Principal (Tier 4–5)',tierClass:'tier-principal',domains:['Offensive'],tags:['Vendor-Neutral','OffSec','Red Team','Leadership'],desc:'OffSec\'s red team leadership certification. Covers enterprise red team operations, purple teaming methodology, C2 infrastructure management, and red team program development. For experienced red teamers moving into leadership roles.',links:[{t:'rlf',l:'https://www.offsec.com/courses/rtl-100/',tx:'🔗 OffSec CRTL Official'}]},
  'cipt':{name:'IAPP CIPT – Certified Information Privacy Technologist',issuer:'IAPP · Exam ~$550',tier:'Principal (Tier 4–5)',tierClass:'tier-principal',domains:['GRC'],tags:['Vendor-Neutral','Privacy','IAPP','Technical Privacy'],desc:'IAPP\'s technical privacy credential. Covers Privacy by Design (PbD), privacy-enhancing technologies (PETs), data architecture, and technical compliance implementation. Designed for GRC architects, security engineers, and technical privacy professionals.',links:[{t:'rlf',l:'https://iapp.org/certify/cipt/',tx:'🔗 IAPP CIPT Info'}]},
  'cgrc':{name:'ISC² CGRC – Certified in Governance, Risk & Compliance',issuer:'ISC² · Exam ~$599 · Formerly CAP',tier:'Principal (Tier 4–5)',tierClass:'tier-principal',domains:['GRC'],tags:['Vendor-Neutral','ISC²','RMF','FedRAMP'],desc:'ISC² credential (formerly the Certified Authorization Professional/CAP) for Risk Management Framework (RMF) and ATO processes. Essential for GRC practitioners in federal government, defense contractors, and FedRAMP-compliant environments.',links:[{t:'rlf',l:'https://www.isc2.org/Certifications/CGRC',tx:'🔗 ISC² CGRC Info'}]},
  'nacd':{name:'NACD Cyber-Risk Oversight Certificate',issuer:'National Association of Corporate Directors · ~$1,000',tier:'Executive (Tier 5–6)',tierClass:'tier-exec',domains:['GRC'],tags:['Executive','Board-Level','Governance','Risk Oversight'],desc:'Non-technical strategic certification for CISOs who present to boards and for board members overseeing cyber risk. Covers board-level cyber risk governance, regulatory expectations, and communicating security risk in business terms.',links:[{t:'rlf',l:'https://www.nacdonline.org/education-and-research/courses/cybersecurity/',tx:'🔗 NACD Cybersecurity Program'}]},
  'cams':{name:'CAMS – Certified Anti-Money Laundering Specialist',issuer:'ACAMS · ~$1,195 · 3–5yr exp preferred',tier:'Executive (Tier 5–6)',tierClass:'tier-exec',domains:['GRC'],tags:['Executive','Financial Services','AML','Compliance'],desc:'The gold standard AML/financial crimes compliance credential. Relevant for IAM and GRC executives in banking and financial services — especially where regulatory identity verification, KYC/AML programs, and transaction monitoring intersect with security.',links:[{t:'rlf',l:'https://www.acams.org/en/certifications/cams',tx:'🔗 ACAMS CAMS Info'}]},
  'gse':{name:'GIAC Security Expert (GSE)',issuer:'GIAC/SANS · Written + Hands-on Lab · Invitation-controlled',tier:'Principal (Tier 4–5)',tierClass:'tier-principal',domains:['All Domains'],tags:['Vendor-Neutral','GIAC','Elite','Fewer than 300 Holders'],desc:'The most prestigious GIAC certification. Requires passing a written exam AND a grueling hands-on lab exam. Fewer than 300 holders worldwide. Demonstrates mastery across multiple security domains. One of the most difficult credentials in the industry to earn.',links:[{t:'rlf',l:'https://www.giac.org/certifications/security-expert-gse/',tx:'🔗 GIAC GSE Official'}]},
  'csa-star':{name:'CSA STAR + CCSP – Cloud Program Leadership',issuer:'Cloud Security Alliance + ISC²',tier:'Executive (Tier 5–6)',tierClass:'tier-exec',domains:['Cloud'],tags:['Executive','Cloud Security','Program Leadership'],desc:'Cloud security program leadership combination: CSA STAR certification (organizational cloud assurance) awareness combined with CCSP (personal vendor-neutral cloud security expertise). For cloud security program executives overseeing multi-cloud compliance.',links:[{t:'rlf',l:'https://cloudsecurityalliance.org/star/',tx:'🔗 CSA STAR Program'}]},
  'csslp-m':{name:'CSSLP + Software Security Program Leadership',issuer:'ISC² CSSLP + SANS GWEB/MGT · Senior track',tier:'Executive (Tier 5–6)',tierClass:'tier-exec',domains:['AppSec'],tags:['Executive','AppSec Program','SDLC Governance'],desc:'Senior AppSec program leadership track combining CSSLP (ISC² SDLC governance), GWEB (SANS web security), and SANS security management courses. For principals and executives running software security programs at scale.',links:[{t:'rlf',l:'https://www.isc2.org/Certifications/CSSLP',tx:'🔗 ISC² CSSLP Info'}]},
  'gxpn':{name:'GIAC Exploit Researcher & Advanced Penetration Tester (GXPN)',issuer:'GIAC/SANS · ~$979 · SEC660 prep course',tier:'Executive (Tier 5–6)',tierClass:'tier-exec',domains:['Offensive'],tags:['Vendor-Neutral','GIAC','SANS','Elite','Exploit Dev'],desc:'SANS\'s most advanced offensive credential. Covers exploit development, kernel and user-mode exploits, advanced network attacks, cryptographic attacks, and fuzzing. Prep course is SANS SEC660. One of the most technically demanding offensive certs.',links:[{t:'rlc',l:'https://www.sans.org/cyber-security-courses/advanced-penetration-testing-exploits-ethical-hacking/',tx:'📚 SANS SEC660 (GXPN prep)'}]},
  'fip':{name:'IAPP FIP – Fellow of Information Privacy',issuer:'IAPP · Application-based · ~$695',tier:'Executive (Tier 5–6)',tierClass:'tier-exec',domains:['GRC'],tags:['Vendor-Neutral','IAPP','Privacy','Fellowship'],desc:'The highest designation awarded by the IAPP. Recognizes senior privacy executives who have demonstrated significant contributions to the privacy field. Application-based process requiring active privacy management certification and demonstrated experience.',links:[{t:'rlf',l:'https://iapp.org/certify/fip/',tx:'🔗 IAPP FIP Program'}]},
  'cimp':{name:'CIMP – Certified Identity Management Professional',issuer:'Identity Management Institute · ~$395',tier:'Mid-Level (Tier 2–3)',tierClass:'tier-mid',domains:['IAM'],tags:['Vendor-Neutral','IAM','Identity Management','IMI'],desc:'Mid-level IAM credential from the Identity Management Institute. Covers identity lifecycle management, provisioning/deprovisioning, role management, and compliance. Specifically designed for IAM practitioners in governance-heavy environments.',links:[{t:'rlf',l:'https://www.identitymanagementinstitute.org/cimp/',tx:'🔗 IMI CIMP Info'}]},
  'cige':{name:'CIGE – Certified Identity Governance Expert',issuer:'Identity Management Institute · ~$495',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['IAM'],tags:['Vendor-Neutral','IAM','IGA','Governance'],desc:'Advanced IAM governance credential from IMI. Covers identity governance and administration (IGA), access certification, separation of duties (SoD), and policy enforcement. Designed for senior IAM engineers moving into governance leadership roles.',links:[{t:'rlf',l:'https://www.identitymanagementinstitute.org/cige/',tx:'🔗 IMI CIGE Info'}]},
  'sc401':{name:'SC-401 – Microsoft Information Protection Administrator',issuer:'Microsoft · Exam SC-401 · ~$165',tier:'Mid-Level (Tier 2–3)',tierClass:'tier-mid',domains:['GRC','Cloud'],tags:['Vendor-Specific','Microsoft','Data Protection','Purview'],desc:'Microsoft\'s data protection and compliance administrator cert. Covers Microsoft Purview, sensitivity labels, data loss prevention (DLP), insider risk management, and information barriers. Essential for GRC roles in Microsoft 365 environments.',links:[{t:'rlf',l:'https://learn.microsoft.com/en-us/credentials/certifications/information-protection-administrator/',tx:'🎥 Microsoft Learn (Free)'}]},
  'ccna-sec':{name:'Cisco CCNA Security / CyberOps',issuer:'Cisco · CyberOps Associate · ~$330',tier:'Entry (Tier 1–2)',tierClass:'tier-entry',domains:['SOC','Security Eng.'],tags:['Vendor-Specific','Cisco','Networking','SOC'],desc:'Cisco\'s entry-level security certification for network security and SOC roles. CyberOps Associate covers monitoring, detection, analysis, and response workflows in a SOC environment. Strong for candidates in Cisco-heavy network environments.',links:[{t:'rlf',l:'https://www.cisco.com/c/en/us/training-events/training-certifications/certifications/associate/ccna-cyberops.html',tx:'🔗 Cisco CyberOps Associate'}]},
  'ccnp-sec':{name:'Cisco CCNP Security',issuer:'Cisco · Professional level · ~$400 core + $300 concentration',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['Security Eng.'],tags:['Vendor-Specific','Cisco','Network Security','Professional'],desc:'Cisco\'s professional-level network security certification. Core exam covers security architecture, network security, content security, endpoint protection, and secure network access. Concentration exams available in SISE (ISE), SVPN, SNCF, and SAUTO.',links:[{t:'rlf',l:'https://www.cisco.com/c/en/us/training-events/training-certifications/certifications/professional/ccnp-security.html',tx:'🔗 Cisco CCNP Security'}]},
  'cks':{name:'CKS – Certified Kubernetes Security Specialist',issuer:'CNCF / Linux Foundation · ~$395 · Hands-on exam',tier:'Senior (Tier 3–4)',tierClass:'tier-senior',domains:['Cloud'],tags:['Vendor-Neutral','CNCF','Kubernetes','Container Security'],desc:'Linux Foundation\'s hands-on Kubernetes security certification. Covers cluster hardening, system hardening, minimizing microservice vulnerabilities, supply chain security, and runtime security with Falco. Requires active CKA (Kubernetes Administrator) cert.',links:[{t:'rlf',l:'https://training.linuxfoundation.org/certification/certified-kubernetes-security-specialist/',tx:'🔗 CNCF CKS Official'}]},
  'sc300':{name:'SC-300 – Identity & Access Administrator',issuer:'Microsoft · Exam SC-300 · ~$165',tier:'Mid-Level (Tier 2–3)',tierClass:'tier-mid',domains:['IAM'],tags:['IAM Track','Microsoft','Entra ID'],desc:'Most in-demand IAM cert. Covers SSO, conditional access, PIM, identity governance, and entitlement management in Entra ID. Essential for IAM Engineer roles in Microsoft environments.',links:[{t:'rlc',l:'https://www.udemy.com/course/sc-300-microsoft-identity-and-access-administrator/',tx:'📚 Udemy – SC-300 Course'},{t:'rlf',l:'https://learn.microsoft.com/en-us/credentials/certifications/identity-and-access-administrator/',tx:'🎥 Microsoft Learn (Free)'}]}
};

// ── CERTS Aliases (HTML badge IDs → canonical CERTS key) ──
CERTS['cc']=CERTS['isc2-cc'];
CERTS['itil4']=CERTS['itil'];
CERTS['cipp-us']=CERTS['cipp'];
CERTS['cco']=CERTS['cellebrite'];
CERTS['securityx']=CERTS['casp'];
CERTS['ca-defender']=CERTS['cyberark-def'];
CERTS['ca-sentry']=CERTS['cyberark-sen'];
CERTS['ca-guardian']=CERTS['cyberark-guard'];
CERTS['cysa-plus']=CERTS['cysa'];
CERTS['splunk-cu']=CERTS['splunk-core'];
CERTS['splunk-esa']=CERTS['splunk-es'];
CERTS['iso-la']=CERTS['iso27001-la'];
CERTS['iso-li']=CERTS['iso27001'];
CERTS['gweb-a']=CERTS['gweb'];
CERTS['sabsa-scf']=CERTS['sabsa'];

// Tier→Ladder mapping
var TIER_TO_LADDER={
  'Entry (Tier 1–2)':'Tier 1–2: Entry Level / Early Career (0–3 yrs exp)',
  'Mid-Level (Tier 2–3)':'Tier 2–3: Early Career / Domain Specialist (2–6 yrs exp)',
  'Senior (Tier 3–4)':'Tier 3–4: Domain Specialist / Senior IC (5–10 yrs exp)',
  'Mid-Level / Senior':'Tier 2–4: Mid through Senior levels',
  'Senior / Principal':'Tier 3–5: Senior through Principal IC',
  'Principal (Tier 4–5)':'Tier 4–5: Senior / Principal IC (10–15 yrs exp)',
  'Principal / Executive':'Tier 5–6: Principal IC / Executive (12+ yrs exp)',
  'Executive (Tier 5–6)':'Tier 5–6: Executive / C-Suite (15+ yrs exp)'
};

function openCert(id){
  var c=CERTS[id];
  if(!c)return;
  var panel=document.getElementById('cert-detail-panel');
  var inner=document.getElementById('cert-detail-inner');
  var tags=c.tags.map(function(t){return '<span class="cd-tag">'+t+'</span>';}).join('');
  var links=c.links.map(function(l){return '<a class="rl '+l.t+'" href="'+l.l+'" target="_blank" rel="noopener">'+l.tx+'</a>';}).join('');
  var tierColor={entry:'var(--gn)',mid:'var(--lb)',senior:'#7cb3ff',principal:'var(--db)',exec:'#c084fc'};
  var tcls=c.tierClass.replace('tier-','');
  var col=tierColor[tcls]||'var(--tx)';
  var ladderNote=TIER_TO_LADDER[c.tier]||c.tier;
  inner.innerHTML='<div class="cd-top">'
    +'<div><div class="cd-name">'+c.name+'</div>'
    +'<div class="cd-issuer">'+c.issuer+'</div>'
    +'<div class="cd-tags"><span class="cd-tag" style="background:rgba(59,130,246,.09);color:'+col+';">'+c.tier+'</span>'+tags+'</div></div>'
    +'</div>'
    +'<div class="cd-desc">'+c.desc+'</div>'
    +'<div class="cd-ladder-link" onclick="showPage(\'ladder\')" title="Go to Career Ladder">🪜 Career Ladder Position: '+ladderNote+'</div>'
    +'<div class="cd-res-label">Study Resources</div>'
    +'<div class="rlinks">'+links+'</div>'
    +'<p class="affn" style="margin-top:10px;">★ Course and book links may be affiliate links.</p>';
  panel.classList.add('open');
  setTimeout(function(){
    var rect=panel.getBoundingClientRect();
    var target=window.pageYOffset+rect.top-80;
    window.scrollTo({top:Math.max(0,target),behavior:'smooth'});
  },60);
}

function closeCert(){document.getElementById('cert-detail-panel').classList.remove('open');}


// ══════════════════════ DOMAIN DATA ══════════════════════
var D={
iam:{icon:'🔐',name:'Identity & Access Management',tag:'Who has access to what — and proving it',salary:'$100K–$185K',hot:'PAM / Privileged Access',fit:['Detail-oriented','Process-minded','Enjoys auditing','Works well cross-functionally'],no:'Prefer fast-paced incident response work',
overview:'IAM is one of the highest-demand and most recession-proof cybersecurity domains. Every organization needs someone to manage who can access what — and enforce that policy at scale. IAM engineers own directory services, single sign-on, multi-factor authentication, privileged access management (PAM), and identity governance. With Zero Trust architectures becoming standard, IAM engineers are now central to every major security transformation.',
jobs:[{t:'IAM Engineer',s:'$100K–$135K',c:'#22d3ee',d:'Configures and maintains identity platforms like Okta, Entra ID, or Ping. Builds SSO integrations, MFA policies, and access provisioning workflows.'},{t:'PAM Engineer',s:'$110K–$145K',c:'#22d3ee',d:'Deploys and manages PAM tools like CyberArk, BeyondTrust, or Delinea. Vaults credentials, enforces just-in-time access.'},{t:'Senior IAM Engineer',s:'$135K–$175K',c:'#22d3ee',d:'Leads IAM platform ownership. Designs Zero Trust access models, mentors juniors, drives tool consolidation.'},{t:'IAM Architect',s:'$155K–$210K',c:'#22d3ee',d:'Designs enterprise-wide identity architecture. Leads Zero Trust roadmap, evaluates new platforms.'},{t:'Dir. of Identity Engineering',s:'$180K–$240K',c:'#f97316',d:'Leads the IAM team. Owns headcount, budget, and 3-year strategy. Reports to CISO.'}],
skills:['Active Directory / Entra ID','Okta / Ping Identity / SailPoint','CyberArk / BeyondTrust / Delinea','SAML 2.0 / OAuth 2.0 / OIDC','SCIM provisioning','Privileged Access Management','Identity Governance & Administration','Zero Trust architecture','PowerShell / Python scripting','RBAC / ABAC policy design'],
tools:['CyberArk PAS','BeyondTrust Password Safe','Okta Workflows','SailPoint IdentityNow','Microsoft Entra ID','Ping Identity','HashiCorp Vault','AD Explorer','BloodHound'],
certs:[{n:'SC-300 – Identity & Access Administrator',i:'Microsoft · Entra ID focused',d:'Most in-demand IAM cert. Covers SSO, conditional access, PIM, identity governance.',links:[{t:'rlc',l:'https://www.udemy.com/course/sc-300-microsoft-identity-and-access-administrator/',tx:'📚 Udemy SC-300'},{t:'rlf',l:'https://learn.microsoft.com/en-us/credentials/certifications/identity-and-access-administrator/',tx:'🎥 MS Learn (Free)'}]},{n:'CyberArk Trustee → Defender → Sentry',i:'CyberArk · PAM vendor certs',d:'Three-step progression. Trustee free. Defender & Sentry via Pearson VUE ~$200 each.',links:[{t:'rlf',l:'https://university.cyberark.com/',tx:'🎥 CyberArk University (Free)'},{t:'rlc',l:'https://www.udemy.com/course/cyberark-defender-certification-prep/',tx:'📚 Udemy Defender Prep'}]},{n:'Okta Certified Professional → Administrator',i:'Okta · Hands-on OIE Exam',d:'Two-step path. Professional first, then Administrator.',links:[{t:'rlf',l:'https://www.okta.com/learn/',tx:'🎥 Okta Training Portal'},{t:'rlc',l:'https://www.udemy.com/course/okta-certification-training/',tx:'📚 Udemy Okta Admin'}]}],
day:'Your day as an IAM Engineer: 9 AM stand-up with the security team. A developer needs access to a production database — you review the ticket, check their role, and provision just-in-time access via CyberArk. A user is locked out of their Okta account — quick fix. Then you spend the afternoon building a new conditional access policy to block legacy authentication protocols. At 4 PM, you review a SailPoint certification campaign to validate that 200 employees still need their current access rights.',
steps:['Get CompTIA Security+ and basic networking down — understanding of authentication protocols is essential.','Stand up a home lab: free Azure tenant with Entra ID, install the free tier of CyberArk or use a BeyondTrust trial.','Get SC-300 certified — this is the #1 hiring signal for IAM Engineer roles.','Target IAM Administrator (Tier 2) roles at mid-size companies.','Pursue CyberArk Defender or Okta Administrator once employed — vendor certs multiply your value significantly.','Progress to Senior IAM Engineer or IAM Architect. At $155K–$210K, IAM Architects are among the highest-paid Individual Contributors in cybersecurity.']
},
soc:{icon:'🛡️',name:'Security Operations (SOC)',tag:'Detect, respond, and contain threats — 24/7',salary:'$100K–$220K',hot:'Detection Engineering',fit:['Analytical mindset','Thrives under pressure','Curious about attacker TTPs','Shift-work tolerant at entry'],no:'Prefer planning over real-time response',
overview:'The SOC is the frontline of defense. SOC analysts monitor security tools, investigate alerts, and respond to incidents around the clock. Detection Engineers build the logic that makes the SOC effective. Threat Hunters proactively search for compromises the tools missed. At senior levels, Detection Engineer is the highest-paid IC role in the SOC domain, with a salary range of $146K–$219K in 2025.',
jobs:[{t:'SOC Analyst (Tier 1)',s:'$60K–$85K',c:'#f97316',d:'Monitors SIEM alerts, triages incidents, escalates confirmed threats. Shift work common.'},{t:'SOC Analyst (Tier 2)',s:'$85K–$115K',c:'#f97316',d:'Investigates escalated incidents, performs deeper log analysis, contains confirmed compromises.'},{t:'Incident Responder',s:'$100K–$145K',c:'#f97316',d:'Leads active incident investigations. Coordinates containment, eradication, and recovery.'},{t:'Detection Engineer',s:'$120K–$165K',c:'#f97316',d:'Builds detection logic, SIEM rules, Sigma signatures, and YARA rules. Highest-demand senior SOC IC role.'},{t:'Threat Hunter',s:'$115K–$160K',c:'#f97316',d:'Proactively hunts for threats not caught by automated tools using hypothesis-driven analysis.'}],
skills:['SIEM (Splunk, Microsoft Sentinel, IBM QRadar)','Incident response lifecycle','MITRE ATT&CK framework','Sigma / YARA rule writing','EDR investigation (CrowdStrike, SentinelOne)','Network traffic analysis (Wireshark, Zeek)','Log analysis (Windows Event Logs, Sysmon)','Threat intelligence consumption','KQL / SPL query languages','Python for automation'],
tools:['Splunk SIEM','Microsoft Sentinel','CrowdStrike Falcon','SentinelOne','Wireshark','Velociraptor','TheHive','MISP','Sigma / YARA','Elastic Security'],
certs:[{n:'CompTIA CySA+',i:'CompTIA · Exam CS0-003 · DoD 8140',d:'Best intermediate cert for SOC analysts. Covers behavioral analytics and SIEM workflows.',links:[{t:'rlc',l:'https://www.udemy.com/course/comptiacysa/',tx:'📚 Udemy CySA+'},{t:'rlb',l:'https://www.amazon.com/CompTIA-CySA-Study-Guide-CS0-003/dp/1394182694/',tx:'📖 Mike Chapple Study Guide'}]},{n:'BTL1 / BTL2',i:'Security Blue Team · Hands-on Lab Exams',d:'Practical scenario-based blue team certs. BTL1: SOC fundamentals. BTL2: advanced IR and threat hunting.',links:[{t:'rlf',l:'https://blueteamlabs.online/',tx:'🆓 Free Practice Labs'},{t:'rlc',l:'https://www.securityblue.team/',tx:'📚 Security Blue Team'}]},{n:'GCIH',i:'GIAC / SANS · Incident Handler',d:'Gold standard for senior SOC and IR professionals.',links:[{t:'rlc',l:'https://www.sans.org/cyber-security-courses/hacker-techniques-incident-handling/',tx:'📚 SANS SEC504'},{t:'rlf',l:'https://www.cyberdefenders.org/',tx:'🆓 CyberDefenders (Free)'}]}],
day:'Your day as a Detection Engineer: Pull your Slack to see a colleague flagged a false-positive storm in production overnight. You review the alert logic, find the triggering condition is too broad, and write an updated Sigma rule. In the afternoon, you analyze a new threat intel report on a ransomware group targeting your industry, extract relevant TTPs, and write three new detections. You test them in a dev SIEM tenant before pushing to production.',
steps:['Start with CompTIA Security+ and basic networking. Then set up a free Splunk trial and practice writing SPL queries on sample logs.','Set up a home lab: TryHackMe or Hack The Box Blue Team paths, plus a free Elastic Security or Splunk environment.','Get your first Tier 1 SOC Analyst role — often available without a degree. MSSPs are the best pipeline.','Get CySA+ or BTL1 certification to differentiate. Many Tier 1 analysts stay stuck — certs signal ambition.','Move to Tier 2 Analyst or Incident Responder within 1–2 years. Begin learning detection engineering.','Target Detection Engineer roles after 3–5 years. Compensation jumps to $120K–$165K and beyond.']
},
eng:{icon:'⚙️',name:'Security Engineering & Architecture',tag:'Build the defenses. Design the blueprint.',salary:'$120K–$280K+',hot:'Staff Security Engineer',fit:['Systems thinker','Loves building over monitoring','Strong scripting skills','Enjoys solving complex integration problems'],no:'Prefer responding to incidents over designing systems',
overview:'Security engineers build and operate the technical controls that protect an organization. They deploy firewalls, configure endpoint security tools, build security automation, and design enterprise security architectures. At senior and principal levels, Security Architects set the technical direction for the entire organization. The Staff Security Engineer title commands $230K+ at large tech firms.',
jobs:[{t:'Security Engineer',s:'$110K–$150K',c:'#a855f7',d:'Deploys and configures security tools, builds automation, integrates security into CI/CD pipelines.'},{t:'Senior Security Engineer',s:'$145K–$195K',c:'#a855f7',d:'Leads tooling selection, designs security architectures, mentors juniors.'},{t:'Security Architect',s:'$155K–$210K',c:'#a855f7',d:'Designs security blueprints for large systems. Reviews all major architectural designs.'},{t:'Staff Security Engineer',s:'$195K–$280K+',c:'#a855f7',d:'Sets technical direction across multiple domains. Works directly with CISO and VPs.'},{t:'Principal Security Architect',s:'$210K–$320K+',c:'#a855f7',d:'Owns enterprise security architecture. Leads security transformation programs.'}],
skills:['Network security (firewalls, IDS/IPS, NAC)','Endpoint security (EDR deployment)','PKI and certificate management','Security automation (Python, Terraform, Ansible)','Cloud security controls (AWS/Azure/GCP)','Zero Trust architecture design','SIEM deployment and tuning','Vulnerability management programs','Security in CI/CD pipelines','Enterprise architecture frameworks (TOGAF, SABSA)'],
tools:['Palo Alto NGFW','Cisco ASA','Splunk','CrowdStrike Falcon','Nessus / Qualys','HashiCorp Vault','Terraform','Ansible','Wireshark','Zscaler'],
certs:[{n:'CISSP',i:'ISC² · 5yr exp req.',d:'Most recognized senior security cert. Required or preferred for Senior Engineer and Architect roles.',links:[{t:'rlb',l:'https://www.amazon.com/CISSP-Official-ISC-Study-Guide/dp/1119786231/',tx:'📖 Official ISC² Study Guide'},{t:'rlc',l:'https://www.udemy.com/course/cissp-certification/',tx:'📚 Udemy CISSP Course'}]},{n:'CISSP-ISSAP',i:'ISC² · Architecture Concentration · Requires active CISSP',d:'CISSP concentration for security architects.',links:[{t:'rlf',l:'https://www.isc2.org/Certifications/CISSP-Concentrations',tx:'🔗 ISC² Official Info'}]},{n:'SABSA SCF',i:'The SABSA Institute · Foundation Certificate',d:'Enterprise security architecture framework.',links:[{t:'rlb',l:'https://www.amazon.com/Enterprise-Security-Architecture-Business-Driven-Approach/dp/1578203430/',tx:'📖 SABSA Architecture Book'}]}],
day:'Your day as a Senior Security Engineer: Morning code review for a new microservice — you flag hardcoded credentials and missing TLS config. After lunch, you work on a Terraform module to auto-configure security groups in AWS with least-privilege defaults. Then a 45-minute architecture review for a new data pipeline accessing PHI — you add encryption at rest requirements and logging controls.',
steps:['Get solid IT fundamentals — networking (CCNA-level), Linux sysadmin, and basic scripting (Python). Security+ validates the baseline.','Build homelab skills: set up pfSense firewall, deploy Splunk in Docker, configure a Wazuh SIEM.','Target Security Engineer or Systems Administrator roles with a security focus.','Pursue CISSP after 3–5 years in engineering roles.','Develop a specialty: cloud security, zero trust architecture, or security automation.','Target Staff Engineer or Principal Architect after 8–12 years. At top tech firms, these roles pay $230K–$320K+.']
},
cloud:{icon:'☁️',name:'Cloud Security',tag:'Securing infrastructure you don\'t physically own',salary:'$125K–$384K',hot:'Cloud Security Architect',fit:['Comfortable with infrastructure as code','Systems thinker','Strong AWS/Azure fundamentals','Enjoys moving fast'],no:'Prefer hands-on physical network work',
overview:'Cloud security is the fastest-growing and highest-compensated domain in cybersecurity in 2025. As organizations migrate workloads to AWS, Azure, and GCP, they need engineers who understand both cloud infrastructure and security. Principal Cloud Security Architects at large tech firms earn $230K–$384K. AWS Security Specialty holders report 30–40% salary premiums.',
jobs:[{t:'Cloud Security Engineer',s:'$125K–$160K',c:'#22d3ee',d:'Configures CSPM tools, implements security guardrails, manages cloud IAM policies.'},{t:'Sr. Cloud Security Engineer',s:'$155K–$195K',c:'#22d3ee',d:'Leads CSPM operations, designs multi-account security landing zones.'},{t:'Cloud Security Architect',s:'$175K–$240K',c:'#22d3ee',d:'Designs cloud security strategy across all providers.'},{t:'Principal Cloud Security Architect',s:'$230K–$384K',c:'#22d3ee',d:'Sets cloud security strategy company-wide. The highest-paid IC cloud security role.'},{t:'Head of Cloud Security',s:'$185K–$250K',c:'#f97316',d:'Manages the cloud security team. Owns CSPM operations and compliance posture.'}],
skills:['AWS / Azure / GCP security services','Cloud IAM policies and SCPs','Infrastructure as Code (Terraform, CDK)','CSPM tools (Wiz, Prisma Cloud, Lacework)','Container and Kubernetes security','Serverless security','DevSecOps pipeline integration','Cloud network security (VPCs, NSGs, WAF)','Security automation and Lambda/Functions','CIS Benchmarks and CSPM posture management'],
tools:['Wiz','Orca Security','Prisma Cloud','AWS Security Hub','Microsoft Defender for Cloud','Terraform','AWS GuardDuty','CloudTrail','Falco','Snyk'],
certs:[{n:'AWS Security Specialty (SCS-C02)',i:'Amazon Web Services · ~$300 · Most In-Demand',d:'Holders report 30–40% salary premiums. Requires SAA-C03 first.',links:[{t:'rlc',l:'https://www.udemy.com/course/aws-certified-security-specialty/',tx:'📚 Udemy Stephane Maarek SCS'},{t:'rlb',l:'https://www.amazon.com/AWS-Certified-Security-Study-Guide/dp/1119658810/',tx:'📖 AWS Security Study Guide'},{t:'rlf',l:'https://aws.amazon.com/training/learn-about/security/',tx:'🎥 AWS Free Security Training'}]},{n:'AZ-500 – Azure Security Technologies',i:'Microsoft · ~$165',d:'Azure cloud security covering Defender for Cloud, Sentinel, and Entra ID security.',links:[{t:'rlc',l:'https://www.udemy.com/course/az500-azure/',tx:'📚 Udemy AZ-500'},{t:'rlf',l:'https://learn.microsoft.com/en-us/credentials/certifications/azure-security-engineer/',tx:'🎥 Microsoft Learn (Free)'}]},{n:'CCSP',i:'ISC² · Certified Cloud Security Professional · 5yr exp',d:'Vendor-neutral cloud security cert. Covers cloud architecture, data security, and legal frameworks.',links:[{t:'rlb',l:'https://www.amazon.com/CCSP-Certified-Cloud-Security-Professional/dp/1260455882/',tx:'📖 CCSP Study Guide'},{t:'rlc',l:'https://www.udemy.com/course/ccsp-video-course/',tx:'📚 Udemy CCSP Course'}]}],
day:'Your day as a Senior Cloud Security Engineer: Morning standup — a new AWS account needs a security baseline. You apply your Terraform security landing zone module. Then a pull request review: a developer opened S3 bucket permissions too broadly — you comment with the fix. Afternoon: a Wiz alert flags a misconfigured RDS instance accepting public connections. You verify it\'s not in production, mark it for remediation.',
steps:['Get AWS Solutions Architect Associate first. Cloud security requires deep cloud fundamentals.','Learn Terraform. Infrastructure as code is non-negotiable in cloud security.','Get AWS Security Specialty (SCS-C02). Study time: 80–120 hours.','Apply to Cloud Security Engineer roles. Filter for "CSPM", "AWS Security", and "Terraform".','Learn a CSPM tool hands-on: Wiz offers free trials, Prisma Cloud has sandboxes.','Target Senior Cloud Security Engineer after 2–3 years. Principal roles open at 6–10 years.']
},
appsec:{icon:'🔧',name:'AppSec & DevSecOps',tag:'Secure the code. Shift left.',salary:'$120K–$260K',hot:'Staff DevSecOps Engineer',fit:['Developers who love security','Comfortable reading code','Enjoys automating security tasks','Fast-paced engineering culture thrives'],no:'Prefer policy/compliance over hands-on technical work',
overview:'Application security engineers find vulnerabilities in software and integrate security into the development lifecycle. DevSecOps engineers build the automation that makes security testing part of every CI/CD pipeline. Staff DevSecOps engineers earn an average of $179K in 2025.',
jobs:[{t:'AppSec Engineer',s:'$120K–$155K',c:'#fb923c',d:'Reviews code for security vulnerabilities, runs SAST/DAST tools, trains developers.'},{t:'DevSecOps Engineer',s:'$125K–$165K',c:'#fb923c',d:'Integrates security tools into CI/CD pipelines, automates security testing.'},{t:'Senior AppSec Engineer',s:'$155K–$195K',c:'#fb923c',d:'Leads security architecture reviews, designs threat models, builds the AppSec program.'},{t:'Staff DevSecOps Engineer',s:'$165K–$230K',c:'#fb923c',d:'Sets DevSecOps strategy across engineering. Avg $179K in 2025.'},{t:'AppSec Architect',s:'$175K–$260K',c:'#fb923c',d:'Designs secure software development lifecycles and sets security standards for all development.'}],
skills:['Secure code review (Python, Java, Go, JavaScript)','SAST tools (Semgrep, Checkmarx, Snyk)','DAST tools (Burp Suite, OWASP ZAP)','Software Composition Analysis (SCA)','Threat modeling (STRIDE, DREAD)','OWASP Top 10','CI/CD security (GitHub Actions, Jenkins, GitLab CI)','Container security (Docker, Kubernetes)','API security testing','Supply chain security (SBOM, Sigstore)'],
tools:['Semgrep','Snyk','Burp Suite Pro','OWASP ZAP','Checkmarx','SonarQube','GitHub Advanced Security','Trivy','Syft','Dependabot'],
certs:[{n:'Burp Suite Certified Practitioner',i:'PortSwigger · portswigger.net',d:'Hands-on practical AppSec cert. Highly respected by practitioners.',links:[{t:'rlf',l:'https://portswigger.net/web-security',tx:'🆓 Web Security Academy (Free)'},{t:'rlf',l:'https://portswigger.net/burp/communitydownload',tx:'🔗 Burp Community (Free)'}]},{n:'GWEB',i:'GIAC / SANS · Web Application Defender',d:'Senior web application security cert.',links:[{t:'rlc',l:'https://www.sans.org/cyber-security-courses/securing-web-application-technologies/',tx:'📚 SANS SEC542'},{t:'rlb',l:'https://www.amazon.com/Web-Application-Hackers-Handbook-Exploiting/dp/1118026470/',tx:'📖 Web App Hackers Handbook'}]},{n:'CSSLP',i:'ISC² · Secure Software Lifecycle Professional · 4yr exp',d:'Vendor-neutral cert for AppSec professionals. Covers security throughout the SDLC.',links:[{t:'rlf',l:'https://www.isc2.org/Certifications/CSSLP',tx:'🔗 ISC² Official Info'}]}],
day:'Your day as a DevSecOps Engineer: Your GitHub Actions pipeline flagged 3 new high-severity issues from a Snyk scan overnight. You triage them — one is a critical CVE requiring an immediate pull request. Morning code review with a dev team adding a new OAuth integration — you catch a missing PKCE implementation. Afternoon: presenting threat model findings for a new API to the architecture committee.',
steps:['Learn to code. AppSec engineers who cannot read code are at a severe disadvantage. Python and JavaScript are the most common.','Work through PortSwigger Web Security Academy completely — it is free and the best AppSec curriculum available.','Get Burp Suite Certified Practitioner. It signals you can actually find vulnerabilities.','Apply for AppSec Engineer or DevSecOps Engineer roles at tech companies.','Learn CI/CD security integration: GitHub Actions, Semgrep, Snyk, and Trivy.','Staff DevSecOps Engineer at major tech companies pays $165K–$230K+ in 2025.']
},
red:{icon:'🔴',name:'Offensive Security (Red Team)',tag:'Think like the attacker. Break things legally.',salary:'$115K–$250K',hot:'Red Team Lead / Adversary Emulation',fit:['Enjoys puzzles and lateral thinking','Self-directed learner','Comfortable writing reports','CTF and hacking challenge enthusiast'],no:'Prefer defending systems to attacking them',
overview:'Offensive security professionals find vulnerabilities before attackers do — legally and ethically. Penetration testers scope, execute, and report on security assessments. Red teamers simulate advanced persistent threats. OSCP is the gold standard entry credential. Heads of Red Team at large enterprises earn $180K–$250K.',
jobs:[{t:'Junior Penetration Tester',s:'$75K–$100K',c:'#f43f5e',d:'Executes scoped assessments under senior guidance. Web application, network, and internal pen testing.'},{t:'Penetration Tester',s:'$100K–$140K',c:'#f43f5e',d:'Leads assessments independently. Authors technical and executive reports.'},{t:'Senior Penetration Tester',s:'$135K–$175K',c:'#f43f5e',d:'Leads complex engagements, manages junior testers, develops custom tooling.'},{t:'Red Team Operator',s:'$130K–$180K',c:'#f43f5e',d:'Simulates advanced threat actors. Multi-week campaigns focused on stealth and lateral movement.'},{t:'Head of Red Team',s:'$180K–$250K',c:'#f97316',d:'Leads the internal offensive security program. Defines adversary emulation strategy.'}],
skills:['External/internal network penetration testing','Web application testing (OWASP Top 10)','Active Directory attacks (Kerberoasting, DCSync, BloodHound)','Social engineering and phishing simulations','Custom exploit development','Cobalt Strike / Havoc C2 frameworks','OSINT reconnaissance','Cloud penetration testing','Report writing for executive audiences','Evasion and AV/EDR bypass'],
tools:['Metasploit','Cobalt Strike','Burp Suite Pro','BloodHound','Impacket','Nmap','Nessus','Responder','CrackMapExec','Havoc'],
certs:[{n:'OSCP',i:'Offensive Security · PEN-200 · ~$1,499 · 24hr practical exam',d:'Gold standard. Required or strongly preferred by most pen test employers.',links:[{t:'rlc',l:'https://www.offensive-security.com/pen200-oscp/',tx:'📚 Official PEN-200'},{t:'rlc',l:'https://www.udemy.com/course/practical-ethical-hacking/',tx:'📚 TCM Practical Ethical Hacking'},{t:'rlb',l:'https://www.amazon.com/Penetration-Testing-Hands-Introduction-Hacking/dp/1593275641/',tx:'📖 Georgia Weidman Book'},{t:'rlf',l:'https://app.hackthebox.com/',tx:'🆓 Hack The Box'}]},{n:'PNPT',i:'TCM Security · ~$399 · 5-day practical exam',d:'Entry-level practical offensive cert. Full engagement simulation including written report.',links:[{t:'rlc',l:'https://certifications.tcm-sec.com/pnpt/',tx:'📚 TCM Security Official'},{t:'rlf',l:'https://tryhackme.com/path/outline/jrpenetrationtester',tx:'🆓 TryHackMe Jr Pen Tester'}]},{n:'CRTO',i:'Zero-Point Security · Cobalt Strike focused · Lab exam',d:'Red team operator cert. Strong demand from internal red teams.',links:[{t:'rlc',l:'https://training.zeropointsecurity.co.uk/courses/red-team-ops',tx:'📚 ZeroPoint Security Official'},{t:'rlb',l:'https://www.amazon.com/Red-Team-Development-Operations-Practical/dp/B083XVG633/',tx:'📖 Red Team Operations Book'}]}],
day:'Your day as a Penetration Tester: Morning kick-off call with the client — a financial services firm. You review scope, confirm rules of engagement, and begin external reconnaissance with OSINT tools. You discover an exposed admin panel via Shodan. After lunch, you enumerate the web application and find an IDOR vulnerability leaking customer account data. End of day: draft the technical findings section of your report.',
steps:['Start with TryHackMe beginner paths and progress to Hack The Box starting point machines.','Complete TCM Security Practical Ethical Hacking on Udemy — the best foundational offensive course under $30.','Get PNPT first. It validates you can complete a full penetration test engagement.','Build your Active Directory home lab: two Windows Server VMs, attack them with BloodHound, Mimikatz, and Impacket.','Get OSCP. Required by most pen test employers. The return on investment is high.','Join a consultancy or internal red team. Bug bounty can supplement income but rarely replaces employment at this stage.']
},
grc:{icon:'📋',name:'GRC & Privacy',tag:'The bridge between security and the business',salary:'$95K–$240K',hot:'Third-Party Risk / Privacy Engineering',fit:['Policy and process oriented','Enjoys translating technical risks','Comfortable with ambiguity','Strong written communicator'],no:'Prefer hands-on technical exploitation or detection',
overview:'GRC (Governance, Risk, and Compliance) is the best entry point into cybersecurity for non-technical professionals. GRC analysts ensure organizations meet regulatory requirements, manage enterprise risk, and maintain compliance programs. Privacy engineers and Third-Party Risk analysts are the fastest-growing GRC specializations in 2025.',
jobs:[{t:'GRC Analyst',s:'$75K–$100K',c:'#00e07a',d:'Supports compliance programs, collects audit evidence, maintains risk registers, writes policies.'},{t:'Compliance Manager',s:'$100K–$135K',c:'#00e07a',d:'Manages one or more compliance frameworks (SOC 2, ISO 27001, HIPAA, PCI DSS).'},{t:'Third-Party Risk Analyst',s:'$95K–$130K',c:'#00e07a',d:'Assesses vendors and partners for security risk. One of the fastest-growing GRC specializations.'},{t:'Privacy Engineer',s:'$120K–$165K',c:'#00e07a',d:'Technical role implementing GDPR/CCPA controls in product and infrastructure.'},{t:'GRC Director',s:'$175K–$240K',c:'#f97316',d:'Leads all compliance programs, enterprise risk management, and third-party risk.'}],
skills:['NIST CSF / SP 800-53','ISO 27001 / 27002','SOC 2 Type II','PCI DSS v4.0','HIPAA Security Rule','GDPR / CCPA / state privacy laws','GRC platforms (ServiceNow, Archer, OneTrust)','Vendor risk assessment','Policy writing and exception management','Risk quantification (FAIR methodology)'],
tools:['OneTrust','ServiceNow GRC','Archer','Vanta','Drata','LogicGate','BitSight','SecurityScorecard'],
certs:[{n:'CompTIA Security+',i:'CompTIA · SY0-701 · Entry foundation',d:'Entry-level baseline. Many GRC hiring managers require it as a minimum technical credential.',links:[{t:'rlc',l:'https://www.udemy.com/course/securityplus/',tx:'📚 Udemy Dion Training'},{t:'rlf',l:'https://www.professormesser.com/security-plus/sy0-701/',tx:'🎥 Prof. Messer (Free)'}]},{n:'CISA',i:'ISACA · 5yr exp req. · Gold standard for IT audit',d:'Highest-ROI cert for GRC professionals entering through the audit path.',links:[{t:'rlb',l:'https://www.amazon.com/CISA-Certified-Information-Systems-Auditor/dp/1260467783/',tx:'📖 CISA All-in-One'},{t:'rlc',l:'https://www.udemy.com/course/cisa-certification/',tx:'📚 Udemy CISA Course'}]},{n:'ISO 27001 Lead Implementer',i:'PECB / BSI · ANSI-accredited',d:'Validates ability to design and lead an ISMS implementation.',links:[{t:'rlc',l:'https://www.udemy.com/course/iso-27001-lead-implementer-preparation-course/',tx:'📚 Udemy ISO 27001'},{t:'rlb',l:'https://www.amazon.com/ISO-27001-Controls-Practical-Information/dp/1787781496/',tx:'📖 ISO 27001 Controls Guide'}]}],
day:'Your day as a Compliance Manager: Morning: a SOC 2 auditor requests evidence that employee security training was completed within the last 12 months. You pull the records from your LMS and upload them to the audit portal. Midday: a new SaaS vendor contract needs security review. Afternoon: writing a risk exception memo for a legacy system that cannot be patched to meet your current standards.',
steps:['A four-year degree in any field gives you an advantage in GRC. Business, legal, accounting, and information systems backgrounds are all valued.','Get CompTIA Security+ to establish a technical baseline that hiring managers respect.','Target Compliance Coordinator or Junior IT Auditor roles at companies undergoing SOC 2 or ISO 27001 certification.','Get CISA after 3–5 years in audit/compliance roles.','Specialize in a high-growth area: Third-Party Risk, Privacy (GDPR/CCPA), or Cloud Compliance.','GRC Directors who also hold CISSP or CRISC command the highest compensation. Target $175K–$240K base at Director level.']
},
forensics:{icon:'🔬',name:'Digital Forensics & Threat Intelligence',tag:'Investigate. Attribute. Anticipate.',salary:'$105K–$250K',hot:'Malware Analyst / Threat Intel Analyst',fit:['Analytical and methodical','Enjoys puzzle-solving','Comfortable in ambiguity','Strong documentation habits'],no:'Prefer real-time response over post-incident analysis',
overview:'Digital forensics and incident response (DFIR) professionals investigate breaches — determining what happened, how, and what data was affected. Threat intelligence analysts monitor the adversary landscape. Malware analysts reverse-engineer malicious code. High demand from government, defense, financial services, and incident response consulting firms.',
jobs:[{t:'DFIR Analyst',s:'$90K–$125K',c:'#a855f7',d:'Investigates security incidents. Performs disk and memory forensics, documents findings.'},{t:'Threat Intelligence Analyst',s:'$100K–$140K',c:'#a855f7',d:'Monitors threat actor activity, processes intelligence feeds, produces intel reports.'},{t:'Malware Analyst',s:'$110K–$155K',c:'#a855f7',d:'Reverse-engineers malicious code. Performs static and dynamic analysis. Extracts IOCs.'},{t:'Senior DFIR Analyst',s:'$135K–$175K',c:'#a855f7',d:'Leads breach investigations. Performs advanced memory forensics. Produces executive reports.'},{t:'Threat Intel Lead',s:'$150K–$200K',c:'#f97316',d:'Leads the threat intelligence function. Manages the intel platform and ISAC relationships.'}],
skills:['Windows / Linux forensic artifacts','Memory forensics (Volatility)','Disk forensics (Autopsy, FTK)','Malware analysis (static and dynamic)','Reverse engineering (Ghidra, IDA Pro)','Threat intelligence frameworks (MITRE ATT&CK)','Network forensics (Wireshark, Zeek, Suricata)','Incident response lifecycle','YARA rule writing','Threat hunting methodologies'],
tools:['Volatility','Autopsy','Ghidra','IDA Pro','ANY.RUN','Joe Sandbox','Wireshark','Velociraptor','MISP','OpenCTI'],
certs:[{n:'GCFE / GCFA',i:'GIAC / SANS · Forensic Examiner / Analyst',d:'GCFE: host-based forensics. GCFA: adds memory forensics and enterprise-scale investigation.',links:[{t:'rlc',l:'https://www.sans.org/cyber-security-courses/windows-forensic-analysis/',tx:'📚 SANS FOR500 (GCFE prep)'},{t:'rlb',l:'https://www.amazon.com/Art-Memory-Forensics-Detecting-Malware/dp/1118825098/',tx:'📖 Art of Memory Forensics'},{t:'rlf',l:'https://github.com/volatilityfoundation/volatility3',tx:'🆓 Volatility3 (Free)'}]},{n:'GREM',i:'GIAC / SANS · Reverse Engineering Malware · Elite',d:'One of the most technically demanding certs in cybersecurity.',links:[{t:'rlc',l:'https://www.sans.org/cyber-security-courses/reverse-engineering-malware-malware-analysis-tools-techniques/',tx:'📚 SANS FOR610 (GREM prep)'},{t:'rlb',l:'https://www.amazon.com/Practical-Malware-Analysis-Hands-Dissecting/dp/1593272901/',tx:'📖 Practical Malware Analysis'},{t:'rlf',l:'https://github.com/NationalSecurityAgency/ghidra',tx:'🔗 Ghidra (Free NSA Tool)'}]},{n:'GCTI',i:'GIAC / SANS · Cyber Threat Intelligence',d:'Validates threat intelligence skills. Growing demand as programs mature.',links:[{t:'rlc',l:'https://www.sans.org/cyber-security-courses/cyber-threat-intelligence/',tx:'📚 SANS FOR578 (GCTI prep)'},{t:'rlf',l:'https://attack.mitre.org/',tx:'🆓 MITRE ATT&CK (Free)'}]}],
day:'Your day as a DFIR Analyst: A major US retailer calls your consulting firm — they discovered unusual traffic leaving their network last night. You join a call with the CISO, gather initial details, and begin remote triage. You deploy an endpoint forensics agent to affected systems and pull memory images. Over the next four hours, you identify a web shell, trace lateral movement, and find data staged for exfiltration.',
steps:['Build a foundation in IT: networking, Windows and Linux administration, and basic scripting.','Set up a malware analysis sandbox: FlareVM for analysis, REMnux for dynamic analysis, and ANY.RUN for browser-based sandbox.','Get CompTIA Security+ and supplement with SANS free resources and the DFIR.training website.','Target SOC Analyst or IT Administrator roles first — DFIR requires broad incident knowledge.','Pursue GCFE or GCFA after 3–5 years. GIAC certs are the benchmarks for DFIR hiring at defense contractors.','Specialize in malware analysis (GREM) or threat intelligence (GCTI) for maximum compensation.']
}};

function showDomain(id){
  var d=D[id];if(!d)return;
  var jobs=d.jobs.map(function(j){return '<div class="jcard"><div class="jct">'+j.t+'</div><div class="jcl" style="color:'+j.c+'">'+j.s+'</div><div class="jcd">'+j.d+'</div></div>';}).join('');
  var skills=d.skills.map(function(s){return '<div class="ddli">'+s+'</div>';}).join('');
  var tools=d.tools.map(function(t){return '<span class="ddtool">'+t+'</span>';}).join('');
  var certs=d.certs.map(function(c){var links=c.links.map(function(l){return '<a class="rl '+l.t+'" href="'+l.l+'" target="_blank" rel="noopener">'+l.tx+'</a>';}).join('');return '<div class="citem"><div class="cin">'+c.n+'</div><div class="cii">'+c.i+'</div><div class="cid">'+c.d+'</div><div class="cres"><div class="cresl">Study Resources</div><div class="rlinks">'+links+'</div></div></div>';}).join('');
  var steps=d.steps.map(function(s,i){return '<div class="step"><div class="stepn">'+(i+1)+'</div><div class="stept">'+s+'</div></div>';}).join('');
  var fit=d.fit.map(function(f){return '<span class="pill pfit">'+f+'</span>';}).join('');
  var html='<div class="bbtn" onclick="showPage(\'domains\')">← Back to Domains</div>'
    +'<div class="ddh"><div class="ddhi">'+d.icon+'</div><div class="ddht"><h1>'+d.name+'</h1><div class="ddhtag">'+d.tag+'</div><div class="ddpills"><span class="pill psal">💰 '+d.salary+'</span><span class="pill phot">🔥 '+d.hot+'</span>'+fit+'<span class="pill pno">⚠️ Not ideal if: '+d.no+'</span></div></div></div>'
    +'<div class="dds"><div class="ddst">Overview</div><div class="ddp">'+d.overview+'</div></div>'
    +'<div class="dds"><div class="ddst">Key Job Titles & Salary Ranges</div><div class="jgrid">'+jobs+'</div></div>'
    +'<div class="dds"><div class="ddst">Core Skills & Knowledge</div><div class="dd2"><div class="ddlist">'+skills+'</div><div><div class="ddst" style="margin-top:0;">Common Tools</div><div class="ddtools">'+tools+'</div></div></div></div>'
    +'<div class="dds"><div class="ddst">Key Certifications & Study Resources</div><div class="clist">'+certs+'</div></div>'
    +'<div class="dds"><div class="ddst">A Day in the Life</div><div class="daybox">'+d.day+'</div></div>'
    +'<div class="dds"><div class="ddst">How to Break In — 6 Steps</div><div class="steps">'+steps+'</div></div>';
  document.getElementById('domain-content').innerHTML=html;
  document.querySelectorAll('.page').forEach(function(x){x.classList.remove('active');});
  document.querySelectorAll('.nl').forEach(function(x){x.classList.remove('active');});
  document.getElementById('page-domain').classList.add('active');
  document.getElementById('nav-domains').classList.add('active');
  window.scrollTo(0,0);
}

// Nav handled by unified showPage below

// ══════════ REVIEWS SYSTEM ══════════
var reviews = [];
var currentRating = 0;
var selectedCats = [];

function loadReviews(){
  try{
    var stored = localStorage.getItem('infosecdeck_reviews');
    if(stored) reviews = JSON.parse(stored);
  }catch(e){ reviews=[]; }
  if(reviews.length===0){
    // Seed with sample reviews
    reviews = [
      {id:1,name:'Marcus T.',role:'SOC Analyst',rating:5,cats:['Career Ladder','Content Quality'],text:'Best free cybersecurity career resource I\'ve found. The career ladder with salary ranges is genuinely accurate — matches what I see on job boards. The domain deep dives are exceptional.',votes:{up:14,down:0},time:'2 days ago',userVote:null},
      {id:2,name:'Priya K.',role:'CS Graduate Student',rating:5,cats:['Cert Roadmap','Training Programs'],text:'The certification roadmap is incredible. I was overwhelmed before finding this site. Now I have a clear path: Security+ → CySA+ → BTL1 → eventually OSCP. The training page saved me hours of research.',votes:{up:9,down:1},time:'5 days ago',userVote:null},
      {id:3,name:'Anonymous',role:'Career Changer',rating:4,cats:['Career Ladder','Feature Request'],text:'Coming from accounting with no IT background, the GRC domain guide spoke directly to me. Would love a salary negotiation guide and LinkedIn profile tips added. Four stars for now — five once that\'s in.',votes:{up:7,down:0},time:'1 week ago',userVote:null},
      {id:4,name:'Jordan R.',role:'Penetration Tester',rating:5,cats:['Games / Challenges','Content Quality'],text:'The Phish or Fish game is actually challenging — I missed the rnicrosoft.com one on my first try and I test phishing campaigns for a living. Humbling and educational. The CTF levels are a nice touch.',votes:{up:11,down:1},time:'1 week ago',userVote:null},
      {id:5,name:'Dev S.',role:'Cloud Security Engineer',rating:5,cats:['Resume Roaster'],text:'Resume Roaster gave me specific feedback I could act on immediately — called out that I wasn\'t quantifying impact and flagged missing cloud security keywords. Got two callbacks after updating it.',votes:{up:16,down:0},time:'3 days ago',userVote:null}
    ];
    saveReviews();
  }
  renderReviews();
}

function saveReviews(){
  try{ localStorage.setItem('infosecdeck_reviews', JSON.stringify(reviews)); }catch(e){}
}

function renderReviews(){
  // Summary stats
  var total = reviews.length;
  var avg = total>0 ? (reviews.reduce(function(s,r){return s+r.rating;},0)/total).toFixed(1) : '0.0';
  document.getElementById('rvw-avg-score').textContent = avg;
  var stars = '';
  var avgN = parseFloat(avg);
  for(var i=1;i<=5;i++) stars += i<=Math.round(avgN)?'★':'☆';
  document.getElementById('rvw-avg-stars').textContent = stars;
  document.getElementById('rvw-avg-count').textContent = total + ' review'+(total!==1?'s':'');
  // Bar breakdown
  var counts = [0,0,0,0,0];
  reviews.forEach(function(r){ if(r.rating>=1&&r.rating<=5) counts[r.rating-1]++; });
  var barHtml = '';
  for(var s=5;s>=1;s--){
    var pct = total>0?Math.round((counts[s-1]/total)*100):0;
    barHtml += '<div class="rvw-bar-row"><div class="rvw-bar-label">'+s+'</div><div class="rvw-bar-bg"><div class="rvw-bar-fill" style="width:'+pct+'%"></div></div><div class="rvw-bar-count">'+counts[s-1]+'</div></div>';
  }
  document.getElementById('rvw-bar-breakdown').innerHTML = barHtml;
  // List
  var sorted = reviews.slice().sort(function(a,b){ return (b.votes.up-b.votes.down)-(a.votes.up-a.votes.down); });
  var listHtml = sorted.map(function(r){
    var starStr = '';
    for(var i=1;i<=5;i++) starStr += i<=r.rating?'★':'☆';
    var cats = (r.cats||[]).map(function(c){return '<span class="rvw-card-cat">'+c+'</span>';}).join('');
    var voteScore = (r.votes.up||0)-(r.votes.down||0);
    var uvUp = r.userVote==='up'?' voted-up':'';
    var uvDn = r.userVote==='down'?' voted-down':'';
    return '<div class="rvw-card" id="rvw-card-'+r.id+'">'
      +'<div class="rvw-card-top">'
      +'<div class="rvw-card-meta"><div class="rvw-card-name">'+(r.name||'Anonymous')+'</div>'
      +(r.role?'<span style="font-family:var(--fm);font-size:.56rem;color:var(--mt);">'+r.role+'</span>':'')+cats
      +'</div><div style="text-align:right;flex-shrink:0;"><div class="rvw-card-stars" style="color:var(--am);">'+starStr+'</div><div class="rvw-card-time">'+r.time+'</div></div>'
      +'</div>'
      +'<div class="rvw-card-body">'+escHtml(r.text)+'</div>'
      +'<div class="rvw-card-actions">'
      +'<div class="rvw-vote'+uvUp+'" onclick="voteReview('+r.id+',\'up\')">👍 '+((r.votes.up)||0)+'</div>'
      +'<div class="rvw-vote'+uvDn+'" onclick="voteReview('+r.id+',\'down\')">👎 '+((r.votes.down)||0)+'</div>'
      +(voteScore>5?'<span class="rvw-admin-note">🔥 Top Feedback</span>':'')
      +'</div>'
      +'</div>';
  }).join('');
  document.getElementById('rvw-list').innerHTML = listHtml || '<div style="color:var(--mt);font-size:.82rem;text-align:center;padding:24px;">No reviews yet — be the first!</div>';
}

function escHtml(t){ return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function setRating(v){
  currentRating = v;
  document.querySelectorAll('.rvw-star').forEach(function(s){
    s.classList.toggle('active', parseInt(s.getAttribute('data-v'))<=v);
  });
}

function toggleCat(el){
  var cat = el.getAttribute('data-cat');
  el.classList.toggle('active');
  if(el.classList.contains('active')){ if(!selectedCats.includes(cat)) selectedCats.push(cat); }
  else { selectedCats = selectedCats.filter(function(c){return c!==cat;}); }
}

function submitReview(){
  var text = document.getElementById('rvw-text').value.trim();
  if(!currentRating){ alert('Please select a star rating.'); return; }
  if(text.length<10){ alert('Please write at least a few words.'); return; }
  var name = document.getElementById('rvw-name').value.trim();
  var role = document.getElementById('rvw-role').value.trim();
  var now = new Date();
  var timeStr = 'just now';
  var newReview = {
    id: Date.now(),
    name: name||'Anonymous',
    role: role||'',
    rating: currentRating,
    cats: selectedCats.slice(),
    text: text,
    votes:{up:0,down:0},
    time: timeStr,
    userVote: null
  };
  reviews.unshift(newReview);
  saveReviews();
  // Reset form
  currentRating=0; selectedCats=[];
  document.getElementById('rvw-text').value='';
  document.getElementById('rvw-name').value='';
  document.getElementById('rvw-role').value='';
  document.querySelectorAll('.rvw-star').forEach(function(s){s.classList.remove('active');});
  document.querySelectorAll('.rvw-cat').forEach(function(c){c.classList.remove('active');});
  renderReviews();
}

function voteReview(id, dir){
  var r = reviews.find(function(rv){return rv.id===id;});
  if(!r) return;
  if(r.userVote===dir){ r.votes[dir]--; r.userVote=null; }
  else{
    if(r.userVote){ r.votes[r.userVote]--; }
    r.votes[dir]++;
    r.userVote=dir;
  }
  saveReviews();
  renderReviews();
}

loadReviews();

// ══════════ CTF GAME ══════════
var ctfChallenges = [
  {
    id:0,
    title:'Recon: Hidden in Plain Sight',
    briefing:[
      'infosecdeck-ctf:~$ <span class="term-cmd">ls -la /challenges/01/</span>',
      '<span class="term-out">total 3 | briefing.txt | index.html | .hidden</span>',
      'infosecdeck-ctf:~$ <span class="term-cmd">cat briefing.txt</span>',
      '<span style="color:#e2e8f0;">CHALLENGE 01 — RECON</span>',
      '<span class="term-out">A threat actor left a flag hidden somewhere accessible to anyone who knows where to look.</span>',
      '<span class="term-out">In real-world recon, analysts inspect page source code, HTTP headers, and robots.txt</span>',
      '<span class="term-out">for information that developers accidentally left exposed.</span>',
      '&nbsp;',
      '<span class="term-hint" onclick="ctfHint1()">💡 Hint: Right-click this page → View Page Source. Search for "FLAG"</span>',
      '&nbsp;',
      '<span class="term-out">Enter the flag in the format: FLAG{...}</span>'
    ],
    flag:'FLAG{R3C0N_M4ST3R}',
    successMsg:'🎯 <strong>Correct!</strong> You found the hidden flag using source code inspection — exactly how real security analysts find exposed credentials, API keys, and debug comments left in production code. In real breaches, developers accidentally commit secrets to public GitHub repos or leave debug endpoints exposed.',
    failMsg:'Not quite. Hint: Right-click this page → "View Page Source" (or press Ctrl+U / Cmd+U), then use Ctrl+F to search for "FLAG". Real analysts do this on every target.',
    solvedXP:100
  },
  {
    id:1,
    title:'Crypto: Decode the Message',
    briefing:[
      'infosecdeck-ctf:~$ <span class="term-cmd">cat intercepted_message.txt</span>',
      '&nbsp;',
      '<span style="color:#fbbf24;">INTERCEPTED TRANSMISSION:</span>',
      '<span style="color:#22d3ee;font-family:var(--fm);font-size:.7rem;letter-spacing:.05em;">RkxBR3tCNDUzX0VOQzBESU5HX0RFVEVDVEVEfQ==</span>',
      '&nbsp;',
      '<span class="term-out">The threat actor encoded their command-and-control password.</span>',
      '<span class="term-out">This encoding scheme is commonly used to obfuscate data — but it\'s NOT encryption.</span>',
      '<span class="term-out">It can be decoded by anyone who recognizes the format.</span>',
      '&nbsp;',
      '<span class="term-hint" onclick="ctfHint2()">💡 Hint: This is Base64. Use atob() in browser console, or search "base64 decoder online"</span>',
      '&nbsp;',
      '<span class="term-out">Decode the message and enter the flag you find inside.</span>'
    ],
    flag:'FLAG{B453_ENC0DING_DETECTED}',
    successMsg:'🔐 <strong>Correct!</strong> You decoded Base64 encoding — a critical skill for incident responders and malware analysts. Base64 is NOT encryption; it\'s encoding. Real attackers use it to obfuscate payloads, commands in PowerShell scripts, and C2 traffic. Tools like CyberChef let you decode dozens of encoding schemes instantly.',
    failMsg:'Not quite. The encoded string is Base64. In your browser\'s developer console (F12 → Console), type: <code style="color:var(--gn);">atob("RkxBR3tCNDUzX0VOQzBESU5HX0RFVEVDVEVEfQ==")</code>',
    solvedXP:150
  },
  {
    id:2,
    title:'OSINT: Find the Threat Actor',
    briefing:[
      'infosecdeck-ctf:~$ <span class="term-cmd">cat case_file.txt</span>',
      '&nbsp;',
      '<span style="color:#f43f5e;">INCIDENT BRIEF — CLASSIFIED</span>',
      '<span class="term-out">A phishing email was sent from: supp0rt@micros0ft-helpdesk.net</span>',
      '<span class="term-out">The attacker signed their message: "- Alex, IT Security Team"</span>',
      '<span class="term-out">The email contained a link to: http://login.micros0ft-helpdesk.net/secure</span>',
      '&nbsp;',
      '<span style="color:#fbbf24;">QUESTION: What MITRE ATT&CK technique did this attacker primarily use?</span>',
      '<span class="term-out">Options: T1566 (Phishing) | T1078 (Valid Accounts) | T1110 (Brute Force) | T1190 (Exploit Public-Facing App)</span>',
      '&nbsp;',
      '<span class="term-hint" onclick="ctfHint3()">💡 Hint: The attacker impersonated Microsoft via a lookalike domain. What technique covers deceptive emails?</span>',
      '&nbsp;',
      '<span class="term-out">Enter the flag in format: FLAG{T[technique number]}</span>'
    ],
    flag:'FLAG{T1566}',
    successMsg:'🕵️ <strong>Correct! T1566 — Phishing.</strong> The attacker used a typosquat domain (micros0ft with a zero) and impersonated IT staff — classic spear phishing. MITRE ATT&CK is the industry-standard framework for categorizing adversary techniques. Every SOC analyst and threat intel professional uses it daily. The \'0\' replacing \'o\' is called a homoglyph substitution.',
    failMsg:'Not quite. Look at the technique: the attacker sent a deceptive email from a fake domain impersonating Microsoft. That\'s phishing. MITRE ATT&CK T1566 = Phishing. Enter: FLAG{T1566}',
    solvedXP:200
  }
];
var ctfSolved = [false,false,false];
var ctfCurrent = 0;

function loadCTF(idx){
  if(idx>0 && !ctfSolved[idx-1]){ return; }
  ctfCurrent = idx;
  var ch = ctfChallenges[idx];
  document.querySelectorAll('.ctf-level').forEach(function(el,i){
    el.classList.toggle('active', i===idx);
  });
  document.getElementById('ctf-briefing').innerHTML = ch.briefing.join('<br>');
  document.getElementById('ctf-answer').value='';
  var res = document.getElementById('ctf-result');
  res.classList.remove('show','win','fail');
  res.innerHTML='';
}

function ctfHint1(){ alert('Right-click this page → "View Page Source" or press Ctrl+U (Windows) / Cmd+U (Mac). Then use Ctrl+F to search for "FLAG". The flag is hidden in an HTML comment.'); }
function ctfHint2(){ alert('Open browser developer tools (F12), go to Console tab, and type:\natob("RkxBR3tCNDUzX0VOQzBESU5HX0RFVEVDVEVEfQ==")\nPress Enter.'); }
function ctfHint3(){ alert('The attacker sent a deceptive email from a fake domain impersonating a trusted company. In MITRE ATT\&CK, this is T1566 (Phishing). Enter: FLAG{T1566}'); }

function checkCTF(){
  var answer = document.getElementById('ctf-answer').value.trim().toUpperCase();
  var ch = ctfChallenges[ctfCurrent];
  var res = document.getElementById('ctf-result');
  res.classList.remove('show','win','fail');
  if(answer === ch.flag.toUpperCase()){
    res.className='ctf-result show win';
    res.innerHTML = ch.successMsg + '<br><br><strong style="color:var(--gn);">+'+ch.solvedXP+' XP</strong> · Challenge complete!';
    ctfSolved[ctfCurrent]=true;
    document.getElementById('ctf-status-'+ctfCurrent).innerHTML='<span style="color:var(--gn);">✓ Solved</span>';
    document.getElementById('ctf-lvl-'+ctfCurrent).classList.add('solved');
    if(ctfCurrent<2){
      document.getElementById('ctf-status-'+(ctfCurrent+1)).innerHTML='Unlocked';
      document.getElementById('ctf-lvl-'+(ctfCurrent+1)).style.opacity='1';
    }
  } else {
    res.className='ctf-result show fail';
    res.innerHTML='❌ Incorrect. '+ch.failMsg;
  }
}

// Unlock first level
document.getElementById('ctf-status-0').innerHTML='Active';
loadCTF(0);

// Hidden flag in comment (for challenge 1)
// FLAG{R3C0N_M4ST3R}

// ══════════ PACKET DETECTIVE ══════════
var pdCases = [
  {
    id:0,
    title:'Operation Night Owl',
    narrative:'A financial services firm detected unauthorized data transfer at 3:17 AM. The SIEM alerted on 4.2GB of outbound traffic to an IP geolocated in Eastern Europe. Investigate the network and identify the breach origin.',
    clues:[
      {icon:'🌍',text:'Network traffic logs show the data left the building to an IP address geolocated in Romania — not a known business partner.'},
      {icon:'⏰',text:'The transfer occurred at 3:17 AM. The only device active on the network at that time was the HP LaserJet on the 3rd floor (192.168.1.45).'},
      {icon:'🔓',text:'The printer firmware hasn\'t been updated in 3 years and runs an unpatched web admin panel accessible on port 9100 — no authentication required.'}
    ],
    devices:[
      {id:'workstation',icon:'💻',label:'Workstation',ip:'192.168.1.12',x:'left'},
      {id:'server',icon:'🖥️',label:'File Server',ip:'192.168.1.5',x:'center'},
      {id:'printer',icon:'🖨️',label:'HP Printer',ip:'192.168.1.45',x:'right'},
      {id:'router',icon:'📡',label:'Router',ip:'192.168.1.1',x:'center'}
    ],
    answer:'printer',
    winMsg:'<strong style="color:var(--gn);">🎯 Correct! The HP LaserJet was the entry point.</strong><br><br>This mirrors real-world IoT attacks. Unpatched printers, cameras, and smart devices are consistently among the easiest entry points for attackers. The printer\'s web admin panel (port 9100, no auth) let the attacker install persistent firmware backdoor firmware. In the 2016 Deutsche Telekom attack, a Mirai variant compromised 900,000 routers via their management ports.<br><br><strong>What a real analyst would do:</strong> Isolate the device immediately, image its flash storage for forensics, audit all other IoT firmware, and implement network segmentation.',
    failMsg:'Incorrect. Review clue #2: the only device active at 3:17 AM was the printer (192.168.1.45). And clue #3 revealed it ran an unpatched, auth-free web admin panel. IoT devices are frequently the weakest link in enterprise security.'
  },
  {
    id:1,
    title:'Operation Shadow Broker',
    narrative:'A healthcare company\'s SOC detected lateral movement after business hours. An attacker appears to have used valid credentials to pivot through the network. Identify the initial point of compromise.',
    clues:[
      {icon:'👤',text:'A domain admin account (DA_backup_svc) logged in from two countries simultaneously — the US and Vietnam — within a 4-minute window. This is physically impossible.'},
      {icon:'🖥️',text:'The file server shows normal access patterns. No unusual ports open, all patches current, monitored by EDR with no alerts.'},
      {icon:'💻',text:'The executive workstation has no EDR agent installed ("it slowed things down"), runs Windows 10 1903 (EOL), and the exec received a LinkedIn connection request from an unknown profile 2 days ago.'}
    ],
    devices:[
      {id:'workstation',icon:'💻',label:'Exec Workstation',ip:'10.0.0.87',x:'left'},
      {id:'server',icon:'🖥️',label:'File Server',ip:'10.0.0.5',x:'center'},
      {id:'printer',icon:'🖨️',label:'Network Printer',ip:'10.0.0.44',x:'right'},
      {id:'router',icon:'📡',label:'Core Switch',ip:'10.0.0.1',x:'center'}
    ],
    answer:'workstation',
    winMsg:'<strong style="color:var(--gn);">🎯 Correct! The executive\'s workstation was the initial access point.</strong><br><br>Classic spear phishing targeting an executive (whaling). The LinkedIn message likely led to a credential harvesting page or delivered a malicious document. No EDR + EOL Windows = no detection. The attacker used the exec\'s cached domain admin credentials to move laterally. The "impossible travel" alert (US + Vietnam in 4 minutes) was the first indicator of compromise (IOC).<br><br><strong>Key lessons:</strong> Every device needs EDR. Executives are high-value targets. Patch management applies to all endpoints, including the CEO\'s laptop.',
    failMsg:'Not quite. Review clue #3: the executive workstation has no EDR, runs an EOL OS, and the exec was targeted via LinkedIn. These are classic conditions for initial access via spear phishing. The impossible travel alert (clue #1) confirms credentials were stolen and used remotely.'
  },
  {
    id:2,
    title:'Operation Red October',
    narrative:'A manufacturing plant running industrial control systems detected anomalous commands being sent to the production floor PLC. A targeted attack on critical infrastructure is underway. Find the breach entry point.',
    clues:[
      {icon:'📧',text:'Three days ago, an employee in the engineering department opened an email attachment titled "Q4_Production_Schedule_FINAL.xlsx" — the email came from a spoofed internal address.'},
      {icon:'🏭',text:'The production server and PLCs operate on an air-gapped OT network — theoretically isolated from corporate IT. However, one workstation has a dual network adapter bridging both networks.'},
      {icon:'🖨️',text:'The printer and router are on the corporate IT network only and cannot send commands to OT systems. Both are fully patched and monitored.'}
    ],
    devices:[
      {id:'workstation',icon:'💻',label:'Engineering WS',ip:'172.16.0.22',x:'left'},
      {id:'server',icon:'🏭',label:'OT/PLC Server',ip:'192.168.100.5',x:'center'},
      {id:'printer',icon:'🖨️',label:'Corporate Printer',ip:'172.16.0.44',x:'right'},
      {id:'router',icon:'📡',label:'IT Router',ip:'172.16.0.1',x:'center'}
    ],
    answer:'workstation',
    winMsg:'<strong style="color:var(--gn);">🎯 Correct! The engineering workstation was the pivot point.</strong><br><br>This mirrors the Stuxnet attack model. The malicious Excel macro (in the attachment) ran on the engineering workstation and used its dual network adapter to bridge the air gap between corporate IT and the OT network. The attacker could then send malicious commands to the PLCs.<br><br><strong>This is exactly how Stuxnet destroyed Iranian centrifuges in 2010</strong> — via infected USB drives reaching air-gapped systems through human hands. Air gaps only work if humans can\'t cross them. The weakest link is always a person with access to both networks.',
    failMsg:'Review clue #2: one workstation has a dual network adapter bridging the IT and OT networks. Combined with clue #1 (the malicious Excel file was opened by engineering staff), the workstation is the only device that could reach both the corporate network (where the infection started) and the OT/PLC network.'
  }
];
var pdActiveCaseIdx = 0;
var pdAnswered = [false,false,false];
var pdSelected = null;

function initPacketDetective(){
  var nav = document.getElementById('pd-cases-nav');
  nav.innerHTML = pdCases.map(function(c,i){
    var cls = 'pd-case-btn'+(i===0?' active':'')+(pdAnswered[i]?' solved':'');
    return '<button class="'+cls+'" id="pd-nav-'+i+'" onclick="loadPDCase('+i+')">Case #'+(i+1)+': '+c.title+'</button>';
  }).join('');
  loadPDCase(0);
}

function loadPDCase(idx){
  pdActiveCaseIdx=idx; pdSelected=null;
  var c = pdCases[idx];
  document.querySelectorAll('.pd-case-btn').forEach(function(b,i){
    b.classList.toggle('active',i===idx);
  });
  var clues = c.clues.map(function(cl){
    return '<div class="pd-clue"><div class="pd-clue-icon">'+cl.icon+'</div><div>'+cl.text+'</div></div>';
  }).join('');
  var devices = c.devices.map(function(d){
    return '<div class="pd-device" id="pd-dev-'+d.id+'" onclick="selectDevice(\''+d.id+'\')">'
      +'<div class="pd-device-icon">'+d.icon+'</div>'
      +'<div class="pd-device-label">'+d.label+'</div>'
      +'<div class="pd-device-ip">'+d.ip+'</div>'
      +'</div>';
  }).join('');
  document.getElementById('pd-case-content').innerHTML = 
    '<div class="pd-case">'
    +'<div class="pd-case-header"><span class="pd-case-badge">🚨 Active Breach</span><div class="pd-case-title">Case #'+(idx+1)+': '+c.title+'</div></div>'
    +'<p style="font-size:.8rem;color:#94a3b8;margin-bottom:16px;line-height:1.7;">'+c.narrative+'</p>'
    +'<div style="font-family:var(--fm);font-size:.56rem;text-transform:uppercase;letter-spacing:.14em;color:var(--mt);margin-bottom:10px;">Evidence & Clues</div>'
    +'<div class="pd-clues">'+clues+'</div>'
    +'<div style="font-family:var(--fm);font-size:.56rem;text-transform:uppercase;letter-spacing:.14em;color:var(--mt);margin-bottom:12px;">Network Diagram — Click the Breach Origin</div>'
    +'<div class="pd-network">'+devices+'</div>'
    +'<button class="pd-submit" onclick="submitPD()">Submit Analysis</button>'
    +'<div class="pd-result" id="pd-result"></div>'
    +'</div>';
  if(pdAnswered[idx]){
    document.getElementById('pd-result').className='pd-result show win';
    document.getElementById('pd-result').innerHTML='<strong style="color:var(--gn);">✓ Case already solved!</strong> You correctly identified the breach origin.';
  }
}

function selectDevice(id){
  pdSelected=id;
  document.querySelectorAll('.pd-device').forEach(function(d){ d.classList.remove('selected'); });
  var el=document.getElementById('pd-dev-'+id);
  if(el) el.classList.add('selected');
}

function submitPD(){
  if(!pdSelected){ alert('Click a device on the network diagram to select it as the breach origin.'); return; }
  var c=pdCases[pdActiveCaseIdx];
  var res=document.getElementById('pd-result');
  res.classList.remove('show','win','fail');
  if(pdSelected===c.answer){
    res.className='pd-result show win';
    res.innerHTML=c.winMsg;
    pdAnswered[pdActiveCaseIdx]=true;
    document.getElementById('pd-dev-'+pdSelected).classList.add('correct');
    var navBtn=document.getElementById('pd-nav-'+pdActiveCaseIdx);
    if(navBtn){ navBtn.classList.add('solved'); navBtn.classList.remove('active'); }
  } else {
    res.className='pd-result show fail';
    res.innerHTML='<strong style="color:var(--rd);">❌ Incorrect.</strong> '+c.failMsg;
    document.getElementById('pd-dev-'+pdSelected).classList.add('wrong');
  }
  res.scrollIntoView({behavior:'smooth',block:'nearest'});
}

initPacketDetective();

// ══════════ PHISHING GAME ══════════
var phEmails = [
  {
    id:0,
    from_name:'IT Security Team',
    from_email:'security-noreply@c0mpany-helpdesk.net',
    subject:'URGENT: Your account will be suspended in 24 hours',
    time:'8:47 AM',
    avatar:'🔒',
    avatar_bg:'rgba(244,63,94,.15)',
    preview:'Your account shows suspicious login attempts...',
    body:'Your corporate account has been flagged for suspicious activity. You must verify your credentials within 24 hours or your account will be permanently suspended.\n\nClick here to verify: <span class="link">http://corporate-verify.c0mpany-helpdesk.net/login</span>\n\nFailure to act will result in immediate account suspension.\n\n- IT Security Team',
    suspicious_field:'from_email',
    correct:'delete',
    explanation:'<strong>🚨 Delete / Obvious Phish.</strong> Multiple red flags: (1) The domain is "c0mpany-helpdesk.net" — not your company\'s domain. The letter O is replaced with a zero. (2) Real IT departments never threaten "permanent suspension" via email. (3) The link points to a third-party domain, not your company\'s. (4) Urgency + threat = social engineering tactics. <strong>72% of data breaches begin with phishing emails exactly like this.</strong>',
    type:'delete'
  },
  {
    id:1,
    from_name:'Sarah Chen (CEO)',
    from_email:'sarah.chen@yourcompany.com',
    subject:'Quick favor — need help ASAP',
    time:'9:12 AM',
    avatar:'👔',
    avatar_bg:'rgba(59,130,246,.15)',
    preview:'Hi, are you free right now? I\'m in a meeting...',
    body:'Hi,\n\nI\'m currently in an important board meeting and can\'t talk. I need you to purchase 5x $200 Amazon gift cards ASAP for client appreciation gifts. It\'s urgent — please buy them at any nearby CVS or Walgreens and email me the redemption codes.\n\nI\'ll reimburse you as soon as I\'m out of the meeting. Please keep this between us for now.\n\nThanks,\nSarah',
    suspicious_field:null,
    correct:'phish',
    explanation:'<strong>🔶 Mark as Phish — CEO Gift Card Scam.</strong> This looks legitimate — the email address matches the CEO\'s real address. But this is a classic Business Email Compromise (BEC) scam. Red flags: (1) Requests gift card purchases — no legitimate business need requires this. (2) "Keep this between us" — isolates the target. (3) Urgency while CEO is "unavailable to talk." (4) Real executives use procurement systems for client gifts. <strong>BEC scams cost businesses $2.9 billion in 2023 (FBI IC3).</strong>',
    type:'phish'
  },
  {
    id:2,
    from_name:'Zoom',
    from_email:'no-reply@z00m-meetings.io',
    subject:'You have a Zoom meeting starting in 5 minutes',
    time:'9:58 AM',
    avatar:'📹',
    avatar_bg:'rgba(34,211,238,.1)',
    preview:'Your 10:00 AM standup is starting soon...',
    body:'Your scheduled meeting is starting in 5 minutes.\n\nMeeting: Daily Standup\nHost: Michael Torres\nTime: 10:00 AM EST\n\nJoin Meeting: <span class="link">https://z00m-meetings.io/j/84726381929?pwd=xKj2</span>\n\n— The Zoom Team\n\nUnsubscribe | Privacy Policy | Terms of Service',
    suspicious_field:'from_email',
    correct:'delete',
    explanation:'<strong>🚨 Delete — Typosquat Domain.</strong> Did you catch it? The email is from "z00m-meetings.io" not "zoom.us." Two zeros replace the O\'s in "Zoom." The link also uses the fake domain. This is a typosquatting attack — registering a lookalike domain to harvest credentials. <strong>Only 3% of people spot this on their first read.</strong> Real Zoom notifications come from @zoom.us. When in doubt, navigate directly to zoom.us and check your meetings there.',
    type:'delete'
  },
  {
    id:3,
    from_name:'Marcus Williams',
    from_email:'m.williams@yourcompany.com',
    subject:'Re: Q4 Budget Review — updated spreadsheet attached',
    time:'10:34 AM',
    avatar:'👤',
    avatar_bg:'rgba(148,163,184,.1)',
    preview:'Hey, I updated the numbers you asked for...',
    body:'Hey,\n\nI updated the Q4 numbers you asked about in this morning\'s call. The spreadsheet is attached — I also fixed the formula errors in column F that were throwing off the totals.\n\nLet me know if you need anything else before the 3 PM review.\n\nMarcus',
    suspicious_field:null,
    correct:'reply',
    explanation:'<strong>✅ Safe to Reply.</strong> This email has no red flags. The sender domain matches your company, the context matches a prior conversation (the call), the request is reasonable, and there\'s no urgency or strange ask. The hallmarks of a safe internal email: known sender, matching domain, contextually appropriate request, no suspicious links or attachments demanding credentials. Always verify unexpected attachments, but this one is expected.',
    type:'reply'
  },
  {
    id:4,
    from_name:'Microsoft Security',
    from_email:'security@microsoft.com',
    subject:'Suspicious sign-in blocked from new device',
    time:'11:22 AM',
    avatar:'🪟',
    avatar_bg:'rgba(0,120,212,.15)',
    preview:'We blocked a sign-in attempt from Minsk, Belarus...',
    body:'Microsoft account\n\nWe blocked a suspicious sign-in attempt.\n\nAccount: your.name@company.com\nLocation: Minsk, Belarus\nDevice: Unknown Windows 11 device\nTime: 11:19 AM EST\n\nIf this was you, click here to confirm: <span class="link">https://account.microsoft.com/security</span>\n\nIf this wasn\'t you, your account may be compromised. Secure your account now.\n\n— Microsoft Account Team',
    suspicious_field:null,
    correct:'phish',
    explanation:'<strong>🔶 Mark as Phish — Verify Before Acting.</strong> This one is designed to fool you. The from address looks legitimate (microsoft.com), and the content is plausible. However: (1) You should NEVER click email links to verify security alerts — always navigate directly to account.microsoft.com in a new browser. (2) Real Microsoft security alerts don\'t ask you to click to "confirm" a blocked sign-in. (3) The correct response is to open a new tab and go directly to account.microsoft.com. Mark suspicious, report to IT, and verify directly. <strong>This exact email pattern was used in the 2022 Lapsus$ attacks.</strong>',
    type:'phish'
  },
  {
    id:5,
    from_name:'HR Team',
    from_email:'hr@yourcompany.com',
    subject:'Open Enrollment reminder — deadline Friday',
    time:'2:15 PM',
    avatar:'👥',
    avatar_bg:'rgba(0,224,122,.1)',
    preview:'Reminder: benefits open enrollment closes this Friday...',
    body:'Hi Team,\n\nThis is a reminder that benefits open enrollment closes this Friday at 5:00 PM EST.\n\nIf you\'d like to make changes to your health, dental, or vision coverage, please log in to the benefits portal at hr.yourcompany.com/benefits by Friday.\n\nIf you have questions, reply to this email or stop by HR on the 4th floor.\n\nThanks,\nHR Team',
    suspicious_field:null,
    correct:'reply',
    explanation:'<strong>✅ Safe — Legitimate Internal HR Email.</strong> All signals are clean: known internal sender domain, clear business purpose tied to a known event (open enrollment), link points to your own company\'s HR portal (hr.yourcompany.com), no urgency pressure tactics, offers multiple contact options including in-person. The gold standard of a legitimate internal communication.',
    type:'reply'
  }
];

var phState = {current:0, score:0, answers:[], viewing:null};

function initPhish(){
  phState = {current:0, score:0, answers:[], viewing:null};
  renderPhish();
}

function renderPhish(){
  var answered = phState.answers.length;
  var total = phEmails.length;
  if(answered===total && total>0){
    renderPhishFinal(); return;
  }
  var dots = phEmails.map(function(e,i){
    var cls='ph-prog-dot';
    if(i<answered){ cls+=' '+(phState.answers[i].correct?'correct':'wrong'); }
    else if(i===answered){ cls+=' current'; }
    return '<div class="'+cls+'"></div>';
  }).join('');
  var emails = phEmails.map(function(e,i){
    var isActive = i===(phState.viewing!==null?phState.viewing:answered);
    var isReviewed = i<answered;
    return '<div class="ph-email'+(isActive?' active':'')+(isReviewed?' reviewed':'')+'" onclick="viewEmail('+i+')">'
      +'<div class="ph-email-avatar" style="background:'+e.avatar_bg+';font-size:1rem;">'+e.avatar+'</div>'
      +'<div class="ph-email-meta">'
      +'<div class="ph-email-from">'+escHtml(e.from_name)+'</div>'
      +'<div class="ph-email-subject">'+escHtml(e.subject)+'</div>'
      +'<div class="ph-email-preview">'+escHtml(e.preview)+'</div>'
      +'</div>'
      +'<div class="ph-email-time">'+e.time+'</div>'
      +'</div>';
  }).join('');
  var viewIdx = phState.viewing!==null?phState.viewing:answered;
  var viewEmail = phEmails[viewIdx]||phEmails[0];
  var fromColor = viewEmail.suspicious_field==='from_email'?'suspicious':'';
  var domainParts = viewEmail.from_email.split('@');
  var fromHtml = escHtml(viewEmail.from_name)+' &lt;<span class="'+fromColor+'">'+escHtml(viewEmail.from_email)+'</span>&gt;';
  var isCurrentEmail = viewIdx===answered;
  var bodyHtml = viewEmail.body.replace(/\n/g,'<br>');
  var fbHtml = '';
  if(viewIdx<answered){
    var ans=phState.answers[viewIdx];
    var fbCls = ans.correct?'correct':(viewEmail.correct==='reply'&&ans.action==='phish'?'partial':'wrong');
    fbHtml='<div class="ph-feedback '+fbCls+' show">'+viewEmail.explanation+'</div>';
  }
  document.getElementById('phish-inner').innerHTML=
    '<div class="ph-progress">'+dots+'</div>'
    +'<div style="display:grid;grid-template-columns:280px 1fr;gap:14px;align-items:start;">'
    +'<div class="ph-inbox">'
    +'<div class="ph-inbox-header"><div class="ph-inbox-title">📥 Inbox ('+total+' emails)</div><div class="ph-score-display">'+answered+'/'+total+' reviewed</div></div>'
    +'<div class="ph-email-list">'+emails+'</div>'
    +'</div>'
    +'<div>'
    +'<div class="ph-viewer">'
    +(viewEmail?'<div class="ph-viewer-header"><div class="ph-field"><div class="ph-field-label">From</div><div class="ph-field-val">'+fromHtml+'</div></div><div class="ph-field"><div class="ph-field-label">Subject</div><div class="ph-field-val">'+escHtml(viewEmail.subject)+'</div></div><div class="ph-field"><div class="ph-field-label">Time</div><div class="ph-field-val" style="color:var(--dm);">'+viewEmail.time+'</div></div></div><div class="ph-body">'+bodyHtml+'</div>':'<div class="ph-viewer-placeholder">Select an email</div>')
    +'</div>'
    +fbHtml
    +(isCurrentEmail&&!fbHtml?'<div class="ph-actions"><button class="ph-action ph-action-reply" onclick="answerPhish(\'reply\')">✅ Reply — Safe</button><button class="ph-action ph-action-phish" onclick="answerPhish(\'phish\')">⚠️ Mark as Phish</button><button class="ph-action ph-action-delete" onclick="answerPhish(\'delete\')">🗑️ Delete — Obvious Fake</button></div>':'')
    +'</div>'
    +'</div>';
}

function viewEmail(idx){ phState.viewing=idx; renderPhish(); }

function answerPhish(action){
  var idx=phState.answers.length;
  var email=phEmails[idx];
  var correct=action===email.correct;
  if(!correct && email.correct==='phish' && action==='delete') correct=true; // delete also acceptable for phish
  phState.answers.push({action:action,correct:correct});
  if(correct) phState.score++;
  phState.viewing=idx;
  renderPhish();
}

function renderPhishFinal(){
  var pct=Math.round((phState.score/phEmails.length)*100);
  var grade=pct>=90?'A+ Security Awareness Expert':pct>=75?'B+ Strong Detection Skills':pct>=60?'C Average — Room to Improve':'D — You Got Phished. A lot.';
  var msg=pct>=90?'Outstanding! You spotted every deceptive indicator including the typosquat domain and the BEC gift card scam. You think like a security analyst.':pct>=75?'Good instincts! You caught most threats. Review the ones you missed — the subtle BEC and lookalike domain attacks trip up even experienced users.':pct>=60?'You\'re getting there. The subtler attacks (CEO gift cards, Microsoft lookalike) are specifically designed to bypass your instincts. Practice and pattern recognition are key.':'Attackers would have a field day. But that\'s OK — you now know their playbook. The domain substitution tricks (z00m, micros0ft) are designed to fool everyone on first glance. Keep practicing.';
  document.getElementById('phish-inner').innerHTML=
    '<div class="ph-final">'
    +'<div class="ph-final-score" style="color:'+(pct>=80?'var(--gn)':pct>=60?'var(--am)':'var(--rd)')+'">'+phState.score+'/'+phEmails.length+'</div>'
    +'<div class="ph-final-grade">'+grade+'</div>'
    +'<div class="ph-final-msg">'+msg+'</div>'
    +'<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">'
    +'<button class="r-retry-btn primary" onclick="initPhish()" style="display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:8px;font-family:var(--fd);font-size:.78rem;font-weight:700;cursor:pointer;border:none;background:linear-gradient(135deg,var(--bl),var(--pu));color:#fff;">↺ Play Again</button>'
    +'<button class="r-retry-btn" onclick="showDomain(\'soc\')" style="display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:8px;font-family:var(--fd);font-size:.78rem;font-weight:700;cursor:pointer;border:1px solid var(--bd);background:rgba(255,255,255,.025);color:var(--mt);">🛡️ SOC Career Guide</button>'
    +'<button class="r-retry-btn" onclick="switchGame(\'ctf\')" style="display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:8px;font-family:var(--fd);font-size:.78rem;font-weight:700;cursor:pointer;border:1px solid var(--bd);background:rgba(255,255,255,.025);color:var(--mt);">🚩 Try CTF Challenge</button>'
    +'</div>'
    +'</div>';
}

function switchGame(g){
  ['ctf','packet','phish'].forEach(function(id){
    document.getElementById('game-'+id).classList.toggle('active',id===g);
    document.getElementById('gtab-'+id).classList.toggle('active',id===g);
  });
  if(g==='phish' && phState.answers.length===0) initPhish();
}

initPhish();

// ══════════ RESUME ROASTER JS ══════════
var rFile=null, rBase64=null, rMime=null;
var rStepTimers=[];

var rDz=document.getElementById('r-dropzone');
var rFi=document.getElementById('r-file-input');
if(rDz){
  rDz.addEventListener('dragover',function(e){e.preventDefault();rDz.classList.add('drag-over');});
  rDz.addEventListener('dragleave',function(){rDz.classList.remove('drag-over');});
  rDz.addEventListener('drop',function(e){e.preventDefault();rDz.classList.remove('drag-over');var f=e.dataTransfer.files[0];if(f)rHandleFile(f);});
}
if(rFi) rFi.addEventListener('change',function(){if(rFi.files[0])rHandleFile(rFi.files[0]);});

function rHandleFile(f){
  var ext=f.name.split('.').pop().toLowerCase();
  if(!['pdf','doc','docx'].includes(ext)){rShowErr('Unsupported file','Please upload PDF, DOC, or DOCX.');return;}
  if(f.size>10*1024*1024){rShowErr('File too large','Max 10MB.');return;}
  rFile=f;
  var mime=f.type||(ext==='pdf'?'application/pdf':'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  rMime=mime;
  var reader=new FileReader();
  reader.onload=function(e){
    rBase64=e.target.result.split(',')[1];
    if(rDz) rDz.style.display='none';
    var fp=document.getElementById('r-file-preview');
    if(fp){
      fp.classList.add('show');
      document.getElementById('r-fp-name').textContent=f.name;
      var kb=Math.round(f.size/1024);
      document.getElementById('r-fp-size').textContent=(kb>1024?Math.round(kb/1024)+'MB':kb+'KB')+' · Ready';
      document.getElementById('r-fp-icon').textContent=ext==='pdf'?'📄':'📝';
    }
  };
  reader.readAsDataURL(f);
}

function rClearFile(){
  rFile=null;rBase64=null;rMime=null;
  if(rFi) rFi.value='';
  if(rDz) rDz.style.display='block';
  var fp=document.getElementById('r-file-preview');
  if(fp) fp.classList.remove('show');
}

function rShowErr(title,msg){
  var eb=document.getElementById('r-err');
  if(!eb)return;
  document.getElementById('r-err-title').textContent=title;
  document.getElementById('r-err-msg').textContent=msg;
  eb.classList.add('show');
  setTimeout(function(){eb.classList.remove('show');},5000);
}

async function rSubmit(){
  document.getElementById('r-err').classList.remove('show');
  if(!rBase64){rShowErr('No file','Please upload your resume first.');return;}
  var domain=document.getElementById('r-domain').value;
  var tier=document.getElementById('r-tier').value;
  if(!domain){rShowErr('Select domain','Please select a target domain.');return;}
  if(!tier){rShowErr('Select tier','Please select a target tier.');return;}
  var jobTitle=document.getElementById('r-jobtitle').value.trim();
  var intensity=document.querySelector('input[name="rintensity"]:checked').value;
  document.getElementById('r-submit-btn').disabled=true;
  document.getElementById('r-loading').classList.add('show');
  rAnimSteps();
  var intensityInstr={
    'balanced':'Be balanced, honest, and constructive. Note strengths alongside weaknesses.',
    'brutal':'Be brutally direct. No sugarcoating. Call out every weakness clearly.',
    'gentle':'Lead with strengths. Frame weaknesses as growth opportunities. Be encouraging.'
  }[intensity];
  var systemPrompt='You are InfoSecDeck Resume Roaster — a senior cybersecurity hiring manager with 20+ years experience. '+intensityInstr+'\n\nRespond with ONLY valid JSON, no markdown, no preamble:\n{\n  "score": <0-100>,\n  "grade": "<A+/A/A-/B+/B/B-/C+/C/C-/D+/D/F>",\n  "grade_label": "<one-line verdict>",\n  "verdict": "<1-sentence punch>",\n  "summary": "<2-3 sentence assessment>",\n  "dimensions": [\n    {"name":"Relevant Experience","score":<0-100>,"note":"<1-2 sentences>"},\n    {"name":"Technical Skills Match","score":<0-100>,"note":"<1-2 sentences>"},\n    {"name":"Certifications","score":<0-100>,"note":"<1-2 sentences>"},\n    {"name":"Impact & Quantification","score":<0-100>,"note":"<1-2 sentences>"},\n    {"name":"Keywords & ATS","score":<0-100>,"note":"<1-2 sentences>"},\n    {"name":"Formatting & Clarity","score":<0-100>,"note":"<1-2 sentences>"}\n  ],\n  "feedback": [\n    {"type":"<critical|warning|tip|strength>","title":"<short title>","body":"<2-4 sentences specific to resume>","quote":"<excerpt or empty string>"}\n  ],\n  "actions": [\n    {"text":"<start with a verb>","priority":"<high|med|low>"}\n  ]\n}\nRules: 5-8 feedback items, 5-8 actions. Be SPECIFIC. Most resumes score 40-75. 80+ is genuinely strong.';
  var userMsg='Analyze this resume for:\nTarget Domain: '+domain+'\nTarget Tier: '+tier+(jobTitle?'\nJob Title: '+jobTitle:'')+'\n\nReturn complete JSON analysis.';
  try{
    var resp=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:2000,system:systemPrompt,messages:[{role:'user',content:[{type:'document',source:{type:'base64',media_type:rMime,data:rBase64}},{type:'text',text:userMsg}]}]})});
    if(!resp.ok){var eb=await resp.text();throw new Error('API '+resp.status+': '+eb.slice(0,200));}
    var data=await resp.json();
    var raw=data.content.map(function(c){return c.text||'';}).join('');
    var jt=raw.replace(/^```json\s*/,'').replace(/^```\s*/,'').replace(/\s*```$/,'').trim();
    var result;
    try{result=JSON.parse(jt);}catch(pe){var m=raw.match(/\{[\s\S]*\}/);if(m)result=JSON.parse(m[0]);else throw new Error('Parse failed: '+raw.slice(0,200));}
    rClearSteps();
    document.getElementById('r-loading').classList.remove('show');
    rRenderResults(result,domain,tier);
  }catch(err){
    rClearSteps();
    document.getElementById('r-loading').classList.remove('show');
    document.getElementById('r-submit-btn').disabled=false;
    rShowErr('Analysis failed',err.message||'Please try again.');
  }
}

function rAnimSteps(){
  var ids=['rs1','rs2','rs3','rs4'];
  var delays=[0,3500,7000,11000];
  ids.forEach(function(id,i){
    rStepTimers.push(setTimeout(function(){
      ids.forEach(function(s){var e=document.getElementById(s);if(e){e.classList.remove('active');}});
      if(i>0){var prev=document.getElementById(ids[i-1]);if(prev)prev.classList.add('done');}
      var cur=document.getElementById(id);if(cur)cur.classList.add('active');
    },delays[i]));
  });
}
function rClearSteps(){rStepTimers.forEach(clearTimeout);rStepTimers=[];}

function rRenderResults(r,domain,tier){
  document.getElementById('r-results').classList.add('show');
  document.getElementById('r-results').scrollIntoView({behavior:'smooth',block:'start'});
  var score=Math.max(0,Math.min(100,r.score||0));
  var circ=345;
  var offset=circ-(score/100)*circ;
  var col=score>=80?'var(--gn)':score>=65?'var(--lb)':score>=50?'var(--am)':score>=35?'var(--or)':'var(--rd)';
  var fg=document.getElementById('r-ring-fg');
  if(fg){fg.style.stroke=col;fg.style.strokeDasharray=circ;fg.style.strokeDashoffset=circ;setTimeout(function(){fg.style.strokeDashoffset=offset;},100);}
  var pctEl=document.getElementById('r-pct');if(pctEl){pctEl.textContent=score+'%';pctEl.style.color=col;}
  var grEl=document.getElementById('r-grade');if(grEl){grEl.textContent=r.grade||'?';grEl.style.color=col;}
  var vEl=document.getElementById('r-verdict');if(vEl)vEl.textContent=r.verdict||'';
  var sEl=document.getElementById('r-summary');if(sEl)sEl.textContent=r.summary||'';
  var metaEl=document.getElementById('r-meta-pills');
  if(metaEl)metaEl.innerHTML=['🎯 '+domain.split('(')[0].trim(),'📊 '+(tier.split('—')[1]||tier).split('(')[0].trim()].map(function(t){return '<span class="r-meta-pill">'+t+'</span>';}).join('');
  var dc=function(s){return s>=80?'var(--gn)':s>=65?'var(--lb)':s>=50?'var(--am)':s>=35?'var(--or)':'var(--rd)';};
  var dg=document.getElementById('r-dims-grid');
  if(dg)dg.innerHTML=(r.dimensions||[]).map(function(d){var s=d.score||0;var c=dc(s);return '<div class="r-dim"><div class="r-dim-hdr"><div class="r-dim-name">'+d.name+'</div><div class="r-dim-score" style="color:'+c+'">'+s+'/100</div></div><div class="r-dim-bar"><div class="r-dim-fill" data-t="'+s+'%" style="width:0;background:'+c+';"></div></div><div class="r-dim-note">'+d.note+'</div></div>';}).join('');
  setTimeout(function(){document.querySelectorAll('.r-dim-fill').forEach(function(el){el.style.width=el.getAttribute('data-t');});},200);
  var tm={'critical':'⚠️ Critical','warning':'🔶 Warning','tip':'💡 Tip','strength':'✅ Strength'};
  var fl=document.getElementById('r-fb-list');
  if(fl)fl.innerHTML=(r.feedback||[]).map(function(f){var t=f.type||'tip';var q=f.quote?'<div class="r-fb-quote">"'+f.quote+'"</div>':'';return '<div class="r-fb-item '+t+'"><div class="r-fb-hdr"><span class="r-fb-badge">'+tm[t]+'</span><div class="r-fb-title">'+f.title+'</div></div><div class="r-fb-body">'+f.body+'</div>'+q+'</div>';}).join('');
  var pl={'high':'🔴 High','med':'🟡 Med','low':'🔵 Low'};
  var al=document.getElementById('r-action-list');
  if(al)al.innerHTML=(r.actions||[]).map(function(a,i){var p=a.priority||'med';return '<div class="r-action"><div class="r-action-n">'+(i+1)+'</div><div class="r-action-txt">'+a.text+'</div><div class="r-action-pri '+p+'">'+pl[p]+'</div></div>';}).join('');
}

function rReset(){
  rClearFile();
  document.getElementById('r-results').classList.remove('show');
  document.getElementById('r-submit-btn').disabled=false;
  document.getElementById('r-loading').classList.remove('show');
  ['rs1','rs2','rs3','rs4'].forEach(function(id){var e=document.getElementById(id);if(e){e.classList.remove('active','done');}});
  window.scrollTo({top:0,behavior:'smooth'});
}

// ══════════ BLOG JS ══════════
var POSTS = {
  'welcome': {
    title: 'Welcome to InfoSecDeck — What We\'re Building and Why',
    date: 'February 2026', tag: 'Site Update',
    body: '<p>InfoSecDeck started as a simple question: why is there no single place online that maps out an entire cybersecurity career — from first job to CISO — with real salary data, honest certification advice, and interactive tools?</p><p>Most cybersecurity career resources fall into one of two traps: they\'re either too broad or too narrow. Neither actually helps you understand the landscape, choose a specialization, or navigate the career ladder.</p><p>InfoSecDeck is built to be the resource we wish existed when we were starting out. Every salary range is sourced from real data — BLS, Glassdoor, Motion Recruitment, and Levels.fyi. Every certification placement in the grid reflects actual job posting requirements, not what the certification vendor claims.</p><p>We\'re building this in public, adding features based on community feedback. The Resume Roaster, Security Challenges, and Career Quiz are all live. The Blog is our way of sharing ongoing insights, updates, and the reasoning behind our decisions.</p><p>If you have feedback or suggestions — the <a href="#" onclick="showPage(\'reviews\');closePost();" style="color:var(--bl);">Reviews page</a> is always open.</p>'
  },
  'cert-roadmap-2025': {
    title: 'The 2025 Cybersecurity Cert Roadmap: What\'s Changed, What\'s New',
    date: 'January 2026', tag: 'Certifications',
    body: '<p>2025 was a significant year for certification updates. Here\'s what actually changed and what it means for your study plan.</p><h3 style="margin:20px 0 8px;font-size:1rem;">CompTIA Security+ SY0-701</h3><p>The SY0-701 update shifted focus toward cloud security, zero trust architecture, and automation. If you\'re studying from SY0-601 materials, you need to update your resources.</p><h3 style="margin:20px 0 8px;font-size:1rem;">ISACA CISM Updates</h3><p>ISACA refreshed the CISM job practice analysis, placing greater weight on governance. CISM holders are expected to be security leaders, not hands-on engineers.</p><h3 style="margin:20px 0 8px;font-size:1rem;">OffSec OSCP+ (PEN-200)</h3><p>The OSCP update introduced Active Directory attack scenarios as a required component. Budget additional study time for AD attack chains.</p><p>For the full certification roadmap organized by domain and career stage, see the <a href="#" onclick="showPage(\'certs\');closePost();" style="color:var(--bl);">Certs &amp; Training page</a>.</p>'
  },
  'iam-hottest': {
    title: 'Why IAM Is the Hottest Cybersecurity Domain You\'re Probably Ignoring',
    date: 'January 2026', tag: 'Career Paths',
    body: '<p>Everyone wants to be a penetration tester. Meanwhile, IAM engineers are commanding $160K+ and companies can\'t hire them fast enough.</p><p>IAM is the foundational layer of modern enterprise security. With the shift to cloud, zero trust, and SaaS-heavy infrastructure, every organization needs engineers who can configure Okta, manage Azure Entra ID, implement PAM via CyberArk or BeyondTrust, and build out identity governance programs. Supply is nowhere near demand.</p><h3 style="margin:20px 0 8px;font-size:1rem;">The Numbers</h3><p>IAM engineers at mid-level (Tier 3) regularly command $130K–$165K. Senior IAM architects at Tier 4 frequently see $175K–$220K. Principal/Staff IAM Architects at large tech companies can exceed $280K total compensation.</p><h3 style="margin:20px 0 8px;font-size:1rem;">How to Break In</h3><p>Start with SC-900 for fundamentals, then SC-300 for Entra ID. Get hands-on with Okta\'s free developer tenant. The CIAM certification provides vendor-neutral credentialing.</p><p>See the full IAM domain breakdown on the <a href="#" onclick="showPage(\'domains\');showDomain(\'iam\');closePost();" style="color:var(--bl);">Domains page</a>.</p>'
  },
  'resume-mistakes': {
    title: 'The 7 Resume Mistakes That Get Cybersecurity Candidates Rejected',
    date: 'February 2026', tag: 'Resume & Job Search',
    body: '<p>After powering hundreds of Resume Roaster analyses, these are the most common patterns that cause strong candidates to get screened out before the first call.</p><ol style="padding-left:20px;line-height:2.2;color:#94a3b8;font-size:.85rem;"><li><strong style="color:var(--tx);">No quantified impact.</strong> \"Managed SIEM\" means nothing. \"Reduced false positive alert volume by 40% through custom detection rule tuning\" gets callbacks.</li><li><strong style="color:var(--tx);">Certs buried at the bottom.</strong> In cybersecurity, certifications are primary screening criteria. List them prominently.</li><li><strong style="color:var(--tx);">Missing domain keywords.</strong> ATS systems filter ruthlessly. A Cloud Security resume without \"IAM,\" \"zero trust,\" \"CSPM,\" and \"SIEM\" will be filtered before human eyes see it.</li><li><strong style="color:var(--tx);">Generic objective statements.</strong> Use a focused 2–3 sentence professional summary targeting your specific domain.</li><li><strong style="color:var(--tx);">No mention of tools.</strong> List the specific platforms: Splunk, Sentinel, CrowdStrike, Okta, CyberArk.</li><li><strong style="color:var(--tx);">Applying to wrong tier jobs.</strong> A Tier 1 resume applying for a Tier 3 role will always be rejected.</li><li><strong style="color:var(--tx);">One resume for all domains.</strong> A resume for SOC roles is different from one for GRC roles. Tailor it.</li></ol><p>Use the <a href="#" onclick="showPage(\'roaster\');closePost();" style="color:var(--bl);">Resume Roaster</a> to get a full AI-powered analysis against your target role.</p>'
  },
  'no-degree': {
    title: "Degree vs. Certs vs. Bootcamp: What Actually Gets You Hired in 2025",
    date: 'February 2026', tag: 'Career Advice',
    body: '<p>This is the most-asked question in cybersecurity career forums, and the answer is more nuanced than most people admit.</p><h3 style="margin:20px 0 8px;font-size:1rem;">What the Job Postings Actually Say</h3><p>Analysis of 1,200 cybersecurity job postings in late 2025 showed: 67% list a degree as \"preferred\" not \"required.\" Only 18% list it as a hard requirement — almost exclusively in government/DoD roles. However, 94% list specific certifications, and 78% list specific tools or platforms.</p><h3 style="margin:20px 0 8px;font-size:1rem;">The Tier Factor</h3><p>For Tier 1–2 roles, certifications matter far more than degrees. Security+, Google Cybersecurity cert, or a strong TryHackMe portfolio will outperform a generic CS degree with no hands-on experience. For Tier 4–5, degrees start mattering more — not because employers demand them, but because you\'re competing against candidates who have both.</p><h3 style="margin:20px 0 8px;font-size:1rem;">The Honest Answer</h3><p>A WGU cybersecurity degree (competency-based, includes 13 certs, ~$4,250/term) is probably the best ROI in higher education for cybersecurity today. But for most entry-level candidates, Google cert + Security+ + TryHackMe is faster and cheaper, and gets you hired first.</p><p>See our curated program recommendations on the <a href="#" onclick="showPage(\'certs\');closePost();" style="color:var(--bl);">Certs &amp; Training page</a>.</p>'
  },
  'soc-path': {
    title: 'From Zero to SOC Analyst: A 12-Month Roadmap',
    date: 'December 2025', tag: 'Career Paths',
    body: '<p>This is the most structured path to landing a Tier 1–2 SOC Analyst role for someone starting from zero. It\'s aggressive but achievable with consistent effort.</p><h3 style="margin:20px 0 8px;font-size:1rem;">Months 1–3: Foundations</h3><p>Start with the Google Cybersecurity Certificate on Coursera. Run through TryHackMe\'s Pre-Security path simultaneously. Set up a free Splunk account. Goal: understand what a SIEM does, what logs look like, and how alerts are generated.</p><h3 style="margin:20px 0 8px;font-size:1rem;">Months 4–6: Certification Prep</h3><p>Study for CompTIA Security+. This is non-negotiable — it\'s on 80%+ of SOC job postings. Work through TryHackMe\'s SOC Level 1 path simultaneously.</p><h3 style="margin:20px 0 8px;font-size:1rem;">Months 7–9: Specialize</h3><p>Start the Blue Team Labs BTL1 certification — hands-on phishing analysis, SIEM investigation, threat intel, digital forensics, and incident response. BTL1 immediately signals practical skills to SOC hiring managers.</p><h3 style="margin:20px 0 8px;font-size:1rem;">Months 10–12: Job Hunt</h3><p>Apply to Tier 1 SOC Analyst roles. Target MSSPs — they hire more entry-level analysts than any other employer type.</p><p>See the full SOC domain breakdown on the <a href="#" onclick="showPage(\'domains\');showDomain(\'soc\');closePost();" style="color:var(--bl);">Domains page</a>.</p>'
  }
};

function openPost(id){
  var post = POSTS[id];
  if(!post) return;
  var modal = document.getElementById('blog-modal');
  var content = document.getElementById('blog-post-content');
  if(!modal || !content) return;
  content.innerHTML = '<div style="font-family:var(--fm);font-size:.54rem;text-transform:uppercase;letter-spacing:.16em;color:var(--bl);margin-bottom:10px;">'+post.tag+' · '+post.date+'</div>'
    + '<h2 style="font-size:1.5rem;font-weight:800;letter-spacing:-.03em;line-height:1.2;margin-bottom:20px;">'+post.title+'</h2>'
    + '<div style="font-size:.85rem;color:#94a3b8;line-height:1.85;">'+post.body+'</div>';
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closePost(){
  var modal = document.getElementById('blog-modal');
  if(modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

// ══════════ MEGA-MENU DROPDOWNS ══════════
function toggleDrop(name) {
  var cat = document.getElementById('ncat-' + name);
  if (!cat) return;
  var isOpen = cat.classList.contains('open');
  closeAllDrops();
  if (!isOpen) {
    cat.classList.add('open');
    positionDrop(name);
  }
}

function positionDrop(name) {
  var drop = document.getElementById('ndrop-' + name);
  if (!drop) return;
  // Reset positioning first
  drop.style.left = '0';
  drop.style.right = 'auto';
  drop.style.transform = 'none';
  // Measure after it's visible (rAF ensures layout is done)
  requestAnimationFrame(function() {
    var rect = drop.getBoundingClientRect();
    var vw = window.innerWidth;
    if (rect.right > vw - 8) {
      // Clamp: shift left so right edge sits 8px from viewport edge
      var overflow = rect.right - (vw - 8);
      var currentLeft = parseFloat(drop.style.left) || 0;
      drop.style.left = Math.max(-rect.left + 8, currentLeft - overflow) + 'px';
    }
    if (rect.left < 8) {
      drop.style.left = (8 - rect.left + (parseFloat(drop.style.left)||0)) + 'px';
    }
  });
}

function closeAllDrops() {
  document.querySelectorAll('.ncat.open').forEach(function(el) {
    el.classList.remove('open');
  });
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('nav')) closeAllDrops();
});

function setActiveNav(pageId) {
  var pageToNav = {
    home:'home', ladder:'career', domains:'career', domain:'career',
    salary:'career', interview:'career', pivot:'career', quiz:'career',
    certs:'learn', training:'learn', homelab:'learn', glossary:'learn',
    roaster:'tools', games:'tools', tools:'tools', resume:'tools',
    threats:'intel', jobs:'intel', calendar:'intel',
    blog:'community', reviews:'community', about:'community', stories:'community',
    profile:'home'
  };
  var cat = pageToNav[pageId] || 'home';
  document.querySelectorAll('.ncbtn').forEach(function(b){ b.classList.remove('active'); });
  document.querySelectorAll('.ncat').forEach(function(el){ el.classList.remove('has-active'); });
  if (cat === 'home') {
    var h = document.querySelector('#ncat-home .ncbtn');
    if (h) h.classList.add('active');
  } else {
    var el = document.getElementById('ncat-' + cat);
    if (el) el.classList.add('has-active');
  }
}

// ══════════ MOBILE NAV ══════════
function toggleMobileNav(){
  var hb = document.getElementById('hamburger');
  var nl = document.getElementById('nlinks');
  if(!hb||!nl) return;
  var open = nl.classList.toggle('open');
  hb.classList.toggle('open', open);
}

function closeMobileNav(){
  var hb = document.getElementById('hamburger');
  var nl = document.getElementById('nlinks');
  if(hb) hb.classList.remove('open');
  if(nl) nl.classList.remove('open');
}

// Close mobile nav when clicking outside
document.addEventListener('click', function(e){
  var nav = document.querySelector('nav');
  if(nav && !nav.contains(e.target)){
    closeMobileNav();
  }
});


// ══════════ HOME LAB GUIDE ══════════
function toggleLabGuide(id){
  var guide=document.getElementById(id);
  if(!guide)return;
  var toggleEl=document.getElementById(id+'-toggle');
  var cardEl=guide.previousElementSibling;// search up for lab-card
  // find parent lab-card by traversing up
  var parent=guide;
  // toggle visibility
  var isOpen=guide.style.display!=='none'&&guide.style.display!=='';
  if(isOpen){
    guide.style.display='none';
    if(toggleEl)toggleEl.innerHTML='View Guide <span>&#9660;</span>';
    // find the corresponding card and remove open class
    var card=document.querySelector('[onclick="toggleLabGuide(\''+id+'\')"]');
    if(card)card.classList.remove('open');
  } else {
    guide.style.display='block';
    if(toggleEl)toggleEl.innerHTML='Close Guide <span>&#9650;</span>';
    var card=document.querySelector('[onclick="toggleLabGuide(\''+id+'\')"]');
    if(card)card.classList.add('open');
    setTimeout(function(){guide.scrollIntoView({behavior:'smooth',block:'nearest'});},60);
  }
}

// ══════════ GLOSSARY ══════════
var GLOSSARY = [
  {t:'2FA',d:'Two-Factor Authentication — requires exactly two verification factors. Often used interchangeably with MFA, though MFA technically encompasses three or more factors.'},
  {t:'AAA',d:'Authentication, Authorization, and Accounting — security framework for network access control. RADIUS and TACACS+ are standard AAA protocols used in enterprise network infrastructure.'},
  {t:'ACL',d:'Access Control List — rules that specify which users or systems are granted or denied access to a resource. Used in firewalls (network ACLs) and operating systems (file-system ACLs).'},
  {t:'AES',d:'Advanced Encryption Standard — symmetric encryption algorithm adopted by NIST in 2001. AES-128 and AES-256 are standard. The most widely deployed symmetric cipher globally, used in TLS, disk encryption, and VPNs.'},
  {t:'APT',d:'Advanced Persistent Threat — a prolonged, targeted cyberattack establishing long-term undetected presence. Often nation-state actors. Examples: APT28/Fancy Bear (Russia), APT41 (China), Lazarus Group (North Korea).'},
  {t:'ATO',d:'Authorization to Operate — formal permission for a federal system to operate despite known risks. Central to NIST RMF. Also: Account Takeover — when attackers gain unauthorized control of a user account.'},
  {t:'ATT&CK',d:'MITRE ATT&CK — a knowledge base of adversary tactics and techniques based on real-world observations. Organized by tactic (the goal) and technique (the method). Used for detection coverage mapping, threat hunting, and red team planning.'},
  {t:'Attack Surface',d:'The sum of all points where an attacker can attempt to enter or extract data. Reducing attack surface is a core security principle: disable unused services, close unnecessary ports, remove unused software.'},
  {t:'Backdoor',d:'A hidden method bypassing normal authentication. Can be developer-placed (maintenance) or attacker-inserted (persistence). Supply chain backdoors — inserted into software before distribution — are increasingly common.'},
  {t:'Blast Radius',d:'The scope of damage from a security compromise. Reduced by segmentation (containing lateral movement) and least privilege (limiting what a compromised account can access). A core concept in zero trust design.'},
  {t:'Blue Team',d:'The defensive security team responsible for protecting systems, detecting attacks, and responding to incidents. Works with Purple Team exercises against Red Team simulations.'},
  {t:'Botnet',d:'A network of compromised devices ("bots") controlled by an attacker. Used for DDoS attacks, spam campaigns, credential stuffing, and cryptomining. Controlled via C2 infrastructure.'},
  {t:'Bug Bounty',d:'A program paying security researchers for responsibly disclosing vulnerabilities. Platforms: HackerOne, Bugcrowd, Intigriti. Rewards range from $100 for low-severity to $1M+ for critical vulnerabilities in major tech companies.'},
  {t:'BYOD',d:'Bring Your Own Device — employees using personal devices for work. Security challenges: unmanaged endpoints, mixed personal/corporate data, no MDM control. Mitigated by MAM (Mobile Application Management) and containerization.'},
  {t:'C2 / C&C',d:'Command and Control — infrastructure used by attackers to communicate with compromised systems. Malware "beacons" to C2 servers for instructions. Modern C2 frameworks: Cobalt Strike, Sliver, Havoc, Brute Ratel.'},
  {t:'CAPTCHA',d:'Completely Automated Public Turing test to tell Computers and Humans Apart — challenges distinguishing humans from bots. Used against automated account creation and credential stuffing. Modern CAPTCHAs are increasingly bypassed by AI.'},
  {t:'CASB',d:'Cloud Access Security Broker — enforcement point between cloud users and cloud providers. Provides visibility into shadow IT, enforces DLP policies, detects anomalous cloud usage, and enables UEBA for cloud apps.'},
  {t:'Certificate Pinning',d:'Hardcoding an expected certificate or public key in an application. Prevents MITM attacks but complicates certificate rotation. Common in mobile apps. Can be bypassed with tools like Frida on non-jailbroken devices.'},
  {t:'CIA Triad',d:'Confidentiality (data accessible only to authorized parties), Integrity (data not tampered with), Availability (data accessible when needed). The foundational model of information security. All controls map to one or more of these properties.'},
  {t:'CISO',d:'Chief Information Security Officer — senior executive accountable for information security strategy, program, and risk posture. Average tenure: 2.5 years. Reports to CEO, CTO, CRO, or Board depending on organizational structure.'},
  {t:'Clickjacking',d:'Tricking users into clicking on transparent malicious elements overlaid on a legitimate page. Prevented by X-Frame-Options: DENY or SAMEORIGIN headers, and Content Security Policy frame-ancestors directive.'},
  {t:'CMDB',d:'Configuration Management Database — stores information about IT assets and their relationships. Essential for vulnerability management (asset context), incident response (blast radius), and change management (impact assessment).'},
  {t:'CSPM',d:'Cloud Security Posture Management — continuously monitors cloud environments for misconfigurations against security benchmarks. Tools: Wiz, Prisma Cloud, Orca, Microsoft Defender for Cloud. Detects publicly exposed storage, over-permissive IAM, missing encryption.'},
  {t:'CVE',d:'Common Vulnerabilities and Exposures — a standardized identifier for publicly known vulnerabilities (e.g., CVE-2021-44228 for Log4Shell). Managed by MITRE, funded by CISA. The universal language for vulnerability communication.'},
  {t:'CVSS',d:'Common Vulnerability Scoring System — rates vulnerability severity 0-10. Components: Base (intrinsic severity), Temporal (exploit maturity, patch availability), Environmental (your specific context). v3.1 is current standard.'},
  {t:'Cyber Kill Chain',d:'Lockheed Martin 7-stage attack model: Reconnaissance → Weaponization → Delivery → Exploitation → Installation → C2 → Actions on Objectives. Defenders disrupt attacks by severing any link in the chain.'},
  {t:'DDoS',d:'Distributed Denial of Service — flooding a target from many sources to exhaust resources. Types: Volumetric (bandwidth), Protocol (SYN flood), Application layer (HTTP flood). Mitigated by CDN scrubbing, Anycast routing, and rate limiting.'},
  {t:'Defense in Depth',d:'Layered security where multiple independent controls protect assets. Layers: perimeter, network, endpoint, application, data, identity. No single control assumed perfect. Modern interpretation includes cloud and identity layers.'},
  {t:'DLP',d:'Data Loss Prevention — tools detecting and preventing unauthorized data transmission. Operates at endpoint (DLP agents), network (inline inspection), and cloud (CASB integration). Scans for patterns: credit card numbers, SSNs, classified keywords.'},
  {t:'DMARC',d:'Domain-based Message Authentication, Reporting and Conformance — email authentication protocol building on SPF and DKIM. Tells receiving servers what to do with emails that fail authentication: none, quarantine, or reject.'},
  {t:'DMZ',d:'Demilitarized Zone — a network segment hosting externally accessible services between the internet and internal network. Provides a buffer zone. Standard architecture for web servers, email gateways, and VPN concentrators.'},
  {t:'Drive-by Download',d:'Malware silently downloaded when visiting a compromised website without any user action beyond page load. Exploits unpatched browser or plugin vulnerabilities. Largely mitigated by modern browser sandboxing.'},
  {t:'EDR',d:'Endpoint Detection and Response — security software providing continuous monitoring, threat detection, and response on endpoints. Market leaders: CrowdStrike Falcon, SentinelOne, Microsoft Defender for Endpoint. Replaces traditional antivirus.'},
  {t:'Encryption',d:'Encoding data so only authorized parties can read it. Symmetric (same key both ways — AES): fast, used for data. Asymmetric (key pair — RSA, ECC): slower, used for key exchange. TLS combines both: asymmetric handshake, then symmetric data transfer.'},
  {t:'Exploit',d:'Code or technique taking advantage of a vulnerability to cause unintended behavior. Exploit kits automate delivery against multiple vulnerabilities. Zero-day exploits target unpatched flaws. N-day exploits target patched but unupdated systems.'},
  {t:'FedRAMP',d:'Federal Risk and Authorization Management Program — standardized cloud service security assessment for U.S. federal agencies. Cloud providers must obtain FedRAMP authorization before selling to federal customers.'},
  {t:'FIDO2',d:'Fast Identity Online 2 — passwordless authentication standard using public-key cryptography. Phishing-resistant because authentication is origin-bound (won\'t work on fake domains). Hardware keys (YubiKey) and passkeys both implement FIDO2.'},
  {t:'Firewall',d:'Controls network traffic based on security rules. Types: packet filtering (Layer 3/4), stateful inspection (tracks connections), proxy/application (Layer 7), NGFW (adds DPI, app-ID, IPS). Zero trust has reduced the primacy of perimeter firewalls.'},
  {t:'Forensics',d:'Digital forensics: collecting, preserving, and analyzing digital evidence. Subdisciplines: computer, network, mobile, cloud, and memory forensics. Chain of custody is essential for legal admissibility. Core tools: Autopsy, Volatility, Cellebrite.'},
  {t:'GRC',d:'Governance, Risk, and Compliance — integrated framework for security governance, risk management, and regulatory adherence. GRC professionals bridge technical security and business/legal requirements. Key frameworks: NIST RMF, ISO 27001, SOC 2.'},
  {t:'Hash Function',d:'One-way mathematical function producing fixed-length output from any input. SHA-256 and SHA-3 are current standards. MD5 and SHA-1 are deprecated. Used for: integrity verification, password storage, digital signatures, and file identification.'},
  {t:'Honeypot',d:'A decoy system designed to attract attackers. Provides early warning of attacks, threat intelligence about attacker techniques, and wastes attacker time. Legal considerations apply when actively gathering attacker data. Honeynets are networks of honeypots.'},
  {t:'IAM',d:'Identity and Access Management — ensuring the right people have the right access at the right time. Encompasses: authentication, authorization, provisioning, governance (IGA), and privileged access (PAM). The identity perimeter is the new network perimeter.'},
  {t:'IDS',d:'Intrusion Detection System — passively monitors for suspicious patterns and generates alerts. Host-based (HIDS) monitors one system. Network-based (NIDS) monitors traffic. Does not block — generates alerts for analyst review.'},
  {t:'IGA',d:'Identity Governance and Administration — managing user access across applications, enforcing policy, and conducting access certifications (reviews). Tools: SailPoint IdentityNow, Saviynt, Omada. Distinct from PAM but complementary.'},
  {t:'Incident Response',d:'The organized process of preparing for, detecting, containing, eradicating, and recovering from security incidents. NIST SP 800-61 defines the lifecycle. Documented IR playbooks are critical — incident time is not the time to figure out process.'},
  {t:'Insider Threat',d:'Security risk from within the organization. Types: malicious (intentional harm — data theft, sabotage), negligent (accidental — clicking phishing links, misconfiguration), and compromised (account taken over externally). Requires different controls than external threats.'},
  {t:'IoT Security',d:'Securing Internet of Things devices with limited processing power and often poor security controls. Common issues: default credentials, unpatched firmware, no encryption, no update mechanism. Botnet recruitment is the most common IoT compromise outcome.'},
  {t:'IPS',d:'Intrusion Prevention System — inline active control that monitors and blocks malicious traffic in real time. Sits in the traffic path. False positives can disrupt legitimate traffic. Often integrated into NGFW.'},
  {t:'ISO 27001',d:'International standard for Information Security Management Systems (ISMS). Organizations can certify to demonstrate systematic information security risk management. Requires: risk assessment, Statement of Applicability, and continuous improvement.'},
  {t:'Jailbreaking',d:'Removing software restrictions on a device (iOS/Android) to install unauthorized apps or gain root access. Security risks: bypasses OS security controls, prevents automatic updates, exposes to malware through unofficial app stores.'},
  {t:'Kerberoasting',d:'Active Directory attack: requesting Kerberos service tickets for service accounts then cracking them offline. Service account passwords are often old and weak. Detection: anomalous TGS-REQ events (ID 4769) for atypical service accounts.'},
  {t:'Keylogger',d:'Malware recording keystrokes to capture credentials, credit cards, and sensitive data. Can be hardware (physical device on keyboard cable) or software (kernel driver or user-space hook). Detected by EDR behavioral analysis.'},
  {t:'Lateral Movement',d:'Techniques attackers use to progressively move through a network after initial access. Goal: reach high-value targets (domain controllers, data stores). Techniques: Pass-the-Hash, PsExec, WMI, RDP, SSH, and Living-off-the-land binaries.'},
  {t:'LDAP',d:'Lightweight Directory Access Protocol — protocol for accessing directory information services. Used to query Active Directory and other LDAP-compatible directories. LDAP injection is a vulnerability class analogous to SQL injection.'},
  {t:'Least Privilege',d:'Users, systems, and processes should have only the minimum access needed. Reduces blast radius of compromised accounts. Implementation: RBAC, periodic access reviews, just-in-time access, no shared accounts.'},
  {t:'Log4Shell',d:'CVE-2021-44228 — critical RCE in Apache Log4j Java logging library. Exploited via JNDI injection in any logged string. CVSS 10.0. One of the most widespread vulnerabilities in history due to Log4js prevalence in Java applications.'},
  {t:'LOLBAS',d:'Living Off the Land Binaries and Scripts — legitimate Windows system tools abused for malicious purposes. Examples: certutil (download files), regsvr32 (code execution), mshta (script execution). Harder to detect because theyre built-in tools.'},
  {t:'Malware',d:'Malicious software: viruses, worms, trojans, ransomware, spyware, adware, rootkits, wipers. Analyzed via static (reverse engineering) and dynamic (sandbox execution) techniques. Attribution via code similarities and TTP overlap.'},
  {t:'Man-in-the-Middle',d:'Attacker intercepts and potentially alters communications between two parties. Mitigated by TLS with proper certificate validation, HSTS, and certificate pinning. Common attack scenario: evil twin WiFi hotspot.'},
  {t:'MFA',d:'Multi-Factor Authentication — two or more verification factors. Phishing-resistant MFA (FIDO2/WebAuthn) is the gold standard. SMS-based MFA is better than nothing but vulnerable to SIM swapping. Push notification MFA is vulnerable to MFA fatigue attacks.'},
  {t:'MITRE ATT&CK',d:'A globally-maintained matrix of adversary TTPs observed in the real world. Used for: detection coverage analysis (ATT&CK Navigator), threat hunting hypothesis development, adversary emulation planning, and red team reporting.'},
  {t:'MSSP',d:'Managed Security Service Provider — outsources security monitoring and management. Typically handles T1 SOC operations 24/7. Common services: SIEM management, endpoint monitoring, vulnerability scanning. Quality varies significantly.'},
  {t:'NAC',d:'Network Access Control — enforces security policy before granting network access. Checks device compliance: MDM enrollment, AV status, patch level. Common platforms: Cisco ISE, Aruba ClearPass. 802.1X is the standard protocol.'},
  {t:'NGFW',d:'Next-Generation Firewall — advanced firewall with deep packet inspection, application identification, SSL/TLS inspection, integrated IPS, and user-identity awareness. Leaders: Palo Alto Networks, Fortinet, Check Point, Cisco Firepower.'},
  {t:'OAuth 2.0',d:'Authorization framework enabling apps to access resources on a users behalf without sharing credentials. Issues access tokens. "Login with Google/Facebook" is OAuth 2.0 + OIDC. OAuth itself is authorization only; OIDC adds authentication.'},
  {t:'OSINT',d:'Open Source Intelligence — gathering intelligence from publicly available sources: social media, job postings, Shodan, DNS records, GitHub, WHOIS, Wayback Machine. Essential for penetration test reconnaissance and threat actor profiling.'},
  {t:'OWASP',d:'Open Web Application Security Project — nonprofit producing the OWASP Top 10 (most critical web security risks), API Security Top 10, Mobile Top 10, testing guides, cheat sheets, and tools including OWASP ZAP.'},
  {t:'PAM',d:'Privileged Access Management — protects privileged accounts through credential vaulting, session recording, just-in-time access, and privileged account discovery. Platforms: CyberArk, BeyondTrust, Delinea. Compromised privileged accounts are the most dangerous breach scenario.'},
  {t:'Pass-the-Hash',d:'Attack technique using a captured password hash directly for authentication without knowing the plaintext. Exploits NTLM authentication. Mitigated by: Credential Guard, restricted admin mode, network segmentation, and tiered administrative model.'},
  {t:'Passkey',d:'A phishing-resistant passwordless credential based on FIDO2/WebAuthn. The private key never leaves the device. Authentication is cryptographically bound to the origin — won\'t work on phishing sites. Major platforms now support passkeys.'},
  {t:'Patch Management',d:'Systematic acquiring, testing, and deploying software patches. Critical security process — most breaches exploit known vulnerabilities with available patches. Best practice SLAs: critical patches within 24 hours, high within 7 days, medium within 30 days.'},
  {t:'Penetration Testing',d:'Simulated cyberattack requiring written authorization. Phases: reconnaissance, scanning, exploitation, post-exploitation, reporting. Types: black-box (no prior info), white-box (full info), gray-box (partial info). Produces findings with exploitation proof.'},
  {t:'Phishing',d:'Social engineering attacks via email tricking users into revealing credentials or installing malware. Subtypes: Spear phishing (targeted), Whaling (executives), Vishing (voice), Smishing (SMS). Business Email Compromise (BEC) is the costliest variant.'},
  {t:'PKI',d:'Public Key Infrastructure — framework for issuing, managing, distributing, and revoking digital certificates. Components: Certificate Authority (CA), Registration Authority, certificate repository. Underpins TLS, S/MIME, code signing, and client certificates.'},
  {t:'Port Scanning',d:'Probing a host for open network ports to identify running services. Standard tool: Nmap. Used in reconnaissance and vulnerability assessment. Scanning without authorization is illegal. Masscan handles large-scale internet scanning.'},
  {t:'Post-Exploitation',d:'Actions after initial system compromise: privilege escalation, lateral movement, persistence, data collection, exfiltration. Frameworks: Metasploit Meterpreter, Cobalt Strike Beacon. Post-exploitation is where most damage actually occurs.'},
  {t:'Purple Team',d:'Collaborative exercise where Red and Blue Teams work together. Red executes one technique at a time, Blue observes whether detection fires, failures immediately generate new detection engineering tasks. More efficient than traditional red vs. blue.'},
  {t:'Ransomware',d:'Malware encrypting victim files and demanding payment for decryption keys. Delivery: phishing, RDP brute force, unpatched vulnerabilities. Modern ransomware includes double extortion (data theft + encryption). Defense: offline backups, MFA, EDR, segmentation.'},
  {t:'RCE',d:'Remote Code Execution — vulnerability allowing attackers to execute arbitrary code on a remote system. Critical severity. Often the final step in an exploit chain. Most dangerous vulnerability class.'},
  {t:'Red Team',d:'Simulates adversary behavior to test defenses using realistic multi-stage attack chains. More advanced than penetration testing — includes social engineering, physical intrusion, and persistent adversary simulation. Goal: find gaps before real attackers do.'},
  {t:'Risk',d:'Potential for loss when a threat exploits a vulnerability. Risk = Threat × Vulnerability × Impact. Treatment options: Accept (document and monitor), Mitigate (add controls), Transfer (insurance), Avoid (don\'t do the activity). FAIR enables quantitative risk measurement.'},
  {t:'Rootkit',d:'Malware providing persistent, hidden access while concealing its presence. User-space rootkits hook OS APIs. Kernel rootkits modify the OS itself — hardest to detect. Firmware rootkits survive OS reinstalls. Detected with memory forensics and bootable scanners.'},
  {t:'SAML',d:'Security Assertion Markup Language — XML-based standard for exchanging authentication/authorization data between Identity Provider (IdP) and Service Provider (SP). Widely used for enterprise SSO. The dominant standard in traditional enterprise environments.'},
  {t:'SCIM',d:'System for Cross-domain Identity Management — standard protocol (REST API) for automating user provisioning and deprovisioning between identity providers and applications. Enables real-time sync. Eliminates manual provisioning and slow deprovisioning.'},
  {t:'SIEM',d:'Security Information and Event Management — aggregates and analyzes log data for real-time alerting, investigation, and compliance. Platforms: Splunk, Microsoft Sentinel, IBM QRadar, Elastic SIEM. Value comes from correlation rules and analyst expertise.'},
  {t:'SOAR',d:'Security Orchestration, Automation and Response — automates repetitive SOC tasks through playbooks. Platforms: Palo Alto XSOAR, Splunk SOAR, Microsoft Sentinel Logic Apps. Reduces MTTR and allows analysts to handle higher volume.'},
  {t:'SOC',d:'Security Operations Center — centralized team monitoring, detecting, analyzing, and responding to security incidents. Tier 1: alert triage. Tier 2: investigation. Tier 3: threat hunting and detection engineering. Follow-the-sun models provide 24/7 coverage.'},
  {t:'Social Engineering',d:'Psychological manipulation to trick people into divulging information or taking unsafe actions. Techniques: phishing, pretexting, baiting, tailgating, vishing, quid pro quo. The most effective attacks bypass technology and target humans directly.'},
  {t:'SQL Injection',d:'Inserting malicious SQL into input fields that gets executed by the database. Can result in data exfiltration, authentication bypass, or data destruction. Prevention: parameterized queries / prepared statements. Removing root cause, not just WAF filtering.'},
  {t:'SSO',d:'Single Sign-On — authenticate once, access multiple applications. Implemented via SAML, OIDC, or OAuth. Common platforms: Okta, Azure Entra ID, Ping Identity, OneLogin. Trade-off: SSO is also a single point of failure if the IdP is compromised.'},
  {t:'Supply Chain Attack',d:'Compromising a less-secure supplier to gain access to their customers. Examples: SolarWinds Orion (software update mechanism), XZ Utils (open source backdoor), 3CX (build environment). Increasingly popular because it scales across thousands of victims.'},
  {t:'Threat Actor',d:'Any person or group posing a cyber threat. Categories: Nation-states (most sophisticated, APT designation), Organized crime (financially motivated), Hacktivists (ideologically motivated), Insider threats, Script kiddies (low skill, opportunistic).'},
  {t:'Threat Intelligence',d:'Evidence-based knowledge about adversary capabilities, intentions, and infrastructure. Types: Strategic (trends, for executives), Operational (campaign details, for SOC managers), Tactical (IOCs, for analysts). Platforms: MISP, OpenCTI, Recorded Future.'},
  {t:'TLS',d:'Transport Layer Security — cryptographic protocol securing network communications. TLS 1.3 is current; 1.0 and 1.1 deprecated. TLS inspection (HTTPS inspection) decrypts traffic for security analysis, creating a man-in-the-middle that must be trusted.'},
  {t:'TTP',d:'Tactics, Techniques, and Procedures — the behavior of threat actors. Tactics (the goal), Techniques (the method), Procedures (specific implementation). Mapped in MITRE ATT&CK. TTPs are harder to change than IOCs — targeting TTPs yields more durable detection.'},
  {t:'Typosquatting',d:'Registering domains similar to legitimate ones (gooogle.com) to exploit typing mistakes. Also called cybersquatting or URL hijacking. Used for phishing and traffic hijacking. Also affects package managers — typosquatted npm/PyPI packages deliver malware.'},
  {t:'VPN',d:'Virtual Private Network — encrypts traffic between endpoints. Traditional VPNs grant broad network access once connected — a major security weakness. Modern zero trust architecture replaces VPN with ZTNA for application-level access control.'},
  {t:'Vulnerability',d:'A weakness in a system, application, or process exploitable by a threat actor. Classified by CVSS score. Remediation priority: patchable critical vulnerabilities with public exploits first. Not all vulnerabilities require immediate remediation — risk context matters.'},
  {t:'WAF',d:'Web Application Firewall — inspects HTTP/S traffic to protect web applications from SQLi, XSS, CSRF, DDoS, and bot attacks. Cloud WAFs: Cloudflare, AWS WAF, Akamai. On-premise: F5 ASM, Imperva. WAF is defense-in-depth, not a substitute for secure code.'},
  {t:'Whaling',d:'Highly targeted spear phishing aimed at senior executives. Often impersonates legal counsel, auditors, or regulators. Goal: wire fraud (Business Email Compromise), credential theft, or malware delivery. CEO fraud is a specific variant.'},
  {t:'XDR',d:'Extended Detection and Response — unifies detection and response across endpoints, networks, identity, cloud, and email into one platform. Goes beyond EDR by correlating signals across sources. Leaders: CrowdStrike, SentinelOne, Microsoft Defender XDR.'},
  {t:'XSS',d:'Cross-Site Scripting — injecting malicious scripts into content viewed by other users. Types: Reflected (URL-based, non-persistent), Stored (database-persisted — most dangerous), DOM-based (client-side). Prevention: output encoding context, CSP, HttpOnly cookies.'},
  {t:'Zero Day',d:'A vulnerability unknown to the vendor with no available patch. Defenders have had "zero days" to prepare. Highly valuable — nation-states pay millions for reliable zero-days. Once patched, becomes an N-day vulnerability (often still exploited at scale due to slow patching).'},
  {t:'Zero Trust',d:'Security model requiring verification for every access request regardless of location. "Never trust, always verify." Principles: verify explicitly, use least privilege, assume breach. Implemented via Conditional Access, ZTNA, micro-segmentation, and continuous monitoring.'},
  {t:'ZTNA',d:'Zero Trust Network Access — provides application-level access without exposing the network. Replaces traditional VPN. Users authenticate to a broker, which connects them only to specific authorized applications. Vendors: Zscaler, Prisma Access, Cloudflare Access.'}
  ,{t:'DNS Poisoning',d:'An attack that corrupts a DNS resolver cache with false records, redirecting users to malicious sites. Also called DNS cache poisoning. DNSSEC adds cryptographic validation to prevent this.'}
  ,{t:'Exfiltration',d:'The unauthorized transfer of data out of a compromised organization. Detection methods include DLP, unusual outbound traffic patterns, large DNS queries, and data staging in unusual locations.'}
  ,{t:'IOC',d:'Indicator of Compromise — forensic artifacts (IP addresses, file hashes, domain names, registry keys, URLs) that indicate a system has been breached. Shared via STIX/TAXII formats on threat intelligence platforms.'}
  ,{t:'NIST CSF',d:'NIST Cybersecurity Framework — a voluntary framework providing guidance for managing cybersecurity risk. Five functions: Identify, Protect, Detect, Respond, Recover. Widely adopted in the U.S. and internationally.'}
  ,{t:'Reconnaissance',d:'The information-gathering phase of an attack. Passive: OSINT without touching the target. Active: direct interaction with target systems. The first phase of the cyber kill chain.'}
  ,{t:'SolarWinds Attack',d:'A 2020 supply chain attack where Russian SVR hackers compromised SolarWinds Orion software updates, delivering malware to ~18,000 organizations including U.S. federal agencies. Redefined supply chain security awareness.'}
  ,{t:'Threat Hunting',d:'Proactive search for threats that have evaded automated detection. Hypothesis-driven — analyst forms a hypothesis based on threat intel or ATT&CK TTPs, then searches for evidence. Successful hunts become new automated detections.'}
];



function renderGlossary(terms) {
  var list = document.getElementById('glossary-list');
  if (!list) return;
  if (terms.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--mt);font-family:var(--fm);font-size:.7rem;">No terms found. Try a different search.</div>';
    return;
  }
  list.innerHTML = terms.map(function(item) {
    return '<div style="display:flex;gap:16px;padding:12px 16px;border-radius:8px;transition:background .15s;" onmouseover="this.style.background=\'rgba(255,255,255,.03)\'" onmouseout="this.style.background=\'transparent\'">'
      + '<div style="font-family:var(--fm);font-size:.65rem;font-weight:700;color:var(--lb);min-width:120px;padding-top:2px;letter-spacing:.05em;">' + item.t + '</div>'
      + '<div style="font-size:.82rem;color:#94a3b8;line-height:1.7;">' + item.d + '</div>'
      + '</div>';
  }).join('<div style="height:1px;background:var(--bd);margin:0 16px;"></div>');
}

function filterGlossary() {
  var q = (document.getElementById('glossary-search') || {}).value || '';
  q = q.toLowerCase();
  var filtered = q ? GLOSSARY.filter(function(item) {
    return item.t.toLowerCase().includes(q) || item.d.toLowerCase().includes(q);
  }) : GLOSSARY;
  renderGlossary(filtered);
}

// ══════════ INTERVIEW PREP TABS ══════════
function showInterview(domain) {
  var domains = ['soc','iam','cloud','grc','offensive','dfir'];
  domains.forEach(function(d) {
    var el = document.getElementById('iprep-' + d);
    if (el) el.style.display = d === domain ? 'block' : 'none';
  });
  document.querySelectorAll('.iprep-tab').forEach(function(btn) {
    btn.classList.toggle('active', btn.getAttribute('onclick') === 'showInterview(\'' + domain + '\')');
  });
}

document.addEventListener('DOMContentLoaded',function(){
  renderGlossary(GLOSSARY);
  filterSalary();
});

// ══════════ CAREER PIVOT ADVISOR ══════════
var PIVOT_TITLES = [
  // Tier 1
  'Help Desk Technician','IT Support Specialist','Desktop Support Analyst','Junior Systems Admin',
  // Tier 2
  'SOC Analyst I','Security Analyst I','Junior Penetration Tester','IT Risk Analyst',
  'Junior IAM Analyst','Cloud Support Engineer','Junior Security Engineer','GRC Analyst I',
  // Tier 3
  'SOC Analyst II','Security Engineer','IAM Engineer','Cloud Security Engineer',
  'Penetration Tester','AppSec Engineer','GRC Analyst II','Incident Responder',
  'Threat Intelligence Analyst','Digital Forensics Analyst','Identity Engineer',
  // Tier 4 IC
  'Senior SOC Analyst','Senior Security Engineer','Senior IAM Engineer',
  'Senior Cloud Security Engineer','Senior Penetration Tester','Senior AppSec Engineer',
  'Senior GRC Analyst','Senior DFIR Analyst','Security Architect','IAM Architect',
  'Cloud Security Architect','Red Team Lead','Threat Hunt Lead',
  // Tier 4 Mgmt
  'SOC Manager','Security Team Lead','IAM Team Lead','Security Engineering Manager',
  // Tier 5 IC
  'Principal Security Engineer','Staff Security Engineer','Distinguished Security Architect',
  'Principal IAM Architect','Principal Cloud Security Architect','Principal Red Team Operator',
  // Tier 5 Mgmt
  'Director of Security Engineering','Director of IAM','Director of Cloud Security',
  'Director of Red Team','Director of GRC','Director of SOC',
  // Tier 6
  'VP of Security','VP of Information Security','CISO','Chief Security Officer',
  'Deputy CISO','Fractional CISO',
  // Domain labels
  'IAM Engineer','SOC Analyst','Cloud Security Engineer','Penetration Tester',
  'AppSec Engineer','GRC Analyst','DFIR Analyst','Security Engineer',
  'Threat Hunter','Malware Analyst','Vulnerability Management Engineer'
];

var pivotExpSelected = '';
var pivotResumeBase64 = '';
var pivotResumeFilename = '';

function filterPivotDropdown(which) {
  var input = document.getElementById('pivot-' + which);
  var drop = document.getElementById('pivot-drop-' + which);
  var val = input.value.toLowerCase();
  var matches = val.length < 1 
    ? PIVOT_TITLES 
    : PIVOT_TITLES.filter(function(t){ return t.toLowerCase().includes(val); });
  renderPivotDrop(drop, matches, which);
  drop.classList.toggle('open', matches.length > 0);
}

function showPivotDrop(which) {
  var input = document.getElementById('pivot-' + which);
  var drop = document.getElementById('pivot-drop-' + which);
  var val = input.value.toLowerCase();
  var matches = val.length < 1 ? PIVOT_TITLES.slice(0,20) : PIVOT_TITLES.filter(function(t){ return t.toLowerCase().includes(val); });
  renderPivotDrop(drop, matches, which);
  drop.classList.toggle('open', matches.length > 0);
}

function renderPivotDrop(drop, items, which) {
  drop.innerHTML = items.slice(0,20).map(function(t) {
    return '<div class="pivot-drop-item" onmousedown="selectPivotTitle(\'' + which + '\',\'' + t.replace(/'/g,"\\'") + '\')">' + t + '</div>';
  }).join('');
}

function selectPivotTitle(which, title) {
  var input = document.getElementById('pivot-' + which);
  var drop = document.getElementById('pivot-drop-' + which);
  input.value = title;
  drop.classList.remove('open');
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('.pivot-combo-wrap')) {
    document.querySelectorAll('.pivot-dropdown').forEach(function(d){ d.classList.remove('open'); });
  }
});

function selectExp(btn, val) {
  pivotExpSelected = val;
  document.querySelectorAll('.pivot-exp-btn').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
}

function handlePivotResume(input) {
  var file = input.files[0];
  if (!file) return;
  pivotResumeFilename = file.name;
  var reader = new FileReader();
  reader.onload = function(e) {
    pivotResumeBase64 = e.target.result.split(',')[1];
    var zone = document.getElementById('pivot-upload-zone');
    var label = document.getElementById('pivot-upload-label');
    zone.classList.add('has-file');
    label.innerHTML = '<div style="font-size:1.2rem;margin-bottom:6px;">✅</div><div style="font-size:.82rem;color:var(--lb);">' + file.name + ' uploaded</div><div style="font-size:.7rem;color:var(--mt);margin-top:4px;">Resume will be used to personalize your pivot plan</div>';
  };
  reader.readAsDataURL(file);
}

async function runPivotAdvisor() {
  var fromTitle = document.getElementById('pivot-from').value.trim();
  var toTitle = document.getElementById('pivot-to').value.trim();
  
  if (!fromTitle || !toTitle) {
    alert('Please fill in both your current role and target role.');
    return;
  }
  if (!pivotExpSelected) {
    alert('Please select your years of experience.');
    return;
  }

  document.getElementById('pivot-submit').disabled = true;
  document.getElementById('pivot-results').style.display = 'none';
  document.getElementById('pivot-loading').style.display = 'block';

  var systemPrompt = 'You are an expert cybersecurity career coach with deep knowledge of all cybersecurity domains, job roles, and career paths. Give direct, specific, actionable advice. Format your response with clear sections using plain text headers (no markdown bold or asterisks). Use line breaks between sections. Be honest about challenges. Experience always matters more than certifications, though certs validate skills. Keep response under 600 words.';

  var expMap = {'0-2':'0–2 years','3-5':'3–5 years','6-9':'6–9 years','10+':'10+ years'};
  var expLabel = expMap[pivotExpSelected] || pivotExpSelected;
  
  var userMsg;
  var messages;

  if (pivotResumeBase64) {
    var mediaType = pivotResumeFilename.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    userMsg = 'I want to transition from ' + fromTitle + ' to ' + toTitle + '. I have ' + expLabel + ' of cybersecurity experience. Here is my resume. Please give me a detailed, personalized career pivot plan covering: 1) Skills I already have that transfer, 2) Key gaps I need to fill based on my actual experience, 3) Specific certifications to pursue (in priority order), 4) Realistic timeline, 5) Concrete first 3 steps to start this week.';
    messages = [{
      role: 'user',
      content: [
        {type: 'document', source: {type: 'base64', media_type: mediaType, data: pivotResumeBase64}},
        {type: 'text', text: userMsg}
      ]
    }];
  } else {
    userMsg = 'I want to transition from ' + fromTitle + ' to ' + toTitle + '. I have ' + expLabel + ' of cybersecurity experience. Please give me a career pivot plan covering: 1) Which skills likely transfer from my current role, 2) Key gaps I will need to fill, 3) Top 3 certifications to prioritize, 4) Realistic timeline for the transition, 5) Concrete first 3 steps to start this week.';
    messages = [{role: 'user', content: userMsg}];
  }

  try {
    var response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: messages
      })
    });
    var data = await response.json();
    var text = (data.content || []).map(function(b){ return b.type === 'text' ? b.text : ''; }).join('');
    
    document.getElementById('pivot-loading').style.display = 'none';
    document.getElementById('pivot-results').style.display = 'block';
    document.getElementById('pivot-results-title').textContent = fromTitle + ' → ' + toTitle;
    document.getElementById('pivot-results-sub').textContent = pivotResumeBase64 ? 'Personalized plan based on your resume' : 'General pivot plan — add your resume for a personalized assessment';
    document.getElementById('pivot-results-body').textContent = text;
    document.getElementById('pivot-submit').disabled = false;
    document.getElementById('pivot-results').scrollIntoView({behavior:'smooth',block:'start'});
  } catch(err) {
    document.getElementById('pivot-loading').style.display = 'none';
    document.getElementById('pivot-results-body').textContent = 'Error generating pivot plan. Please try again.';
    document.getElementById('pivot-results').style.display = 'block';
    document.getElementById('pivot-submit').disabled = false;
  }
}

// ══════════ SALARY TABLE ══════════
var SAL_CSS_ADDED = false;
function addSalCSS(){
  if(SAL_CSS_ADDED) return; SAL_CSS_ADDED=true;
  var s=document.createElement('style');
  s.textContent='.sal-th{font-family:var(--fm);font-size:.55rem;text-transform:uppercase;letter-spacing:.1em;padding:11px 14px;color:var(--mt);white-space:nowrap;}.sal-td{padding:11px 14px;font-size:.8rem;border-bottom:1px solid var(--bd);white-space:nowrap;}.sal-row:hover{background:rgba(255,255,255,.025);}.sal-filter{width:100%;padding:8px 12px;background:var(--sf2);border:1px solid var(--bd2);border-radius:8px;color:var(--tx);font-family:var(--fd);font-size:.8rem;outline:none;}.sal-filter-label{display:block;font-family:var(--fm);font-size:.55rem;text-transform:uppercase;letter-spacing:.1em;color:var(--mt);margin-bottom:6px;}.sal-bar{height:6px;border-radius:3px;background:linear-gradient(90deg,var(--bl),var(--pu));}';
  document.head.appendChild(s);
}

var SAL_DATA = [
  // ─ T1 Entry ─
  {title:'Help Desk Technician',domain:'Security Engineering',track:'IC',tier:'T1',min:38000,mid:48000,max:62000,desc:'First IT support role. Password resets, hardware triage, ticket queue. Pipeline into SOC Analyst and IAM Administrator.'},
  {title:'IT Support Specialist',domain:'Security Engineering',track:'IC',tier:'T1',min:40000,mid:52000,max:68000,desc:'Broader support covering endpoints, asset management, and basic network troubleshooting. Often the jumping-off point for security careers.'},
  {title:'Desktop Support Analyst',domain:'Security Engineering',track:'IC',tier:'T1',min:38000,mid:50000,max:65000,desc:'On-site or remote end-user support. Configures workstations, manages OS deployments, handles endpoint security basics.'},
  {title:'NOC Technician',domain:'SOC / IR',track:'IC',tier:'T1',min:42000,mid:54000,max:70000,desc:'Monitors network infrastructure 24/7. Responds to uptime alerts, escalates outages, documents incidents. Strong SOC pipeline.'},
  {title:'Junior IT Auditor',domain:'GRC',track:'IC',tier:'T1',min:45000,mid:57000,max:73000,desc:'Collects audit evidence, documents controls, assists in IT risk reviews. Best non-technical entry into GRC careers.'},
  // ─ T2 Early Career ─
  {title:'SOC Analyst I',domain:'SOC / IR',track:'IC',tier:'T2',min:55000,mid:70000,max:88000,desc:'Monitors SIEM alerts, triages incidents, escalates confirmed threats. The most common hands-on security entry point.'},
  {title:'Security Analyst I',domain:'SOC / IR',track:'IC',tier:'T2',min:58000,mid:73000,max:92000,desc:'Broad early-career role spanning log reviews, vulnerability scanning, and basic incident response.'},
  {title:'IAM Administrator',domain:'IAM',track:'IC',tier:'T2',min:60000,mid:75000,max:95000,desc:'Manages user accounts, group memberships, and access provisioning in Active Directory or Entra ID. High-demand entry IAM role.'},
  {title:'Junior Security Engineer',domain:'Security Engineering',track:'IC',tier:'T2',min:65000,mid:80000,max:100000,desc:'Assists with firewall rule management, vulnerability scanning, and security tooling maintenance.'},
  {title:'GRC Analyst I',domain:'GRC',track:'IC',tier:'T2',min:55000,mid:68000,max:85000,desc:'Supports compliance assessments, collects audit evidence, assists with policy documentation and risk register maintenance.'},
  {title:'IT Risk Analyst',domain:'GRC',track:'IC',tier:'T2',min:58000,mid:72000,max:90000,desc:'Identifies and assesses technology risks, maintains risk register, supports vendor reviews. Good pipeline to GRC Analyst.'},
  {title:'Cloud Support Engineer',domain:'Cloud Security',track:'IC',tier:'T2',min:62000,mid:78000,max:98000,desc:'Supports cloud infrastructure issues, assists with IAM configuration, monitors cloud security dashboards.'},
  {title:'Junior AppSec Engineer',domain:'AppSec',track:'IC',tier:'T2',min:65000,mid:80000,max:100000,desc:'Runs SAST/DAST scans, reviews code for common vulnerabilities, supports developer security training.'},
  {title:'Junior Penetration Tester',domain:'Offensive',track:'IC',tier:'T2',min:60000,mid:75000,max:95000,desc:'Conducts guided vulnerability assessments and basic pentests under senior oversight.'},
  {title:'Junior DFIR Analyst',domain:'DFIR',track:'IC',tier:'T2',min:58000,mid:72000,max:90000,desc:'Assists with evidence collection, log analysis, and basic forensic investigations.'},
  {title:'Vulnerability Analyst',domain:'Security Engineering',track:'IC',tier:'T2',min:58000,mid:72000,max:90000,desc:'Runs vulnerability scans with Nessus/Qualys, tracks findings, assists with patch prioritization reporting.'},
  {title:'Cybersecurity Analyst I',domain:'SOC / IR',track:'IC',tier:'T2',min:56000,mid:70000,max:88000,desc:'General security monitoring role covering SIEM triage, threat analysis, and basic incident response.'},
  {title:'Network Security Analyst',domain:'Security Engineering',track:'IC',tier:'T2',min:62000,mid:77000,max:96000,desc:'Monitors network traffic, manages firewall rules, analyzes IDS/IPS alerts. Bridges networking and security.'},
  {title:'Security Compliance Analyst',domain:'GRC',track:'IC',tier:'T2',min:55000,mid:68000,max:85000,desc:'Supports SOC 2, ISO 27001, and PCI DSS compliance activities. Collects evidence, tracks control status.'},
  {title:'Identity Specialist',domain:'IAM',track:'IC',tier:'T2',min:58000,mid:72000,max:91000,desc:'Manages SSO configurations, MFA enrollment, and basic identity lifecycle processes.'},
  {title:'Privacy Analyst',domain:'GRC',track:'IC',tier:'T2',min:54000,mid:67000,max:84000,desc:'Supports GDPR/CCPA compliance, assists with privacy impact assessments, maintains data mapping records.'},
  // ─ T3 Mid ─
  {title:'SOC Analyst II',domain:'SOC / IR',track:'IC',tier:'T3',min:80000,mid:97000,max:120000,desc:'Tier 2 escalation analyst handling complex incidents. Conducts deeper log analysis, malware triage, and initial forensics.'},
  {title:'IAM Engineer',domain:'IAM',track:'IC',tier:'T3',min:90000,mid:112000,max:138000,desc:'Designs and implements identity solutions — SSO, MFA, PAM, directory services. One of the most in-demand security specializations.'},
  {title:'Cloud Security Engineer',domain:'Cloud Security',track:'IC',tier:'T3',min:95000,mid:120000,max:148000,desc:'Implements cloud security controls across AWS/Azure/GCP. Manages CSPM, cloud IAM, and security monitoring.'},
  {title:'AppSec Engineer',domain:'AppSec',track:'IC',tier:'T3',min:90000,mid:115000,max:142000,desc:'Embeds security into the SDLC through code reviews, threat modeling, SAST/DAST tooling, and developer training.'},
  {title:'Penetration Tester',domain:'Offensive',track:'IC',tier:'T3',min:85000,mid:108000,max:135000,desc:'Conducts authorized network and web application penetration tests. Produces detailed findings and remediation reports.'},
  {title:'GRC Analyst II',domain:'GRC',track:'IC',tier:'T3',min:82000,mid:102000,max:128000,desc:'Leads risk assessments, manages compliance frameworks (SOC 2, ISO 27001, NIST), and conducts vendor reviews.'},
  {title:'Threat Intelligence Analyst',domain:'SOC / IR',track:'IC',tier:'T3',min:85000,mid:105000,max:130000,desc:'Collects, analyzes, and disseminates cyber threat intelligence. Maps adversary TTPs to ATT&CK, produces threat reports.'},
  {title:'DFIR Analyst',domain:'DFIR',track:'IC',tier:'T3',min:80000,mid:100000,max:125000,desc:'Conducts digital forensics investigations and incident response. Analyzes disk images, memory dumps, and log data.'},
  {title:'Security Engineer',domain:'Security Engineering',track:'IC',tier:'T3',min:88000,mid:110000,max:138000,desc:'Designs, deploys, and maintains security infrastructure including firewalls, EDR, SIEM, and network controls.'},
  {title:'Incident Responder',domain:'SOC / IR',track:'IC',tier:'T3',min:82000,mid:103000,max:128000,desc:'Leads incident response from detection through remediation. Coordinates containment, eradication, and recovery.'},
  {title:'Malware Analyst',domain:'DFIR',track:'IC',tier:'T3',min:85000,mid:107000,max:132000,desc:'Performs static and dynamic malware analysis. Reverse engineers binaries, extracts IOCs, and produces threat reports.'},
  {title:'Vulnerability Management Engineer',domain:'Security Engineering',track:'IC',tier:'T3',min:80000,mid:100000,max:125000,desc:'Runs enterprise vulnerability management programs. Prioritizes findings, tracks remediation, reports KPIs to leadership.'},
  {title:'Detection Engineer',domain:'SOC / IR',track:'IC',tier:'T3',min:88000,mid:112000,max:140000,desc:'Builds and maintains SIEM detection rules, Sigma signatures, and SOAR playbooks. Maps detections to MITRE ATT&CK.'},
  {title:'PAM Engineer',domain:'IAM',track:'IC',tier:'T3',min:88000,mid:110000,max:136000,desc:'Implements and administers privileged access management platforms (CyberArk, BeyondTrust). Manages credential vaulting and session recording.'},
  {title:'DevSecOps Engineer',domain:'AppSec',track:'IC',tier:'T3',min:92000,mid:118000,max:148000,desc:'Integrates security into CI/CD pipelines. Manages SAST, SCA, IaC scanning, and container security tooling.'},
  {title:'Threat Hunter',domain:'SOC / IR',track:'IC',tier:'T3',min:90000,mid:113000,max:140000,desc:'Proactively searches for threats that evade automated detection. Hypothesis-driven hunting using ATT&CK TTPs.'},
  {title:'Cloud IAM Engineer',domain:'IAM',track:'IC',tier:'T3',min:90000,mid:114000,max:142000,desc:'Manages cloud identity controls — AWS IAM roles, Azure Entra ID, GCP IAM. Implements least privilege at cloud scale.'},
  {title:'Security Automation Engineer',domain:'Security Engineering',track:'IC',tier:'T3',min:88000,mid:112000,max:140000,desc:'Builds security automation scripts and integrations. Uses Python, APIs, and SOAR platforms to reduce manual work.'},
  {title:'Privacy Engineer',domain:'GRC',track:'IC',tier:'T3',min:85000,mid:107000,max:133000,desc:'Implements privacy by design in products and systems. Conducts DPIAs, manages consent frameworks, and builds privacy tooling.'},
  {title:'OT/ICS Security Analyst',domain:'Security Engineering',track:'IC',tier:'T3',min:88000,mid:110000,max:138000,desc:'Secures operational technology and industrial control systems. Specialized expertise in SCADA, PLCs, and OT network protocols.'},
  {title:'Bug Bounty Hunter',domain:'Offensive',track:'IC',tier:'T3',min:50000,mid:95000,max:250000,desc:'Finds and reports vulnerabilities to companies through bug bounty programs. Income highly variable — top hunters earn $500K+.'},
  {title:'Security Consultant',domain:'Security Engineering',track:'IC',tier:'T3',min:85000,mid:108000,max:135000,desc:'Advises organizations on security posture, architecture, and compliance. Can be firm-employed or independent.'},
  // ─ T4 IC Senior ─
  {title:'Senior SOC Analyst',domain:'SOC / IR',track:'IC',tier:'T4',min:110000,mid:133000,max:162000,desc:'Handles the most complex incident investigations. Mentors junior analysts, leads detection content improvements.'},
  {title:'Senior IAM Engineer',domain:'IAM',track:'IC',tier:'T4',min:125000,mid:152000,max:185000,desc:'Owns identity infrastructure end-to-end. Leads Zero Trust access design, PAM rollouts, and IGA implementations.'},
  {title:'Senior Cloud Security Engineer',domain:'Cloud Security',track:'IC',tier:'T4',min:135000,mid:165000,max:200000,desc:'Leads cloud security posture management, designs multi-account security landing zones. Highest-demand senior role in 2025.'},
  {title:'Senior AppSec Engineer',domain:'AppSec',track:'IC',tier:'T4',min:128000,mid:157000,max:192000,desc:'Owns the application security program. Leads threat modeling, security reviews for major releases, and AppSec tooling strategy.'},
  {title:'Senior Penetration Tester',domain:'Offensive',track:'IC',tier:'T4',min:120000,mid:148000,max:182000,desc:'Leads complex engagements, manages junior testers, authors executive-level reports. May specialize in red team operations.'},
  {title:'Senior GRC Analyst',domain:'GRC',track:'IC',tier:'T4',min:112000,mid:138000,max:168000,desc:'Leads risk assessments, manages third-party risk program, drives audit readiness for multiple frameworks simultaneously.'},
  {title:'Senior DFIR Analyst',domain:'DFIR',track:'IC',tier:'T4',min:118000,mid:145000,max:178000,desc:'Leads breach investigations, performs advanced memory and disk forensics, produces executive-level post-incident reports.'},
  {title:'Senior Security Engineer',domain:'Security Engineering',track:'IC',tier:'T4',min:122000,mid:150000,max:185000,desc:'Designs and maintains complex security architectures. Leads tooling selection and security transformation initiatives.'},
  {title:'Threat Hunt Lead',domain:'SOC / IR',track:'IC',tier:'T4',min:125000,mid:155000,max:190000,desc:'Runs the threat hunting program. Develops hunting hypotheses, builds new detections, and mentors junior hunters.'},
  {title:'Red Team Lead',domain:'Offensive',track:'IC',tier:'T4',min:130000,mid:162000,max:200000,desc:'Leads internal red team operations. Designs adversary emulation scenarios, manages team cadence, reports to CISO.'},
  {title:'IAM Architect',domain:'IAM',track:'IC',tier:'T4',min:135000,mid:165000,max:205000,desc:'Designs enterprise identity architecture. Leads Zero Trust roadmap, IAM tool selection, and federation strategy.'},
  {title:'Cloud Security Architect',domain:'Cloud Security',track:'IC',tier:'T4',min:145000,mid:178000,max:220000,desc:'Sets cloud security architecture standards across all providers. Designs secure multi-account landing zones.'},
  {title:'Security Architect',domain:'Security Engineering',track:'IC',tier:'T4',min:140000,mid:172000,max:215000,desc:'Owns enterprise security architecture. Reviews system designs, defines standards, leads security transformation initiatives.'},
  {title:'Senior Detection Engineer',domain:'SOC / IR',track:'IC',tier:'T4',min:128000,mid:158000,max:195000,desc:'Highest-paid senior IC SOC role in 2025. Builds detection logic, writes Sigma rules and YARA signatures. $146K–$219K range.'},
  {title:'Senior Threat Intel Analyst',domain:'SOC / IR',track:'IC',tier:'T4',min:120000,mid:148000,max:182000,desc:'Produces strategic and operational threat intelligence reports. Manages TI platform, coordinates with law enforcement and ISACs.'},
  {title:'Senior DevSecOps Engineer',domain:'AppSec',track:'IC',tier:'T4',min:132000,mid:163000,max:200000,desc:'Leads DevSecOps program across engineering organization. Owns pipeline security tooling, developer security training, and policy.'},
  {title:'Senior PAM Engineer',domain:'IAM',track:'IC',tier:'T4',min:125000,mid:154000,max:188000,desc:'Leads enterprise PAM program. Architects credential vaulting, session recording, and just-in-time access across all privileged accounts.'},
  {title:'Senior OT/ICS Security Engineer',domain:'Security Engineering',track:'IC',tier:'T4',min:120000,mid:148000,max:182000,desc:'Leads OT security programs for critical infrastructure. Designs segmentation between IT and OT networks.'},
  {title:'Senior Malware Analyst',domain:'DFIR',track:'IC',tier:'T4',min:120000,mid:148000,max:184000,desc:'Advanced malware reverse engineering specialist. Analyzes nation-state implants, writes YARA rules, and produces detailed threat reports.'},
  // ─ T4 Management ─
  {title:'SOC Manager',domain:'SOC / IR',track:'Management',tier:'T4',min:115000,mid:142000,max:175000,desc:'Manages a team of SOC analysts across multiple tiers. Owns team metrics (MTTD, MTTR), hiring, and shift scheduling.'},
  {title:'Security Engineering Manager',domain:'Security Engineering',track:'Management',tier:'T4',min:130000,mid:162000,max:200000,desc:'Manages security engineering team. Owns technical security roadmap, hiring, and team performance.'},
  {title:'IAM Team Lead',domain:'IAM',track:'Management',tier:'T4',min:128000,mid:158000,max:195000,desc:'Leads a team of IAM engineers. Owns IAM program roadmap, vendor relationships, and team development.'},
  {title:'Compliance Manager',domain:'GRC',track:'Management',tier:'T4',min:108000,mid:135000,max:168000,desc:'Manages compliance program across multiple frameworks. Owns audit readiness, third-party risk, and policy governance.'},
  {title:'AppSec Manager',domain:'AppSec',track:'Management',tier:'T4',min:125000,mid:155000,max:192000,desc:'Leads application security team. Manages security champions program, tool procurement, and AppSec roadmap.'},
  {title:'DFIR Manager',domain:'DFIR',track:'Management',tier:'T4',min:120000,mid:148000,max:183000,desc:'Manages digital forensics and incident response team. Owns IR playbooks, forensic lab, and retainer relationships.'},
  {title:'Cloud Security Manager',domain:'Cloud Security',track:'Management',tier:'T4',min:130000,mid:162000,max:200000,desc:'Manages cloud security team. Owns CSPM operations, architecture reviews, and cloud compliance monitoring.'},
  {title:'Vulnerability Management Lead',domain:'Security Engineering',track:'Management',tier:'T4',min:115000,mid:142000,max:175000,desc:'Leads enterprise vulnerability management program. Manages team, coordinates remediation, and reports KPIs.'},
  {title:'Incident Response Lead',domain:'SOC / IR',track:'Management',tier:'T4',min:118000,mid:146000,max:180000,desc:'Leads IR team during active incidents. Develops runbooks, runs tabletop exercises, drives post-incident improvements.'},
  // ─ T5 Principal / Director IC ─
  {title:'Principal Security Engineer',domain:'Security Engineering',track:'IC',tier:'T5',min:160000,mid:198000,max:250000,desc:'Sets technical direction for multiple security domains. Works directly with VPs and CISO on multi-year strategy.'},
  {title:'Principal IAM Architect',domain:'IAM',track:'IC',tier:'T5',min:168000,mid:208000,max:265000,desc:'Designs identity architecture for the entire organization. Leads Zero Trust roadmap execution and enterprise SSO strategy.'},
  {title:'Principal Cloud Security Architect',domain:'Cloud Security',track:'IC',tier:'T5',min:175000,mid:218000,max:278000,desc:'Sets cloud security strategy across all providers. $230K–$384K at large tech firms. Extremely high demand.'},
  {title:'Staff AppSec Engineer',domain:'AppSec',track:'IC',tier:'T5',min:162000,mid:202000,max:258000,desc:'Drives AppSec direction across engineering organization. Owns secure architecture patterns and developer security program.'},
  {title:'Distinguished Security Engineer',domain:'Security Engineering',track:'IC',tier:'T5',min:200000,mid:280000,max:400000,desc:'Rare, prestigious IC title. Company-wide technical leadership; external-facing thought leader. Equivalent influence to VP.'},
  {title:'Staff Detection Engineer',domain:'SOC / IR',track:'IC',tier:'T5',min:165000,mid:205000,max:258000,desc:'Sets detection engineering standards across the SOC. Leads threat hunting program and ATT&CK coverage strategy.'},
  // ─ T5 Director Management ─
  {title:'Director of Security Engineering',domain:'Security Engineering',track:'Management',tier:'T5',min:175000,mid:218000,max:278000,desc:'Leads the security engineering department. Owns all technical security tooling, architecture reviews, and engineering team budget.'},
  {title:'Director of IAM',domain:'IAM',track:'Management',tier:'T5',min:180000,mid:225000,max:290000,desc:'Leads the IAM department across all identity domains — PAM, IGA, SSO, federation, and cloud IAM.'},
  {title:'Director of Cloud Security',domain:'Cloud Security',track:'Management',tier:'T5',min:185000,mid:232000,max:300000,desc:'Owns the cloud security program across all providers. Most sought-after Director role in 2025.'},
  {title:'Director of SOC',domain:'SOC / IR',track:'Management',tier:'T5',min:165000,mid:205000,max:262000,desc:'Leads the Security Operations Center organization. Owns team structure, MSSP relationships, and SOC metrics program.'},
  {title:'Director of GRC',domain:'GRC',track:'Management',tier:'T5',min:160000,mid:198000,max:255000,desc:'Leads the governance, risk, and compliance function. Oversees all compliance frameworks, audit relations, and risk reporting.'},
  {title:'Director of Red Team',domain:'Offensive',track:'Management',tier:'T5',min:170000,mid:212000,max:272000,desc:'Leads the internal offensive security program. Defines adversary emulation strategy, manages budget, reports to CISO.'},
  {title:'Director of Threat Intelligence',domain:'SOC / IR',track:'Management',tier:'T5',min:168000,mid:210000,max:268000,desc:'Leads the CTI function. Manages TI platform, external intelligence partnerships, and strategic threat reporting to board.'},
  {title:'Director of AppSec',domain:'AppSec',track:'Management',tier:'T5',min:172000,mid:215000,max:275000,desc:'Leads the application security organization. Owns SDL program, AppSec tooling strategy, and developer security culture.'},
  {title:'Director of DFIR',domain:'DFIR',track:'Management',tier:'T5',min:165000,mid:205000,max:262000,desc:'Leads the forensics and incident response organization. Manages IR retainers, forensic lab, and major breach response.'},
  // ─ T6 Executive ─
  {title:'VP of Security',domain:'Leadership',track:'Management',tier:'T6',min:220000,mid:290000,max:400000,desc:'Leads security divisions at large enterprises. Functionally equivalent to CISO at mid-market companies.'},
  {title:'VP of Information Security',domain:'Leadership',track:'Management',tier:'T6',min:230000,mid:305000,max:420000,desc:'Senior security executive responsible for enterprise-wide information security strategy and program.'},
  {title:'CISO (Mid-market)',domain:'Leadership',track:'Management',tier:'T6',min:250000,mid:340000,max:460000,desc:'The top security executive at companies with $100M–$1B revenue. Strategy, budget, board reporting, and risk accountability.'},
  {title:'CISO (Enterprise)',domain:'Leadership',track:'Management',tier:'T6',min:380000,mid:550000,max:850000,desc:'The top security executive at Fortune 1000 companies. Total comp often exceeds $1M including equity and bonus.'},
  {title:'Deputy CISO',domain:'Leadership',track:'Management',tier:'T6',min:210000,mid:275000,max:370000,desc:'Second-in-command. Owns day-to-day security operations while CISO manages board and executive relationships.'},
  {title:'Chief Security Officer',domain:'Leadership',track:'Management',tier:'T6',min:280000,mid:390000,max:600000,desc:'Broader than CISO — may encompass physical security, executive protection, and cyber. Common in defense and financial services.'},
  {title:'Fractional CISO',domain:'Leadership',track:'Management',tier:'T6',min:150000,mid:250000,max:500000,desc:'Experienced CISO serving multiple organizations part-time. Growing market driven by SEC cybersecurity disclosure rules. Hourly/retainer model.'},
];

function formatSal(n){return '$'+Math.round(n/1000)+'K';}
function tierColor(t){var m={'T1':'var(--mt)','T2':'var(--gn)','T3':'var(--lb)','T4':'var(--bl)','T5':'var(--db)','T6':'var(--rd)'};return m[t]||'var(--mt)';}

function filterSalary(){
  addSalCSS();
  var domain=document.getElementById('sal-domain').value;
  var track=document.getElementById('sal-track').value;
  var tier=document.getElementById('sal-tier').value;
  var minSal=parseInt(document.getElementById('sal-min').value)||0;
  var sort=document.getElementById('sal-sort').value;
  var rows=SAL_DATA.filter(function(r){
    return (!domain||r.domain===domain)&&(!track||r.track===track)&&(!tier||r.tier===tier)&&(r.mid>=minSal);
  });
  if(sort==='mid-desc') rows.sort(function(a,b){return b.mid-a.mid;});
  else if(sort==='mid-asc') rows.sort(function(a,b){return a.mid-b.mid;});
  else if(sort==='title') rows.sort(function(a,b){return a.title.localeCompare(b.title);});
  else if(sort==='tier') rows.sort(function(a,b){return a.tier.localeCompare(b.tier)||b.mid-a.mid;});
  var globalMax=Math.max.apply(null,rows.map(function(r){return r.max;}));
  var tbody=document.getElementById('sal-tbody');
  var count=document.getElementById('sal-count');
  if(!tbody) return;
  count.textContent=rows.length+' positions shown';
  tbody.innerHTML=rows.map(function(r,ri){
    var pct=Math.round((r.max/globalMax)*100);
    var desc = r.desc ? '<div class=\"sal-desc\">'+r.desc+'</div>' : '';
    return '<tr class=\"sal-row\" data-idx=\"'+ri+'\" style=\"cursor:pointer;\">'+
      '<td class=\"sal-td\" style=\"font-weight:600;\">'+
        '<span class=\"sal-arr\">▶</span>'+r.title+desc+'</td>'+
      '<td class=\"sal-td\" style=\"color:var(--mt);\">'+r.domain+'</td>'+
      '<td class=\"sal-td\" style=\"color:var(--mt);\">'+r.track+'</td>'+
      '<td class=\"sal-td\"><span style=\"font-family:var(--fm);font-size:.55rem;color:'+tierColor(r.tier)+';\">'+r.tier+'</span></td>'+
      '<td class=\"sal-td\" style=\"font-family:var(--fm);font-size:.75rem;\">'+formatSal(r.min)+'</td>'+
      '<td class=\"sal-td\" style=\"font-family:var(--fm);font-size:.75rem;color:var(--lb);font-weight:700;\">'+formatSal(r.mid)+'</td>'+
      '<td class=\"sal-td\" style=\"font-family:var(--fm);font-size:.75rem;\">'+formatSal(r.max)+'</td>'+
      '<td class=\"sal-td\" style=\"min-width:80px;\"><div class=\"sal-bar\" style=\"width:'+pct+'%;\"></div></td>'+
    '</tr>';
  });
  // Add click delegation for row expand
  if(!tbody._salListener){
    tbody._salListener=true;
    tbody.addEventListener('click',function(e){
      var row=e.target.closest('tr.sal-row');
      if(row) row.classList.toggle('sal-expanded');
    });
  }
}

// ══════════ INTERVIEW QUESTIONS ══════════
var INTERVIEW_QA = {
  'soc1': {title:'SOC Analyst I', qs:[
    {q:'What is the difference between an IDS and an IPS?',a:'IDS (Intrusion Detection System) is passive — it monitors and alerts but does not block. IPS (Intrusion Prevention System) is inline and actively blocks malicious traffic. Use IDS where false positives would be disruptive; IPS where real-time blocking is worth the risk. Strong answer: mention specific placement (out-of-band vs inline) and vendor examples.'},
    {q:'Walk me through how you would triage a phishing alert.',a:'Check sender reputation and headers, analyze URLs (sandbox if needed), check if any users clicked, look for similar emails in the environment, check endpoint telemetry for follow-on activity, and escalate per your IR playbook. Always document actions taken. Mention tools you\'ve used (ProofPoint, Defender, Splunk).'},
    {q:'What is a SIEM and what do you use it for?',a:'Security Information and Event Management — aggregates log data from across the environment, provides real-time alerting, and supports compliance reporting. Used for threat detection, investigation, and incident response. Strong candidates name specific platforms (Splunk, Microsoft Sentinel, IBM QRadar) and describe a real use case.'},
    {q:'What are the phases of the incident response lifecycle?',a:'NIST framework: Preparation → Detection & Analysis → Containment, Eradication & Recovery → Post-Incident Activity. Know what happens in each phase — preparation means playbooks and tabletops; detection means alert triage; containment means isolate vs. investigate; post-incident means lessons learned report.'},
    {q:'What is the CIA triad?',a:'Confidentiality (data accessible only to authorized users), Integrity (data has not been tampered with), Availability (data is accessible when needed). This is foundational — be able to give a real-world example of a breach affecting each element.'},
    {q:'How would you handle a situation where you see unusual outbound traffic at 3 AM?',a:'Follow your IR playbook: identify source host and process generating traffic, check destination IP reputation (VirusTotal, Shodan), look at volume and duration, compare to baseline, check for C2 beacon patterns (regular intervals, small payloads). Escalate per severity. Document everything.'},
    {q:'What is the difference between a vulnerability, a threat, and a risk?',a:'Vulnerability: a weakness in a system. Threat: a potential cause of an incident. Risk: the likelihood and impact of a threat exploiting a vulnerability. Risk = Threat × Vulnerability × Impact. Being able to chain these together in a sentence demonstrates real understanding.'},
    {q:'What tools have you used for log analysis?',a:'Be specific and honest. Common tools: Splunk, Elastic (ELK Stack), Microsoft Sentinel, Sumo Logic, Graylog. If self-taught, mention your home lab setup. Describe what you did with the tool — wrote searches, built dashboards, investigated alerts — not just "I used it."'},
    {q:'What is a false positive and why does it matter?',a:'An alert that fires when there is no actual threat. Matters because too many false positives cause alert fatigue — analysts start ignoring alerts and miss real incidents. Shows maturity to discuss how you would tune rules to reduce false positives while maintaining detection coverage.'},
    {q:'Where do you go to stay current on cybersecurity threats?',a:'Hiring managers want to see genuine interest. Good sources: SANS ISC, Krebs on Security, CISA KEV catalog, Dark Reading, Bleeping Computer, MITRE ATT&CK updates. Bonus: mention a specific recent incident you tracked and what you learned from it.'},
  ]},
  'iam1': {title:'IAM Analyst / Identity Analyst', qs:[
    {q:'What is the difference between authentication and authorization?',a:'Authentication = verifying identity (who you are). Authorization = verifying permissions (what you can do). Real example: MFA is authentication. RBAC is authorization. OAuth handles authorization (access delegation). OIDC adds authentication on top of OAuth. Interviewers test this constantly because candidates frequently confuse the two.'},
    {q:'What is SSO and why do organizations use it?',a:'Single Sign-On allows users to authenticate once and access multiple applications. Benefits: reduced password fatigue, fewer credentials to manage, centralized access control, easier deprovisioning. Common platforms: Okta, Azure AD/Entra ID, Ping Identity. Mention trade-off: SSO is also a single point of failure.'},
    {q:'Explain MFA and the different factors available.',a:'Multi-Factor Authentication requires 2+ factors from: something you know (password, PIN), something you have (hardware token, phone app), something you are (biometrics). Modern MFA: TOTP apps (Authy, Google Authenticator), push notifications (Okta Verify, Duo), hardware keys (YubiKey). Phishing-resistant MFA = FIDO2/WebAuthn.'},
    {q:'What is the principle of least privilege?',a:'Users should have only the minimum access required to perform their job function. Reduces blast radius of compromised accounts. Implementation: role-based access control, periodic access reviews, just-in-time access for elevated privileges. The most common IAM security failure is privilege creep over time.'},
    {q:'What is RBAC and how does it differ from ABAC?',a:'Role-Based Access Control assigns permissions to roles, then roles to users. Simpler to manage at scale. ABAC (Attribute-Based Access Control) makes decisions based on attributes of the user, resource, and environment — more granular but more complex. Most orgs use RBAC with some ABAC elements for sensitive resources.'},
    {q:'Walk me through the user provisioning and deprovisioning process.',a:'Provisioning: triggered by HR event (new hire) → create account → assign to role/groups based on job function → grant application access → communicate credentials. Deprovisioning: triggered by termination → disable account immediately → revoke all sessions/tokens → remove from all groups → archive account for audit period. Mention IGA tools: SailPoint, Saviynt.'},
    {q:'What is privileged access management (PAM) and why is it important?',a:'PAM protects privileged accounts (admin, root, service accounts) through vaulting (store creds in an encrypted vault), session recording, just-in-time access (grant elevated privileges on demand, revoke after use), and privileged account discovery. Important because compromised admin accounts are the #1 tool for attackers moving laterally.'},
    {q:'What is directory services and what protocols are used?',a:'Directory services store and organize information about network resources and users. Active Directory is the most common enterprise directory. Key protocols: LDAP (Lightweight Directory Access Protocol) for querying, Kerberos for authentication in AD environments, SAML for federated SSO. Understanding LDAP structure (DN, OU, CN) is important for IAM roles.'},
    {q:'How would you investigate a report of unauthorized access to a system?',a:'Gather facts: who reported it, which system, what access. Pull logs from the directory (AD logon events, Event ID 4624/4625), check the identity provider for authentication events, look at source IP. Determine if credentials were shared, compromised (check HIBP), or if it was an insider. Notify relevant stakeholders per IR process.'},
    {q:'What is federation and how does SAML work?',a:'Federation allows identities from one domain to be trusted by another. SAML (Security Assertion Markup Language) works in 3 parties: user, Identity Provider (IdP — issues assertions), Service Provider (SP — consumes assertions). Flow: user requests access → SP redirects to IdP → user authenticates → IdP issues signed SAML assertion → SP validates and grants access.'},
  ]},
  'sec-eng1': {title:'Junior Security Engineer', qs:[
    {q:'What is defense in depth and why is it important?',a:'Layered security strategy where multiple independent security controls protect assets. If one layer fails, others remain. Layers: perimeter (firewall), network (segmentation, IDS/IPS), endpoint (EDR, AV), application (WAF, SAST), data (encryption, DLP), identity (MFA, PAM). Important because no single control is perfect.'},
    {q:'Explain the difference between symmetric and asymmetric encryption.',a:'Symmetric: same key for encryption and decryption (AES-256). Faster, better for large data. Problem: secure key exchange. Asymmetric: public key encrypts, private key decrypts (RSA, ECC). Solves key exchange but slower. In practice: asymmetric exchanges the symmetric key, then symmetric encrypts the data (TLS handshake).'},
    {q:'What is a firewall and what are the different types?',a:'Packet filtering (Layer 3/4, stateless), stateful inspection (tracks connection state), application-layer/proxy (Layer 7, understands protocols), NGFW (adds DPI, application ID, IPS, TLS inspection). Most enterprise environments use NGFWs. Know when to use each and the trade-offs between security and performance.'},
    {q:'What is network segmentation and why do you implement it?',a:'Dividing a network into isolated zones to limit lateral movement after a breach. Methods: VLANs, subnets, firewall rules, zero trust micro-segmentation. A compromised host in the guest network shouldn\'t reach the database subnet. Common segmentation: DMZ, corporate LAN, OT/ICS network, guest WiFi, PCI cardholder data environment.'},
    {q:'What is a VPN and what are its limitations from a security perspective?',a:'Encrypts traffic between endpoints. Limitations: creates implicit trust once connected (mitigated by ZTNA), performance overhead, doesn\'t protect against compromised endpoints, split tunneling risks, credential phishing for VPN still common. Modern trend is ZTNA (Zero Trust Network Access) replacing traditional VPN.'},
    {q:'Describe the OSI model and which layers are most relevant to security.',a:'7 layers: Physical, Data Link, Network, Transport, Session, Presentation, Application. Security relevance: Layer 3 (IP — firewalls, routing), Layer 4 (TCP/UDP — port-based filtering, DDoS), Layer 7 (Application — WAF, API security, DLP). Understanding which layer an attack or control operates at shows real technical depth.'},
    {q:'What is the difference between a vulnerability scan and a penetration test?',a:'Vulnerability scan: automated tool identifies known weaknesses (Nessus, Qualys). Fast, broad, but no exploitation. Penetration test: human-led, actually exploits vulnerabilities to prove impact. More expensive, slower, but shows real risk. VA = breadth, PT = depth. Both are needed; many organizations confuse them.'},
    {q:'How do you harden a Linux server?',a:'Remove unnecessary packages and services, change default ports where applicable, disable root SSH login (use key-based auth only), configure iptables/UFW firewall rules, enable auditd for logging, apply CIS Benchmark controls, implement AIDE for file integrity monitoring, configure SELinux or AppArmor, keep packages updated, and run Lynis for audit.'},
    {q:'What is certificate management and why does it matter?',a:'PKI certificates authenticate identity and encrypt communications. Management involves: tracking expiration dates (expired certs cause outages), ensuring proper chain of trust, revoking compromised certs (OCSP/CRL), using appropriate key lengths (RSA-2048 minimum, prefer ECC P-256), and automating renewal (Let\'s Encrypt, cert-manager). Cert sprawl is a major operational security problem.'},
    {q:'What scripting or programming languages do you know and how would you use them in security?',a:'Be honest about skill level. Python is most valuable for security: log parsing, API integrations, automation, tool development. Bash for system administration and pipeline automation. PowerShell for Windows environments. Mention a specific project: "I wrote a Python script to parse Splunk exports and flag anomalous logon patterns" is far better than a generic answer.'},
  ]},
  'grc1': {title:'GRC Analyst I / IT Risk Analyst', qs:[
    {q:'What is GRC and what does each component mean?',a:'Governance: the framework of policies, standards, and oversight structures that direct the organization\'s security strategy. Risk: identifying, assessing, and treating threats to information assets. Compliance: ensuring adherence to applicable laws, regulations, and contractual obligations. GRC professionals align all three to support business objectives while managing security risk.'},
    {q:'What is a risk assessment and how do you conduct one?',a:'Identify assets → identify threats → identify vulnerabilities → assess likelihood and impact → calculate risk score → prioritize → select treatment (accept, mitigate, transfer, avoid) → document in risk register → monitor. Frameworks: NIST RMF, ISO 31000, FAIR. Always tie risk to business impact, not just technical severity.'},
    {q:'What is the difference between a policy, a standard, a procedure, and a guideline?',a:'Policy: leadership-approved statement of intent ("all data must be encrypted"). Standard: specific measurable requirement implementing the policy ("AES-256 for data at rest"). Procedure: step-by-step instructions ("how to configure BitLocker"). Guideline: non-mandatory best practice recommendation. Hierarchy: Policy > Standard > Procedure > Guideline.'},
    {q:'What compliance frameworks are you familiar with?',a:'Common frameworks: SOC 2 (trust services for cloud/SaaS), ISO 27001 (ISMS), PCI DSS (payment card), HIPAA (healthcare), NIST CSF (voluntary US framework), CMMC (DoD contractors), FedRAMP (federal cloud). Key insight: most controls overlap. A unified control framework maps one control to multiple compliance requirements simultaneously.'},
    {q:'What is the difference between SOC 1 and SOC 2?',a:'SOC 1: financial reporting controls (SSAE 18). Used by companies whose operations affect customer financial statements. SOC 2: security, availability, processing integrity, confidentiality, and privacy controls. Used by technology and cloud service providers to demonstrate security posture to customers. Type I = point in time; Type II = 6–12 month operating effectiveness.'},
    {q:'What is a business impact analysis (BIA) and why is it important?',a:'A BIA identifies critical business functions, determines the impact of disruption, and establishes Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO). Important because it prioritizes which systems to restore first in a disaster and informs BCM/DR planning. Without a BIA, DR plans are guesswork.'},
    {q:'How do you handle a situation where a business unit wants to do something that creates security risk?',a:'The business is a customer, not an adversary. Steps: document the risk clearly and quantify it if possible, present options (mitigate, transfer, accept with formal risk acceptance sign-off), escalate if the risk is material. A mature GRC analyst finds ways to enable the business while managing risk — not just saying no.'},
    {q:'What is a control and what is the difference between preventive, detective, and corrective controls?',a:'Control: a safeguard to reduce risk. Preventive: stops an incident from occurring (firewall, MFA). Detective: identifies that an incident has occurred (SIEM alerts, audit logs). Corrective: restores normal operations after an incident (backup restoration, patch deployment). Strong security programs use all three types in combination.'},
    {q:'What is vendor risk management?',a:'The process of assessing and managing security risks introduced by third-party vendors who have access to your data or systems. Process: inventory all vendors → categorize by data access and criticality → conduct risk assessments (questionnaires, SOC 2 reviews, on-site audits) → define contractual requirements → monitor continuously. Common frameworks: SIG questionnaire, CAIQ.'},
    {q:'How would you approach building a risk register from scratch?',a:'Define risk categories (operational, strategic, regulatory, third-party), identify risks through interviews with business units and technical teams, document each risk with: description, likelihood, impact, current controls, risk rating, owner, and treatment plan. Use a consistent scoring methodology (qualitative 1–5×5 matrix or quantitative FAIR). Review quarterly minimum.'},
  ]},
  'cloud1': {title:'Cloud Security Analyst', qs:[
    {q:'Explain the shared responsibility model.',a:'Cloud providers secure the infrastructure (physical, hypervisor, network fabric). Customers secure everything above: OS patching, IAM configuration, application security, data encryption, network security groups. The boundary shifts by service type: IaaS (you own most), PaaS (provider handles more), SaaS (provider handles almost everything). Most cloud breaches are customer-side misconfigurations, not provider failures.'},
    {q:'What is the difference between a security group and a network ACL in AWS?',a:'Security groups are stateful (return traffic automatically allowed), apply at the instance level, and support allow rules only. Network ACLs are stateless (must explicitly allow return traffic), apply at the subnet level, and support both allow and deny rules. Best practice: use security groups for most use cases; add NACLs for subnet-level deny rules (blocking IP ranges).'},
    {q:'What are some common cloud misconfigurations and how do you detect them?',a:'Most common: S3/blob storage left public, overly permissive IAM roles, security groups open to 0.0.0.0/0, unencrypted storage volumes, CloudTrail/logging disabled, default credentials not rotated. Detection: AWS Security Hub, AWS Config rules, CSPM tools (Wiz, Prisma Cloud, Orca Security), manual review of IAM policies.'},
    {q:'What is IAM in the context of AWS/Azure/GCP?',a:'Cloud IAM controls who can do what in your cloud environment. AWS: IAM users, roles, groups, policies (JSON). Azure: Entra ID + RBAC (role assignments at subscription/resource group/resource scope). GCP: IAM roles (primitive, predefined, custom). Key principle: use roles, not individual user policies. Grant least privilege. Use service accounts/managed identities for workloads instead of long-lived access keys.'},
    {q:'What is infrastructure as code (IaC) and why does it matter for security?',a:'IaC defines infrastructure in code files (Terraform, CloudFormation, Bicep). Security benefits: version control (audit trail), consistent deployment (no manual misconfigurations), security scanning in CI/CD pipeline (Checkov, tfsec, KICS), reproducibility, and easier compliance attestation. IaC security scanning catches misconfigurations before they reach production.'},
    {q:'What is a CSPM tool and when would you use one?',a:'Cloud Security Posture Management continuously monitors cloud environments for misconfigurations against security benchmarks (CIS, NIST). Tools: Wiz, Prisma Cloud, Orca, Lacework, Microsoft Defender for Cloud. Use when: managing multi-cloud or large cloud environments, needing continuous compliance monitoring, or when manual review is too slow. CSPM complements, not replaces, manual security review.'},
    {q:'What is encryption at rest vs. encryption in transit?',a:'At rest: data stored on disk is encrypted (S3 SSE, Azure Storage encryption, volume encryption). In transit: data moving across networks is encrypted (TLS 1.2+, HTTPS). Both are required for most compliance frameworks. Common mistake: enabling at-rest encryption but forgetting transit encryption between internal services.'},
    {q:'How would you investigate a suspected compromised cloud access key?',a:'Immediate containment: disable or delete the key. Investigation: check CloudTrail/Activity Log for actions taken with the key (what resources accessed, from what IPs, when), check for persistence mechanisms created (new IAM users, backdoor roles, Lambda functions), look for data exfiltration signs (S3 GetObject at high volume). Rotate all keys from that account as precaution.'},
    {q:'What is a service account / managed identity and why should you use them instead of long-lived credentials?',a:'Service accounts (GCP), managed identities (Azure), or IAM roles for EC2 (AWS) allow workloads to authenticate to cloud services without storing static access keys. Benefits: no credentials to rotate or accidentally expose in code, automatic rotation, scoped to least privilege, auditable. Long-lived static credentials are a major breach vector — GitHub scanning finds exposed AWS keys constantly.'},
    {q:'What cloud certifications are most valuable for a cloud security role?',a:'AWS: AWS Security Specialty (SCS-C02) is the gold standard. Azure: AZ-500 for security. Vendor-neutral: CCSP (ISC²) and CCSK (CSA). Foundational: AWS SAA-C03 or AZ-104 before going security-specific. Honest answer for an interview: name what you have, what you\'re studying for, and why — shows progression and initiative.'},
  ]},
  'appsec1': {title:'Junior AppSec Engineer', qs:[
    {q:'What is the OWASP Top 10 and name 3 items from it.',a:'The OWASP Top 10 is the most widely referenced list of critical web application security risks, updated periodically. Current top items include: Broken Access Control (#1), Cryptographic Failures (#2), Injection (#3, includes SQL injection and XSS), Insecure Design (#4), Security Misconfiguration (#5). Being able to explain and give examples of at least the top 5 is expected.'},
    {q:'Explain SQL injection and how to prevent it.',a:'SQL injection: attacker inserts malicious SQL into an input field that gets executed by the database. Example: login form with \' OR \'1\'=\'1 bypasses authentication. Prevention: parameterized queries / prepared statements (the only reliable fix), input validation, least privilege database accounts, WAF as defense in depth. Never concatenate user input directly into SQL strings.'},
    {q:'What is XSS and what are the different types?',a:'Cross-Site Scripting: injecting malicious scripts into content served to other users. Types: Reflected (non-persistent, payload in URL), Stored (persistent, payload saved in database and served to all users — most dangerous), DOM-based (client-side, manipulates the DOM without server involvement). Prevention: output encoding (OWASP guidelines), Content Security Policy (CSP), HttpOnly cookies, input validation.'},
    {q:'What is CSRF and how do you prevent it?',a:'Cross-Site Request Forgery: tricks an authenticated user\'s browser into sending a malicious request to a trusted site. Prevention: CSRF tokens (unique per-session random value required with state-changing requests), SameSite cookie attribute (Strict or Lax), checking Origin/Referer headers. Modern frameworks often include CSRF protection built in — know whether yours does.'},
    {q:'What is the difference between SAST and DAST?',a:'SAST (Static Application Security Testing): analyzes source code without running it. Finds issues early in SDLC. Tools: Semgrep, SonarQube, Checkmarx. DAST (Dynamic Application Security Testing): tests the running application from the outside, like an attacker. Tools: Burp Suite, OWASP ZAP, Nikto. SAST = white-box, DAST = black-box. Both are needed; they find different vulnerability classes.'},
    {q:'What is Burp Suite and how have you used it?',a:'The industry standard web application security testing tool. Key features: proxy (intercept/modify requests), Scanner (automated vulnerability detection), Repeater (manually test requests), Intruder (brute force/fuzzing), Decoder (encode/decode data). For an entry role: honest answer about your experience level — even basic proxy use for learning demonstrates initiative.'},
    {q:'What is threat modeling and why is it done early in development?',a:'Threat modeling identifies security threats to an application before it\'s built, enabling design-level mitigations that are cheaper than code fixes. Methodologies: STRIDE (Spoofing, Tampering, Repudiation, Info disclosure, Denial of service, Elevation of privilege), PASTA, Attack Trees. Done early because fixing design flaws costs 100x more than fixing them in design phase.'},
    {q:'What are HTTP security headers and which ones are most important?',a:'HTTP response headers that instruct browsers on security behavior. Most important: Content-Security-Policy (prevents XSS by controlling allowed content sources), Strict-Transport-Security (forces HTTPS), X-Frame-Options (prevents clickjacking), X-Content-Type-Options (prevents MIME sniffing), Permissions-Policy. Check with securityheaders.com. Easy wins for improving application security posture.'},
    {q:'What is an API security vulnerability and how is it different from web app vulnerabilities?',a:'APIs have unique risks: broken object-level authorization (BOLA/IDOR — accessing other users\' data by changing IDs), broken function-level authorization, excessive data exposure (returning more fields than needed), mass assignment (binding all user-supplied fields to objects). OWASP API Security Top 10 covers these. APIs are increasingly the attack surface — mobile apps, SPAs, and microservices all expose APIs.'},
    {q:'How would you approach a code review from a security perspective?',a:'Focus on: input validation (is all user input treated as untrusted?), output encoding, authentication/authorization logic, cryptography implementation (don\'t roll your own), secrets management (no hardcoded credentials), dependency vulnerabilities (check with npm audit, Dependabot, Snyk), error handling (are stack traces exposed?), logging (are sensitive fields redacted?). Use a checklist — OWASP Code Review Guide is the standard reference.'},
  ]},
  'pt1': {title:'Junior Penetration Tester', qs:[
    {q:'What is the difference between penetration testing and vulnerability assessment?',a:'Vulnerability assessment: automated scanning to identify known weaknesses. No exploitation, produces a list. Penetration test: human-led, actually exploits vulnerabilities to demonstrate real-world impact. More expensive, slower, but proves actual risk. Many clients confuse them. VA = breadth, PT = depth. A mature pentest also includes manual testing that automated tools miss.'},
    {q:'Walk me through the penetration testing methodology.',a:'Standard methodology: Reconnaissance (passive OSINT: Shodan, Censys, LinkedIn, DNS enum; active: port scans) → Scanning & Enumeration (Nmap, service identification, version fingerprinting) → Exploitation (known CVEs, misconfigurations, credential attacks) → Post-Exploitation (privilege escalation, lateral movement, persistence) → Reporting (executive summary + technical findings + remediation). Frameworks: PTES, OWASP Testing Guide, NIST SP 800-115.'},
    {q:'What tools do you use for reconnaissance?',a:'Passive OSINT: theHarvester (emails/subdomains), Shodan (internet-facing assets), Censys, WHOIS, LinkedIn/social, Google dorks, Wayback Machine, DNSdumpster. Active: Nmap (port/service discovery), Amass (subdomain enumeration), Masscan (large-scale port scanning). Always start passive — active recon may alert defenders or violate scope.'},
    {q:'What is Metasploit and how does it work?',a:'Open-source penetration testing framework. Core concepts: Modules (exploits, payloads, auxiliary, post), Listeners (handlers for reverse shells), Sessions (active connections to compromised hosts). Workflow: select exploit → set options (RHOSTS, LHOST, LPORT) → run → receive shell/meterpreter session. Important: know the difference between a bind shell and a reverse shell, and why reverse shells bypass firewalls.'},
    {q:'Explain the difference between a bind shell and a reverse shell.',a:'Bind shell: payload opens a listening port on the target — attacker connects to it. Problem: inbound connections are often blocked by firewalls. Reverse shell: payload connects back from the target to the attacker — attacker listens. Bypasses most egress-permissive firewalls. In practice: almost always use reverse shells. Common reverse shell ports: 443, 80 (blend with normal traffic).'},
    {q:'What is privilege escalation and what are common techniques?',a:'Gaining higher privileges after initial access. Linux: SUID/GUID binaries, sudo misconfigurations, cron job hijacking, writeable /etc/passwd, kernel exploits, PATH manipulation. Windows: unquoted service paths, weak service permissions, always install elevated MSI, DLL hijacking, token impersonation, SeImpersonatePrivilege (JuicyPotato, PrintSpoofer). GTFOBins and LOLBAS are essential references.'},
    {q:'What is the importance of a rules of engagement document?',a:'The RoE defines the legal and technical boundaries of the engagement: scope (which IPs/systems are in-scope), out-of-scope systems (never touch), testing windows (business hours only vs. 24/7), escalation contacts (who to call if you accidentally cause an outage), reporting format, and legal authorization. Without a signed RoE, you\'re committing crimes. Always get written authorization before starting.'},
    {q:'How do you document your findings for a client report?',a:'Executive Summary: non-technical, business impact focus, overall risk rating, key findings in plain language. Technical Findings: for each finding — vulnerability name, CVSS score, affected systems, evidence (screenshots, output), reproduction steps, remediation guidance. Good reports are actionable. Bad reports list vulnerabilities without context or fix guidance. Mention report frameworks: PTES, CVSS scoring.'},
    {q:'What is a CVE and how do you research vulnerabilities?',a:'Common Vulnerabilities and Exposures — a numbered identifier for publicly disclosed security vulnerabilities. Research: NVD (nvd.nist.gov) for details and CVSS scores, Exploit-DB for public exploits, vendor advisories, GitHub for PoC code, Shodan for exposed vulnerable systems. Workflow: identify version → search CVEs → check exploit availability → test in lab before production.'},
    {q:'What CTF platforms have you used for practice?',a:'Hiring managers love candidates who practice in their own time. Great platforms: HackTheBox (realistic machines, excellent for OSCP prep), TryHackMe (more guided, good for beginners), PicoCTF (beginner CTF), VulnHub (downloadable offline VMs), PortSwigger Web Security Academy (free, excellent for web). Mention specific machines or challenges you\'ve completed.'},
  ]},
  'dfir1': {title:'Junior DFIR Analyst', qs:[
    {q:'What is the difference between volatile and non-volatile evidence?',a:'Volatile: data lost when power is removed — RAM (running processes, network connections, encryption keys, logged-in users), routing tables, ARP cache. Non-volatile: persists after power off — disk storage, logs, registry, NVRAM. Collection order per RFC 3227: most volatile first. Start with RAM dump, then network state, then disk image. Never image disk before RAM if the system is on.'},
    {q:'What is chain of custody and why does it matter in forensics?',a:'Chain of custody documents every person who handled evidence, when, and what was done with it. Matters because: evidence admissibility in legal proceedings depends on demonstrating it was not tampered with, and it provides accountability. Practice: hash all evidence immediately (MD5 + SHA-256), document in writing, use write blockers, store securely. Even internal investigations benefit from proper chain of custody.'},
    {q:'What are Windows event log IDs you should know?',a:'Critical event IDs: 4624 (successful logon), 4625 (failed logon), 4648 (logon with explicit credentials), 4672 (admin privileges assigned), 4688 (process creation), 4698 (scheduled task created), 4768/4769 (Kerberos ticket requests), 4776 (NTLM authentication), 7045 (new service installed). 4688 with command line logging enabled is especially powerful for detecting malicious activity.'},
    {q:'What is memory forensics and what tools are used?',a:'Analyzing a memory dump to extract artifacts not available on disk: running processes, network connections, encryption keys, injected code, user credentials, clipboard contents. Primary tool: Volatility (open source, cross-platform). Workflow: identify OS profile → list processes (pslist, pstree) → find network connections (netscan) → dump suspicious process memory → scan for malware signatures (malfind). Rekall is an alternative.'},
    {q:'How would you approach investigating a suspected malware infection?',a:'Initial triage: identify affected systems and scope. Containment: isolate from network (preserve forensic state if possible). Collection: RAM dump, disk image, logs. Analysis: identify malware family (VirusTotal hash lookup, sandbox detonation), determine initial access vector (phishing email, exploit, RDP), trace execution (process tree, registry persistence, scheduled tasks), identify C2 communications (network connections, DNS queries). Timeline reconstruction is key.'},
    {q:'What is a write blocker and when do you use it?',a:'Hardware or software device that allows reading from a storage device while preventing any writes. Used whenever imaging evidence drives to prevent accidental modification. Hardware write blockers (Tableau, WiebeTech) are preferred in legal cases — they are more defensible in court than software blockers. Always image with a write blocker and verify hash before and after imaging.'},
    {q:'What is timeline analysis in DFIR?',a:'Creating a chronological record of events from multiple artifact sources to reconstruct what happened. Sources: file system timestamps (MACB — Modified, Accessed, Changed, Born), Windows event logs, registry timestamps, browser history, prefetch files, $MFT records. Tools: log2timeline/Plaso (creates timelines from multiple sources), Timesketch (visualization). Correlation across sources reveals the attack story.'},
    {q:'What are common persistence mechanisms on Windows?',a:'Registry Run keys (HKLM/HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run), scheduled tasks, services, startup folder, WMI subscriptions, DLL hijacking (dropping malicious DLL in app directory), COM object hijacking, BITS jobs, AppInit_DLLs, Winlogon helper entries. Key tool: Autoruns from Sysinternals — shows everything that runs at startup, color-coded for anomalies.'},
    {q:'What is Autopsy and how is it used?',a:'Open-source digital forensics platform with a GUI. Built on The Sleuth Kit. Used for: disk image analysis, file carving (recovering deleted files), timeline creation, keyword search, artifact extraction (browser history, email, registry), hash database lookups (known bad/known good). Good for junior analysts because the GUI reduces the command-line barrier. Commercial alternative: FTK, Magnet Axiom.'},
    {q:'How do you analyze a suspicious email for phishing or malware delivery?',a:'Never open attachments on a production system. Analysis steps: view raw headers (X-Originating-IP, SPF/DKIM/DMARC checks), check sender reputation, extract URLs and check in urlscan.io, VirusTotal, URLhaus. For attachments: check hash in VirusTotal, detonate in sandbox (Any.run, Hybrid Analysis, Joe Sandbox), use oletools for Office macro analysis, look for embedded URLs or payload droppers.'},
  ]},
  'soc2': {title:'SOC Analyst II / Tier 2 Analyst', qs:[
    {q:'How do you approach threat hunting and what distinguishes it from alert response?',a:'Alert response is reactive — you work known detections. Threat hunting is proactive — you hypothesize attacker behavior and search for evidence before alerts fire. Process: hypothesis (based on CTI or MITRE ATT&CK TTPs) → data collection plan → hunt using structured queries (Splunk, ELK) → document findings → create detection rules for any validated threat. Key: hunting produces new detections, not just validated alerts.'},
    {q:'Walk me through building a detection rule in your SIEM.',a:'Start with a specific threat or behavior to detect (e.g., lateral movement via PsExec). Identify data sources and log fields. Write the query (Splunk SPL or KQL). Test against historical data — check true positive rate. Set threshold to reduce noise. Define alert actions and severity. Document the rule with ATT&CK technique mapping. Schedule regular review. The best answers reference real rules you\'ve written.'},
    {q:'How do you reduce alert fatigue in your SOC?',a:'Risk-based alerting (weight alerts by asset criticality and user risk score), tune rules to eliminate known false positives, implement SOAR playbooks to auto-close low-fidelity alerts, tiered severity classification, and regular rule review cycles (monthly minimum). Measure MTTD and MTTR — if they\'re rising, alert fatigue is likely a contributing factor. Balance coverage with precision.'},
    {q:'Describe a complex incident you\'ve investigated and how you handled it.',a:'Behavioral question — have a story ready. Structure it: situation (what was the alert/tip), actions (what did you look at, what tools, what did you find), result (what was the outcome — contained, escalated, lessons learned). Quantify where possible: "found 3 additional compromised hosts," "reduced investigation time by 40% with a custom dashboard." Even lab/home lab investigations count.'},
    {q:'How do you use MITRE ATT&CK in your daily work?',a:'ATT&CK is a matrix of adversary TTPs organized by tactic (the why) and technique (the how). Daily uses: mapping detections to techniques (coverage analysis), pivot during investigations (what technique is this activity associated with? what comes next?), threat intel enrichment (which groups use this TTP?), purple team planning (which techniques have no coverage?). Knowing 10–20 specific technique IDs impresses interviewers.'},
    {q:'What is a detection engineering approach to building a security monitoring program?',a:'Detection as code: write detection rules in version-controlled code, test in staging before production, track coverage using ATT&CK Navigator, measure false positive rates, regularly review and retire stale rules. Sigma rules are the vendor-neutral standard. Good detection programs prioritize high-fidelity, specific detections over broad noisy ones. Balance: too few = missed detections, too many = alert fatigue.'},
    {q:'How do you investigate a suspected account compromise?',a:'Timeline construction: when did anomalous activity start? Authentication logs (successful and failed), source IPs and geolocation (impossible travel?), devices used (new device?), what was accessed and when, any privilege escalation? Reset credentials and all session tokens. Check for persistence (new email forwarding rules, authorized OAuth apps, added MFA devices). Notify the user and document.'},
    {q:'What is a SOAR platform and how does it improve SOC efficiency?',a:'Security Orchestration, Automation, and Response — automates repetitive analyst tasks through playbooks. Examples: auto-block IP in firewall when threat intel feed flags it, auto-pull endpoint data when alert fires, auto-send Slack notification with case details. Platforms: Palo Alto XSOAR, Splunk SOAR, Microsoft Sentinel playbooks. Reduces MTTR and allows L1 analysts to handle more volume. Best uses: high-volume, low-complexity alerts.'},
    {q:'Explain threat intelligence and how you use it operationally.',a:'TI provides context about adversaries, campaigns, and indicators. Types: strategic (trends, actor profiles — for CISOs), operational (campaigns, TTPs — for SOC leadership), tactical (IOCs: IPs, domains, hashes — for analysts). Operational use: enrich alerts with TI (is this IP a known C2?), block known bad indicators in firewalls/email gateways, update detection rules for new TTPs. Platforms: MISP, OpenCTI, ThreatConnect.'},
    {q:'How do you document and communicate incident findings to stakeholders?',a:'Two audiences: technical (IR report with full timeline, IOCs, TTPs, containment/eradication steps) and executive (one-page summary with business impact, what happened in plain language, what was done, what was found, and what the remediation plan is). Good communication accelerates response — decision-makers need to understand enough to approve containment actions quickly. Avoid jargon in executive communication.'},
  ]},
  'iam2': {title:'IAM Engineer', qs:[
    {q:'How would you design an enterprise IAM architecture from scratch?',a:'Start with the identity store (Active Directory or cloud IdP like Entra ID/Okta). Add SSO via SAML/OIDC for all applications. Implement MFA (phishing-resistant FIDO2 preferred). Layer in IGA (SailPoint, Saviynt) for provisioning/deprovisioning and access certification. Add PAM (CyberArk, BeyondTrust) for privileged accounts. Implement RBAC with least privilege. Build automated joiner-mover-leaver processes. Define monitoring and alerting for identity anomalies.'},
    {q:'What is the joiner-mover-leaver (JML) process and how do you automate it?',a:'JML covers the full identity lifecycle. Joiner: triggered by HR new hire event → create account → assign baseline role → grant application access → communicate credentials. Mover: role change → update group memberships → remove old access → grant new access (critical: don\'t accumulate). Leaver: termination → immediate disable → session revocation → access removal → archive period → deletion. Automation: IGA tool integrating with HRIS (Workday, SAP) as system of record.'},
    {q:'What is OAuth 2.0 and how does it differ from OIDC?',a:'OAuth 2.0 is an authorization framework — it grants applications access to resources on behalf of a user without sharing credentials. It issues access tokens. OIDC (OpenID Connect) adds authentication on top of OAuth — it issues identity tokens (ID tokens in JWT format) that tell the application who the user is. OAuth = authorization (what can this app do?). OIDC = authentication (who is this user?). Most modern SSO implementations use both together.'},
    {q:'How do you implement an access certification (recertification) campaign?',a:'Access certifications ensure users only retain access they still need. Process: extract all user entitlements from IGA → generate review campaigns by application owner or manager → reviewers approve or revoke each entitlement → automated enforcement of revocations in downstream systems → report on completion and exceptions. Cadence: quarterly for sensitive applications, annually for low risk. IGA tools: SailPoint, Saviynt, Omada.'},
    {q:'What is SCIM and how does it relate to IAM?',a:'System for Cross-domain Identity Management — a standard protocol for automating user provisioning between identity providers and applications. How it works: IdP (Okta, Entra ID) sends SCIM API calls to the application to create, update, or deactivate users. Benefit: eliminates manual provisioning, ensures timely deprovisioning, consistent attributes. Most modern SaaS applications support SCIM. Without it, you rely on slower JIT provisioning or manual CSV imports.'},
    {q:'Explain zero trust and how IAM is central to implementing it.',a:'Zero trust: never trust, always verify. IAM is the enforcement plane. Every access request requires: strong authentication (MFA, risk-based), device health verification (MDM compliance), least-privilege authorization (RBAC + just-in-time access), continuous monitoring (UEBA, CASB). Contrast with traditional perimeter model where anything inside the network was implicitly trusted. ZTA implementation: Conditional Access policies (Entra ID), ZTNA (Zscaler, Prisma Access).'},
    {q:'How do you manage service accounts securely?',a:'Service accounts are frequently over-privileged and never rotated — a major attack target. Best practices: use managed identities (Azure) or IAM roles (AWS) instead of static credentials where possible. For traditional service accounts: unique account per service (never shared), least privilege (specifically scoped, not Domain Admin), password vaulting in PAM tool (CyberArk), regular rotation (automated), monitor for anomalous logons, no interactive logon permissions.'},
    {q:'What is a federated identity and how does it work across organizations?',a:'Federation extends trust across organizational boundaries — a user in Org A can access resources in Org B using their Org A credentials. Mechanisms: SAML federation (classic enterprise B2B), Azure AD B2B (guest users in Entra ID), AWS cross-account IAM roles. Real use case: a contractor using their employer\'s credentials to access your systems. Key considerations: trust establishment, attribute mapping, access governance, and offboarding when the relationship ends.'},
    {q:'How do you detect and respond to a compromised privileged account?',a:'Detection signals: logons at unusual hours, from new locations, to unusual systems, privilege use that deviates from baseline, large data access volumes. Response: immediately disable the account and force session termination (do not just reset the password — attacker may have persistence). Identify what was accessed during compromise window. Check for persistence (new accounts created, service modifications). PAM tools: CyberArk, BeyondTrust — session recordings are invaluable here.'},
    {q:'What is FIDO2/WebAuthn and why is it considered phishing-resistant MFA?',a:'FIDO2 is a passwordless authentication standard using public-key cryptography. The private key never leaves the device. During authentication: the server sends a challenge → the device signs it with the private key → server verifies with stored public key. Phishing-resistant because: the signing is origin-bound (won\'t work on a fake domain), there\'s no shared secret to steal via phishing, and no OTP codes that can be intercepted. Methods: hardware security keys (YubiKey), passkeys (on device biometrics).'},
  ]},
  'cloud2': {title:'Cloud Security Engineer', qs:[
    {q:'How would you design a secure multi-account AWS architecture?',a:'AWS Organizations with SCPs (Service Control Policies) as guardrails. Account structure: management account (billing, SCPs only), security account (GuardDuty, Security Hub, CloudTrail aggregation), logging account (centralized S3 bucket for all logs), and workload accounts (dev, staging, prod separated). Networking: Transit Gateway with central inspection VPC. All accounts must enable GuardDuty, Config, CloudTrail. No root account usage.'},
    {q:'What is infrastructure drift and how do you prevent it?',a:'Drift occurs when deployed infrastructure differs from the IaC definition — usually from manual console changes. Prevention: enforce IaC-only changes through CI/CD pipeline, deny console access for production (IAM policies), use AWS Config to detect drift, enable CloudTrail to audit all manual changes, implement AWS Service Control Policies blocking console resource creation in prod accounts. Remediation: drift detection tools (Terraform Cloud, CloudFormation drift detection).'},
    {q:'Explain how you would implement least privilege IAM in AWS at scale.',a:'Organization-wide: SCPs at the OU level (preventive controls). Account-level: permission boundaries on IAM roles. Application-level: task roles with only required permissions. Human access: use IAM Identity Center (SSO) with permission sets, not individual IAM users. Audit: IAM Access Analyzer to identify unused permissions, IAM Credential Report for key age. Automation: run aws iam generate-service-last-accessed-details to trim unused permissions.'},
    {q:'How do you secure containers and Kubernetes in a cloud environment?',a:'Image security: scan with Trivy/Snyk in CI pipeline, use minimal base images, never run as root. Kubernetes: enable RBAC (no cluster-admin for workloads), use Network Policies to restrict pod-to-pod communication, enable Pod Security Standards, use service mesh (Istio) for mTLS between services. Runtime: Falco for anomaly detection, enable audit logging, restrict API server access. Secrets: use cloud secret manager (AWS Secrets Manager, Vault), not environment variables.'},
    {q:'What is CSPM vs CNAPP and how do they relate?',a:'CSPM (Cloud Security Posture Management): identifies misconfigurations in cloud infrastructure. CNAPP (Cloud Native Application Protection Platform): a broader platform combining CSPM + CWPP (workload protection) + container security + IaC scanning + runtime protection. CNAPP vendors: Wiz, Prisma Cloud, Lacework, Orca. The industry has moved from point tools toward unified CNAPP platforms because attackers cross boundaries between infrastructure, runtime, and application layers.'},
    {q:'How do you handle secrets management in a cloud-native environment?',a:'Never store secrets in: code, environment variables (visible in ECS/K8s task definitions), SSM Parameter Store without encryption, or unencrypted S3. Do use: AWS Secrets Manager or Azure Key Vault for application secrets (with automatic rotation), Hashicorp Vault for complex scenarios, cloud provider managed identities to eliminate static credentials entirely. In CI/CD: OIDC federation instead of long-lived service account keys.'},
    {q:'What is a cloud security incident and how do you respond to one?',a:'Common cloud incidents: exposed S3 bucket, compromised access key, cryptomining via overprivileged Lambda, compromised ECR container image. Response: containment first (disable access key, block IP in security group, isolate instance), preserve evidence (CloudTrail logs, VPC flow logs, GuardDuty findings — don\'t delete), investigate blast radius (what did the attacker access?), remediate and rotate credentials, conduct post-mortem, implement controls to prevent recurrence.'},
    {q:'What is eBPF and how is it used in cloud security?',a:'Extended Berkeley Packet Filter: allows running sandboxed programs in the Linux kernel without changing kernel source. Used in security for: real-time syscall monitoring without agent overhead, network traffic analysis, runtime container security (Falco uses eBPF), detecting privilege escalation and container escape attempts. Tools: Cilium (network security), Tetragon (runtime threat detection), Falco. Growing importance as containers and microservices reduce visibility.'},
    {q:'How would you implement a cloud security posture review for a new cloud environment?',a:'Initial assessment: enable core logging (CloudTrail, Config, VPC Flow Logs, GuardDuty). Run CIS Benchmark assessment (AWS Trusted Advisor, Security Hub CIS standard). Review IAM: root account usage, users without MFA, unused credentials, overly permissive roles. Check network: security groups open to 0.0.0.0/0, public S3 buckets, unencrypted data stores. Review: account contacts, billing alerts, and support plan. Prioritize findings by blast radius and exploitability.'},
    {q:'What is shift-left security and how do you implement it?',a:'Moving security earlier in the development lifecycle — from post-deployment testing to the developer\'s IDE and CI/CD pipeline. Implementation: pre-commit hooks (secrets scanning with git-secrets, Trufflehog), PR checks (SAST with Semgrep, IaC scanning with Checkov), pipeline gates (DAST, container scanning, dependency audits), developer security training and secure coding guidelines. Goal: find and fix issues when they\'re cheapest — before they reach production.'},
  ]},
  'senior-soc': {title:'Senior SOC Analyst / Threat Hunter', qs:[
    {q:'How do you build and mature a threat hunting program?',a:'Maturity model: Level 0 (no hunting, rely on automated alerts) → Level 1 (hypothesis-based, manual) → Level 2 (data-informed, moderate automation) → Level 3 (leading indicators, fully procedure-driven, generates new detections). Build process: secure data access (SIEM, EDR, network), define hypothesis methodology (ATT&CK-based), run initial hunts → document → convert successful hunts to automated detections. Measure: number of new detections created, threats found before alerting, MTTD reduction.'},
    {q:'Walk me through a complex threat hunt from hypothesis to detection.',a:'Example: hypothesis "adversary is using WMI for persistence based on recent threat intel about Cozy Bear TTPs." Data: Windows event logs (WMI activity — 5858, 5859, 5861), Sysmon (Event ID 20 WMI consumer). Hunt: query for WMI subscriptions created in the last 30 days → filter out known legitimate baseline → investigate anomalous ones → validate or dismiss. If validated: create permanent detection rule, write ATT&CK-mapped detection signature, update threat intel.'},
    {q:'How do you measure the effectiveness of your detection program?',a:'Key metrics: MTTD (Mean Time to Detect) — how long from initial compromise to detection, MTTR (Mean Time to Respond), detection coverage percentage against ATT&CK matrix, false positive rate per rule (tune anything >30%), detections created per quarter, percentage of incidents detected by humans vs. automated. Track trends over time — a rising MTTD indicates coverage gaps. Use ATT&CK Navigator to visualize coverage gaps.'},
    {q:'Describe your approach to adversary emulation and purple teaming.',a:'Purple team exercises run Red Team TTPs against real defensive controls with Blue Team observing and improving detections in real-time. Process: select target techniques (based on threat intel for your industry), Red Team executes one technique at a time, Blue Team checks whether detection fired and within what time, gaps become new detection engineering tasks. More efficient than traditional Red vs. Blue because failures immediately improve defenses.'},
    {q:'How do you stay current on emerging threats and translate that to detection?',a:'Sources: CISA KEV catalog (vulnerabilities being actively exploited), CTI platforms (MISP, OpenCTI), vendor threat reports (CrowdStrike, Mandiant, SentinelOne OverWatch), ISAC feeds for your sector, Twitter/X security community, security conferences (DEF CON, Black Hat, BSides). Workflow: see new TTP reported → check ATT&CK mapping → check if we have detection coverage → if not, create hunt hypothesis → build detection → deploy.'},
    {q:'How do you handle an incident where a nation-state actor is suspected?',a:'Escalation and communication first: notify CISO immediately, engage legal counsel, consider FBI/CISA notification (for critical infrastructure, mandatory). Do not tip off the adversary. Forensics: collect evidence carefully, preserve for legal proceedings (chain of custody). Beware of counter-forensics — sophisticated actors often clean up. Consider engaging a specialized DFIR firm with nation-state experience. Attribution is hard — focus on containment and eradication over attribution.'},
    {q:'What experience do you have with EDR platforms and how do you use them for detection?',a:'Know your platform deeply (CrowdStrike Falcon, SentinelOne, Carbon Black, Microsoft Defender). Advanced use: process injection detection (looking for anomalous parent-child process relationships), LSASS memory access patterns (credential dumping), hollow process detection, network connections from unusual processes. Custom IOAs/detection rules: CrowdStrike Fusion SOAR and custom indicators of attack. The best answers describe specific detections you\'ve written or tuned.'},
    {q:'How do you manage and tune a large-scale SIEM deployment?',a:'Content management: version control all detection rules (Sigma format → convert to vendor SPL/KQL), regular tuning cycles (monthly), retire stale rules, document every rule\'s purpose and ATT&CK mapping. Data management: tiered storage (hot/warm/cold), compression, selective collection (not everything needs to go to SIEM), normalization. Performance: separate search heads from indexers (Splunk), use accelerations/summaries for common searches. Cost management: filter noisy, low-value logs at collection time.'},
    {q:'What is your approach to onboarding a new data source into your SIEM?',a:'Process: identify what security value the source provides → determine log format and normalization requirements → write or adapt parser → test in dev environment → onboard with volume estimates → create initial detection use cases → document the source in the data dictionary → establish log health monitoring (alert if source stops sending). Common new sources: cloud provider logs, identity platform logs, WAF/CDN logs, OT/ICS logs.'},
    {q:'How do you mentor junior analysts while maintaining your own productivity?',a:'Structure: pair junior analysts with senior for case reviews (not just assignment dumps), create runbooks for common investigation types so they\'re empowered to investigate independently, hold regular 1:1s to discuss skill development, involve them in detection engineering and threat hunting (not just tier-1 queue work). Your productivity: block focused time, batch mentorship touchpoints, invest upfront in documentation that scales.'},
  ]},
  'sec-arch': {title:'Security Architect', qs:[
    {q:'How do you approach security architecture for a new enterprise application?',a:'Use a threat model first: identify assets, trust boundaries, data flows, and threats (STRIDE methodology). Design security controls at each layer: network (segmentation, TLS everywhere), identity (strong AuthN, least-privilege AuthZ, federation), application (input validation, secure coding, WAF), data (encryption at rest and in transit, DLP, classification), operations (logging, monitoring, patch management). Security architecture should be an enabler, not a blocker — work with development teams early.'},
    {q:'What frameworks do you use for security architecture?',a:'SABSA (Sherwood Applied Business Security Architecture): the most rigorous, business-aligned framework. TOGAF: enterprise architecture framework that security architecture plugs into. NIST CSF: Identify/Protect/Detect/Respond/Recover — good for program-level architecture. ZTA (NIST SP 800-207): zero trust architecture reference. NIST SP 800-53: control catalog for federal/FedRAMP environments. Real architects use multiple frameworks mapped to each other, not a single dogmatic approach.'},
    {q:'Explain zero trust architecture and how you would implement it in an enterprise.',a:'ZTA principles: verify explicitly (every request authenticated, authorized, encrypted), use least privilege access (JIT, JEA), assume breach (segment, monitor everything). Implementation path: identity (strong MFA + Conditional Access) → endpoints (MDM compliance + device health) → applications (ZTNA replacing VPN) → data (classification + DLP) → network (micro-segmentation). Tools: Microsoft Entra ID Conditional Access, Zscaler/Prisma Access for ZTNA, CrowdStrike + Intune for endpoint. It\'s a journey of 2–5 years, not a product you buy.'},
    {q:'How do you balance security requirements with business agility?',a:'Security architecture must enable business outcomes, not just restrict them. Techniques: secure by default patterns that developers can use without thinking (approved libraries, pre-built auth modules, IaC templates), self-service security tooling (developers run their own DAST scans), risk-tiered control frameworks (not every application needs the same controls), paved road approach (make the secure path the easy path). Friction that isn\'t justified by risk will be bypassed.'},
    {q:'What is a security reference architecture and why is it important?',a:'A security reference architecture (SRA) is a reusable, opinionated design for how security should be implemented across the organization. Components: network architecture patterns, identity architecture standards, cloud architecture blueprints, data protection standards. Importance: ensures consistency, reduces reinvention, accelerates secure design, provides a baseline for threat modeling. Best practice: publish SRA internally with implementation guides, review annually.'},
    {q:'How do you approach third-party and supply chain security architecture?',a:'Supply chain risk is a major architectural concern (SolarWinds, Log4j, XZ Utils). Architecture controls: software composition analysis (SCA) in CI/CD pipeline (Snyk, Dependabot), SBOM (Software Bill of Materials) generation, vendor security assessments before integration, network segmentation for third-party integrations (don\'t give vendors broad internal access), code signing and artifact integrity verification, monitor for third-party component vulnerabilities.'},
    {q:'Explain the architectural differences between monolithic and microservices security.',a:'Monolith: single perimeter, simpler AuthN/AuthZ, one attack surface, easier to audit. Microservices: distributed trust, service-to-service auth required (mTLS, service mesh like Istio), API gateway for external traffic, each service has its own attack surface, harder to audit. Additional microservices concerns: container security, secret management at scale, distributed logging and tracing, service-to-service authZ (SPIFFE/SPIRE for workload identity). Microservices security requires architectural discipline that monoliths don\'t.'},
    {q:'How do you document security architecture decisions?',a:'Architecture Decision Records (ADRs): document each significant decision with context (why we needed to decide), options considered, decision made, and consequences (trade-offs). Store in version control alongside the architecture. Also: threat model documents (updated when architecture changes), data flow diagrams (with trust boundaries), network architecture diagrams, and a security architecture runbook for operations. Documentation that isn\'t maintained is worse than none because it creates false confidence.'},
    {q:'How do you measure the effectiveness of your security architecture?',a:'Architecture-level metrics: percentage of applications covered by threat modeling, control coverage gaps identified in architecture review, time from architecture approval to implementation, number of security exceptions granted. Outcome metrics: incidents attributable to architectural weakness, mean time to contain (architectural segmentation effectiveness), patch time for critical vulnerabilities (architecture enabling or impeding patching). Board-level: cybersecurity program maturity score against framework (NIST CSF maturity levels).'},
    {q:'What is your experience with cloud security architecture across multiple providers?',a:'Key differences: AWS (IAM Roles/SCPs/Organizations, GuardDuty, Security Hub), Azure (Entra ID Conditional Access, Defender for Cloud, Sentinel), GCP (IAM, Security Command Center, Chronicle). Common architecture: unified identity plane (federated from corporate IdP), centralized logging (cloud SIEM or SIEM connector), consistent policy enforcement (Terraform/IaC with security guardrails), CNAPP for posture management across all clouds. Avoid cloud-specific lock-in in security tooling where possible.'},
  ]},
  'soc-mgr': {title:'SOC Manager', qs:[
    {q:'How do you build and structure a SOC from scratch?',a:'Define mission and scope first (what are we protecting and what SLAs do we commit to?). Structure: Tier 1 (alert triage), Tier 2 (investigation), Tier 3 (hunting/engineering). Staffing: 5-7:1 T1 to T2 ratio is common. Tooling: SIEM, SOAR, EDR, TI platform, case management (TheHive, ServiceNow). Metrics framework from day 1. Key decisions: follow-the-sun vs. shifts, insource vs. MSSP for T1, specialization vs. generalist model.'},
    {q:'How do you handle analyst burnout and high turnover in a SOC?',a:'Root causes: alert fatigue (too many low-quality alerts), repetitive work without growth opportunities, lack of recognition, poor tooling. Interventions: ruthless alert tuning (reduce false positives), rotation through interesting work (threat hunting, detection engineering, not just queue work), clear career progression path, regular 1:1 development conversations, after-action reviews that are blameless. Turnover in security is expensive — replacement costs 1.5-2x salary. Prevention ROI is high.'},
    {q:'What metrics do you use to measure SOC performance?',a:'Operational: MTTD (Mean Time to Detect), MTTR (Mean Time to Respond/Resolve), alert volume, false positive rate, SLA compliance. Quality: escalation accuracy rate (T1 escalating the right things), incident closure quality score, cases requiring rework. Strategic: threats detected before business impact, coverage across ATT&CK techniques, security program maturity trend. Report differently to different audiences: CISO wants strategic metrics, shift leads want operational.'},
    {q:'How do you develop an incident response plan?',a:'IRP components: scope and purpose, roles and responsibilities (who declares an incident, who leads response, who communicates), classification framework (severity levels with response SLAs), response procedures by incident type (playbooks), communication plan (internal escalation, external notification, regulatory reporting requirements), evidence handling guidelines, and post-incident review requirements. Test the plan: tabletop exercises quarterly, full simulation annually. Plans not tested are plans that fail.'},
    {q:'How do you manage the relationship between the SOC and other IT/security teams?',a:'SOC should be a service provider with clear SLAs and feedback loops. Critical relationships: IR team (handoff process for major incidents), threat intel (consuming and producing intel), detection engineering (rule quality), IT operations (asset inventory, change management coordination to reduce false positives). Regular touchpoints: weekly operational sync, monthly metrics review, quarterly strategic alignment. Common failure: SOC operates as a silo, missing context from IT changes.'},
    {q:'How do you evaluate and select SIEM and SOAR technologies?',a:'Requirements first: data volume, log sources needed, use cases (compliance vs. detection vs. hunting). Evaluation criteria: detection content library, integration ecosystem, query language capability, scalability and cost model, vendor support quality. POC with your actual data — vendor demos use clean data. SOAR evaluation: playbook flexibility, integration catalog, low-code vs. code-heavy approach, maintenance burden. TCO matters more than license price — implementation and tuning costs are often 3-5x license.'},
    {q:'Describe your approach to tabletop exercises.',a:'Tabletop exercises simulate incident scenarios to test your plan, communication, and decision-making without real impact. Process: select realistic scenario (ransomware, insider threat, supply chain breach — relevant to your threat landscape), brief participants (no "correct" answers, goal is to find gaps), run the scenario with injects (time pressure, new information), debrief (what worked, what failed, action items with owners). Document and track action items to closure. Do this quarterly — different scenarios each time.'},
    {q:'How do you manage an MSSP relationship effectively?',a:'Define and enforce SLAs from day 1: MTTD, MTTR, escalation quality. Regular cadence: weekly operational review, monthly QBR. Common failure modes: MSSP escalates everything (high false positive rate, no learning), slow escalation (breach already contained before you know), knowledge gaps on your specific environment. Mitigations: knowledge transfer sessions, maintain threat model documentation for MSSP, dedicated MSSP account team that knows your environment, escalation quality scoring. Never outsource the thinking — MSSP handles volume, your team handles complexity.'},
    {q:'What is your philosophy on hiring and developing SOC analysts?',a:'Hire for curiosity and learning ability over current technical skill — cybersecurity knowledge can be taught, intellectual curiosity cannot. Diverse backgrounds are an asset (IT ops, networking, sysadmin, even non-technical backgrounds with aptitude). Development: structured onboarding with mentorship, clear competency framework for promotion, rotation through different SOC functions, conference attendance and training budget, support for certification pursuit. The best SOC managers produce analysts that get recruited away and take pride in it.'},
    {q:'How do you communicate the value of the SOC to executive leadership?',a:'Executives care about business risk, not security technology. Translate: "We detected and contained a ransomware intrusion before encryption began — estimated loss avoided: $2M based on industry averages" is better than "Splunk fired an alert on Event ID 4688." Use business metrics: incidents prevented, SLA performance, regulatory compliance status, comparison to industry benchmarks (e.g., industry average MTTD is 197 days; we\'re at 4 hours). The goal is budget and support — speak their language.'},
  ]},
  'ciso': {title:'CISO / VP of Security', qs:[
    {q:'How do you build a cybersecurity strategy that aligns with business objectives?',a:'Start with the business strategy, not security controls. Understand: what are the organization\'s top 3–5 strategic objectives this year? What are the top threats to those objectives (cyber, regulatory, operational)? Build a security program that protects what matters most. Map program investments to business risk reduction. Present to the board as risk-adjusted business outcomes, not technology initiatives. Review and update annually with business strategy cycle.'},
    {q:'How do you present cybersecurity risk to a board of directors?',a:'Board members are not technical — they are fiduciaries. What they need: current threat landscape (relevant to your industry), where we are relative to peer organizations and compliance requirements, top 3 risks and what we\'re doing about them, significant incidents (past and emerging), resource requests with ROI framing ("$500K investment reduces probability of a $10M ransomware event by 70%"). Use frameworks boards understand: NIST CSF maturity levels, insurance actuarial data. No acronyms without explanation.'},
    {q:'How do you measure the ROI of a security program?',a:'ROI in security is largely risk reduction, not revenue generation. Methods: risk quantification (FAIR methodology: probability × magnitude = annual loss expectancy; show how controls reduce ALE), incident cost avoidance (cost of incidents we prevented vs. program cost), cyber insurance premium reduction, regulatory fine avoidance, M&A due diligence readiness. Benchmarking: Gartner/Forrester peer data, industry ISAC benchmarks. Be honest that perfect ROI calculation is impossible — frame as risk management investment.'},
    {q:'How do you manage the CISO relationship with the CEO and CFO?',a:'CEO: build trust by being a business partner, not just a "no" function. Connect security investment to business outcomes. Brief regularly, not just after incidents. CFO: speak in financial risk language. Total Cost of Ownership vs. total risk. Cyber insurance as a data point. Budget requests with expected risk reduction. Key principle: the CISO who only shows up when things go wrong will always struggle for budget. Be part of business strategy conversations proactively.'},
    {q:'How do you structure a security organization as the company scales?',a:'Early stage (startup): CISO as player-coach, small team. Mid-market: functional specialization (SOC, GRC, AppSec, IAM). Enterprise: centers of excellence, dedicated security architecture, Red Team, dedicated compliance. MSSP for operational functions (T1 SOC) vs. insource for strategic functions (detection engineering, architecture). Reporting structure matters: CISO reporting to CTO has more technical influence but potential conflict of interest; reporting to CEO/CFO/CRO has more independence but requires more translation.'},
    {q:'What is your philosophy on security culture and how do you build it?',a:'Security culture is not awareness training — it\'s changing behaviors at scale. Real culture change requires: leadership visibly modeling secure behaviors, making secure behavior easy (remove friction from the right path), consequences (positive and negative) that are consistent and immediate, security embedded in processes (not bolted on). Metrics: phishing simulation click rates over time (trends matter, not absolute numbers), security behavior surveys, incident reports from employees (culture of reporting vs. hiding). Takes 2–3 years minimum — don\'t expect overnight results.'},
    {q:'How have you handled a major security incident as a senior leader?',a:'Leadership response: immediately stand up an incident command structure (clear roles, single commander, documented decisions), establish communication cadences (hourly during active incident, daily during recovery), manage external communications (legal counsel involved from first minute, PR team on standby), manage regulatory notification obligations (timelines vary: SEC 4 days for material incidents, GDPR 72 hours). Personally: maintain calm under pressure, make decisions with incomplete information, protect your team from pressure while driving resolution.'},
    {q:'How do you approach cyber insurance and what role does it play in your risk program?',a:'Cyber insurance transfers residual risk that can\'t be economically mitigated. Role: not a substitute for controls (insurers now require strong MFA, EDR, backup testing as conditions), complements the program by capping catastrophic loss. How to get better terms: strong security posture documentation, prior incident history, mature detection and response capabilities, regular policy review as threat landscape changes. Know what\'s covered: first-party (your costs) vs. third-party (liability to others), exclusions (war/nation-state carve-outs becoming common).'},
    {q:'What is your approach to managing the CISO\'s own career and executive presence?',a:'The CISO role has the shortest tenure of any C-suite position (~2.5 years average). Why: blamed for incidents they inherited, budget constrained and then blamed for outcomes, board relationship not established before incident. Mitigation: negotiate scope and resources before accepting, establish board relationship immediately, document inherited risks in writing, build cross-functional relationships. Executive presence: communicate in business language, build credibility outside your own team, be visible at industry events, and contribute to the broader security community.'},
    {q:'How do you handle the tension between security and developer velocity?',a:'False tension if approached correctly. Bad approach: security as gate at the end of development (causes delays and resentment). Good approach: shift-left security embedded in development (faster overall because finding issues early is 10-100x cheaper). Tactics: security champions in dev teams, pre-approved secure architecture patterns, security guardrails in CI/CD that are informative before being blocking, AppSec engineers embedded in product teams vs. central security reviews. Goal: developers think of security as a feature they ship, not a tax they pay.'},
  ]},

  'appsec2': {title:'AppSec Engineer (Mid)', qs:[
    {q:'How do you perform a threat model for a new feature?',a:"Use STRIDE or PASTA — identify assets, trust boundaries, data flows, then enumerate threats per component. Output: a threat model doc with mitigations assigned to engineering tickets."},
    {q:'What is the OWASP Top 10 and which is most commonly exploited?',a:"The OWASP Top 10 lists the most critical web application risks. Injection (SQLi, command injection) and Broken Access Control are historically most exploited. A01 Broken Access Control has been #1 since 2021."},
    {q:'Explain the difference between SAST, DAST, and IAST.',a:"SAST (Static Application Security Testing) analyzes source code without running the app. DAST (Dynamic) tests the running app from outside. IAST (Interactive) combines both by instrumenting the app at runtime. Each catches different vulnerability classes."},
    {q:'What is a secure SDLC and how do you embed security into it?',a:"A Secure SDLC integrates security gates at each phase: requirements (threat modeling), design (architecture review), development (SAST/code review), testing (DAST/pentest), deployment (IaC scanning), and maintenance (patch management, monitoring)."},
    {q:'How do you handle a developer who pushes code with a critical vulnerability to production?',a:"Immediate: assess exploitability and business impact, coordinate with engineering to patch or revert. Follow-up: blameless post-mortem, improve pipeline gate that missed the vulnerability, add detection rule. Goal is systemic improvement not punishment."},
    {q:'What are common API security vulnerabilities?',a:"OWASP API Security Top 10 covers: Broken Object Level Auth (BOLA/IDOR), Broken Authentication, Excessive Data Exposure, Lack of Rate Limiting, Broken Function Level Auth, Mass Assignment, Security Misconfiguration, Injection, Improper Asset Management, Insufficient Logging."},
    {q:'How would you build a security champions program?',a:"Identify volunteer engineers per team, provide quarterly training on AppSec topics, give them tools and access to AppSec team, recognize contributions. Champions act as the security conscience of their squad and reduce bottlenecks to the central AppSec team."},
    {q:'What is content security policy (CSP) and why does it matter?',a:"CSP is an HTTP response header that tells browsers which sources are trusted for scripts, styles, and other resources. It mitigates XSS by preventing inline script execution and unauthorized external scripts. Implemented via Content-Security-Policy header."},
    {q:'Walk me through a code review for SQL injection.',a:"Identify all database query construction points. Look for string concatenation with user input instead of parameterized queries or prepared statements. Check ORM usage for raw query methods. Verify stored procedures do not concatenate inputs. Flag any dynamic ORDER BY clauses."},
    {q:'How do you measure the effectiveness of your AppSec program?',a:"Key metrics: mean time to remediate critical vulns (MTTR), vulnerability density per KLOC, % of releases with completed security reviews, developer training completion, false positive rate in SAST/DAST tooling, number of vulns found in production vs pre-production."}
  ]},
  'pt2': {title:'Penetration Tester (Mid)', qs:[
    {q:'Walk me through a full external penetration test methodology.',a:"Phases: Reconnaissance (OSINT, subdomain enum, port scanning), Scanning/Enumeration (service fingerprinting, vulnerability scanning), Exploitation (CVE exploitation, misconfiguration abuse), Post-Exploitation (privilege escalation, lateral movement, data access), Reporting (executive summary + technical findings with PoC and CVSS scores)."},
    {q:'How do you perform privilege escalation on Linux?',a:"Check sudo rights (sudo -l), SUID/SGID binaries (find / -perm -4000), cron jobs writable by user, world-writable scripts run by root, kernel exploits, exposed credentials in config files, misconfigured services (NFS no_root_squash), PATH hijacking, and capabilities (getcap -r /)."},
    {q:'Explain how you would bypass an antivirus.',a:"Common techniques: custom payload obfuscation, encoding/encryption, process injection (hollowing, injection into legitimate processes), living off the land (LOLBins), staged payloads, custom C2 protocols to avoid signature detection. In an engagement, always disclose AV evasion to client and stay within RoE."},
    {q:'What is the difference between a vulnerability assessment and a penetration test?',a:"A vulnerability assessment identifies and ranks known vulnerabilities using automated scanning — it does not exploit them. A penetration test goes further: it chains vulnerabilities together to demonstrate real-world impact. VA is broader in scope; pentest is deeper and targeted."},
    {q:'How do you perform Active Directory reconnaissance?',a:"Use BloodHound/SharpHound for attack path mapping, PowerView/ldapdomaindump for domain enumeration, Kerbrute for user enumeration, check for AS-REP roastable accounts (no preauth required), enumerate GPOs, find misconfigured ACLs and delegation settings."},
    {q:'Explain Pass-the-Hash and how to defend against it.',a:"PtH abuses NTLM authentication by using a captured password hash directly without needing the plaintext. An attacker with SYSTEM access extracts hashes via Mimikatz and authenticates to other systems. Defenses: Credential Guard, disabling NTLM where possible, network segmentation, tiered admin model, Protected Users security group."},
    {q:'What is Kerberoasting and how is it detected?',a:"Kerberoasting requests service tickets (TGS) for service accounts with SPNs, then cracks them offline. No special privileges needed — any domain user can request TGS tickets. Detection: monitor for unusual volume of TGS-REQ for service accounts (Event ID 4769) especially from non-service account users."},
    {q:'How do you approach web application testing for a client?',a:"Start with passive recon (crawl, spider, JavaScript analysis), map all authentication and authorization flows, test OWASP Top 10 systematically, focus on business logic flaws unique to the application, test API endpoints separately. Use Burp Suite for intercepting/modifying requests. Document every finding with PoC steps."},
    {q:'What do you include in a pentest report?',a:"Executive Summary (non-technical business impact), Scope and methodology, Risk ratings (CVSS + business context), Finding details (description, evidence/screenshots, reproduction steps, remediation recommendation), Remediation roadmap prioritized by risk, Appendices (tool outputs, full scan results). Tailor executive summary for C-suite, technical details for engineering."},
    {q:'How do you stay current on offensive techniques?',a:"Follow exploit developers and researchers on Twitter/X and GitHub, read CVE advisories and PoC releases, practice on HackTheBox, TryHackMe, and VulnHub, participate in CTFs, read offensive security blogs (SpecterOps, harmj0y, s3cur3th1ssh1t), attend DEF CON and Black Hat talks."}
  ]},
  'grc2': {title:'GRC Analyst II (Mid)', qs:[
    {q:'How do you build an enterprise risk register?',a:"Identify risks through interviews, asset inventory, and threat intelligence. For each risk: document description, likelihood (1-5), impact (1-5), inherent risk score, existing controls, residual risk score, risk owner, and treatment plan. Prioritize top risks for executive reporting and quarterly review."},
    {q:'Walk me through a SOC 2 Type II audit.',a:"SOC 2 evaluates controls against Trust Services Criteria (Security, Availability, Processing Integrity, Confidentiality, Privacy). Type II covers a period (usually 12 months) vs. Type I (point in time). Process: scope definition, control implementation, readiness assessment, auditor observation period, auditor testing, and report issuance."},
    {q:'What is the NIST Cybersecurity Framework and how do you implement it?',a:"NIST CSF provides a risk-based approach across 5 functions: Identify (assets, risks), Protect (controls), Detect (monitoring), Respond (IR), Recover (BCP). Implementation: assess current state vs. target profile, identify gaps, prioritize remediation by business criticality and risk, build roadmap."},
    {q:'How do you conduct a third-party risk assessment?',a:"Tier vendors by data access and criticality. Use standardized questionnaires (VSA, SIG, CAIQ). Request evidence: SOC 2 reports, pen test summaries, security policies. Assess their controls against your requirements. Document risk acceptance or remediation requirements. Track reassessment dates."},
    {q:'Explain the difference between a policy, standard, procedure, and guideline.',a:"Policy: high-level mandate from leadership (what must be done). Standard: specific measurable requirements supporting policy (how it must be done). Procedure: step-by-step instructions for a specific task. Guideline: non-mandatory recommendations and best practices. Hierarchy: Policy > Standard > Procedure."},
    {q:'How would you approach getting ISO 27001 certified?',a:"Scope definition → gap assessment vs. Annex A controls → risk assessment and treatment plan → implement controls → develop required documentation (ISMS, Statement of Applicability, risk register) → internal audit → management review → Stage 1 audit (document review) → Stage 2 audit (controls testing) → certification → annual surveillance audits."},
    {q:'What is the difference between risk appetite and risk tolerance?',a:"Risk appetite is the overall level of risk an organization is willing to accept in pursuit of its strategy — a broad qualitative statement. Risk tolerance is the acceptable deviation from the risk appetite for a specific risk or metric — more quantitative (e.g., we tolerate up to 4 hours of system downtime per quarter)."},
    {q:'How do you manage a control gap identified in an audit?',a:"Document the gap formally, assign an owner, assess the risk exposure, define a remediation plan with timeline, implement compensating controls if remediation takes time, track progress in the risk register, report status to management, verify closure with evidence, update the audit findings log."},
    {q:'How do you present security risk to a non-technical executive?',a:"Translate technical findings to business impact: financial exposure, regulatory penalties, reputational damage, operational disruption. Use risk scoring in dollar terms where possible. Show heat maps and trend lines rather than technical details. Frame recommendations as business decisions with cost-benefit analysis."},
    {q:'What regulations most commonly affect U.S. enterprise security programs?',a:"PCI DSS (payment card data), HIPAA (healthcare), SOX (public company financial controls), GDPR/CCPA (privacy), CMMC (defense contractors), FedRAMP (federal cloud), SEC cybersecurity rules (public company disclosure), NYDFS 500 (NY financial services), state breach notification laws in all 50 states."}
  ]},
  'threat-intel': {title:'Threat Intelligence Analyst', qs:[
    {q:'What are the different types of threat intelligence?',a:"Strategic: high-level trends for executives (nation-state activity, industry targeting). Operational: campaign details for security managers (TTPs of active threat groups). Tactical: IOCs for analysts and automation (IPs, hashes, domains, YARA rules). Technical: detailed artifact analysis for incident responders."},
    {q:'How do you pivot on an indicator of compromise?',a:"Start with one IOC (e.g., a malicious IP). Pivot using VirusTotal, Shodan, RiskIQ/PassiveTotal, WHOIS, passive DNS, certificate transparency logs, and malware sandboxes. Look for shared infrastructure — same ASN, certificate, registrar, hosting provider. Build out the threat actor's infrastructure map."},
    {q:'Explain the Diamond Model of intrusion analysis.',a:"The Diamond Model frames intrusions around 4 features: Adversary (who), Capability (malware/tools), Infrastructure (C2 servers/domains), Victim (who was targeted). Edges show relationships. It helps analysts understand how changing one feature affects the others — adversaries can swap infrastructure but often reuse capabilities."},
    {q:'How do you map threat actor behavior to MITRE ATT&CK?',a:"Analyze incident reports, sandbox outputs, and malware samples to identify behaviors. Map each behavior to the most specific ATT&CK technique. Use ATT&CK Navigator to visualize coverage. Cross-reference with CTI reports from vendors (CrowdStrike, Mandiant, Recorded Future) to confirm mappings."},
    {q:'What is threat intelligence sharing and what platforms support it?',a:"Sharing threat data (IOCs, TTPs) across organizations improves collective defense. Standards: STIX 2.x (structured threat data format) and TAXII 2.x (transport protocol). Platforms: MISP (open source), OpenCTI, ThreatConnect, Anomali. Communities: ISACs (industry-specific), CISA AIS, FS-ISAC for financial."},
    {q:'How do you assess the reliability of a threat intelligence source?',a:"Use the Admiralty Scale: Source reliability (A-F: completely reliable to unreliable) and Information credibility (1-6: confirmed to cannot be judged). Evaluate: track record, corroboration by other sources, timeliness, specificity, and whether the source has a bias or commercial interest in the intelligence."},
    {q:'Walk me through analyzing a phishing email for threat intelligence.',a:"Extract headers (sender IP, relay path), analyze URLs (expand redirects, check domain age, passive DNS), detonate attachments in sandbox (Cuckoo, Any.run, Hatching Triage), extract malware IOCs (C2 URLs, mutexes, registry keys), identify credential harvesting kit, search for campaign reuse across VirusTotal/URLscan, attribute to known threat actor if possible."},
    {q:'What is the Cyber Kill Chain and how is it used in intelligence?',a:"Lockheed Martin's model maps attacker stages: Recon, Weaponization, Delivery, Exploitation, Installation, C2, Actions on Objectives. Intelligence value: earlier disruption is cheaper. Defenders try to detect at Delivery/Exploitation rather than Actions. Intelligence helps identify what stage attackers are at and what comes next."},
    {q:'How do you produce a finished intelligence product?',a:"Collection (gather raw data) → Processing (normalize, translate) → Analysis (assess credibility, patterns, attribution) → Production (write-up tailored to audience: executive brief vs. analyst report) → Dissemination (share via TIP, email, or briefing) → Feedback (did consumers find it actionable?). The intelligence cycle."},
    {q:'What are the signs that a threat actor is targeting your organization specifically?',a:"Spear phishing using org-specific content (employee names, org chart references, current events), reconnaissance activity in logs (unusual scanning patterns, credential stuffing on login pages), typosquatted domains registered near your domain, mentions in dark web forums or paste sites, C2 infrastructure with your org-specific beaconing strings."}
  ]},
  'dfir2': {title:'DFIR Analyst (Mid)', qs:[
    {q:'Walk me through your process for responding to a suspected ransomware incident.',a:"Contain immediately (isolate affected hosts from network without powering off), verify the incident (confirm ransomware vs. other encryption), identify patient zero and initial access vector, preserve volatile evidence (memory dump if possible before isolation), assess blast radius (what systems/data are impacted), notify leadership and legal, begin eradication and recovery from clean backups, produce post-incident report."},
    {q:'How do you perform memory forensics and what can you find?',a:"Use Volatility 3 or Rekall on a memory image. Key artifacts: running processes and parent-child relationships (detect process injection, hollow processes), network connections (spot C2 beaconing), loaded DLLs and modules (find injected code), registry hives loaded in memory, plaintext credentials (in some cases), encryption keys, and evidence of fileless malware."},
    {q:'What Windows event IDs are most useful in incident response?',a:"4624/4625 (logon success/failure), 4648 (explicit credential logon), 4688 (process creation — enable command line logging), 4698/4702 (scheduled task created/modified), 4720/4726 (user account created/deleted), 7045 (new service installed), 4776 (credential validation), 4768/4769 (Kerberos TGT/TGS requests), 1102 (audit log cleared)."},
    {q:'How do you investigate lateral movement in an environment?',a:"Review authentication logs for Pass-the-Hash patterns (NTLM auth from unusual sources), check for PsExec, WMI, or RDP usage, analyze scheduled task creation across multiple hosts, review service installation logs (Event 7045), correlate login timestamps across systems with Splunk/ELK, use EDR timeline views to trace process execution chains."},
    {q:'What is timeline analysis and how do you build one?',a:"Timeline analysis correlates artifacts from multiple sources (filesystem $MFT, Windows registry LastWrite times, Event Logs, prefetch, browser history, LNK files) into a chronological view of attacker activity. Tools: log2timeline/Plaso for automated super-timelines, Timesketch for visualization, manually using Excel pivot tables for simpler cases."},
    {q:'How do you handle a situation where you suspect an insider threat?',a:"Involve HR and Legal immediately — insider threats have legal and HR implications distinct from external breaches. Collect evidence quietly without alerting the suspect (use read-only forensic copies). Document everything with chain of custody. Avoid using the suspect's systems or accounts for investigation. Follow the org's insider threat policy and legal counsel guidance."},
    {q:'Explain how you would investigate a compromised AWS account.',a:"Disable compromised IAM keys immediately, review CloudTrail for all API calls from the compromised credentials (last 90 days), check for new IAM users/roles created, review S3 bucket policy changes, look for new EC2 instances (especially crypto miners), check for Lambda functions or Route53 changes, review GuardDuty findings, and determine initial access vector (exposed key in code, phishing, etc.)."},
    {q:'What is anti-forensics and how do you detect it?',a:"Anti-forensics techniques: timestomping ($STANDARD_INFORMATION vs $FILE_NAME timestamp discrepancies), log clearing (Event 1102, gaps in log sequences), secure file deletion (overwriting), use of encrypted channels (TLS 1.3 C2), living off the land to avoid malware artifacts. Detection: timestamp anomalies in MFT, event log gaps, presence of anti-forensic tools in prefetch, EDR telemetry that persists beyond disk clearing."},
    {q:'How do you preserve digital evidence to maintain chain of custody?',a:"Use write blockers (hardware or software like FTK Imager) for disk acquisition, document hash values (MD5/SHA-256) of all evidence immediately after collection, record who handled each piece of evidence and when, store originals in a secure location, work only on forensic copies, document all actions in a case notes log with timestamps."},
    {q:'What is the difference between incident response and digital forensics?',a:"Incident Response focuses on minimizing business impact through rapid containment, eradication, and recovery — speed is prioritized. Digital Forensics focuses on thorough evidence preservation and analysis to reconstruct what happened — integrity and defensibility in legal proceedings is prioritized. In most incidents you need both, but the balance depends on whether litigation or attribution is a goal."}
  ]},
  'senior-eng': {title:'Senior Security Engineer', qs:[
    {q:'How do you design a zero trust network architecture?',a:"Eliminate implicit trust based on network location. Key pillars: strong identity verification for every access request (MFA, device health), microsegmentation (limit lateral movement), least privilege access, continuous monitoring and validation. Implementation: replace VPN with ZTNA (Zscaler, Prisma Access), enforce device posture checks, implement identity-aware proxies, log all access for anomaly detection."},
    {q:'Walk me through selecting and deploying an EDR platform.',a:"Requirements: platform coverage (Windows/Mac/Linux/cloud), detection quality (MITRE ATT&CK evaluations), alert fidelity (false positive rate), response capabilities (isolation, remediation), integration with SIEM/SOAR, scalability, and cost. Pilot with 500 endpoints across different OS types, evaluate detection coverage vs. ATT&CK framework, measure analyst workflow efficiency before enterprise rollout."},
    {q:'How do you build a security metrics program?',a:"Identify stakeholder audiences (CISO needs strategic metrics, SOC manager needs operational). CISO-level: risk reduction trend, MTTD/MTTR, compliance posture, vulnerability age by severity. Operational: alert volume, false positive rate, patch coverage, mean time to patch critical vulns. Avoid vanity metrics. Use a dashboard (Splunk, Grafana) for real-time visibility."},
    {q:'Explain how TLS works and common misconfiguration issues.',a:"TLS provides authentication (server certificate), confidentiality (encryption), and integrity (HMAC). Handshake: client hello (cipher suites) → server hello + cert → key exchange → session keys derived. Common misconfigs: expired or self-signed certs, weak cipher suites (RC4, 3DES), TLS 1.0/1.1 enabled, missing HSTS headers, certificate pinning bypasses."},
    {q:'How do you approach securing a hybrid cloud environment?',a:"Inventory all assets across on-prem and cloud. Extend identity governance (SSO, PAM) to cloud. Implement CSPM for cloud misconfiguration monitoring. Ensure logging from both environments flows into a single SIEM. Apply consistent network segmentation principles. Use infrastructure as code scanning to prevent misconfigs at deployment. Monitor for cloud-specific attack patterns (SSRF, metadata service abuse)."},
    {q:'What is your approach to vulnerability management at scale?',a:"Prioritize by exploitability (EPSS score) and business criticality rather than CVSS alone. Integrate scanner APIs with CMDB for asset context. Define SLAs: Critical = 24-72h, High = 7-14 days, Medium = 30 days. Automate patch deployment where possible (WSUS, Ansible, AWS SSM). Track KPIs: mean age of open vulns by severity, patch coverage %, compliance rate."},
    {q:'How do you handle a zero-day vulnerability affecting your environment?',a:"Assess exploitability and exposure (is it internet-facing?). Apply emergency mitigations immediately (WAF rules, network segmentation, disable affected service if viable). Monitor for exploitation attempts in logs and EDR. Coordinate with vendor for emergency patch. If a patch is unavailable, implement compensating controls and increase monitoring. Communicate timeline to leadership."},
    {q:'What are common PKI failures and how do you prevent them?',a:"Weak CA key protection (HSMs required for root CA), certificate sprawl (no inventory → expired certs cause outages), weak signing algorithms (MD5/SHA-1 deprecated), no certificate transparency logging, overly broad SAN fields, mismanaged certificate revocation (CRL/OCSP). Prevention: certificate lifecycle management platform (Venafi, HashiCorp Vault PKI), automated renewal (Let's Encrypt + ACME), regular CA audits."},
    {q:'Describe a complex security architecture decision you made and the trade-offs.',a:"Strong answer structure: context (what problem you were solving, scale, constraints), options considered with pros/cons, decision criteria used, what you chose and why, how you measured success, and what you learned. Interviewers want to see systems thinking, ability to balance security with usability/performance, and communication skills."},
    {q:'How do you stay current with the threat landscape as a security engineer?',a:"Daily: CISA KEV alerts, vendor security advisories, CVE feeds for technologies in use. Weekly: SANS Internet Storm Center, security newsletters (tl;dr sec, Risky Biz). Quarterly: review MITRE ATT&CK updates. Annually: Verizon DBIR, SANS Top 25, CrowdStrike/Mandiant threat reports. Participate in CTFs and internal red/purple team exercises."}
  ]},
  'senior-iam': {title:'Senior IAM Engineer', qs:[
    {q:'How do you design an enterprise identity governance program?',a:"Start with authoritative source of truth (HR system as master). Map all applications and their access models. Implement joiner-mover-leaver automation via IGA platform (SailPoint, Saviynt). Define role model (RBAC or ABAC), implement access certifications (quarterly for privileged, annual for standard). Build separation of duties ruleset. Report compliance metrics to audit committee."},
    {q:'Explain the difference between SAML, OAuth 2.0, and OIDC.',a:"SAML: XML-based, purpose-built for enterprise SSO/federation, uses assertions. OAuth 2.0: authorization framework for delegated resource access, issues access tokens, not designed for authentication. OIDC (OpenID Connect): authentication layer built on OAuth 2.0, adds ID tokens (JWTs) with user identity claims. Enterprise SSO: SAML. Modern web/mobile apps: OIDC/OAuth. All three enable federated identity but serve different use cases."},
    {q:'How do you implement a PAM program from scratch?',a:"Phase 1: Discovery (find all privileged accounts across all systems — AD, servers, databases, network devices, cloud). Phase 2: Vault everything (onboard to PAM platform, rotate all passwords). Phase 3: Session recording (enable for all privileged sessions). Phase 4: JIT access (eliminate standing privilege, require approval workflow). Phase 5: Governance (review access quarterly, generate reports for auditors)."},
    {q:'What is SCIM and how does it improve IAM?',a:"System for Cross-domain Identity Management — an open standard REST API for automated user provisioning/deprovisioning between IdP and applications. SCIM eliminates manual CSV uploads and manual deprovisioning. Benefits: real-time sync (user disabled in IdP → deprovisioned in all apps within seconds), reduces orphaned accounts, standardizes user data schema across apps."},
    {q:'How do you approach securing service accounts and non-human identities?',a:"Inventory all service accounts (often 3-5x more than human accounts). Eliminate shared service accounts. Apply least privilege — no Domain Admin for service accounts. Vault passwords in PAM. Use managed identities in cloud (Azure MSI, AWS IAM roles for EC2) instead of long-lived static keys. Monitor for anomalous behavior from service accounts. Enforce password rotation."},
    {q:'Explain passwordless authentication and your recommendation for enterprise adoption.',a:"Passwordless uses something you have (hardware key, device) + something you are (biometric) instead of passwords. Options: FIDO2 hardware keys (YubiKey — strongest, phishing-resistant), platform passkeys (Windows Hello, Face ID — convenient, phishing-resistant), push MFA (Duo/Okta Verify — better than TOTP but still phishable). Recommendation: pilot hardware keys for privileged users and high-risk roles first, roll out passkeys broadly."},
    {q:'How do you manage the IAM aspects of a cloud migration?',a:"Map on-prem identities to cloud IAM (federate existing IdP to cloud via SAML/OIDC), implement cloud-native IAM controls (AWS IAM roles, Azure RBAC), enable just-enough-access (use permission boundaries, SCPs in AWS), migrate service accounts to managed identities, deploy CIEM (Cloud Infrastructure Entitlement Management) to find overprivileged cloud IAM, continuously monitor with CloudTrail/Entra audit logs."},
    {q:'What is the JML lifecycle and how do you automate it?',a:"Joiner: new employee → HR system triggers provisioning workflow → create accounts + assign role-based entitlements + provision equipment → notify user. Mover: transfer → trigger access review → remove old role entitlements + add new + audit for orphaned access. Leaver: termination → immediate disable (same day) → access revocation across all systems → archive accounts for defined retention → remove after retention period."},
    {q:'How do you handle an investigation into a compromised privileged account?',a:"Immediately disable the account (do not just reset password — attacker may have persistence). Collect audit logs from PAM (session recordings, command logs). Check for new accounts created, permission changes, data accessed. Rotate all credentials the account had access to. Review for lateral movement from that identity. Determine root cause (phishing, credential exposure, insider). Implement additional MFA/controls before reactivating."},
    {q:'What IAM metrics do you report to leadership?',a:"Orphaned accounts (accounts with no active employee) — should be near zero. Access certifications completion rate and findings. Mean time to provision/deprovision (benchmark: deprovisioning should be same-day). PAM coverage — % of privileged accounts vaulted. MFA adoption rate. Privileged account count trend. Failed login attempts (credential stuffing indicator). Time since last privileged account review."}
  ]},
  'senior-cloud': {title:'Senior Cloud Security Engineer', qs:[
    {q:'How do you design a multi-account AWS security architecture?',a:"Use AWS Organizations with SCPs to enforce security guardrails centrally. Dedicated accounts for: security tooling (GuardDuty master, Security Hub, CloudTrail), logging (centralized S3 log bucket with object lock), shared services, and workload accounts. Implement AWS Control Tower for account vending. Centralize security findings in Security Hub with custom aggregation rules."},
    {q:'What is the shared responsibility model and where do customers most often fail?',a:"AWS/Azure/GCP own security OF the cloud (physical, hypervisor, network infrastructure). Customer owns security IN the cloud (IAM, data encryption, network config, OS patching). Most failures: over-permissive IAM (wildcard actions), public S3 buckets, unencrypted data at rest, missing logging (CloudTrail off), unpatched EC2 instances, exposed metadata service (SSRF to IMDSv1)."},
    {q:'How do you implement least privilege at cloud scale?',a:"Start with Permission Analyzer/IAM Access Analyzer to find unused permissions. Use AWS IAM Access Analyzer for resource-based policy analysis. Implement permission boundaries on all developer roles. Enforce SCPs blocking dangerous actions (disable public S3, require MFA for root). Use CIEM tools (Wiz, Orca) to continuously detect and rightsize overprivileged identities. Quarterly entitlement reviews."},
    {q:'What is CNAPP and how does it differ from CSPM?',a:"CSPM (Cloud Security Posture Management) focuses on misconfiguration detection and compliance across cloud resources. CNAPP (Cloud Native Application Protection Platform) is broader — combines CSPM, CWPP (workload protection), CIEM (entitlement management), container security, and IaC scanning in a unified platform. Market leaders: Wiz, Palo Alto Prisma Cloud, Orca, Lacework."},
    {q:'How do you secure Kubernetes workloads?',a:"Namespace-based isolation, RBAC with minimal permissions, Pod Security Standards (enforce restricted profile), network policies (deny all by default, allow explicitly), image scanning in CI pipeline (Trivy, Snyk), runtime protection (Falco, Aqua), secrets management (Vault, external-secrets-operator — never mount secrets as env vars), audit logging, admission controllers (OPA/Gatekeeper for policy enforcement)."},
    {q:'Explain how you approach secrets management in cloud-native environments.',a:"Never hardcode secrets or commit to source control. Use cloud-native secret stores (AWS Secrets Manager, Azure Key Vault, GCP Secret Manager) or HashiCorp Vault. Rotate secrets automatically. Use service accounts/managed identities for app-to-service auth instead of static keys. Implement IRSA (IAM roles for service accounts) in EKS. Monitor for secret exposure in logs and environment variables."},
    {q:'What is an SSRF attack in cloud environments and how is it mitigated?',a:"SSRF (Server-Side Request Forgery) tricks a server into making requests to internal resources. In cloud, the critical target is the Instance Metadata Service (IMDS) — attackers can retrieve IAM credentials via http://169.254.169.254. Mitigations: require IMDSv2 (uses token-based session, not susceptible to simple SSRF), block IMDS access for containers that don't need it, use VPC endpoint policies, WAF rules blocking metadata IP in responses."},
    {q:'How do you respond to a compromised cloud workload?',a:"Isolate the instance (quarantine security group — no inbound/outbound except to forensics host), capture volatile state (memory dump if possible, system logs, network connections), preserve disk snapshot before termination, terminate and replace (infrastructure is immutable — don't forensic in production), analyze snapshot in isolated environment, review CloudTrail for blast radius, rotate all credentials accessible from that workload."},
    {q:'What is infrastructure drift and how do you prevent it?',a:"Drift is when live cloud infrastructure diverges from its IaC definition — manual console changes, hotfixes, or unauthorized modifications. Prevention: enforce IaC-only changes (block console access via SCPs where feasible), implement drift detection (Terraform Cloud/Atlantis drift detection, AWS Config rules), require all changes through PR-reviewed IaC pipelines, use immutable infrastructure patterns."},
    {q:'How do you implement cloud security monitoring and alerting?',a:"Enable CloudTrail (all regions, all services), VPC Flow Logs, and S3 access logging. Send all logs to centralized SIEM (Splunk, Sentinel, Elastic). Enable GuardDuty (threat detection), Security Hub (aggregated findings), Macie (data classification). Build custom detection rules for: IAM key creation, public resource exposure, anomalous API calls, root account usage, cross-account role assumptions to unknown accounts."}
  ]},
  'senior-pt': {title:'Senior Penetration Tester', qs:[
    {q:'How do you scope and manage a complex penetration testing engagement?',a:"Define scope precisely in RoE: target systems/IPs, out-of-scope systems, testing windows, escalation contacts, emergency stop procedures. Kick-off meeting with client to align on objectives (compliance vs. risk discovery). Maintain a testing log. Daily check-ins for extended engagements. Immediately notify client of critical findings before final report — do not let a P1 sit for 2 weeks."},
    {q:'Walk me through a red team engagement methodology.',a:"Phases: Planning (objectives, TTP selection based on threat model), Reconnaissance (OSINT, infrastructure mapping), Initial Access (phishing, external vulns, physical — if in scope), Post-Exploitation (privilege escalation, credential harvest, lateral movement), Objective Achievement (data exfiltration, C2 persistence, domain dominance), Deconfliction, and Reporting (executive brief + technical report + improvement roadmap)."},
    {q:'What is adversary emulation and how does it differ from pentesting?',a:"Adversary emulation specifically replicates the behaviors of a known threat actor (e.g., APT29) using their documented TTPs from ATT&CK. Standard pentesting tests for all exploitable vulnerabilities. Emulation tests whether your defenses can detect and respond to a specific realistic adversary. It requires a threat intelligence feed and ATT&CK mapping. Outputs include detection gap analysis by TTP, not just vuln list."},
    {q:'How do you bypass multi-factor authentication in a red team engagement?',a:"Common techniques (authorized engagements only): MFA fatigue/bombing (flood Authenticator push notifications until user accepts), adversary-in-the-middle phishing (Evilginx2, Modlishka to capture session tokens in real time), SIM swapping social engineering, OTP interception via phishing. Phishing-resistant MFA (FIDO2/passkeys) defeats most of these. Findings should drive client toward phishing-resistant MFA adoption."},
    {q:'Explain your process for developing custom malware for a red team operation.',a:"Write implant in a language that avoids common signatures (Go, Nim, or C++). Implement custom C2 protocol over HTTPS/DNS. Use payload staging to minimize on-disk signature. Implement sleep jitter and environmental keying (only execute in target domain). Test against target's specific EDR in a lab. Obfuscate strings and API calls. All development must be within engagement contract scope with written authorization."},
    {q:'How do you approach social engineering in an authorized engagement?',a:"Define specific pretexts and approval from client before execution. Common scenarios: IT helpdesk impersonation (password reset), vendor impersonation, executive impersonation (BEC simulation). For phishing: clone legitimate landing pages, use typosquatted or look-alike domains registered well in advance, track click/credential submission rates. Vishing: script out the call flow, record with consent. Debrief employees post-engagement."},
    {q:'How do you find and chain vulnerabilities for maximum impact?',a:"Look for vulnerability chains rather than isolated findings: combine a low-severity info disclosure with an IDOR to reach a critical outcome. Classic chains: SSRF + IMDS → cloud credential theft, XXE → internal file read + credential leak → RCE, stored XSS + CSRF bypass → account takeover. Business logic flaws are often the highest value — they require deep application understanding, not just automated scanning."},
    {q:'What tools make up your red team toolkit?',a:"Reconnaissance: Shodan, Amass, OSINT Framework, Maltego. Initial Access: GoPhish (phishing), Evilginx2 (AITM), Metasploit, custom implants. Post-Exploitation: Cobalt Strike/Sliver/Havoc C2, BloodHound (AD paths), Mimikatz, Rubeus, SharpHound. Lateral Movement: PsExec, WMI, RDP, CrackMapExec. Evasion: custom packers, process injection techniques. Web Testing: Burp Suite Pro."},
    {q:'How do you write an executive-level penetration test report?',a:"Executive Summary (1-2 pages max): overall risk rating, top 3 findings in business language, remediation priority roadmap. Avoid technical jargon in exec section. Technical sections: finding detail (title, CVSS score, description, evidence with screenshots, reproduction steps, remediation steps). Include an attack path narrative showing how findings chain together. Appendices: methodology, scope, tools used."},
    {q:'What is your process for responsible disclosure when you find critical vulnerabilities?',a:"For authorized engagements: notify client immediately for critical findings — do not wait for final report. Include reproduction steps and suggested remediation. For bug bounties: follow program's disclosure policy, report through designated channel, give reasonable remediation timeline (90 days is standard) before public disclosure. CVE assignment if it's a vendor product vulnerability. Never publish PoC before patch is available if lives or critical infrastructure at risk."}
  ]},
  'senior-appsec': {title:'Senior AppSec Engineer', qs:[
    {q:'How do you design and run a security champions program at scale?',a:"Recruit 1 champion per engineering squad (voluntary but incentivized). Training: quarterly AppSec workshops, access to OWASP resources and internal AppSec team. Responsibilities: triage SAST findings for their repo, conduct peer security code reviews, represent security in sprint planning. Recognition: security champion certification, public acknowledgment. Champions scale AppSec coverage 10-20x vs. a small central team alone."},
    {q:'How do you prioritize which vulnerabilities to fix when you have limited engineering capacity?',a:"Risk-based prioritization: CVSS + exploitability (EPSS score) + business criticality of the affected asset + presence of existing compensating controls. Use a risk scoring matrix. Critical/High with public exploits on production internet-facing systems = immediate. Automate low-severity fixes where possible (dependency updates, header additions). Involve engineering leads in prioritization to build alignment."},
    {q:'Explain supply chain security risks in software development.',a:"Attack vectors: compromised open-source dependencies (SolarWinds-style, xz utils backdoor), typosquatted packages (malicious npm/PyPI packages with similar names), compromised build environments (CI/CD pipeline attacks), malicious code in legitimate package updates. Mitigations: SCA tools (Snyk, Dependabot), pin dependency versions + verify hashes (SLSA framework), sign artifacts (Sigstore), scan CI/CD configurations, review supply chain for critical dependencies."},
    {q:'How do you integrate security into a CI/CD pipeline?',a:"Pre-commit hooks: SAST scan, secret detection (Gitleaks, detect-secrets). PR stage: SAST, SCA (dependency vulnerabilities), IaC scanning (Checkov, tfsec). Build stage: container image scanning (Trivy, Grype), SBOM generation. Deploy stage: DAST against staging environment, compliance checks. Post-deploy: runtime monitoring, DAST scheduled scans. Fail builds on critical/high findings with clear developer feedback."},
    {q:'What is your approach to API security testing?',a:"Authentication: test for auth bypass, token prediction, JWT weaknesses (algorithm confusion, none algorithm). Authorization: test every endpoint for IDOR/BOLA, horizontal and vertical privilege escalation, broken function-level auth. Input validation: injection in all parameters (SQL, command, SSTI, GraphQL introspection), excessive data exposure (API returns more data than needed). Rate limiting: test for brute force on auth endpoints. Use Burp Suite + custom scripts."},
    {q:'How do you build a threat model for a complex microservices architecture?',a:"Use STRIDE per service and per inter-service communication channel. Map all trust boundaries — external API, service-to-service calls (mTLS? Auth token?), database access, third-party integrations. Data flow diagrams for each sensitive data path. Focus on: authentication between services, secrets management, network exposure, blast radius if a service is compromised. Output: risk-ranked findings mapped to architecture components."},
    {q:'What secure coding standards do you enforce and how?',a:"OWASP Secure Coding Practices as baseline. Language-specific: CERT C/C++, Google Java Style for Java, PEP 8 + Bandit for Python. Enforcement: mandatory SAST in CI pipeline, peer code review checklist with security items, linting rules configured in IDE (SonarLint), training developers on language-specific pitfalls. Work with engineering leads to embed in team standards rather than imposing externally."},
    {q:'How do you measure AppSec program ROI to justify budget?',a:"Metrics that resonate with leadership: cost avoided (average breach cost in industry $4.4M vs. AppSec program cost), vulnerability trend over time (are we finding more in SDLC vs. production?), mean time to remediate critical vulns, % of releases with completed security review, reduction in pen test findings year over year. Show progress toward security maturity model targets."},
    {q:'Walk me through handling a critical vulnerability disclosure from a security researcher.',a:"Acknowledge within 24 hours (builds researcher trust and goodwill). Validate the report (reproduce in test environment). Assess severity (CVSS + business impact). Assign fix to engineering with priority SLA. Communicate remediation timeline to researcher. Deploy fix. Verify remediation. Issue CVE if applicable. Public disclosure after patch (coordinate timing with researcher). Consider bug bounty if not already in program. Recognize researcher credit if they consent."},
    {q:'What do you look for in a security code review for authentication logic?',a:"Password storage (bcrypt/Argon2 vs. MD5/SHA-1 or plaintext), session token entropy and rotation on login/logout/privilege change, account lockout logic (brute force protection), MFA implementation (TOTP correctly validated? Time window appropriate?), password reset flows (token entropy, expiration, single-use enforcement), remember-me functionality (secure cookie attributes), OAuth flow security (state parameter, redirect URI validation)."}
  ]},
  'senior-grc': {title:'Senior GRC Analyst', qs:[
    {q:'How do you build and manage an enterprise risk management (ERM) program?',a:"Establish risk governance structure (CISO owns, board audit committee oversees). Develop risk taxonomy and scoring methodology (likelihood × impact matrix). Conduct annual risk assessment using interviews, threat intel, and control testing. Maintain risk register with quarterly updates. Report top risks to board via heat map. Track remediation plans and residual risk acceptance by risk owners. Integrate with business strategy planning cycle."},
    {q:'How do you manage multiple compliance frameworks simultaneously without duplicating effort?',a:"Use a common controls framework (UCF or NIST CSF as backbone). Map all framework requirements to a master control library — each control has evidence artifacts that satisfy multiple frameworks simultaneously. Tools: Archer, ServiceNow GRC, Tugboat Logic. This approach reduces audit evidence collection by 60-70% compared to treating each framework separately. Key: maintain a single evidence repository."},
    {q:'Explain how you would prepare an organization for its first ISO 27001 certification.',a:"Gap assessment vs. Annex A controls → risk assessment (ISO 27005 methodology) → define risk treatment plan → develop ISMS documentation (scope, policy, SoA, risk register) → implement controls → conduct internal audit → management review → Stage 1 (document review audit) → Stage 2 (controls testing) → certification. Timeline: 12-18 months for mature orgs; 18-24 months for first-time. Ongoing: annual surveillance audits, 3-year recertification."},
    {q:'How do you run an effective tabletop exercise?',a:"Select scenario based on top organizational risks (ransomware, insider threat, supply chain attack). Define objectives: test IR plan, communications, decision-making under pressure. Invite: CISO, CTO, Legal, Communications, Business continuity, key technical leads. Facilitator injects new information periodically to increase stress. Debrief: document gaps identified, assign owners and timelines. Update IR plan with lessons learned within 30 days."},
    {q:'What is the role of GRC in mergers and acquisitions?',a:"Pre-acquisition due diligence: assess target's security posture, compliance obligations, known breaches, pending litigation, regulatory exposure, data privacy practices. Risk quantification: identify material security risks that affect deal valuation. Post-acquisition integration: harmonize policies, rationalize security tooling, extend compliance frameworks, assess workforce IAM integration, address legacy technical debt. Report to deal team and board on material security risks discovered."},
    {q:'How do you measure the effectiveness of security controls?',a:"Control testing: design effectiveness (does the control address the risk?), operating effectiveness (is it working as designed?). Methods: automated continuous control monitoring (CCM), periodic manual testing, internal audit sampling, pen test findings. Metrics: control coverage rate, control failure rate, time to remediate failed controls, percentage of key controls tested annually. Report control health via dashboard to CISO and audit committee."},
    {q:'How do you handle a regulatory audit or examination?',a:"Preparation: maintain always-audit-ready posture (living documentation, pre-collected evidence packages). Day-of: single point of contact manages auditor requests, legal counsel on standby, no undocumented off-the-record conversations. Respond to requests within SLA, provide context with evidence (don't just dump documents). If you discover a gap during audit: disclose proactively with remediation timeline rather than having auditor find it — regulators value transparency."},
    {q:'What is cyber risk quantification and how do you use FAIR?',a:"FAIR (Factor Analysis of Information Risk) provides a financial model for cyber risk: Loss Event Frequency × Loss Magnitude = Risk in dollar terms. Inputs: threat event frequency, vulnerability (probability control fails), primary loss (direct costs) and secondary loss (regulatory, reputational). Output: risk range in annualized dollar terms. Value: enables comparison of security investment ROI against residual risk in language CFO/board understands."},
    {q:'How do you build a vendor risk management program?',a:"Tier vendors by data access and criticality (Tier 1: critical data/systems, annual assessment; Tier 2: moderate, biennial; Tier 3: low, questionnaire only). Assessment toolkit: SIG Lite questionnaire, request SOC 2 Type II / ISO 27001 certs, review pentest summaries. Track fourth-party risk (your vendors' critical vendors). Contractual controls: security addendum, right-to-audit clause, breach notification requirements. Monitor via BitSight or SecurityScorecard."},
    {q:'How do you communicate security risk to the board?',a:"Frame in business terms: potential financial impact, regulatory exposure, reputational damage, operational disruption. Use risk heat maps — visual, intuitive. Show trend (is risk increasing or decreasing?). Benchmark against peers. Limit to top 5 risks — boards are not technical audiences. Present risk treatment options with cost-benefit, not just the problem. Come with a recommended action, not just data. CISO should present directly, not through proxy."}
  ]},
  'sec-mgr': {title:'Security Manager', qs:[
    {q:'How do you build and develop a high-performing security team?',a:"Hire for potential and culture fit as much as current skill. Define clear career ladders so analysts know growth paths. Balance senior/junior mix — seniors mentor and prevent burnout spreading. Provide learning budget (certs, training, conferences). Regular 1:1s focused on development. Rotate analysts through different areas to prevent siloing. Recognize and reward publicly. Address performance issues early."},
    {q:'How do you manage SOC analyst burnout?',a:"Burnout drivers: alert fatigue, repetitive tasks, night shifts, lack of impact visibility. Mitigations: reduce false positives through detection tuning (give analysts less noise), automate repetitive tasks with SOAR, rotate shifts fairly, provide clear incident impact reporting (show analysts the breaches they prevented), set realistic on-call expectations, enforce PTO, create a culture where asking for help is normal."},
    {q:'Walk me through how you would handle a major security incident as the manager.',a:"Activate IR plan immediately. Assign incident commander role (often yourself). Establish a bridge call with key stakeholders. Delegate technical containment/investigation to senior analysts. Own executive communication — provide brief, frequent updates. Coordinate with Legal (breach notification obligations), Communications (if public disclosure needed), and HR (if insider involved). Document decisions in real time. Run post-incident review within 2 weeks."},
    {q:'How do you justify security investments to leadership?',a:"Translate risk to business impact: breach cost (IBM Cost of Breach = avg $4.4M), regulatory fines, downtime cost, reputational impact. Show ROI: if a $200K tool prevents a $4M breach even once in 5 years, the ROI is strong. Use peer benchmarking — are we spending less than industry average? Use recent industry incidents as proxies (e.g., &quot;a company our size was hit with this attack last month&quot;). Quantify residual risk without the investment."},
    {q:'How do you measure and report SOC performance?',a:"Key metrics: Mean Time to Detect (MTTD), Mean Time to Respond (MTTR), alert volume and trend, true positive rate, analyst utilization rate, SLA compliance (what % of P1/P2 incidents met response SLA). Operational metrics: tickets closed per analyst per day, SOAR automation rate, false positive rate by detection source. Report monthly to CISO, quarterly trend to leadership. Avoid vanity metrics (raw alert count means nothing without context)."},
    {q:'How do you build the security team\'s relationship with other IT and engineering teams?',a:'Security is a blocker if it only says no. Be a consultant, not a checkpoint. Embed security engineers in development teams where possible. Conduct lunch-and-learns to educate without lecturing. Solve engineering problems with security solutions (not vice versa). Create a security champions program. Acknowledge engineering team security wins publicly. Build relationships before you need them in an incident.'},
    {q:'What is your approach to vendor and tooling selection?',a:"Start with requirements from the team who will use the tool. Define evaluation criteria: detection coverage, integration capability, ease of use, scalability, total cost of ownership (including staff time to maintain), vendor support quality. Run a structured PoC (proof of concept) with realistic data and realistic attack scenarios. Involve the analysts who will use it daily — their buy-in determines adoption. Check references from similar-size organizations."},
    {q:'How do you handle a situation where a senior analyst disagrees with your technical decision?',a:"Acknowledge their perspective — senior analysts often have critical context. If it's purely technical and they have more direct expertise, consider changing your decision and crediting them. If it's a management decision with broader context (risk appetite, budget, regulatory), explain the full picture. Create a culture where disagreement is raised through proper channels (1:1, team discussion) not passive resistance. Document decisions with reasoning."},
    {q:'Describe how you would build a SOC from scratch.',a:"Start with the mission (what threats are you defending against?). Define scope (on-prem, cloud, endpoints). Select a SIEM (Splunk, Sentinel, Elastic) and EDR platform. Onboard log sources in priority order: AD/identity, endpoints, firewalls, cloud. Write first detection rules (focus on high-confidence, high-impact — PtH, admin tool abuse, cloud IAM changes). Build runbooks for top 10 incident types. Hire analysts. Measure MTTD/MTTR from day one and track improvement."},
    {q:'How do you approach developing analysts toward senior and specialist roles?',a:"Identify each analyst's strengths and interests early. Create development plans: certifications (GIAC for technical growth), projects that stretch current skills, opportunities to lead smaller incidents. Pair junior analysts with seniors during complex investigations. Rotate through threat hunting, detection engineering, and IR — different skills needed for each. Set clear promotion criteria. Give public credit when analysts make good calls."}
  ]},
  'dir-sec': {title:'Director of Security', qs:[
    {q:'How do you build a multi-year security program roadmap?',a:"Start with a current-state assessment (NIST CSF or CIS Controls maturity model). Define target state based on risk appetite, business objectives, and regulatory requirements. Identify gaps and prioritize by risk reduction impact and feasibility. Build a 3-year roadmap with annual milestones. Tie each initiative to a business outcome. Budget annually within a 3-year envelope. Review and adjust quarterly. Present to CISO and board annually."},
    {q:'How do you manage budget and headcount for a large security organization?',a:"Budget planning: bottoms-up (team leads submit needs + justification) + top-down (CISO allocates envelope). Categorize spend: run (keeping lights on), grow (incremental improvements), transform (strategic initiatives). Benchmark against peers (Gartner, Forrester spend benchmarks). Headcount planning: model on risk exposure, not just org size. Prioritize roles that fill highest-risk gaps. Use managed services to flex capacity without full-time headcount."},
    {q:'How do you build a security culture across a large organization?',a:"Culture comes from top: board and CEO must visibly prioritize security. Programs: phishing simulations (not blame-focused), security awareness training (behavioral, not compliance checkbox), security champions in engineering teams, security incident post-mortems that are blameless, executive communication that frames security as business enablement. Measure: phishing click rates, training completion, security incident self-reporting rates."},
    {q:'How do you evaluate and manage MSSPs (Managed Security Service Providers)?',a:"Define SLAs contractually: MTTD, MTTR, escalation timelines, reporting cadence. Monthly service review meetings (operational metrics). Quarterly business reviews (strategic alignment). Test MSSP effectiveness: conduct purple team exercises and measure detection rates, run tabletops that include MSSP in IR workflows. Ensure proper data classification — what data leaves your environment to the MSSP? Maintain in-house capability to validate MSSP work and to function if contract ends."},
    {q:'How do you align the security program with business objectives?',a:"Attend business strategy sessions — understand where the business is going (new markets, M&A, new products) and what that means for security risk. Map top business initiatives to security implications. Frame security investments in terms of enabling business: &quot;this enables us to meet FedRAMP requirements and open the federal market.&quot; Risk appetite discussions must involve the business, not be dictated by security. Report security health metrics that correlate to business outcomes."},
    {q:'How do you handle a situation where you inherit a broken security program?',a:"First 90 days: listen and assess (don't announce changes immediately). Understand current state: review last audit findings, recent incidents, team structure, tooling, budget, key stakeholder relationships. Identify quick wins that build credibility (fix an obvious gap fast). Prioritize: what are the 3 highest risks that need immediate attention? Build a roadmap and communicate it. Bring the team along — they know the environment, you need their trust."},
    {q:'What is your approach to board-level security reporting?',a:"Board wants: are we materially at risk? Are we trending better or worse? What are we spending and is it justified? How do we compare to peers? Format: one-page dashboard (risk heat map, key metrics vs. last period, top 3 concerns, ask if any). Avoid technical jargon entirely. Prepare a 10-minute verbal brief backed by 2-3 slides. Anticipate questions: &quot;What would it cost if we were breached?&quot; Answer with quantification."},
    {q:'How do you build and maintain relationships with law enforcement and regulators?',a:"Proactive relationship building before you need them. FBI Cyber Division has regional outreach; attend their cybersecurity briefings. CISA offers free resources and coordination for critical infrastructure. Regulators (OCC, SEC, FTC): understand their frameworks and reporting requirements. Breach notification: having an existing relationship with regulators before a breach significantly improves the response experience. Coordinate with Legal before any law enforcement engagement."},
    {q:'Describe how you would handle a public security breach disclosure.',a:"Legal counsel leads disclosure decisions. Notifications: regulatory (breach notification laws — 72 hours for GDPR, state laws vary), law enforcement (FBI, CISA for critical infrastructure), customers/partners (per contractual and legal obligations). Communications team drafts external messaging. Key principles: disclose what you know accurately, avoid speculating about what you don't know, don't minimize impact, communicate what you've done to stop it. Timing: coordinate regulatory, customer, and public disclosure simultaneously where possible."},
    {q:'How do you approach security for a global organization with different regulatory requirements?',a:"Map all applicable regulations by jurisdiction: GDPR (EU), PIPL (China), LGPD (Brazil), state laws (CCPA), industry-specific (PCI, HIPAA, CMMC). Build a privacy/security control framework that satisfies the strictest requirements — often GDPR is the baseline. Data residency requirements may require separate infrastructure in some regions. Hire regional GRC expertise. Build a global policy framework with local addenda where regulations differ."}
  ]}
};

function loadInterviewQ(jobKey) {
  var content = document.getElementById('interview-content');
  if (!jobKey || !INTERVIEW_QA[jobKey]) {
    content.innerHTML = '<div style="text-align:center;padding:60px 0;color:var(--mt);"><div style="font-size:2rem;margin-bottom:12px;">🎯</div><div style="font-family:var(--fm);font-size:.65rem;text-transform:uppercase;letter-spacing:.14em;">Select a job title above to load interview questions</div></div>';
    return;
  }
  var data = INTERVIEW_QA[jobKey];
  content.innerHTML = '<div style="margin-bottom:20px;"><div style="font-weight:800;font-size:1.1rem;margin-bottom:4px;">' + data.title + '</div><div style="font-family:var(--fm);font-size:.58rem;text-transform:uppercase;letter-spacing:.14em;color:var(--mt);">' + data.qs.length + ' interview questions</div></div>' +
    '<div style="display:flex;flex-direction:column;gap:10px;">' +
    data.qs.map(function(item, i) {
      var safeQ = item.q.replace(/'/g, "&#39;");
      var safeA = item.a.replace(/'/g, "&#39;");
      return '<details class="iprep-q"><summary>' + (i+1) + '. ' + item.q + '</summary><div class="iprep-a"><p><strong style="color:var(--lb);">What to cover:</strong></p><p>' + item.a + '</p></div></details>';
    }).join('') +
    '</div>';
}

// ══════════ JOB BOARD QUESTIONNAIRE ══════════
var jbState = {domain:'', titles:[], exp:'', work:'', clearance:''};

var JB_TITLES_BY_DOMAIN = {
  'IAM': ['IAM Administrator','IAM Engineer','PAM Engineer','Cloud IAM Engineer','Identity Specialist','IAM Architect','Principal IAM Architect','IGA Analyst','Okta Engineer','SailPoint Developer','CyberArk Engineer','Directory Services Engineer','Senior IAM Engineer','IAM Team Lead','Director of IAM'],
  'SOC / IR': ['SOC Analyst I','SOC Analyst II','Cybersecurity Analyst I','Incident Responder','Threat Hunter','Detection Engineer','Threat Intelligence Analyst','Senior Threat Intel Analyst','Senior SOC Analyst','Threat Hunt Lead','Senior Detection Engineer','SOC Manager','Director of SOC','CSIRT Analyst'],
  'Cloud Security': ['Cloud Support Engineer','Cloud Security Engineer','Cloud IAM Engineer','DevSecOps Engineer','Senior Cloud Security Engineer','Cloud Security Architect','Cloud Security Manager','Director of Cloud Security','Principal Cloud Security Architect'],
  'AppSec': ['Junior AppSec Engineer','AppSec Engineer','DevSecOps Engineer','Senior AppSec Engineer','Staff AppSec Engineer','AppSec Manager','Director of AppSec','Bug Bounty Hunter','Security Champion'],
  'Offensive': ['Junior Penetration Tester','Penetration Tester','Bug Bounty Hunter','Senior Penetration Tester','Red Team Lead','Vulnerability Researcher','Exploit Developer','Head of Red Team','Director of Red Team'],
  'GRC': ['Privacy Analyst','GRC Analyst I','GRC Analyst II','IT Risk Analyst','Security Compliance Analyst','Privacy Engineer','Senior GRC Analyst','Compliance Manager','Director of GRC'],
  'DFIR': ['Junior DFIR Analyst','DFIR Analyst','Malware Analyst','Senior Malware Analyst','Senior DFIR Analyst','DFIR Manager','Director of DFIR'],
  'Security Engineering': ['Vulnerability Analyst','Network Security Analyst','Junior Security Engineer','Security Engineer','Security Automation Engineer','Vulnerability Management Engineer','OT/ICS Security Analyst','Security Consultant','Senior Security Engineer','Security Architect','Senior OT/ICS Security Engineer','Principal Security Engineer','Distinguished Security Engineer','Security Engineering Manager','Director of Security Engineering'],
  'General / Any': ['Cybersecurity Analyst I','Information Security Analyst','Security Specialist','Cybersecurity Engineer','Security Consultant','Security Architect','CISO','Deputy CISO','VP of Security','VP of Information Security','Fractional CISO']
}
function selectJbChoice(key, btn, val) {
  if (key === 'titles') {
    // Multi-select for titles
    btn.classList.toggle('active');
    var title = val;
    var idx = jbState.titles.indexOf(title);
    if (idx >= 0) jbState.titles.splice(idx,1);
    else jbState.titles.push(title);
    return;
  }
  // Single select for others
  var container = btn.parentElement;
  container.querySelectorAll('.jb-choice-btn').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  jbState[key] = val;
  if (key === 'domain') loadJbTitles(val);
}

function loadJbTitles(domain) {
  var titles = JB_TITLES_BY_DOMAIN[domain] || [];
  jbState.titles = [];
  var container = document.getElementById('jb-title-btns');
  if (!container) return;
  container.innerHTML = titles.map(function(t) {
    return '<button class="jb-choice-btn" onclick="selectJbChoice(\'titles\',this,\''+t.replace(/'/g,"\\'")+'\')">' + t + '</button>';
  }).join('');
}

function buildSearchUrl(board, titles, domain, exp, work, clearance) {
  var query = titles.length > 0 ? titles[0] : domain + ' security';
  var expMap = {entry:'entry level', mid:'mid level', senior:'senior', principal:'principal staff'};
  var expStr = expMap[exp] || '';
  var workMap = {remote:'remote', hybrid:'hybrid', onsite:'', any:''};
  var workStr = workMap[work] || '';

  var q = encodeURIComponent(query + (expStr?' '+expStr:'') + (workStr?' '+workStr:''));
  
  if (board === 'linkedin') {
    var expLvl = {entry:'1,2', mid:'3', senior:'4', principal:'5,6'}[exp] || '';
    var remoteFilter = work==='remote'?'&f_WT=2':work==='hybrid'?'&f_WT=3':'';
    return 'https://www.linkedin.com/jobs/search/?keywords='+q+(expLvl?'&f_E='+expLvl:'')+remoteFilter;
  }
  if (board === 'indeed') {
    var remoteQ = work==='remote'?' remote':work==='hybrid'?' hybrid':'';
    return 'https://www.indeed.com/jobs?q='+encodeURIComponent(query+remoteQ)+'&l='+(work==='remote'?'Remote':'');
  }
  if (board === 'dice') return 'https://www.dice.com/jobs?q='+q+(work==='remote'?'&remoteCodes=TRUE':'');
  if (board === 'clearance') return 'https://www.clearancejobs.com/jobs?q='+encodeURIComponent(query);
  if (board === 'usajobs') return 'https://www.usajobs.gov/Search/Results?k='+encodeURIComponent(query);
  if (board === 'cyberseek') return 'https://www.cyberseek.org/heatmap.html';
  if (board === 'glassdoor') return 'https://www.glassdoor.com/Job/jobs.htm?sc.keyword='+q+(work==='remote'?'&remoteWorkType=1':'');
  return '#';
}

function generateJobLinks() {
  if (!jbState.domain) { alert('Please select a domain.'); return; }
  if (!jbState.exp) { alert('Please select your experience level.'); return; }
  if (!jbState.work) { alert('Please select a work arrangement.'); return; }
  if (!jbState.clearance) { alert('Please answer the clearance question.'); return; }

  document.getElementById('job-quiz-form').style.display = 'none';
  document.getElementById('jb-results').style.display = 'block';

  var titleList = jbState.titles.length > 0 ? jbState.titles : [jbState.domain + ' specialist'];
  var titleDisplay = titleList.slice(0,3).join(', ') + (titleList.length > 3 ? ' +' + (titleList.length-3) + ' more' : '');

  document.getElementById('jb-results-title').textContent = 'Job Search for: ' + (jbState.titles.length > 0 ? jbState.titles[0] : jbState.domain);
  document.getElementById('jb-results-sub').textContent = jbState.domain + ' · ' + {entry:'Entry Level',mid:'Mid Level',senior:'Senior',principal:'Principal+'}[jbState.exp] + ' · ' + {remote:'Remote',hybrid:'Hybrid',onsite:'On-site',any:'Any location'}[jbState.work];

  // Stats cards
  var expSalMap = {
    'IAM':         {entry:'$65K–$95K', mid:'$95K–$138K', senior:'$138K–$185K', principal:'$185K–$265K'},
    'SOC / IR':    {entry:'$55K–$88K', mid:'$80K–$128K', senior:'$120K–$165K', principal:'$165K–$210K'},
    'Cloud Security':{entry:'$70K–$98K', mid:'$95K–$148K', senior:'$135K–$200K', principal:'$175K–$278K'},
    'AppSec':      {entry:'$65K–$100K',mid:'$90K–$142K', senior:'$128K–$192K', principal:'$162K–$258K'},
    'Offensive':   {entry:'$60K–$95K', mid:'$85K–$135K', senior:'$120K–$182K', principal:'$170K–$272K'},
    'GRC':         {entry:'$55K–$90K', mid:'$82K–$128K', senior:'$112K–$168K', principal:'$160K–$255K'},
    'DFIR':        {entry:'$58K–$90K', mid:'$80K–$125K', senior:'$118K–$178K', principal:'$168K–$220K'},
    'Security Engineering':{entry:'$65K–$100K',mid:'$88K–$138K',senior:'$122K–$185K',principal:'$160K–$250K'},
    'General / Any':{entry:'$55K–$88K',mid:'$80K–$128K',senior:'$115K–$170K',principal:'$155K–$240K'},
  };
  var salRange = (expSalMap[jbState.domain]||{})[jbState.exp] || 'See salary guide';
  
  var demandMap = {entry:'High — entry demand is strong',mid:'Very High',senior:'High — competition increases',principal:'Selective — fewer roles, high pay'};
  var clearancePremium = jbState.clearance === 'yes' ? '+$15K–40K salary premium typical' : 'Clearance adds significant value — consider pursuing';
  
  document.getElementById('jb-stats').innerHTML = [
    {icon:'💰', label:'Typical Salary Range', val: salRange},
    {icon:'📈', label:'Demand Level', val: demandMap[jbState.exp] || 'Strong'},
    {icon:'🔏', label:'Clearance Premium', val: clearancePremium},
    {icon:'🎯', label:'Titles Targeted', val: titleList.length + ' job title' + (titleList.length!==1?'s':'')},
  ].map(function(stat){
    return '<div style="background:var(--sf);border:1px solid var(--bd2);border-radius:12px;padding:16px 18px;">' +
      '<div style="font-size:1.2rem;margin-bottom:6px;">' + stat.icon + '</div>' +
      '<div style="font-family:var(--fm);font-size:.5rem;text-transform:uppercase;letter-spacing:.14em;color:var(--mt);margin-bottom:4px;">' + stat.label + '</div>' +
      '<div style="font-size:.82rem;font-weight:600;">' + stat.val + '</div>' +
    '</div>';
  }).join('');

  // Build job board links
  var boards = [
    {id:'linkedin', name:'LinkedIn Jobs', icon:'💼', color:'rgba(10,102,194,.2)', border:'rgba(10,102,194,.4)', desc:'Largest professional network — best for referrals and networking'},
    {id:'indeed', name:'Indeed', icon:'🔍', color:'rgba(34,211,238,.06)', border:'rgba(34,211,238,.2)', desc:'Highest volume of postings — great for breadth'},
    {id:'dice', name:'Dice.com', icon:'🎲', color:'rgba(249,115,22,.08)', border:'rgba(249,115,22,.2)', desc:'Tech-focused — strong for security engineering roles'},
    {id:'glassdoor', name:'Glassdoor', icon:'⭐', color:'rgba(0,224,122,.06)', border:'rgba(0,224,122,.2)', desc:'See salary data and company reviews alongside listings'},
    {id:'cyberseek', name:'CyberSeek Heat Map', icon:'🗺️', color:'rgba(168,85,247,.08)', border:'rgba(168,85,247,.2)', desc:'See where the most cyber jobs are geographically'},
  ];
  
  if (jbState.clearance === 'yes') {
    boards.push({id:'clearance', name:'ClearanceJobs', icon:'🔐', color:'rgba(244,63,94,.08)', border:'rgba(244,63,94,.2)', desc:'#1 job board for cleared candidates — exclusive listings'});
  }
  boards.push({id:'usajobs', name:'USAJobs (Federal)', icon:'🏛️', color:'rgba(59,130,246,.08)', border:'rgba(59,130,246,.2)', desc:'Federal government postings — many require or prefer clearance'});

  document.getElementById('jb-links').innerHTML = boards.map(function(b){
    var url = buildSearchUrl(b.id, titleList, jbState.domain, jbState.exp, jbState.work, jbState.clearance);
    return '<a href="'+url+'" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:16px;padding:16px 20px;background:'+b.color+';border:1px solid '+b.border+';border-radius:12px;text-decoration:none;transition:all .15s;" onmouseover="this.style.transform=\'translateX(4px)\'" onmouseout="this.style.transform=\'none\'">' +
      '<span style="font-size:1.4rem;flex-shrink:0;">'+b.icon+'</span>' +
      '<div style="flex:1;"><div style="font-weight:700;font-size:.9rem;color:var(--tx);margin-bottom:2px;">'+b.name+'</div>' +
      '<div style="font-size:.74rem;color:var(--mt);">'+b.desc+'</div></div>' +
      '<span style="color:var(--mt);font-size:.8rem;flex-shrink:0;">Open →</span>' +
    '</a>';
  }).join('');

  // Tips
  var tips = [
    '💡 <strong>Pro tip:</strong> Apply to 10–15 roles simultaneously rather than waiting for responses one at a time. Response rates in security are typically 10–20%.',
    '📝 <strong>Tailor your resume</strong> to match keywords in each job description — many companies use ATS filtering before human review.',
  ];
  if (jbState.exp === 'entry') tips.push('🎯 <strong>Entry-level tip:</strong> Look for "analyst" roles over "engineer" titles — they typically have lower experience bars. Internships, contract roles, and MSSP positions are great entry points.');
  if (jbState.clearance === 'yes') tips.push('🔐 <strong>Clearance advantage:</strong> Your clearance is worth $15K–40K in premium. Lead with it on your resume header. Government contractors pay a significant premium for cleared candidates.');
  if (jbState.work === 'remote') tips.push('🏠 <strong>Remote search tip:</strong> Filter LinkedIn by "Remote" in location field, not just the remote toggle — many remote roles are miscategorized.');
  
  document.getElementById('jb-tips').innerHTML = tips.join('<br><br>');

  document.getElementById('jb-results').scrollIntoView({behavior:'smooth',block:'start'});
}

function resetJobQuiz() {
  jbState = {domain:'', titles:[], exp:'', work:'', clearance:''};
  document.querySelectorAll('.jb-choice-btn').forEach(function(b){ b.classList.remove('active'); });
  document.getElementById('jb-title-btns').innerHTML = '<div style="font-family:var(--fm);font-size:.6rem;text-transform:uppercase;letter-spacing:.1em;color:var(--dm);padding:8px 0;">Select a domain above to see relevant titles</div>';
  document.getElementById('job-quiz-form').style.display = 'block';
  document.getElementById('jb-results').style.display = 'none';
}

function showSalaryFilter(domain) {
  showPage('salary');
  // Set domain filter and rerun
  var sel = document.getElementById('sal-domain');
  if (sel) {
    sel.value = domain;
    filterSalary();
    setTimeout(function(){ document.getElementById('sal-table').scrollIntoView({behavior:'smooth',block:'start'}); }, 100);
  }
}

function showSalaryTierFilter(tier, track) {
  showPage('salary');
  var tierSel = document.getElementById('sal-tier');
  var trackSel = document.getElementById('sal-track');
  if (tierSel) tierSel.value = tier;
  if (trackSel && track) trackSel.value = track;
  filterSalary();
  setTimeout(function(){ document.getElementById('sal-table').scrollIntoView({behavior:'smooth',block:'start'}); }, 100);
}

// ── Fixed tooltip positioning for career ladder job cards ──
document.addEventListener('mouseover', function(e) {
  var jc = e.target.closest('.jc');
  if (!jc) return;
  var tip = jc.querySelector('.tip');
  if (!tip) return;
  var rect = jc.getBoundingClientRect();
  var tipW = 260;
  var left = rect.left + rect.width/2 - tipW/2;
  // Clamp to viewport
  left = Math.max(8, Math.min(left, window.innerWidth - tipW - 8));
  var top = rect.top - 8; // position above, JS will flip if needed
  // Prefer above
  if (rect.top > 180) {
    tip.style.top = (rect.top - 8) + 'px';
    tip.style.transform = 'translateY(-100%)';
  } else {
    tip.style.top = (rect.bottom + 8) + 'px';
    tip.style.transform = 'none';
  }
  tip.style.left = left + 'px';
});

function toggleSalDesc(id) {
  var el = document.getElementById(id);
  if (!el) return;
  el.style.display = el.style.display === 'none' ? 'table-row' : 'none';
}

// ── Interview Prep search filter ──
function filterIprepOptions() {
  var query = (document.getElementById('iprep-search').value || '').toLowerCase();
  var sel = document.getElementById('interview-select');
  if (!sel) return;
  var groups = sel.querySelectorAll('optgroup');
  groups.forEach(function(grp) {
    var opts = grp.querySelectorAll('option');
    var anyVisible = false;
    opts.forEach(function(opt) {
      var match = !query || opt.text.toLowerCase().indexOf(query) >= 0;
      opt.style.display = match ? '' : 'none';
      if (match) anyVisible = true;
    });
    grp.style.display = anyVisible ? '' : 'none';
  });
  // Auto-select if exactly one match
  if (query) {
    var visible = Array.from(sel.querySelectorAll('option')).filter(function(o){ return o.style.display !== 'none' && o.value; });
    if (visible.length === 1) {
      sel.value = visible[0].value;
      loadInterviewQ(visible[0].value);
    }
  }
}

function selectIprepTile(tile, jobKey) {
  document.querySelectorAll('.iprep-tile').forEach(function(t){ t.classList.remove('active'); });
  tile.classList.add('active');
  openIprepModal(jobKey);
}
function openIprepModal(jobKey) {
  var data = INTERVIEW_QA[jobKey];
  if (!data) return;
  var modal = document.getElementById('iprep-modal');
  var roleEl = document.getElementById('iprep-modal-role');
  var tierEl = document.getElementById('iprep-modal-tier');
  var bodyEl = document.getElementById('iprep-modal-body');
  roleEl.textContent = data.title || jobKey;
  // Get tier info from the clicked tile
  var tile = document.querySelector('.iprep-tile.active');
  tierEl.textContent = tile ? tile.querySelector('.iprep-tile-tier').textContent : '';
  // Build Q&A content
  var html = '';
  (data.qs || []).forEach(function(item, i) {
    html += '<div class="iprep-qa">'
      + '<div class="iprep-q-num">Q' + (i+1) + '</div>'
      + '<div class="iprep-q-text">' + item.q + '</div>'
      + '<div class="iprep-a-text">' + item.a + '</div>'
      + '</div>';
  });
  bodyEl.innerHTML = html || '<p style="color:var(--mt);padding:20px;">No questions found for this role.</p>';
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeIprepModal() {
  document.getElementById('iprep-modal').classList.remove('open');
  document.body.style.overflow = '';
}


function filterHpTab(cat, btn) {
  // Update active tab
  document.querySelectorAll('.hp-tab').forEach(function(t){ t.classList.remove('active'); });
  btn.classList.add('active');
  // Show/hide items
  document.querySelectorAll('.hpi').forEach(function(item) {
    if (cat === 'all' || item.dataset.cat === cat) {
      item.classList.remove('hidden');
    } else {
      item.classList.add('hidden');
    }
  });
}

function filterLpTab(cat, btn) {
  document.querySelectorAll('.lp-tab').forEach(function(t){ t.classList.remove('active'); });
  btn.classList.add('active');
  document.querySelectorAll('.lpi').forEach(function(item) {
    if (cat === 'all' || item.dataset.cat === cat) {
      item.classList.remove('lp-hidden');
    } else {
      item.classList.add('lp-hidden');
    }
  });
}

// ── HOME PAGE SCROLL REVEAL + TAB FILTER ──
function hp2InitReveal() {
  if (!window.IntersectionObserver) {
    // Fallback: just show everything
    document.querySelectorAll('.hp2-reveal').forEach(function(el){ el.classList.add('hp2-visible'); });
    return;
  }
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        e.target.classList.add('hp2-visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.hp2-reveal').forEach(function(el) {
    el.classList.remove('hp2-visible');
    obs.observe(el);
  });
}

function hp2FilterTab(cat, btn) {
  document.querySelectorAll('.hp2-tab').forEach(function(t){ t.classList.remove('active'); });
  btn.classList.add('active');
  document.querySelectorAll('#hp2-items .hp2-item').forEach(function(item) {
    var hide = cat !== 'all' && item.dataset.cat !== cat;
    item.classList.toggle('hp2-tk-hidden', hide);
  });
}

// ══════════════════════════════════════════
// HERO — PARTICLE CANVAS + TYPEWRITER
// ══════════════════════════════════════════

(function() {
  var _animFrame = null;

  // ── Particle canvas ──────────────────────
  function initHeroCanvas() {
    var canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    function resize() {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    var N = 60;
    var pts = [];
    for (var i = 0; i < N; i++) {
      pts.push({
        x:  Math.random() * canvas.width,
        y:  Math.random() * canvas.height,
        vx: (Math.random() - .5) * .28,
        vy: (Math.random() - .5) * .28,
        r:  Math.random() * 1.4 + .5
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var a = 0; a < N; a++) {
        for (var b = a + 1; b < N; b++) {
          var dx = pts[a].x - pts[b].x;
          var dy = pts[a].y - pts[b].y;
          var d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 130) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0,212,200,' + (.1 * (1 - d / 130)).toFixed(3) + ')';
            ctx.lineWidth = .5;
            ctx.moveTo(pts[a].x, pts[a].y);
            ctx.lineTo(pts[b].x, pts[b].y);
            ctx.stroke();
          }
        }
      }
      for (var i = 0; i < N; i++) {
        var p = pts[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,212,200,.38)';
        ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      }
      _animFrame = requestAnimationFrame(draw);
    }
    if (_animFrame) cancelAnimationFrame(_animFrame);
    draw();
  }

  // ── Typewriter ───────────────────────────
  var _typedTimer = null;
  var _typedWi = 0;
  var _typedWords = [
    'Cybersecurity.',
    'Offensive Sec.',
    'Cloud Security.',
    'Threat Intel.',
    'Identity & Access.',
    'Incident Response.'
  ];

  function initHeroTyped() {
    var el = document.getElementById('hero-typed');
    if (!el) return;
    if (_typedTimer) clearTimeout(_typedTimer);
    var wi = _typedWi, ci = _typedWords[wi].length, del = false;

    function tick() {
      var word = _typedWords[wi];
      if (!del) {
        el.textContent = word.slice(0, ++ci);
        if (ci === word.length) { del = true; _typedTimer = setTimeout(tick, 2200); return; }
      } else {
        el.textContent = word.slice(0, --ci);
        if (ci === 0) { del = false; wi = (wi + 1) % _typedWords.length; _typedWi = wi; }
      }
      _typedTimer = setTimeout(tick, del ? 38 : 78);
    }
    _typedTimer = setTimeout(tick, 1600);
  }

  // Expose restart for showPage hook
  window.heroRestartTyped = initHeroTyped;

  // Boot on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    initHeroCanvas();
    initHeroTyped();
  });
})();

// Init reveal on page load and whenever home becomes active
document.addEventListener('DOMContentLoaded', function() {
  hp2InitReveal();
});
// Re-init when navigating back to home (MutationObserver on page-home class)
(function() {
  var homeEl = document.getElementById('page-home');
  if (homeEl && window.MutationObserver) {
    var mo = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        if (m.attributeName === 'class' && homeEl.classList.contains('active')) {
          setTimeout(hp2InitReveal, 80);
        }
      });
    });
    mo.observe(homeEl, { attributes: true });
  }
})();

// ══════════════════════════════════════════
// TOOLKIT CARDS — Scroll-reveal via IntersectionObserver
// ══════════════════════════════════════════
(function() {
  function initScrollReveal() {
    var cards = document.querySelectorAll('.tk-card');
    if (!cards.length) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var card = entry.target;
          // Stagger by column position (0, 1, 2)
          var col = parseInt(card.dataset.tkCol || 0);
          card.style.transitionDelay = (col * 0.1) + 's';
          card.classList.add('tk-visible');
          // After reveal, reset delay so hover transition is instant
          card.addEventListener('transitionend', function onEnd() {
            card.style.transitionDelay = '0s';
            card.removeEventListener('transitionend', onEnd);
          }, { once: true });
          observer.unobserve(card);
        }
      });
    }, { threshold: 0.1 });

    cards.forEach(function(card, i) {
      card.dataset.tkCol = i % 3;
      observer.observe(card);
    });
  }

  document.addEventListener('DOMContentLoaded', initScrollReveal);
})();


// ══════════════════════ FEATURES v10 ══════════════════════
// ─── F1: WHAT'S NEW ───────────────────────────────────────
var WHATS_NEW=[
  {date:'Mar 2026',icon:'🗺️',text:'Career Roadmap — visual path explorer',page:'roadmap'},
  {date:'Mar 2026',icon:'🛠️',text:'Tool Encyclopedia — 80+ security tools catalogued',page:'tools'},
  {date:'Mar 2026',icon:'📅',text:'CTF & Conference Calendar — upcoming events',page:'calendar'},
  {date:'Mar 2026',icon:'📄',text:'Resume Templates — role-specific templates & tips',page:'resume'},
  {date:'Mar 2026',icon:'🏆',text:'Wall of Wins — community success stories',page:'stories'},
  {date:'Feb 2026',icon:'🧪',text:'Cert Comparison Tool — compare any two certs side by side',page:'certs'},
  {date:'Feb 2026',icon:'💰',text:'Salary Calculator — personalized salary estimates',page:'salary'},
];
function renderWhatsNew(){
  var c=document.getElementById('wn-items');
  if(!c)return;
  c.innerHTML=WHATS_NEW.map(function(n){
    return '<div class="wn-item" onclick="showPage(\''+n.page+'\')">'
      +'<span class="wn-icon">'+n.icon+'</span>'
      +'<div class="wn-body"><span class="wn-text">'+n.text+'</span></div>'
      +'<span class="wn-date">'+n.date+'</span>'
      +'</div>';
  }).join('');
}

// ─── F2: DAILY CHALLENGE ─────────────────────────────────
var DC_BANK=[
  {q:'What does the CIA triad stand for?',opts:['Confidentiality, Integrity, Availability','Control, Identity, Access','Cyber, Information, Architecture','Compliance, Infrastructure, Access'],correct:0,explain:'CIA triad: Confidentiality (authorized access only), Integrity (data accurate/unaltered), Availability (systems accessible when needed). The foundation of all information security.',cat:'Fundamentals',diff:'Easy'},
  {q:'Which port does HTTPS use by default?',opts:['Port 80','Port 8080','Port 443','Port 8443'],correct:2,explain:'HTTPS uses TCP port 443. HTTP uses port 80. 8080 and 8443 are common dev/alternate ports. The S in HTTPS is provided by TLS running on port 443.',cat:'Networking',diff:'Easy'},
  {q:'What is a zero-day vulnerability?',opts:['A flaw unknown to the vendor, actively exploited before a patch exists','A bug discovered and patched the same day','A flaw only affecting unpatched systems','A DoS attack crashing systems instantly'],correct:0,explain:'A zero-day is unknown to the vendor (zero days to fix it) and actively exploited before any patch exists. Highly valued on criminal markets and by nation-states.',cat:'Fundamentals',diff:'Easy'},
  {q:'Which symmetric encryption algorithm is the current U.S. government standard?',opts:['DES','3DES','AES-256','RC4'],correct:2,explain:'AES-256 is the NIST-approved standard for symmetric encryption. DES and 3DES are legacy. RC4 is deprecated and broken.',cat:'Cryptography',diff:'Easy'},
  {q:'Which attack secretly relays and alters communications between two parties?',opts:['Replay attack','Man-in-the-Middle (MITM)','SQL injection','Rainbow table attack'],correct:1,explain:'MITM attackers position themselves between two parties, intercepting and potentially modifying traffic. Mitigated by certificate pinning, HSTS, and mutual TLS.',cat:'Attacks',diff:'Easy'},
  {q:'What does SIEM stand for?',opts:['Security Information and Event Management','Secure Infrastructure and Endpoint Monitoring','System Integrity Evaluation Matrix','Security Incident and Error Management'],correct:0,explain:'SIEM aggregates and correlates security logs to detect threats. Examples: Splunk, Microsoft Sentinel, IBM QRadar.',cat:'Tools',diff:'Easy'},
  {q:'Which protocol does DNS primarily use for standard queries?',opts:['TCP port 53','UDP port 53','TCP port 443','UDP port 8080'],correct:1,explain:'DNS primarily uses UDP port 53 for standard queries. TCP port 53 handles zone transfers and large responses. DNS = UDP 53.',cat:'Networking',diff:'Easy'},
  {q:'What is the MITRE ATT&CK framework?',opts:['A certification exam for ethical hackers','A knowledge base of adversary TTPs based on real-world observations','A healthcare compliance framework','An open-source SIEM platform'],correct:1,explain:'MITRE ATT&CK documents adversary Tactics, Techniques, and Procedures observed in real attacks. Used for detection engineering, red team planning, and security gap analysis.',cat:'Frameworks',diff:'Easy'},
  {q:'What does phishing specifically refer to?',opts:['Any social engineering attack','Deceptive emails tricking users into revealing credentials or installing malware','Scanning for open ports','Brute force password cracking'],correct:1,explain:'Phishing uses fake emails mimicking legitimate sources. Spear phishing targets specific people. Whaling targets executives. Vishing uses voice calls. Smishing uses SMS.',cat:'Attacks',diff:'Easy'},
  {q:'What is lateral movement in a cyberattack?',opts:['Moving stolen data to external servers','Port scanning the internet for targets','After initial access, moving to other systems within the same network','Escalating from user to admin permissions'],correct:2,explain:'Lateral movement expands attacker presence post-compromise. Techniques: pass-the-hash, Kerberoasting, RDP, WMI. Detected via UEBA and network segmentation.',cat:'Attacks',diff:'Medium'},
  {q:'Which of these is NOT a type of malware?',opts:['Ransomware','Rootkit','Firewall','Trojan'],correct:2,explain:'Firewalls are defensive tools. Ransomware encrypts files for ransom, rootkits provide hidden persistent access, Trojans disguise as legitimate software.',cat:'Fundamentals',diff:'Easy'},
  {q:'What is the purpose of penetration testing?',opts:['Install security software on endpoints','Simulate attacks to find vulnerabilities before real attackers do','Monitor employee internet usage','Automate patch management'],correct:1,explain:'Pen testing is authorized simulated attacks discovering security weaknesses. Scopes: network, web app, social engineering, red team. Required by PCI DSS, HIPAA, SOC 2.',cat:'Offensive',diff:'Easy'},
  {q:'What does XSS stand for in web security?',opts:['Extended Security Shell','Cross-Site Scripting','External System Scanning','Cross-Service Synchronization'],correct:1,explain:'XSS injects malicious scripts into trusted web pages. Stored XSS persists in the DB. Reflected XSS is URL-based. Mitigated by output encoding and CSP headers.',cat:'Attacks',diff:'Easy'},
  {q:'What does the principle of least privilege state?',opts:['Users should have maximum access for efficiency','Users/systems should have only the minimum access needed for their function','Privileged accounts should never be audited','Only admins should have network access'],correct:1,explain:'Least privilege limits blast radius: a compromised account with minimal access causes minimal damage. Applied to users, service accounts, APIs, and cloud IAM roles.',cat:'Fundamentals',diff:'Easy'},
  {q:'What is a honeypot in cybersecurity?',opts:['A database of stolen passwords','A secure vault for encryption keys','A decoy system designed to attract and trap attackers','A tool for monitoring encrypted traffic'],correct:2,explain:'Honeypots mimic real systems to attract attackers. When engaged, defenders gain intelligence on attack tools and techniques without risking real systems.',cat:'Defense',diff:'Medium'},
  {q:'Which hashing algorithm should be avoided due to collision vulnerabilities?',opts:['SHA-256','SHA-3','MD5','BLAKE2'],correct:2,explain:'MD5 is cryptographically broken — collisions are feasible in seconds. Never use MD5 for security. SHA-256 and SHA-3 are current standards.',cat:'Cryptography',diff:'Medium'},
  {q:'What does the cloud shared responsibility model mean?',opts:['All security is the cloud provider\'s responsibility','Security is split: provider (infrastructure), customer (data/config)','Customers are fully responsible for all cloud security','Security is shared equally with third-party auditors'],correct:1,explain:'AWS/Azure/GCP secure the infrastructure ("security OF the cloud"). Customers secure data, config, IAM, and apps ("security IN the cloud"). Split varies: IaaS, PaaS, SaaS.',cat:'Cloud',diff:'Medium'},
  {q:'What is multi-factor authentication (MFA)?',opts:['Multiple passwords for the same account','Biometrics as the only auth factor','Requiring 2+ different verification factor types to authenticate','Enforcing password rotation every 30 days'],correct:2,explain:'MFA factors: something you know (password), something you have (TOTP/token), something you are (biometric). Requiring 2+ factor TYPES dramatically reduces account takeover.',cat:'Identity',diff:'Easy'},
  {q:'What is a buffer overflow attack?',opts:['Filling server storage with junk files','Sending more data to a buffer than it can hold, overwriting adjacent memory','Intercepting traffic to fill network buffers','Overloading a web server with HTTP requests'],correct:1,explain:'Buffer overflows overflow allocated memory, potentially overwriting return addresses to execute attacker code. Mitigated by ASLR, stack canaries, and DEP/NX.',cat:'Attacks',diff:'Medium'},
  {q:'What does "defense in depth" mean?',opts:['Using only the strongest possible firewall','Focusing security exclusively on the perimeter','Layering multiple security controls so no single failure exposes the system','Having deep cybersecurity knowledge'],correct:2,explain:'Defense in depth applies controls at perimeter, network, endpoint, application, and data layers. If one layer fails, others contain the damage. Also called the Swiss cheese model.',cat:'Fundamentals',diff:'Easy'},
  {q:'What is the primary difference between authentication and authorization?',opts:['They are the same thing','Authentication verifies identity; authorization determines what you can access','Authorization verifies identity; authentication determines access','Authentication is for humans; authorization is for systems'],correct:1,explain:'Authentication: "Who are you?" (verify identity). Authorization: "What can you do?" (permission check post-auth). Often called AuthN and AuthZ.',cat:'Identity',diff:'Easy'},
  {q:'What does a WAF primarily protect against?',opts:['DDoS attacks at the network layer','Physical server theft','Application-layer attacks like SQLi, XSS, and CSRF','Ransomware via email'],correct:2,explain:'WAFs operate at Layer 7 (HTTP) to inspect web traffic and block OWASP Top 10 attacks. Examples: AWS WAF, Cloudflare WAF. They complement secure coding, not replace it.',cat:'Defense',diff:'Medium'},
  {q:'What does EDR stand for?',opts:['Endpoint Detection and Response','Enterprise Data Repository','Encrypted Data Routing','Event-Driven Response'],correct:0,explain:'EDR continuously monitors endpoints, detects threats via behavioral analytics, and enables response. Key vendors: CrowdStrike, SentinelOne, Microsoft Defender.',cat:'Tools',diff:'Easy'},
  {q:'What is a supply chain attack?',opts:['Attacking physical supply trucks carrying hardware','Compromising a trusted vendor/software to attack downstream targets','Stealing credentials from supply chain employees','Intercepting packages to install hardware implants'],correct:1,explain:'Supply chain attacks compromise trusted software (e.g., SolarWinds SUNBURST, XZ Utils). High ROI for attackers — compromise one trusted source, reach thousands of organizations.',cat:'Attacks',diff:'Medium'},
  {q:'What is the purpose of a DMZ in network architecture?',opts:['A physical isolation room for servers','A network zone between internet and internal network for public-facing services','A zone where all traffic is decrypted','A backup network for incidents'],correct:1,explain:'The DMZ hosts public-facing servers (web, email, DNS) between external and internal networks. Even if a DMZ server is compromised, the internal network requires crossing another boundary.',cat:'Networking',diff:'Medium'},
  {q:'Which compliance framework applies to credit card payment processing?',opts:['HIPAA','SOX','PCI DSS','GDPR'],correct:2,explain:'PCI DSS is mandatory for any entity processing cardholder data. 12 requirements cover network security, encryption, access control, monitoring, and VM.',cat:'Compliance',diff:'Easy'},
  {q:'What does incident response involve?',opts:['Developing new security products after a breach','The structured process of identifying, containing, eradicating, and recovering from a security incident','Only technical malware analysis','Notifying all users about policy changes'],correct:1,explain:'IR lifecycle (NIST SP 800-61): Preparation, Detection/Analysis, Containment, Eradication, Recovery, Post-Incident Activity. Preparation is the most valuable phase.',cat:'IR',diff:'Easy'},
  {q:'What does social engineering exploit?',opts:['Weak network perimeters','Human psychology rather than technical vulnerabilities','Social media app vulnerabilities','Cryptographic algorithm weaknesses'],correct:1,explain:'Social engineering manipulates people: phishing (email), vishing (voice), smishing (SMS), pretexting, baiting, tailgating. "The human is the weakest link."',cat:'Attacks',diff:'Easy'},
  {q:'What does CVE stand for?',opts:['Common Vulnerability Exposure','Critical Vulnerability Event','Common Vulnerabilities and Exposures','Cybersecurity Vulnerability Entry'],correct:2,explain:'CVE is a MITRE-maintained list of publicly known vulnerabilities. Each CVE (e.g., CVE-2021-44228 = Log4Shell) has a unique ID used across security tools and advisories.',cat:'Fundamentals',diff:'Easy'},
  {q:'What is privilege escalation?',opts:['Requesting IT to increase your clearance','An attacker gaining higher permissions than initially granted','Adding users to an AD admin group','Encrypting admin credentials'],correct:1,explain:'Privilege escalation: local (user → admin) or domain-level. Techniques: misconfigured sudo, SUID binaries, unquoted service paths, Kerberoasting.',cat:'Attacks',diff:'Medium'},
  {q:'What is OSINT?',opts:['Open Source Intelligence — collecting from publicly available sources','Offensive Security Intelligence Network','Organizational Security Information Technology','Open System Internet Tools'],correct:0,explain:'OSINT collects from public sources: social media, WHOIS, Shodan, LinkedIn, GitHub. Used by attackers for recon and by defenders for threat intelligence.',cat:'Fundamentals',diff:'Easy'},
  {q:'What is threat hunting?',opts:['Waiting for automated alerts','Searching LinkedIn for security talent','Proactively searching for threats that evade automated detection','Developing public threat reports'],correct:2,explain:'Threat hunting hypothesizes adversaries may already be present and proactively searches for IOCs and TTPs that automated tools miss. Driven by threat intel hypotheses.',cat:'Defense',diff:'Medium'},
  {q:'What is data exfiltration?',opts:['Permanently deleting sensitive data','Unauthorized transfer of data out of the organization\'s control','Encrypting data before it leaves the network','Moving data between internal departments'],correct:1,explain:'Exfiltration is the end goal of many attacks. Methods: HTTPS to cloud, DNS tunneling, ICMP covert channels. DLP tools and network monitoring detect unusual outbound flows.',cat:'Attacks',diff:'Medium'},
  {q:'What is a false positive in security monitoring?',opts:['An alert identifying a real threat','Benign activity incorrectly flagged as malicious','A vulnerability not affecting the current version','A blocked attack that was harmless'],correct:1,explain:'False positives cause analyst fatigue, leading to real threats being missed. SOC teams tune rules to optimize the false positive/negative balance.',cat:'SOC',diff:'Medium'},
  {q:'What does PKI enable?',opts:['Password management across the org','Secure issuance/management of digital certificates for encryption and auth','Monitoring of public internet traffic','Physical key management'],correct:1,explain:'PKI uses asymmetric key pairs and digital certificates issued by CAs. Powers TLS/HTTPS, code signing, email encryption (S/MIME), and certificate-based authentication.',cat:'Cryptography',diff:'Medium'},
  {q:'What is a botnet?',opts:['Security bots for automated patching','A legitimate high-speed connection type','A collection of infected devices controlled remotely for malicious purposes','A network monitoring tool'],correct:2,explain:'Botnets are compromised devices controlled via C2 infrastructure. Used for DDoS, spam, credential stuffing, and crypto mining. Takedowns require law enforcement coordination.',cat:'Attacks',diff:'Medium'},
  {q:'What is the purpose of network segmentation?',opts:['Dividing the internet geographically','Physically separating servers','Dividing a network into subnetworks to limit lateral movement','Assigning bandwidth limits to users'],correct:2,explain:'Network segmentation contains breaches by preventing free lateral movement. Zero Trust extends this: "never trust, always verify" even within the network.',cat:'Defense',diff:'Medium'},
  {q:'What does DLP stand for?',opts:['Deep Learning Protocol','Dynamic Link Prevention','Data Loss Prevention','Distributed Logging Platform'],correct:2,explain:'DLP monitors and controls data transfers to prevent sensitive data from leaving the organization — protecting against exfiltration and accidental leakage.',cat:'Defense',diff:'Easy'},
  {q:'What does TLS provide?',opts:['Firewall functionality for web apps','Encryption, authentication, and integrity for data in transit','Endpoint detection and response','Network traffic monitoring'],correct:1,explain:'TLS (successor to SSL) encrypts data in transit, authenticates server identity via certificates, and ensures data integrity. TLS 1.3 is the current recommended version.',cat:'Cryptography',diff:'Medium'},
  {q:'What is an insider threat?',opts:['A threat from within the internal network','An attack using internet-facing vulnerabilities','A threat from employees, contractors, or trusted parties with authorized access','A threat exploiting unpatched internal vulnerabilities'],correct:2,explain:'Insiders are dangerous because they already have legitimate access, bypassing perimeter controls. Types: malicious, negligent, and compromised (credentials stolen).',cat:'Fundamentals',diff:'Easy'},
  {q:'What does system hardening mean?',opts:['Making hardware physically harder to break','Encrypting all data on a system','Reducing attack surface by disabling unnecessary features and applying secure configs','Increasing server CPU performance'],correct:2,explain:'Hardening: disable unused services/ports, remove default accounts, enforce least privilege, apply CIS Benchmarks or DISA STIGs, enable logging. Reduces exploitable attack surface.',cat:'Defense',diff:'Easy'},
  {q:'What does CSPM stand for in cloud security?',opts:['Cloud Security Posture Management — monitors for misconfigurations','Customer Service Protection Module','Certified Security Professional Manager','Cloud Service Provider Monitoring'],correct:0,explain:'CSPM tools (Wiz, Prisma Cloud, AWS Security Hub) continuously assess cloud infrastructure for misconfigurations and compliance violations. Misconfiguration is the #1 cause of cloud breaches.',cat:'Cloud',diff:'Hard'},
  {q:'What are the 5 functions of the NIST Cybersecurity Framework?',opts:['Plan, Do, Check, Act','Identify, Protect, Detect, Respond, Recover','Prevent, Detect, Correct, Compensate','Classify, Control, Monitor, Report'],correct:1,explain:'NIST CSF 5 functions: Identify (assets/risks), Protect (safeguards), Detect (threats), Respond (incidents), Recover (restoration). CSF 2.0 added Govern as a 6th function.',cat:'Frameworks',diff:'Medium'},
  {q:'What is credential stuffing?',opts:['Testing all possible password combinations (brute force)','Using stolen credentials from other breaches to attempt logins at multiple services','Adding fake credentials to detect unauthorized access','Storing credentials in multiple encrypted locations'],correct:1,explain:'Credential stuffing exploits password reuse. Attackers use leaked credential pairs across many sites. Mitigated by MFA, breach monitoring (HaveIBeenPwned), and unique passwords.',cat:'Attacks',diff:'Medium'},
  {q:'What is the difference between IDS and IPS?',opts:['They are identical technology','IDS detects passively; IPS detects AND actively blocks threats','IDS blocks traffic; IPS only logs it','IDS works at network layer; IPS at application layer'],correct:1,explain:'IDS monitors and alerts but takes no action. IPS sits inline and actively blocks detected threats. IPS adds latency; IDS provides visibility without interference.',cat:'Defense',diff:'Medium'},
  {q:'What is threat intelligence?',opts:['AI predictions about future attacks','Evidence-based knowledge about existing/emerging threats used to inform security decisions','Security clearance classification','Monitoring competitors for cyber threats'],correct:1,explain:'TI = actionable info about threat actors, TTPs, and IOCs. Strategic TI informs long-term decisions; operational TI informs campaigns; tactical TI provides IOCs for blocking rules.',cat:'Defense',diff:'Medium'},
  {q:'What is a rootkit?',opts:['A collection of admin tools','Malware hiding itself and other malicious code deep in the OS, often at kernel level','A legitimate root-level backup utility','A penetration testing framework'],correct:1,explain:'Rootkits hide processes, files, and connections — often at kernel or firmware level. Detection requires offline scanning, integrity checking, or memory forensics. Very difficult to remove.',cat:'Malware',diff:'Hard'},
  {q:'What is Kerberoasting?',opts:['A firewall evasion technique','An attack targeting Kerberos service accounts to crack their password hashes offline','A method to bypass MFA','A cloud IAM privilege escalation technique'],correct:1,explain:'Kerberoasting: in AD, any authenticated user can request Kerberos service tickets for SPNs. The ticket is encrypted with the service account password hash — attackers take it offline for cracking.',cat:'Attacks',diff:'Hard'},
  {q:'What does SOC 2 attest to?',opts:['Physical security of data centers','A vendor\'s security, availability, processing integrity, confidentiality, and privacy controls','Developer secure coding practices','Network perimeter security configurations'],correct:1,explain:'SOC 2 audits a service provider\'s controls around the Trust Service Criteria. Commonly required in B2B contracts for SaaS vendors to prove security posture.',cat:'Compliance',diff:'Medium'},
  {q:'What is DMARC and what does it protect against?',opts:['A database encryption standard','An email authentication protocol protecting against domain spoofing and phishing','A network scanning protocol','A cloud security configuration tool'],correct:1,explain:'DMARC builds on SPF and DKIM. It tells receiving mail servers what to do with email that fails authentication — reject, quarantine, or report. Prevents domain spoofing.',cat:'Networking',diff:'Hard'},
  {q:'What is a Golden Ticket attack in Active Directory?',opts:['Using a stolen SSL cert to impersonate a trusted website','Forging a Kerberos TGT using the KRBTGT hash for unlimited AD access','Purchasing domain credentials on the dark web','An attack targeting financial sector organizations'],correct:1,explain:'Golden Ticket: attackers who obtain the KRBTGT hash (via DCSync from a compromised DC) can forge TGTs for ANY account with any privileges. A devastating persistence mechanism.',cat:'Attacks',diff:'Hard'},
];
var _dcState=null;
function getDailyIdx(){return Math.floor(Date.now()/86400000)%DC_BANK.length;}
function loadDCState(){try{var s=localStorage.getItem('isd_dc');return s?JSON.parse(s):null;}catch(e){return null;}}
function saveDCState(obj){try{localStorage.setItem('isd_dc',JSON.stringify(obj));}catch(e){}}
function loadStreak(){try{var s=localStorage.getItem('isd_streak');return s?JSON.parse(s):{count:0,last:null};}catch(e){return{count:0,last:null};}}
function saveStreak(obj){try{localStorage.setItem('isd_streak',JSON.stringify(obj));}catch(e){}}
function updateStreak(won){
  var sk=loadStreak();
  var today=new Date().toDateString();
  var yesterday=new Date(Date.now()-86400000).toDateString();
  if(sk.last===today){return sk;}
  if(sk.last===yesterday){sk.count+=1;}else{sk.count=won?1:0;}
  sk.last=today;
  saveStreak(sk);
  return sk;
}
function renderDailyChallenge(){
  var body=document.getElementById('dc-body');
  if(!body)return;
  var idx=getDailyIdx();
  var q=DC_BANK[idx];
  var state=loadDCState();
  var today=new Date().toDateString();
  var sk=loadStreak();
  var streakEl=document.getElementById('dc-streak');
  if(streakEl)streakEl.textContent=(sk.count>0?'🔥 '+sk.count+' day streak':'Start your streak today!');
  if(state&&state.date===today){
    var correct=state.correct;
    body.innerHTML='<div class="dc-result dc-result-'+(correct?'win':'loss')+'">'
      +'<div class="dc-result-icon">'+(correct?'✅':'❌')+'</div>'
      +'<div class="dc-result-hd">'+(correct?'Correct!':'Not quite...')+'</div>'
      +'<div class="dc-result-ans">Answer: <strong>'+q.opts[q.correct]+'</strong></div>'
      +'<div class="dc-explanation">'+q.explain+'</div>'
      +'<div class="dc-next-label">Come back tomorrow for the next challenge!</div>'
      +'</div>';
    return;
  }
  body.innerHTML='<div class="dc-q-wrap">'
    +'<div class="dc-category"><span class="dc-cat-tag">'+q.cat+'</span><span class="dc-diff diff-'+q.diff.toLowerCase()+'">'+q.diff+'</span></div>'
    +'<div class="dc-question">'+q.q+'</div>'
    +'<div class="dc-opts">'
    +q.opts.map(function(o,i){return '<div class="dc-opt" onclick="submitDailyAnswer('+i+')"><span class="dc-opt-letter">'+['A','B','C','D'][i]+'</span><span class="dc-opt-text">'+o+'</span></div>';}).join('')
    +'</div></div>';
}
function submitDailyAnswer(i){
  var idx=getDailyIdx();
  var q=DC_BANK[idx];
  var correct=(i===q.correct);
  var today=new Date().toDateString();
  saveDCState({date:today,answered:true,correct:correct,chosen:i});
  updateStreak(correct);
  var opts=document.querySelectorAll('#dc-body .dc-opt');
  opts.forEach(function(el,j){
    el.classList.add(j===q.correct?'dc-opt-correct':(j===i&&!correct?'dc-opt-wrong':'dc-opt-neutral'));
    el.style.pointerEvents='none';
  });
  setTimeout(function(){renderDailyChallenge();},900);
}

// ─── F3: GLOBAL SEARCH ───────────────────────────────────
var _searchIndex=null;
function buildSearchIndex(){
  if(_searchIndex)return;
  _searchIndex=[];
  var pages=[
    {label:'Home',sub:'Main page',page:'home'},{label:'Career Ladder',sub:'Six tiers from Help Desk to CISO',page:'ladder'},
    {label:'8 Domains',sub:'SOC, IAM, Cloud, GRC & more',page:'domains'},{label:'Salary Guide',sub:'Compensation data by role & tier',page:'salary'},
    {label:'Interview Prep',sub:'Domain-specific Q&A guides',page:'interview'},{label:'Career Pivot Advisor',sub:'AI-powered domain switching guide',page:'pivot'},
    {label:'Certifications',sub:'Roadmap grid by domain & tier',page:'certs'},{label:'Training',sub:'Certificates, degrees & bootcamps',page:'training'},
    {label:'Home Lab Guide',sub:'Build your own practice environment',page:'homelab'},{label:'Glossary',sub:'Cybersecurity terms & acronyms',page:'glossary'},
    {label:'Resume Roaster',sub:'AI-powered resume analysis',page:'roaster'},{label:'Security Challenges',sub:'CTF, packet detective & more',page:'games'},
    {label:'Threat Landscape',sub:'Curated news & advisories',page:'threats'},{label:'Job Board',sub:'Curated listings by domain',page:'jobs'},
    {label:'Blog',sub:'Career insights & site updates',page:'blog'},{label:'Reviews',sub:'Community feedback & ratings',page:'reviews'},
    {label:'About',sub:'Who built this & why',page:'about'},{label:'Career Quiz',sub:'Find your cybersecurity role',page:'home'},
    {label:'Career Roadmap',sub:'Visual career path explorer',page:'roadmap'},{label:'Tool Encyclopedia',sub:'80+ security tools catalogued',page:'tools'},
    {label:'CTF & Conference Calendar',sub:'Upcoming security events',page:'calendar'},{label:'Resume Templates',sub:'Role-specific resume guides',page:'resume'},
    {label:'Wall of Wins',sub:'Community success stories',page:'stories'},
  ];
  pages.forEach(function(p){_searchIndex.push({type:'page',label:p.label,sub:p.sub,_page:p.page});});
  if(typeof JT!=='undefined'){Object.keys(JT).forEach(function(k){var j=JT[k];_searchIndex.push({type:'role',label:j.title,sub:j.domain+' · '+j.salary,_page:'quiz'});});}
  if(typeof D!=='undefined'){Object.keys(D).forEach(function(k){var d=D[k];_searchIndex.push({type:'domain',label:d.name,sub:'Domain: '+d.tag,_page:'domains'});});}
  if(typeof CERTS!=='undefined'){var seen={};Object.keys(CERTS).forEach(function(k){var c=CERTS[k];if(!c||seen[c.name])return;seen[c.name]=1;_searchIndex.push({type:'cert',label:c.name,sub:(c.vendor||'')+(c.tier?' · '+c.tier:''),_page:'certs'});});}
  if(typeof SAL_DATA!=='undefined'){var seenS={};SAL_DATA.forEach(function(s){if(seenS[s.title])return;seenS[s.title]=1;_searchIndex.push({type:'salary',label:s.title,sub:'$'+s.min+'K–$'+s.max+'K · '+s.domain,_page:'salary'});});}
  if(typeof TOOLS!=='undefined'){TOOLS.forEach(function(t){_searchIndex.push({type:'tool',label:t.name,sub:t.vendor+' · '+t.cat,_page:'tools'});});}
}
function openSearch(){
  buildSearchIndex();
  var o=document.getElementById('search-overlay');
  if(!o)return;
  o.classList.add('search-open');
  var inp=document.getElementById('search-input');
  if(inp){inp.value='';inp.focus();}
  document.getElementById('search-results').innerHTML='<div class="sr-hint">Type to search roles, certs, tools, pages...</div>';
  document.body.style.overflow='hidden';
}
function closeSearchDirect(){
  var o=document.getElementById('search-overlay');
  if(o){o.classList.remove('search-open');document.body.style.overflow='';}
}
function runSearch(q){
  q=(q||'').trim().toLowerCase();
  var res=document.getElementById('search-results');
  if(!res)return;
  if(!q){res.innerHTML='<div class="sr-hint">Type to search roles, certs, tools, pages...</div>';return;}
  buildSearchIndex();
  var matches=_searchIndex.filter(function(it){
    return (it.label.toLowerCase().indexOf(q)>-1)||(it.sub&&it.sub.toLowerCase().indexOf(q)>-1);
  }).slice(0,24);
  if(!matches.length){res.innerHTML='<div class="sr-no-results">No results for "'+q+'"</div>';return;}
  var groups={page:[],role:[],domain:[],cert:[],salary:[],tool:[]};
  matches.forEach(function(m){if(groups[m.type])groups[m.type].push(m);});
  var typeLabels={page:'Pages',role:'Roles',domain:'Domains',cert:'Certifications',salary:'Salary Data',tool:'Tools'};
  var html='';
  Object.keys(groups).forEach(function(t){
    if(!groups[t].length)return;
    html+='<div class="sr-group"><div class="sr-group-label">'+typeLabels[t]+'</div>';
    groups[t].forEach(function(m){
      var esc=m.label.replace(/'/g,'&#39;');
      html+='<div class="sr-item" onclick="searchGo(\''+esc+'\',\''+m.type+'\')">'
        +'<span class="sr-dot sr-dot-'+m.type+'"></span>'
        +'<div class="sr-item-body"><span class="sr-label">'+m.label+'</span><span class="sr-sub">'+m.sub+'</span></div></div>';
    });
    html+='</div>';
  });
  res.innerHTML=html;
}
function searchGo(label,type){
  buildSearchIndex();
  var match=_searchIndex.find(function(it){return it.label===label&&it.type===type;});
  if(match)showPage(match._page);
  closeSearchDirect();
}
document.addEventListener('keydown',function(e){
  if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();openSearch();return;}
  if(e.key==='Escape'){closeSearchDirect();}
});

// ─── F4: CERT PROGRESS TRACKER ───────────────────────────
function getCertProgress(){try{var s=localStorage.getItem('isd_cert_prog');return s?JSON.parse(s):{};}catch(e){return{};}}
function saveCertProgress(obj){try{localStorage.setItem('isd_cert_prog',JSON.stringify(obj));}catch(e){}}
function cycleStatus(key){
  var prog=getCertProgress();
  var cur=prog[key]||'none';
  var next={none:'planned',planned:'inprog',inprog:'done',done:'none'};
  if(next[cur]==='none'){delete prog[key];}else{prog[key]=next[cur];}
  saveCertProgress(prog);
  var newStatus=next[cur]==='none'?null:next[cur];
  document.querySelectorAll('.cb[data-cert-key="'+key+'"]').forEach(function(b){
    b.classList.remove('cb-planned','cb-inprog','cb-done');
    if(newStatus)b.classList.add('cb-'+newStatus);
  });
  updateCPTSummary();
}
function initCertTracker(){
  var prog=getCertProgress();
  document.querySelectorAll('.cb').forEach(function(b){
    var key=b.getAttribute('data-cert-key');
    if(!key){var m=(b.getAttribute('onclick')||'').match(/openCert\(['"]([^'"]+)['"]\)/);if(m)b.setAttribute('data-cert-key',m[1]);}
  });
  document.querySelectorAll('.cb[data-cert-key]').forEach(function(b){
    var key=b.getAttribute('data-cert-key');
    b.classList.remove('cb-planned','cb-inprog','cb-done');
    if(prog[key])b.classList.add('cb-'+prog[key]);
    if(!b.dataset.cptBound){
      b.dataset.cptBound='1';
      b.addEventListener('contextmenu',function(e){e.preventDefault();cycleStatus(key);});
    }
  });
  updateCPTSummary();
}
function updateCPTSummary(){
  var prog=getCertProgress();
  var counts={done:0,inprog:0,planned:0};
  Object.values(prog).forEach(function(v){if(counts[v]!==undefined)counts[v]++;});
  var d=document.getElementById('cpt-done');var i=document.getElementById('cpt-inprog');var p=document.getElementById('cpt-planned');
  if(d)d.textContent='✅ '+counts.done+' earned';
  if(i)i.textContent='⏳ '+counts.inprog+' in progress';
  if(p)p.textContent='📌 '+counts.planned+' planned';
}
function resetCertProgress(){
  if(!confirm('Reset all cert progress? This cannot be undone.'))return;
  localStorage.removeItem('isd_cert_prog');
  document.querySelectorAll('.cb').forEach(function(b){b.classList.remove('cb-planned','cb-inprog','cb-done');});
  updateCPTSummary();
}

// ─── F5: CERT COMPARISON TOOL ────────────────────────────
function openCertCompare(){
  var m=document.getElementById('cert-compare-modal');
  if(!m)return;
  m.classList.add('ccm-open');
  document.body.style.overflow='hidden';
  renderCertCompareSelectors();
}
function closeCertCompare(){
  var m=document.getElementById('cert-compare-modal');
  if(m){m.classList.remove('ccm-open');document.body.style.overflow='';}
}
function renderCertCompareSelectors(){
  var sel=document.getElementById('ccm-selectors');
  if(!sel||typeof CERTS==='undefined')return;
  var seen={};var list=[];
  Object.keys(CERTS).forEach(function(k){var c=CERTS[k];if(!c||!c.name||seen[c.name])return;seen[c.name]=1;list.push({key:k,name:c.name});});
  list.sort(function(a,b){return a.name.localeCompare(b.name);});
  var opts=list.map(function(l){return '<option value="'+l.key+'">'+l.name+'</option>';}).join('');
  sel.innerHTML='<div class="ccm-sel-row"><div class="ccm-sel-label">Cert A</div>'
    +'<select id="ccm-a" onchange="renderCertComparison()" class="ccm-select">'+opts+'</select></div>'
    +'<div class="ccm-vs">VS</div>'
    +'<div class="ccm-sel-row"><div class="ccm-sel-label">Cert B</div>'
    +'<select id="ccm-b" onchange="renderCertComparison()" class="ccm-select">'+opts+'</select></div>';
  var keys=list.map(function(l){return l.key;});
  var sa=document.getElementById('ccm-a'),sb=document.getElementById('ccm-b');
  if(sa&&keys[0])sa.value=keys[0];
  if(sb&&keys[1])sb.value=keys[1];
  renderCertComparison();
}
function renderCertComparison(){
  var sa=document.getElementById('ccm-a'),sb=document.getElementById('ccm-b');
  var t=document.getElementById('ccm-table');
  if(!sa||!sb||!t||typeof CERTS==='undefined')return;
  var ca=CERTS[sa.value],cb=CERTS[sb.value];
  if(!ca||!cb){t.innerHTML='<div class="ccm-msg">Select two certifications above.</div>';return;}
  var rows=[
    {label:'Vendor',a:ca.vendor||'—',b:cb.vendor||'—'},
    {label:'Domain',a:ca.domain||'—',b:cb.domain||'—'},
    {label:'Tier',a:ca.tier||'—',b:cb.tier||'—'},
    {label:'Difficulty',a:ca.diff||'—',b:cb.diff||'—'},
    {label:'Salary Range',a:ca.sal||'—',b:cb.sal||'—'},
    {label:'Tags',a:(ca.tags||[]).join(', ')||'—',b:(cb.tags||[]).join(', ')||'—'},
  ];
  var html='<div class="ccm-row ccm-row-hd"><div class="ccm-row-label"></div>'
    +'<div class="ccm-col ccm-col-hd">'+ca.name+'</div><div class="ccm-col ccm-col-hd">'+cb.name+'</div></div>';
  rows.forEach(function(r){
    var diff=r.a!==r.b&&r.a!=='—'&&r.b!=='—';
    html+='<div class="ccm-row'+(diff?' ccm-diff':'')+'"><div class="ccm-row-label">'+r.label+'</div>'
      +'<div class="ccm-col">'+r.a+'</div><div class="ccm-col">'+r.b+'</div></div>';
  });
  t.innerHTML=html;
}

// ─── F6: SALARY CALCULATOR ───────────────────────────────
var LOC_MULT={remote:1.0,sf:1.28,nyc:1.22,dc:1.16,boston:1.14,seattle:1.18,austin:1.09,chicago:1.05,midwest:0.90,southeast:0.87,southwest:0.92};
var CERT_BONUSES={cissp:0.13,cism:0.10,cisa:0.09,ccsp:0.10,oscp:0.12,gpen:0.08,gcih:0.07,gcia:0.07,aws_sec:0.09,azure_sec:0.08,cloud_security:0.08};
var EXP_MULT={entry:0.82,mid:1.0,senior:1.18,lead:1.35};
function initSalaryCalc(){
  var roleEl=document.getElementById('sc-role');
  if(!roleEl||roleEl.dataset.init)return;
  roleEl.dataset.init='1';
  if(typeof JT!=='undefined'){
    Object.keys(JT).sort(function(a,b){return JT[a].title.localeCompare(JT[b].title);}).forEach(function(k){
      var o=document.createElement('option');o.value=k;o.textContent=JT[k].title;roleEl.appendChild(o);
    });
  }
  var locEl=document.getElementById('sc-loc');
  if(locEl){
    var locs=[['remote','Remote / National Avg'],['sf','San Francisco Bay Area (+28%)'],['nyc','New York City (+22%)'],['seattle','Seattle (+18%)'],['dc','Washington D.C. (+16%)'],['boston','Boston (+14%)'],['austin','Austin (+9%)'],['chicago','Chicago (+5%)'],['southwest','Southwest (-8%)'],['midwest','Midwest (-10%)'],['southeast','Southeast (-13%)']];
    locs.forEach(function(l){var o=document.createElement('option');o.value=l[0];o.textContent=l[1];locEl.appendChild(o);});
  }
  var cbEl=document.getElementById('sc-cert-bonuses');
  if(cbEl){
    var pc=[['cissp','CISSP (+13%)'],['oscp','OSCP (+12%)'],['ccsp','CCSP (+10%)'],['cism','CISM (+10%)'],['aws_sec','AWS Security Specialty (+9%)'],['cisa','CISA (+9%)'],['azure_sec','Azure Security (+8%)'],['cloud_security','Cloud Security (+8%)'],['gpen','GPEN (+8%)'],['gcih','GCIH (+7%)']];
    cbEl.innerHTML=pc.map(function(c){return '<label class="sc-cert-cb"><input type="checkbox" value="'+c[0]+'" onchange="calcSalary()"> '+c[1]+'</label>';}).join('');
  }
  calcSalary();
}
function calcSalary(){
  var roleKey=document.getElementById('sc-role')&&document.getElementById('sc-role').value;
  var expKey=(document.getElementById('sc-exp')&&document.getElementById('sc-exp').value)||'mid';
  var locKey=(document.getElementById('sc-loc')&&document.getElementById('sc-loc').value)||'remote';
  var res=document.getElementById('sc-result');
  if(!res||!roleKey||typeof JT==='undefined')return;
  var jt=JT[roleKey];if(!jt)return;
  var baseMin=65,baseMax=120;
  if(typeof SAL_DATA!=='undefined'){
    var matches=SAL_DATA.filter(function(s){return s.title.toLowerCase().indexOf(jt.title.toLowerCase().split(' ')[0])>-1;});
    if(matches.length){baseMin=matches[0].min||baseMin;baseMax=matches[0].max||baseMax;}
  }
  var expM=EXP_MULT[expKey]||1.0;
  var locM=LOC_MULT[locKey]||1.0;
  var certBonus=0;
  document.querySelectorAll('#sc-cert-bonuses input:checked').forEach(function(cb){certBonus+=(CERT_BONUSES[cb.value]||0);});
  var totalM=expM*locM*(1+certBonus);
  var adjMin=Math.round(baseMin*totalM/5)*5;
  var adjMax=Math.round(baseMax*totalM/5)*5;
  var adjMid=Math.round((adjMin+adjMax)/2/5)*5;
  res.innerHTML='<div class="sc-result-role">'+jt.icon+' '+jt.title+'</div>'
    +'<div class="sc-range-wrap">'
    +'<div class="sc-range-labels"><span>$'+adjMin+'K</span><span class="sc-mid-label">~$'+adjMid+'K median</span><span>$'+adjMax+'K</span></div>'
    +'<div class="sc-range-bar"><div class="sc-range-fill"></div></div></div>'
    +'<div class="sc-tip">'+jt.domain+' · '+(certBonus>0?'Cert bonuses: +'+Math.round(certBonus*100)+'%. ':'')+
    (locKey!=='remote'?'Adjusted for local market.':'National remote average.')+'</div>';
}

// ─── F7: CAREER ROADMAP ──────────────────────────────────
var ROADMAP_NODES=[
  {id:'itsupp',title:'IT Support / Help Desk',domain:'entry',tier:1,icon:'🖥️',jtKey:null,x:48,y:88},
  {id:'soc1',title:'SOC Analyst I',domain:'soc',tier:2,icon:'🛡️',jtKey:'soc',x:18,y:74},
  {id:'grcana',title:'GRC Analyst',domain:'grc',tier:2,icon:'📋',jtKey:'grc',x:72,y:74},
  {id:'iamadm',title:'IAM Administrator',domain:'iam',tier:2,icon:'🔑',jtKey:'iam',x:90,y:74},
  {id:'ir',title:'Incident Responder',domain:'forensics',tier:3,icon:'🚨',jtKey:'ir',x:22,y:60},
  {id:'vm',title:'Vuln Management Analyst',domain:'soc',tier:3,icon:'🔍',jtKey:'vm',x:37,y:60},
  {id:'ti',title:'Threat Intel Analyst',domain:'forensics',tier:3,icon:'🕵️',jtKey:'ti',x:8,y:60},
  {id:'pt',title:'Penetration Tester',domain:'red',tier:3,icon:'⚔️',jtKey:'pt',x:56,y:60},
  {id:'as',title:'AppSec / DevSecOps',domain:'appsec',tier:3,icon:'🛡',jtKey:'as',x:68,y:60},
  {id:'iameng',title:'IAM Engineer',domain:'iam',tier:3,icon:'🔐',jtKey:'iam',x:84,y:60},
  {id:'ma',title:'Malware Analyst',domain:'forensics',tier:4,icon:'🦠',jtKey:'ma',x:10,y:46},
  {id:'de',title:'Detection Engineer',domain:'soc',tier:4,icon:'⚡',jtKey:'de',x:25,y:46},
  {id:'rt',title:'Red Team Operator',domain:'red',tier:4,icon:'🎯',jtKey:'rt',x:52,y:46},
  {id:'cs',title:'Cloud Security Engineer',domain:'cloud',tier:4,icon:'☁️',jtKey:'cs',x:65,y:46},
  {id:'grcmgr',title:'GRC Manager',domain:'grc',tier:4,icon:'📊',jtKey:'grc',x:80,y:46},
  {id:'se',title:'Security Engineer',domain:'eng',tier:4,icon:'⚙️',jtKey:'se',x:38,y:32},
  {id:'sa',title:'Security Architect',domain:'eng',tier:5,icon:'🏗️',jtKey:'sa',x:35,y:18},
  {id:'cloudarch',title:'Cloud Security Architect',domain:'cloud',tier:5,icon:'🌩️',jtKey:'cs',x:62,y:18},
  {id:'iamarch',title:'IAM Architect',domain:'iam',tier:5,icon:'🗝️',jtKey:'iam',x:82,y:18},
  {id:'ciso',title:'Security Manager / CISO',domain:'leadership',tier:6,icon:'👔',jtKey:'ciso',x:50,y:5},
];
var ROADMAP_EDGES=[
  {from:'itsupp',to:'soc1'},{from:'itsupp',to:'grcana'},{from:'itsupp',to:'iamadm'},
  {from:'soc1',to:'ir'},{from:'soc1',to:'vm'},{from:'soc1',to:'ti'},
  {from:'ir',to:'ma'},{from:'ma',to:'ti'},{from:'vm',to:'de'},{from:'soc1',to:'de'},
  {from:'ti',to:'de'},{from:'de',to:'se'},{from:'pt',to:'rt'},{from:'rt',to:'se'},
  {from:'as',to:'se'},{from:'cs',to:'cloudarch'},{from:'iamadm',to:'iameng'},
  {from:'iameng',to:'iamarch'},{from:'grcana',to:'grcmgr'},{from:'grcmgr',to:'ciso'},
  {from:'se',to:'sa'},{from:'sa',to:'ciso'},{from:'cloudarch',to:'ciso'},
  {from:'iamarch',to:'sa'},{from:'vm',to:'cs'},
];
var DOMAIN_COLORS={soc:'#00d4c8',forensics:'#c084fc',red:'#f05d78',cloud:'#4d9eff',eng:'#10e87e',appsec:'#f5c842',iam:'#ff8c42',grc:'#818cf8',leadership:'#e2e8f0',entry:'#475569'};
var _rmFilter='all';
function renderRoadmap(){
  var canvas=document.getElementById('rm-canvas');
  if(!canvas)return;
  var filters=document.getElementById('rm-filters');
  if(filters&&!filters.dataset.init){
    filters.dataset.init='1';
    var cats=[['all','All Paths'],['soc','Security Ops'],['forensics','Forensics & TI'],['red','Offensive'],['cloud','Cloud'],['eng','Security Eng'],['appsec','AppSec'],['iam','IAM'],['grc','GRC']];
    filters.innerHTML=cats.map(function(c){return '<button class="rm-filter-chip'+(c[0]==='all'?' rm-chip-active':'')+'" data-domain="'+c[0]+'" onclick="filterRoadmap(\''+c[0]+'\')">'+c[1]+'</button>';}).join('');
  }
  var w=canvas.offsetWidth||800;
  var h=Math.max(560,Math.round(w*0.68));
  canvas.style.height=h+'px';
  canvas.innerHTML='';
  var svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('width','100%');svg.setAttribute('height','100%');
  svg.style.cssText='position:absolute;top:0;left:0;pointer-events:none;overflow:visible;';
  canvas.appendChild(svg);
  var nodeMap={};
  ROADMAP_NODES.forEach(function(n){nodeMap[n.id]={x:(n.x/100)*w,y:(n.y/100)*h};});
  ROADMAP_EDGES.forEach(function(e){
    var a=nodeMap[e.from],b=nodeMap[e.to];
    if(!a||!b)return;
    if(_rmFilter!=='all'){
      var fn=ROADMAP_NODES.find(function(n){return n.id===e.from;});
      var tn=ROADMAP_NODES.find(function(n){return n.id===e.to;});
      if(fn&&fn.domain!==_rmFilter&&tn&&tn.domain!==_rmFilter&&fn.domain!=='entry')return;
    }
    var line=document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1',a.x);line.setAttribute('y1',a.y);
    line.setAttribute('x2',b.x);line.setAttribute('y2',b.y);
    line.setAttribute('stroke','rgba(255,255,255,0.1)');line.setAttribute('stroke-width','1.5');
    svg.appendChild(line);
  });
  ROADMAP_NODES.forEach(function(n){
    if(_rmFilter!=='all'&&n.domain!==_rmFilter&&n.domain!=='entry')return;
    var pos=nodeMap[n.id];
    var col=DOMAIN_COLORS[n.domain]||'#64748b';
    var el=document.createElement('div');
    el.className='rm-node';
    el.style.cssText='left:'+Math.round(pos.x)+'px;top:'+Math.round(pos.y)+'px;border-color:'+col+';';
    el.setAttribute('data-node-id',n.id);
    el.innerHTML='<span class="rm-node-icon">'+n.icon+'</span><span class="rm-node-title" style="color:'+col+'">'+n.title+'</span>';
    el.onclick=function(){clickRoadmapNode(n.id);};
    canvas.appendChild(el);
  });
}
function clickRoadmapNode(id){
  var n=ROADMAP_NODES.find(function(x){return x.id===id;});
  if(!n)return;
  var panel=document.getElementById('rm-info-panel');
  if(!panel)return;
  var jt=n.jtKey&&typeof JT!=='undefined'?JT[n.jtKey]:null;
  var col=DOMAIN_COLORS[n.domain]||'#64748b';
  panel.style.borderColor=col;
  panel.innerHTML='<div class="rm-info-header"><span class="rm-info-icon">'+n.icon+'</span>'
    +'<div><div class="rm-info-title" style="color:'+col+'">'+n.title+'</div></div>'
    +'<button class="rm-info-close" onclick="document.getElementById(\'rm-info-panel\').style.display=\'none\'">✕</button></div>'
    +(jt?'<div class="rm-info-meta">'+jt.domain+' · '+jt.level+'</div>'
    +'<div class="rm-info-salary">💰 '+jt.salary+'</div>'
    +'<p class="rm-info-desc">'+jt.desc+'</p>'
    +'<div class="rm-info-daily"><strong>Daily:</strong> '+jt.daily+'</div>'
    +'<div class="rm-info-actions"><button class="rm-info-btn" onclick="showPage(\'salary\')">Salary Data</button><button class="rm-info-btn" onclick="showPage(\'certs\')">Cert Roadmap</button></div>'
    :'<p class="rm-info-desc">Entry-level IT role — strong pipeline into SOC, GRC, and IAM positions.</p>');
  panel.style.display='block';
  document.querySelectorAll('.rm-node').forEach(function(el){el.classList.remove('rm-node-active');});
  var sel=document.querySelector('.rm-node[data-node-id="'+id+'"]');
  if(sel)sel.classList.add('rm-node-active');
}
function filterRoadmap(domain){
  _rmFilter=domain;
  document.querySelectorAll('.rm-filter-chip').forEach(function(el){el.classList.toggle('rm-chip-active',el.dataset.domain===domain);});
  renderRoadmap();
}

// ─── F8: TOOL ENCYCLOPEDIA ───────────────────────────────
var TOOLS=[
  {name:'Splunk Enterprise',vendor:'Splunk',cat:'SIEM',desc:'Industry-leading SIEM for log aggregation, correlation, and alerting at enterprise scale.',tier:'paid',tags:['siem','logs','dashboards'],domains:['soc','eng']},
  {name:'Microsoft Sentinel',vendor:'Microsoft',cat:'SIEM',desc:'Cloud-native SIEM on Azure with built-in AI/ML threat detection and Microsoft ecosystem integration.',tier:'paid',tags:['siem','azure','cloud'],domains:['soc','cloud']},
  {name:'IBM QRadar',vendor:'IBM',cat:'SIEM',desc:'Enterprise SIEM with advanced correlation engine, behavioral analytics, and network flow analysis.',tier:'paid',tags:['siem','enterprise'],domains:['soc']},
  {name:'Elastic SIEM',vendor:'Elastic',cat:'SIEM',desc:'Open-source-foundation SIEM built on the Elastic Stack. Highly flexible with strong community support.',tier:'freemium',tags:['siem','open-source','elastic'],domains:['soc','eng']},
  {name:'LogRhythm SIEM',vendor:'LogRhythm',cat:'SIEM',desc:'Integrated SIEM, UEBA, and SOAR platform with automated threat detection and response workflows.',tier:'paid',tags:['siem','ueba','soar'],domains:['soc']},
  {name:'Exabeam',vendor:'Exabeam',cat:'SIEM',desc:'UEBA-driven SIEM with behavior-based threat detection using machine learning baselines.',tier:'paid',tags:['siem','ueba','ml'],domains:['soc']},
  {name:'Chronicle SIEM',vendor:'Google',cat:'SIEM',desc:'Google Cloud-native SIEM with massive scale telemetry ingestion and YARA-L detection rules.',tier:'paid',tags:['siem','cloud','google'],domains:['soc']},
  {name:'CrowdStrike Falcon',vendor:'CrowdStrike',cat:'EDR',desc:'Cloud-native EDR with AI-powered threat detection, threat hunting, and Falcon OverWatch MDR service.',tier:'paid',tags:['edr','cloud','ai'],domains:['soc','eng']},
  {name:'SentinelOne',vendor:'SentinelOne',cat:'EDR',desc:'Autonomous AI-powered EDR with rollback capability and built-in SOAR response automation.',tier:'paid',tags:['edr','ai','autonomous'],domains:['soc','eng']},
  {name:'Carbon Black',vendor:'VMware',cat:'EDR',desc:'Behavioral EDR leveraging unfiltered endpoint telemetry for investigation and threat hunting.',tier:'paid',tags:['edr','behavioral'],domains:['soc']},
  {name:'Microsoft Defender for Endpoint',vendor:'Microsoft',cat:'EDR',desc:'Enterprise EDR deeply integrated with Microsoft 365 and Azure. Included in M365 E5 licensing.',tier:'paid',tags:['edr','microsoft','integrated'],domains:['soc','cloud']},
  {name:'Cortex XDR',vendor:'Palo Alto Networks',cat:'EDR',desc:'XDR platform correlating endpoint, network, and cloud data for unified threat detection.',tier:'paid',tags:['edr','xdr'],domains:['soc','cloud']},
  {name:'Tenable Nessus',vendor:'Tenable',cat:'Vulnerability Scanner',desc:'World\'s most widely deployed vulnerability scanner with comprehensive CVE plugin library.',tier:'freemium',tags:['vuln','scanner','cve'],domains:['eng','soc']},
  {name:'Qualys VMDR',vendor:'Qualys',cat:'Vulnerability Scanner',desc:'Cloud-based VM with asset discovery, risk prioritization, and patch orchestration.',tier:'paid',tags:['vuln','cloud'],domains:['eng','soc']},
  {name:'OpenVAS / Greenbone',vendor:'Greenbone',cat:'Vulnerability Scanner',desc:'Open-source vulnerability scanner with large NVT feed. Foundation of many enterprise VM programs.',tier:'open-source',tags:['vuln','open-source','free'],domains:['eng','soc']},
  {name:'Rapid7 InsightVM',vendor:'Rapid7',cat:'Vulnerability Scanner',desc:'Risk-based VM with live dashboards, remediation workflow, and InsightIDR integration.',tier:'paid',tags:['vuln','risk-based'],domains:['eng','soc']},
  {name:'Trivy',vendor:'Aqua Security',cat:'Vulnerability Scanner',desc:'Fast open-source scanner for container images, filesystems, and IaC. Essential for DevSecOps.',tier:'open-source',tags:['containers','iac','devsecops'],domains:['appsec','cloud']},
  {name:'Nikto',vendor:'Open Source',cat:'Vulnerability Scanner',desc:'Open-source web server scanner checking for dangerous files, outdated software, and misconfigurations.',tier:'open-source',tags:['web','scanner','open-source'],domains:['appsec','red']},
  {name:'Metasploit Framework',vendor:'Rapid7',cat:'Pentest',desc:'World\'s most used penetration testing framework with 2,000+ exploit modules and payloads.',tier:'freemium',tags:['exploit','pentest','framework'],domains:['red','soc']},
  {name:'Burp Suite',vendor:'PortSwigger',cat:'Pentest',desc:'Leading web application security testing platform with intercepting proxy, scanner, and extensions.',tier:'freemium',tags:['web','proxy','appsec'],domains:['appsec','red']},
  {name:'Nmap',vendor:'Open Source',cat:'Pentest',desc:'Network discovery and security auditing — detects open ports, services, OS, and firewall rules.',tier:'open-source',tags:['network','scan','discovery'],domains:['red','soc','eng']},
  {name:'BloodHound',vendor:'SpecterOps',cat:'Pentest',desc:'Active Directory attack path mapping using graph theory. Essential for pentest and defense.',tier:'open-source',tags:['ad','attack-path','graph'],domains:['red','iam']},
  {name:'Cobalt Strike',vendor:'HelpSystems',cat:'Pentest',desc:'Advanced adversary simulation and red team platform. Widely used for authorized red team operations.',tier:'paid',tags:['c2','red-team'],domains:['red']},
  {name:'Impacket',vendor:'SecureAuth',cat:'Pentest',desc:'Python library for working with network protocols — essential for AD attacks (pass-the-hash, Kerberoasting).',tier:'open-source',tags:['python','ad','protocol'],domains:['red']},
  {name:'Hashcat',vendor:'Open Source',cat:'Pentest',desc:'World\'s fastest GPU-based password recovery tool supporting 300+ hash types.',tier:'open-source',tags:['password','cracking','gpu'],domains:['red']},
  {name:'ffuf',vendor:'Open Source',cat:'Pentest',desc:'Fast web fuzzer for directory/endpoint discovery, parameter fuzzing, and vhost enumeration.',tier:'open-source',tags:['fuzzing','web','recon'],domains:['red','appsec']},
  {name:'Autopsy',vendor:'Basis Technology',cat:'Forensics',desc:'Open-source digital forensics platform for disk image analysis, file recovery, and timeline analysis.',tier:'free',tags:['forensics','disk','timeline'],domains:['forensics']},
  {name:'Volatility',vendor:'Volatility Foundation',cat:'Forensics',desc:'Advanced memory forensics framework for analyzing RAM dumps and extracting process artifacts.',tier:'open-source',tags:['memory','forensics','malware'],domains:['forensics','soc']},
  {name:'FTK Imager',vendor:'AccessData',cat:'Forensics',desc:'Forensic disk imaging tool creating exact sector-by-sector copies while preserving evidence integrity.',tier:'free',tags:['forensics','imaging','disk'],domains:['forensics']},
  {name:'Cellebrite UFED',vendor:'Cellebrite',cat:'Forensics',desc:'Industry-standard mobile device forensics platform used by law enforcement worldwide.',tier:'paid',tags:['mobile','forensics'],domains:['forensics']},
  {name:'x64dbg',vendor:'Open Source',cat:'Forensics',desc:'Open-source x64/x32 Windows debugger for malware analysis and reverse engineering.',tier:'open-source',tags:['debugger','reversing','windows'],domains:['forensics']},
  {name:'MISP',vendor:'CIRCL',cat:'Threat Intel',desc:'Open-source threat intelligence platform for sharing IOCs and threat data across organizations.',tier:'open-source',tags:['ti','ioc','sharing'],domains:['soc','forensics']},
  {name:'OpenCTI',vendor:'Filigran',cat:'Threat Intel',desc:'Open-source cyber threat intelligence platform with STIX/TAXII support and rich visualization.',tier:'open-source',tags:['ti','stix','graph'],domains:['soc','forensics']},
  {name:'VirusTotal',vendor:'Google',cat:'Threat Intel',desc:'Free file/URL/hash analysis aggregating results from 70+ antivirus engines and security tools.',tier:'freemium',tags:['ti','ioc','malware'],domains:['soc','forensics']},
  {name:'Shodan',vendor:'Shodan',cat:'Threat Intel',desc:'Internet-facing device search engine. Essential for external attack surface discovery and OSINT.',tier:'freemium',tags:['osint','recon','iot'],domains:['soc','red']},
  {name:'AlienVault OTX',vendor:'AT&T Cybersecurity',cat:'Threat Intel',desc:'Community-powered threat intel platform with real-time IOC feeds and pulse subscriptions.',tier:'free',tags:['ti','ioc','community'],domains:['soc']},
  {name:'Wiz',vendor:'Wiz',cat:'Cloud Security',desc:'CNAPP providing agentless cloud security posture management and workload protection.',tier:'paid',tags:['cloud','cnapp','cspm'],domains:['cloud']},
  {name:'Prisma Cloud',vendor:'Palo Alto Networks',cat:'Cloud Security',desc:'Comprehensive CNAPP with CSPM, CWPP, IAM security for multi-cloud environments.',tier:'paid',tags:['cloud','cnapp','multicloud'],domains:['cloud']},
  {name:'AWS Security Hub',vendor:'Amazon',cat:'Cloud Security',desc:'Unified AWS security posture view aggregating findings from GuardDuty, Inspector, and Macie.',tier:'paid',tags:['aws','cloud','posture'],domains:['cloud']},
  {name:'Prowler',vendor:'Open Source',cat:'Cloud Security',desc:'Open-source AWS, Azure, and GCP security assessment tool checking against CIS Benchmarks.',tier:'open-source',tags:['cloud','cis','audit'],domains:['cloud','grc']},
  {name:'ScoutSuite',vendor:'NCC Group',cat:'Cloud Security',desc:'Multi-cloud security auditing tool assessing configurations against security best practices.',tier:'open-source',tags:['cloud','audit','multicloud'],domains:['cloud']},
  {name:'CyberArk PAM',vendor:'CyberArk',cat:'IAM',desc:'Leading PAM platform for securing, rotating, and auditing privileged credentials.',tier:'paid',tags:['pam','privileged','credentials'],domains:['iam']},
  {name:'Okta',vendor:'Okta',cat:'IAM',desc:'Cloud-based identity platform providing SSO, MFA, and lifecycle management for enterprise apps.',tier:'paid',tags:['sso','mfa','identity'],domains:['iam']},
  {name:'SailPoint IdentityIQ',vendor:'SailPoint',cat:'IAM',desc:'Enterprise identity governance for access certification, provisioning, and separation of duties.',tier:'paid',tags:['iga','governance','provisioning'],domains:['iam']},
  {name:'HashiCorp Vault',vendor:'HashiCorp',cat:'IAM',desc:'Secrets management platform for securely storing and accessing API keys, passwords, and certs.',tier:'freemium',tags:['secrets','vault','infrastructure'],domains:['iam','cloud','appsec']},
  {name:'BeyondTrust',vendor:'BeyondTrust',cat:'IAM',desc:'PAM and privileged remote access platform focusing on least privilege enforcement.',tier:'paid',tags:['pam','least-privilege','remote'],domains:['iam']},
  {name:'Wireshark',vendor:'Open Source',cat:'Network Analysis',desc:'World\'s most popular network protocol analyzer for capturing and browsing network traffic.',tier:'open-source',tags:['network','pcap','protocol'],domains:['soc','forensics','eng']},
  {name:'Zeek (Bro)',vendor:'Open Source',cat:'Network Analysis',desc:'Powerful network analysis framework generating structured logs of network behavior.',tier:'open-source',tags:['ndr','logs','network'],domains:['soc','eng']},
  {name:'Suricata',vendor:'OISF',cat:'Network Analysis',desc:'High-performance open-source IDS/IPS/NSM engine with multi-threading and protocol analysis.',tier:'open-source',tags:['ids','ips','nids'],domains:['soc','eng']},
  {name:'Snort',vendor:'Cisco',cat:'Network Analysis',desc:'Original open-source IDS/IPS with extensive community rule sets (ET Open, VRT).',tier:'open-source',tags:['ids','ips','snort'],domains:['soc','eng']},
  {name:'OWASP ZAP',vendor:'OWASP',cat:'AppSec',desc:'Free open-source DAST tool for finding vulnerabilities in web apps. Great for CI/CD integration.',tier:'open-source',tags:['dast','web','owasp'],domains:['appsec']},
  {name:'Snyk',vendor:'Snyk',cat:'AppSec',desc:'Developer-first platform for finding vulnerabilities in code, dependencies, containers, and IaC.',tier:'freemium',tags:['sca','iac','devsecops'],domains:['appsec','cloud']},
  {name:'SonarQube',vendor:'SonarSource',cat:'AppSec',desc:'SAST platform with code quality and security vulnerability detection for CI/CD pipelines.',tier:'freemium',tags:['sast','code-quality','ci-cd'],domains:['appsec']},
  {name:'Semgrep',vendor:'Semgrep',cat:'AppSec',desc:'Fast open-source static analysis supporting 30+ languages with customizable security rules.',tier:'freemium',tags:['sast','open-source','rules'],domains:['appsec']},
  {name:'Checkmarx',vendor:'Checkmarx',cat:'AppSec',desc:'Enterprise SAST/SCA platform with deep code analysis and developer IDE integration.',tier:'paid',tags:['sast','sca','enterprise'],domains:['appsec']},
  {name:'ServiceNow GRC',vendor:'ServiceNow',cat:'GRC',desc:'Enterprise GRC for risk management, policy management, and compliance automation at scale.',tier:'paid',tags:['grc','risk','compliance'],domains:['grc']},
  {name:'RSA Archer',vendor:'RSA',cat:'GRC',desc:'Comprehensive GRC platform for risk management, compliance tracking, and business continuity.',tier:'paid',tags:['grc','risk','archer'],domains:['grc']},
  {name:'Drata',vendor:'Drata',cat:'GRC',desc:'Automated compliance platform for SOC 2, ISO 27001, HIPAA, and GDPR with continuous monitoring.',tier:'paid',tags:['compliance','automation','soc2'],domains:['grc']},
  {name:'Vanta',vendor:'Vanta',cat:'GRC',desc:'Automated security and compliance platform streamlining SOC 2, HIPAA, ISO 27001 certification.',tier:'paid',tags:['compliance','automation'],domains:['grc']},
  {name:'Ghidra',vendor:'NSA',cat:'Malware Analysis',desc:'Free and open-source reverse engineering tool from NSA with powerful binary analysis and decompiler.',tier:'open-source',tags:['reversing','re','nsa'],domains:['forensics']},
  {name:'IDA Pro',vendor:'Hex-Rays',cat:'Malware Analysis',desc:'Industry-standard disassembler and debugger for professional reverse engineering and malware analysis.',tier:'paid',tags:['reversing','disassembler','professional'],domains:['forensics']},
  {name:'Cuckoo Sandbox',vendor:'Open Source',cat:'Malware Analysis',desc:'Automated malware analysis system executing samples in an isolated environment and reporting behavior.',tier:'open-source',tags:['sandbox','dynamic','behavior'],domains:['forensics']},
  {name:'ANY.RUN',vendor:'ANY.RUN',cat:'Malware Analysis',desc:'Interactive online malware sandbox with real-time process monitoring and network traffic analysis.',tier:'freemium',tags:['sandbox','online','interactive'],domains:['forensics','soc']},
  {name:'REMnux',vendor:'SANS',cat:'Malware Analysis',desc:'Linux distribution purpose-built for reverse-engineering and analyzing malware samples.',tier:'free',tags:['linux','distro','reversing'],domains:['forensics']},
  {name:'Radare2',vendor:'Open Source',cat:'Malware Analysis',desc:'Advanced CLI reverse engineering framework for binary analysis, patching, and debugging.',tier:'open-source',tags:['reversing','cli','binary'],domains:['forensics']},
];
var _toolFilter='';var _toolCat='All';
function initTools(){
  var catSel=document.getElementById('tf-cat');
  if(catSel&&!catSel.dataset.init){
    catSel.dataset.init='1';
    var cats=['All','SIEM','EDR','Vulnerability Scanner','Pentest','Forensics','Threat Intel','Cloud Security','IAM','Network Analysis','AppSec','GRC','Malware Analysis'];
    cats.forEach(function(c){var o=document.createElement('option');o.value=c;o.textContent=c;catSel.appendChild(o);});
  }
  renderTools('',_toolCat);
}
function filterTools(){
  var q=(document.getElementById('tf-search')&&document.getElementById('tf-search').value)||'';
  var cat=(document.getElementById('tf-cat')&&document.getElementById('tf-cat').value)||'All';
  _toolFilter=q;_toolCat=cat;
  renderTools(q,cat);
}
function renderTools(q,cat){
  var grid=document.getElementById('tools-grid');
  if(!grid)return;
  q=(q||'').toLowerCase();cat=cat||'All';
  var filtered=TOOLS.filter(function(t){
    var matchCat=(cat==='All'||t.cat===cat);
    var matchQ=!q||(t.name.toLowerCase().indexOf(q)>-1)||(t.desc.toLowerCase().indexOf(q)>-1)||(t.vendor.toLowerCase().indexOf(q)>-1)||((t.tags||[]).some(function(tg){return tg.indexOf(q)>-1;}));
    return matchCat&&matchQ;
  });
  var tierColors={paid:'#f05d78',freemium:'#f5c842',free:'#10e87e','open-source':'#4d9eff'};
  grid.innerHTML=filtered.length?filtered.map(function(t){
    return '<div class="tool-card">'
      +'<div class="tc-head"><span class="tc-name">'+t.name+'</span><span class="tc-tier-badge" style="background:'+tierColors[t.tier]+'22;color:'+tierColors[t.tier]+'">'+t.tier+'</span></div>'
      +'<div class="tc-vendor">'+t.vendor+' &middot; <span class="tc-cat-tag">'+t.cat+'</span></div>'
      +'<div class="tc-desc">'+t.desc+'</div>'
      +'<div class="tc-tags">'+(t.tags||[]).slice(0,4).map(function(tg){return '<span class="tc-tag">'+tg+'</span>';}).join('')+'</div>'
      +'</div>';
  }).join(''):'<div class="tools-no-results">No tools match your search.</div>';
  var cnt=document.getElementById('tools-count');
  if(cnt)cnt.textContent=filtered.length+' tool'+(filtered.length!==1?'s':'');
}

// ─── F9: CTF & CONFERENCE CALENDAR ──────────────────────
var EVENTS=[
  {name:'picoCTF 2025',type:'ctf',date:'2025-03-07',url:'https://picoctf.org',cost:'free',virtual:true,desc:'Beginner-friendly CTF from Carnegie Mellon University. Perfect for newcomers learning the fundamentals.',diff:'Beginner'},
  {name:'BSides Austin 2025',type:'conference',date:'2025-03-21',url:'https://bsidesaustin.com',cost:'free',virtual:false,desc:'Community-run security conference in Austin with talks, workshops, and CTF challenges.',diff:null},
  {name:'BSides San Francisco 2025',type:'conference',date:'2025-04-26',url:'https://bsidessf.org',cost:'free',virtual:false,desc:'Long-running BSides event with diverse security research presentations.',diff:null},
  {name:'RSA Conference 2025',type:'conference',date:'2025-04-28',url:'https://www.rsaconference.com',cost:'paid',virtual:false,desc:'World\'s largest cybersecurity conference — 500+ sessions, keynotes, Expo Hall, and networking events.',diff:null},
  {name:'ISACA North America CACS',type:'conference',date:'2025-05-04',url:'https://www.isaca.org',cost:'paid',virtual:false,desc:'ISACA flagship North America conference covering GRC, audit, risk, and governance topics.',diff:null},
  {name:'NahamCon 2025',type:'conference',date:'2025-06-06',url:'https://www.nahamcon.com',cost:'free',virtual:true,desc:'Free online hacking conference with CTF competition, workshops, and industry speakers.',diff:null},
  {name:'NahamCon CTF 2025',type:'ctf',date:'2025-06-06',url:'https://ctf.nahamcon.com',cost:'free',virtual:true,desc:'Beginner to intermediate CTF running alongside NahamCon. Great for building practical skills.',diff:'Beginner'},
  {name:'Google CTF 2025',type:'ctf',date:'2025-07-12',url:'https://capturetheflag.withgoogle.com',cost:'free',virtual:true,desc:'Google\'s annual CTF with high-quality challenges across web, crypto, pwn, and reversing.',diff:'Advanced'},
  {name:'Black Hat USA 2025',type:'conference',date:'2025-08-02',url:'https://www.blackhat.com',cost:'paid',virtual:false,desc:'Premier technical security conference with in-depth trainings, briefings, and Arsenal tool demos.',diff:null},
  {name:'BSides Las Vegas 2025',type:'conference',date:'2025-08-05',url:'https://bsideslv.org',cost:'free',virtual:false,desc:'Community-driven conference running alongside DEF CON. Two days of talks and networking.',diff:null},
  {name:'DEF CON 33',type:'conference',date:'2025-08-07',url:'https://defcon.org',cost:'paid',virtual:false,desc:'The world\'s largest hacker convention — villages, CTF, talks, and everything in between.',diff:null},
  {name:'DEF CON CTF 2025',type:'ctf',date:'2025-08-07',url:'https://defcon.org',cost:'free',virtual:false,desc:'The most prestigious CTF in the world. Attack/Defense format for elite teams. Finals at DEF CON.',diff:'Expert'},
  {name:'BlueTeamCon 2025',type:'conference',date:'2025-08-29',url:'https://blueteamcon.com',cost:'paid',virtual:false,desc:'Defensive security-focused conference in Chicago covering blue team tools, tactics, and careers.',diff:null},
  {name:'GrrCON 2025',type:'conference',date:'2025-10-09',url:'https://grrcon.com',cost:'paid',virtual:false,desc:'Midwest information security and hacking event held annually in Grand Rapids, MI.',diff:null},
  {name:'ISC2 Security Congress 2025',type:'conference',date:'2025-10-13',url:'https://www.isc2.org',cost:'paid',virtual:false,desc:'ISC2\'s annual congress covering CISSP domains, member networking, and CPE opportunities.',diff:null},
  {name:'ToorCon San Diego 2025',type:'conference',date:'2025-10-17',url:'https://toorcon.net',cost:'paid',virtual:false,desc:'San Diego\'s premier hacker conference with technical talks, workshops, and CTF challenges.',diff:null},
  {name:'Wild West Hackin\' Fest 2025',type:'conference',date:'2025-10-22',url:'https://wildwesthackinfest.com',cost:'paid',virtual:true,desc:'Community security conference with in-person (Deadwood, SD) and virtual attendance options.',diff:null},
  {name:'SecTor 2025',type:'conference',date:'2025-10-21',url:'https://www.sector.ca',cost:'paid',virtual:false,desc:'Canada\'s premier cybersecurity conference in Toronto with technical and strategic security tracks.',diff:null},
  {name:'HackTheBox University CTF 2025',type:'ctf',date:'2025-11-14',url:'https://ctf.hackthebox.com',cost:'free',virtual:true,desc:'Annual HTB CTF open to all skill levels with team format covering all security domains.',diff:'Intermediate'},
  {name:'SANS Cyber Defense Forum',type:'conference',date:'2025-12-08',url:'https://www.sans.org',cost:'paid',virtual:true,desc:'SANS annual virtual summit covering defensive security techniques, threat hunting, and detection.',diff:null},
  {name:'SANS Holiday Hack / KringleCon',type:'ctf',date:'2025-12-01',url:'https://www.sans.org/mlp/holiday-hack-challenge/',cost:'free',virtual:true,desc:'Annual SANS holiday CTF with a fun narrative storyline. Great for all skill levels.',diff:'Beginner'},
  {name:'SANS Webcasts (Ongoing)',type:'webinar',date:'2025-03-01',url:'https://www.sans.org/webcasts/',cost:'free',virtual:true,desc:'Regular free webcasts from SANS instructors covering current threats, tools, and techniques.',diff:null},
  {name:'ISC2 CPE Webinars (Ongoing)',type:'webinar',date:'2025-03-01',url:'https://www.isc2.org/professional-development/webinars',cost:'free',virtual:true,desc:'Free CPE-eligible webinars for ISC2 members covering all CISSP and associate domains.',diff:null},
  {name:'CISA Events (Ongoing)',type:'webinar',date:'2025-03-01',url:'https://www.cisa.gov/events',cost:'free',virtual:true,desc:'Free government webinars on threat advisories, critical infrastructure security, and IR.',diff:null},
  {name:'CTFtime — All Competitions',type:'ctf',date:'2025-03-01',url:'https://ctftime.org',cost:'free',virtual:true,desc:'Aggregator for all ongoing and upcoming CTF competitions worldwide. Check here for the full schedule.',diff:'All Levels'},
];
var _calFilter='all';var _calFreeOnly=false;
function initCalendar(){
  var filters=document.getElementById('cal-filters');
  if(filters&&!filters.dataset.init){
    filters.dataset.init='1';
    var types=[['all','All Events'],['conference','Conferences'],['ctf','CTFs'],['webinar','Webinars']];
    filters.innerHTML=types.map(function(t){return '<button class="cal-filter-chip'+(t[0]==='all'?' cal-chip-active':'')+'" data-type="'+t[0]+'" onclick="setCalFilter(\''+t[0]+'\')">'+t[1]+'</button>';}).join('')
      +'<button class="cal-filter-chip" id="cal-free-btn" onclick="toggleCalFree()">Free Only</button>';
  }
  renderCalendar(_calFilter,_calFreeOnly);
}
function setCalFilter(type){
  _calFilter=type;
  document.querySelectorAll('.cal-filter-chip').forEach(function(el){if(el.id!=='cal-free-btn')el.classList.toggle('cal-chip-active',el.dataset.type===type);});
  renderCalendar(_calFilter,_calFreeOnly);
}
function toggleCalFree(){
  _calFreeOnly=!_calFreeOnly;
  var btn=document.getElementById('cal-free-btn');
  if(btn)btn.classList.toggle('cal-chip-active',_calFreeOnly);
  renderCalendar(_calFilter,_calFreeOnly);
}
function renderCalendar(typeFilter,freeOnly){
  var list=document.getElementById('cal-list');
  if(!list)return;
  var filtered=EVENTS.filter(function(e){
    var matchType=(typeFilter==='all'||e.type===typeFilter);
    var matchFree=!freeOnly||(e.cost==='free');
    return matchType&&matchFree;
  }).sort(function(a,b){return new Date(a.date)-new Date(b.date);});
  if(!filtered.length){list.innerHTML='<div class="cal-empty">No events match your filters.</div>';return;}
  var groups={};
  filtered.forEach(function(e){
    var d=new Date(e.date+'T12:00:00');
    var key=d.getFullYear()+'-'+(d.getMonth()+1);
    var label=d.toLocaleDateString('en-US',{month:'long',year:'numeric'});
    if(!groups[key])groups[key]={label:label,events:[]};
    groups[key].events.push(e);
  });
  var typeColors={conference:'#4d9eff',ctf:'#f05d78',webinar:'#10e87e',training:'#f5c842'};
  var html='';
  Object.keys(groups).sort().forEach(function(k){
    var g=groups[k];
    html+='<div class="cal-month-group"><div class="cal-month-label">'+g.label+'</div>';
    g.events.forEach(function(e){
      var d=new Date(e.date+'T12:00:00');
      var day=d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
      html+='<div class="cal-event">'
        +'<div class="ce-date">'+day+'</div>'
        +'<div class="ce-body">'
        +'<div class="ce-title-row"><span class="ce-title">'+e.name+'</span>'
        +'<span class="ce-type-badge" style="background:'+typeColors[e.type]+'22;color:'+typeColors[e.type]+'">'+e.type+'</span>'
        +(e.cost==='free'?'<span class="ce-free-tag">FREE</span>':'')
        +(e.virtual?'<span class="ce-virtual-tag">VIRTUAL</span>':'')
        +'</div>'
        +'<div class="ce-desc">'+e.desc+'</div>'
        +(e.diff?'<div class="ce-diff">Difficulty: <strong>'+e.diff+'</strong></div>':'')
        +'</div>'
        +'<a class="ce-link" href="'+e.url+'" target="_blank" rel="noopener">Visit &rarr;</a>'
        +'</div>';
    });
    html+='</div>';
  });
  list.innerHTML=html;
}

// ─── F10: RESUME TEMPLATES ───────────────────────────────
var RESUME_TEMPLATES=[
  {id:'soc',role:'SOC Analyst',level:'Entry – Mid',icon:'🛡️',color:'#00d4c8',
    tips:['Lead with monitoring/detection skills: Splunk, SIEM platforms, alert triage','Include threat intelligence tools: VirusTotal, MISP, OTX','Quantify: "Triaged 150+ alerts/day," "Reduced MTTR by 30%"','Highlight shift flexibility and on-call experience','Relevant certs: CompTIA Security+, CySA+, Splunk Core Certified, BTL1'],googleDocUrl:'https://docs.google.com/'},
  {id:'pentest',role:'Penetration Tester',level:'Mid – Senior',icon:'⚔️',color:'#f05d78',
    tips:['List tools by name: Metasploit, Burp Suite, Nmap, BloodHound, Impacket','Include bug bounty rankings and CTF results (HackTheBox, TryHackMe)','Highlight any CVEs found or responsible disclosures','Emphasize report writing — clients pay for clear risk communication','OSCP is the gold standard cert; also add CEH, eJPT, PNPT, GPEN'],googleDocUrl:'https://docs.google.com/'},
  {id:'cloud-sec',role:'Cloud Security Engineer',level:'Mid – Senior',icon:'☁️',color:'#4d9eff',
    tips:['Specify platforms: AWS, Azure, GCP — avoid generic "cloud security"','List IaC tools: Terraform, CloudFormation, Pulumi — engineers must code','Include CSPM tools: Wiz, Prisma Cloud, Prowler, ScoutSuite','Quantify: "Secured 200+ cloud accounts," "Reduced critical findings 40%"','Certs: AWS Security Specialty, AZ-500, CCSP, GCSA'],googleDocUrl:'https://docs.google.com/'},
  {id:'security-eng',role:'Security Engineer',level:'Mid – Senior',icon:'⚙️',color:'#10e87e',
    tips:['Show Python/Go/Bash coding ability — security engineers must code','Highlight tool builds: SIEM detection rules, automated IR playbooks','Reference frameworks used: MITRE ATT&CK, NIST, CIS Benchmarks','Include scale: "Protected 10,000-seat enterprise," "Managed 50TB/day log pipeline"','Certs: CISSP, Security+, GCED, GCIH — breadth matters here'],googleDocUrl:'https://docs.google.com/'},
  {id:'grc',role:'GRC Analyst',level:'Entry – Senior',icon:'📋',color:'#818cf8',
    tips:['Lead with frameworks: NIST CSF, ISO 27001, SOC 2, PCI DSS, HIPAA — be specific','Highlight audit outcomes: "Managed SOC 2 Type II audit, zero exceptions"','Include risk register management and risk scoring methodology','Show business fluency — GRC requires translating risk for executives','Certs: CISA, CISM, CRISC, CompTIA Security+ are highly valued'],googleDocUrl:'https://docs.google.com/'},
  {id:'iam',role:'IAM Engineer',level:'Mid – Senior',icon:'🔑',color:'#ff8c42',
    tips:['Specify platforms: CyberArk, SailPoint, Okta, Ping, Azure AD/Entra ID','Include PAM, SSO, MFA, and directory service experience','Show lifecycle management scale: "Provisioned 5,000+ accounts across 15 systems"','Highlight compliance support: SOX, SOC 2 AC controls, certifications','Differentiator certs: CIMP, SailPoint, CyberArk, CIAM'],googleDocUrl:'https://docs.google.com/'},
  {id:'sa',role:'Security Architect',level:'Senior – Principal',icon:'🏗️',color:'#c084fc',
    tips:['Show breadth across multiple security domains','Include enterprise architecture: SABSA, TOGAF, NIST frameworks','Quantify impact: "Designed zero trust architecture for 15,000-seat org"','Highlight cross-team leadership and executive communication','Certs: CISSP-ISSAP, SABSA, TOGAF alongside technical certs'],googleDocUrl:'https://docs.google.com/'},
  {id:'ciso',role:'CISO / Security Manager',level:'Director – Executive',icon:'👔',color:'#f5c842',
    tips:['Lead with business outcomes — use board-level language, not technical jargon','Include budget ownership: "Managed $3.2M security budget"','Show compliance outcomes: "Led SOC 2 Type II, ISO 27001 certifications"','Highlight team building, vendor management, and M&A security work','Certs: CISM, CISSP, CCISO, executive education programs'],googleDocUrl:'https://docs.google.com/'},
];
function renderResumeTemplates(){
  var grid=document.getElementById('resume-grid');
  if(!grid)return;
  grid.innerHTML=RESUME_TEMPLATES.map(function(t){
    return '<div class="rt-card" onclick="openResumeTemplate(\''+t.id+'\')" style="--rt-color:'+t.color+'">'
      +'<div class="rt-icon">'+t.icon+'</div>'
      +'<div class="rt-role">'+t.role+'</div>'
      +'<div class="rt-level">'+t.level+'</div>'
      +'<div class="rt-footer"><span class="rt-btn">View Tips &rarr;</span></div>'
      +'</div>';
  }).join('');
}
function openResumeTemplate(id){
  var t=RESUME_TEMPLATES.find(function(x){return x.id===id;});
  if(!t)return;
  var panel=document.getElementById('resume-detail');
  if(!panel)return;
  panel.innerHTML='<button class="rd-close" onclick="var d=document.getElementById(\'resume-detail\');var g=document.getElementById(\'resume-grid\');if(d)d.style.display=\'none\';if(g)g.style.display=\'\';">&larr; Back to Templates</button>'
    +'<div class="rd-header" style="border-color:'+t.color+'">'
    +'<span class="rd-icon">'+t.icon+'</span>'
    +'<div><div class="rd-role" style="color:'+t.color+'">'+t.role+'</div><div class="rd-level">'+t.level+'</div></div>'
    +'</div>'
    +'<h3 class="rd-tips-hd">Resume Tips for '+t.role+'</h3>'
    +'<ul class="rd-tips-list">'+t.tips.map(function(tip){return '<li>'+tip+'</li>';}).join('')+'</ul>'
    +'<div class="rd-cta">'
    +'<a href="'+t.googleDocUrl+'" target="_blank" class="rd-template-btn">Open Template in Google Docs &nearr;</a>'
    +'<p class="rd-note">Click "File &rarr; Make a copy" to get your own editable version. (Placeholder link — add your own Google Doc template URL.)</p>'
    +'</div>';
  panel.style.display='block';
  document.getElementById('resume-grid').style.display='none';
}

// ─── F11: WALL OF WINS ────────────────────────────────────
var FEATURED_STORIES=[
  {name:'Marcus T.',role:'SOC Analyst II',prev:'Retail Store Manager',domain:'soc',duration:'14 months',quote:'I had zero tech background. Started with CompTIA A+ and Security+, then grinded TryHackMe every night. Got my first SOC role at month 11.',tip:'Consistency beats intensity. 1 hour every day beats 8 hours on weekends.',date:'Jan 2026',icon:'🛡️',color:'#00d4c8'},
  {name:'Priya M.',role:'Cloud Security Engineer',prev:'Network Engineer',domain:'cloud',duration:'8 months',quote:'The AWS Security Specialty cert was a game changer. Every interview asked about cloud security architecture — I had all the answers.',tip:'If you\'re already in networking, cloud security is a natural next step. Get the AWS Security Specialty.',date:'Dec 2025',icon:'☁️',color:'#4d9eff'},
  {name:'James R.',role:'Penetration Tester',prev:'IT Help Desk',domain:'red',duration:'18 months',quote:'OSCP was brutal but worth every painful moment. The day I passed, three companies reached out within a week.',tip:'OSCP is the minimum bar for serious pentest roles. Don\'t skip it.',date:'Feb 2026',icon:'⚔️',color:'#f05d78'},
  {name:'Aisha K.',role:'GRC Analyst',prev:'Paralegal',domain:'grc',duration:'6 months',quote:'My legal background translated perfectly. Risk assessment, policy writing, contract review — I already had those skills. CISA study solidified the rest.',tip:'Non-tech backgrounds aren\'t a weakness in GRC. Lean into your transferable skills.',date:'Nov 2025',icon:'📋',color:'#818cf8'},
  {name:'Tyler B.',role:'IAM Engineer',prev:'Systems Administrator',domain:'iam',duration:'10 months',quote:'Moved from managing Active Directory to building CyberArk implementations. The jump in salary was $35K.',tip:'If you manage AD/Entra ID, you\'re already halfway to IAM Engineering. Get CyberArk or SailPoint certified.',date:'Jan 2026',icon:'🔑',color:'#ff8c42'},
  {name:'Sarah L.',role:'Security Architect',prev:'Security Engineer',domain:'eng',duration:'3 years',quote:'The path from engineer to architect is about developing business fluency. I started presenting risk in dollars, not CVE scores. That changed everything.',tip:'Learn to speak executive language. Risk in dollars, not technical jargon.',date:'Oct 2025',icon:'🏗️',color:'#c084fc'},
];
function getStories(){
  try{var s=localStorage.getItem('isd_stories');var sub=s?JSON.parse(s):[];return sub.concat(FEATURED_STORIES);}catch(e){return FEATURED_STORIES;}
}
function renderStories(){
  var grid=document.getElementById('stories-grid');
  if(!grid)return;
  var stories=getStories();
  grid.innerHTML=stories.map(function(s){
    var initials=s.name.split(' ').map(function(w){return w[0]||'';}).join('').toUpperCase().slice(0,2);
    return '<div class="story-card">'
      +'<div class="sc-av" style="background:'+s.color+'22;color:'+s.color+'">'+initials+'</div>'
      +'<div class="sc-body">'
      +'<div class="sc-name">'+s.name+'</div>'
      +'<div class="sc-role"><span class="sc-role-icon">'+s.icon+'</span>'+s.role+'</div>'
      +'<div class="sc-prev">&larr; '+s.prev+'</div>'
      +'<div class="sc-quote">"'+s.quote+'"</div>'
      +'<div class="sc-tip"><strong>Tip:</strong> '+s.tip+'</div>'
      +'<div class="sc-meta">'+s.duration+(s.date?' &middot; '+s.date:'')+'</div>'
      +'</div></div>';
  }).join('');
}
function submitStory(){
  var name=document.getElementById('ssf-name')&&document.getElementById('ssf-name').value.trim()||'';
  var role=document.getElementById('ssf-role')&&document.getElementById('ssf-role').value.trim()||'';
  var prev=document.getElementById('ssf-prev')&&document.getElementById('ssf-prev').value.trim()||'';
  var dur=document.getElementById('ssf-dur')&&document.getElementById('ssf-dur').value.trim()||'';
  var quote=document.getElementById('ssf-quote')&&document.getElementById('ssf-quote').value.trim()||'';
  var tip=document.getElementById('ssf-tip')&&document.getElementById('ssf-tip').value.trim()||'';
  if(!name||!role||!quote){showToast('Please fill in Name, New Role, and Your Story.');return;}
  var story={name:name,role:role,prev:prev||'Previous Career',domain:'soc',duration:dur,quote:quote,tip:tip,date:new Date().toLocaleDateString('en-US',{month:'short',year:'numeric'}),icon:'⭐',color:'#f5c842'};
  try{var existing=localStorage.getItem('isd_stories');var arr=existing?JSON.parse(existing):[];arr.unshift(story);localStorage.setItem('isd_stories',JSON.stringify(arr));}catch(e){}
  ['ssf-name','ssf-role','ssf-prev','ssf-dur','ssf-quote','ssf-tip'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
  renderStories();
  showToast('Your story has been added! Thank you for inspiring others. 🏆');
  var g=document.getElementById('stories-grid');if(g)g.scrollIntoView({behavior:'smooth'});
}
function showToast(msg){
  var t=document.getElementById('isd-toast');
  if(!t){t=document.createElement('div');t.id='isd-toast';t.className='isd-toast';document.body.appendChild(t);}
  t.textContent=msg;t.classList.add('toast-show');
  setTimeout(function(){t.classList.remove('toast-show');},3500);
}

// ─── PAGE INIT HOOKS ─────────────────────────────────────
var _pageInits={
  certs:function(){initCertTracker();},
  salary:function(){initSalaryCalc();},
  tools:function(){initTools();},
  calendar:function(){initCalendar();},
  resume:function(){var g=document.getElementById('resume-grid');var d=document.getElementById('resume-detail');if(d)d.style.display='none';if(g){g.style.display='';renderResumeTemplates();}},
  stories:function(){renderStories();},
  profile:function(){initProfile();},
};

// Trigger DC float on first load
document.addEventListener('DOMContentLoaded', function(){
  if(typeof initDCFloat==='function')initDCFloat();
});

// ══════════════════════ v11 UPDATES ══════════════════════

// ─── DAILY CHALLENGE MODAL ───────────────────────────────
function initDCFloat(){
  var sk=loadStreak();
  var floatBtn=document.getElementById('dc-float-btn');
  var floatStreak=document.getElementById('dc-float-streak');
  if(floatStreak&&sk.count>0){floatStreak.textContent='🔥'+sk.count;}
  if(floatBtn){floatBtn.style.display='flex';}
}
function openDCModal(){
  var m=document.getElementById('dc-modal');
  if(!m)return;
  m.classList.add('dc-modal-open');
  document.body.style.overflow='hidden';
  renderDCModal();
}
function closeDCModal(){
  var m=document.getElementById('dc-modal');
  if(m){m.classList.remove('dc-modal-open');document.body.style.overflow='';}
}
function renderDCModal(){
  var body=document.getElementById('dc-modal-body');
  var streakEl=document.getElementById('dc-modal-streak');
  var signupEl=document.getElementById('dc-modal-signup');
  if(!body)return;
  var idx=getDailyIdx();
  var q=DC_BANK[idx];
  var state=loadDCState();
  var today=new Date().toDateString();
  var sk=loadStreak();
  if(streakEl)streakEl.textContent=(sk.count>0?'🔥 '+sk.count+' day streak':'Start your streak today!');
  var diffColors={Easy:'#10e87e',Medium:'#f5c842',Hard:'#f05d78'};
  if(state&&state.date===today){
    // Already answered today
    if(signupEl)signupEl.style.display='flex';
    var chosen=state.chosen;
    body.innerHTML='<div class="dcm-q">'+q.q+'</div>'
      +'<div class="dcm-opts">'+q.opts.map(function(o,i){
        var cls='dcm-opt';
        if(i===q.correct)cls+=' dcm-opt-correct';
        else if(i===chosen&&chosen!==q.correct)cls+=' dcm-opt-wrong';
        else cls+=' dcm-opt-neutral';
        return '<div class="'+cls+'">'+o+'</div>';
      }).join('')+'</div>'
      +'<div class="dcm-result '+(state.won?'dcm-result-win':'dcm-result-lose')+'">'+(state.won?'✅ Correct!':'❌ Not quite.')+'</div>'
      +'<div class="dcm-explain">'+q.explain+'</div>'
      +'<div class="dcm-meta"><span class="dcm-cat">'+q.cat+'</span>'
      +'<span class="dcm-diff" style="color:'+(diffColors[q.diff]||'#94a3b8')+'">'+q.diff+'</span></div>'
      +'<div class="dcm-done-msg">Come back tomorrow for a new challenge!</div>';
    return;
  }
  if(signupEl)signupEl.style.display='none';
  body.innerHTML='<div class="dcm-q">'+q.q+'</div>'
    +'<div class="dcm-opts">'+q.opts.map(function(o,i){
      return '<div class="dcm-opt" onclick="submitDCModalAnswer('+i+')">'+o+'</div>';
    }).join('')+'</div>'
    +'<div class="dcm-meta"><span class="dcm-cat">'+q.cat+'</span>'
    +'<span class="dcm-diff" style="color:'+(diffColors[q.diff]||'#94a3b8')+'">'+q.diff+'</span></div>';
}
function submitDCModalAnswer(chosen){
  var idx=getDailyIdx();
  var q=DC_BANK[idx];
  var won=(chosen===q.correct);
  var today=new Date().toDateString();
  saveDCState({date:today,chosen:chosen,won:won});
  var sk=updateStreak(won);
  // Update float button streak
  var floatStreak=document.getElementById('dc-float-streak');
  if(floatStreak&&sk.count>0){floatStreak.textContent='🔥'+sk.count;}
  var streakEl=document.getElementById('dc-modal-streak');
  if(streakEl)streakEl.textContent=(sk.count>0?'🔥 '+sk.count+' day streak':'Keep going!');
  renderDCModal();
}

// ─── PROFILE PAGE ────────────────────────────────────────
var _PROFILE_KEY='isd_profile';
function loadProfile(){try{var s=localStorage.getItem(_PROFILE_KEY);return s?JSON.parse(s):{};}catch(e){return {};}}
function saveProfile(){
  var p={
    name:(document.getElementById('pf-name')&&document.getElementById('pf-name').value)||'',
    email:(document.getElementById('pf-email')&&document.getElementById('pf-email').value)||'',
    currentRole:(document.getElementById('pf-current-role')&&document.getElementById('pf-current-role').value)||'',
    targetRole:(document.getElementById('pf-target-role')&&document.getElementById('pf-target-role').value)||'',
    exp:(document.getElementById('pf-exp')&&document.getElementById('pf-exp').value)||'',
    location:(document.getElementById('pf-location')&&document.getElementById('pf-location').value)||'',
    bio:(document.getElementById('pf-bio')&&document.getElementById('pf-bio').value)||''
  };
  try{localStorage.setItem(_PROFILE_KEY,JSON.stringify(p));}catch(e){}
  updateProfileDisplay(p);
  showToast('Profile saved! ✅');
}
function updateProfileDisplay(p){
  if(!p)p=loadProfile();
  var nameEl=document.getElementById('ph-name-display');
  var roleEl=document.getElementById('ph-role-display');
  if(nameEl)nameEl.textContent=p.name||'Guest User';
  if(roleEl)roleEl.textContent=p.currentRole||(p.targetRole?'Targeting: '+p.targetRole:'Not signed in');
}
function initProfile(){
  var p=loadProfile();
  if(p.name){var el=document.getElementById('pf-name');if(el)el.value=p.name;}
  if(p.email){var el=document.getElementById('pf-email');if(el)el.value=p.email;}
  if(p.currentRole){var el=document.getElementById('pf-current-role');if(el)el.value=p.currentRole;}
  if(p.targetRole){var el=document.getElementById('pf-target-role');if(el)el.value=p.targetRole;}
  if(p.exp){var el=document.getElementById('pf-exp');if(el)el.value=p.exp;}
  if(p.location){var el=document.getElementById('pf-location');if(el)el.value=p.location;}
  if(p.bio){var el=document.getElementById('pf-bio');if(el)el.value=p.bio;}
  updateProfileDisplay(p);
  // Load streak
  var sk=loadStreak();
  var streakEl=document.getElementById('ps-streak');if(streakEl)streakEl.textContent=sk.count;
  // Load cert progress
  var cp=getCertProgress();
  var done=Object.values(cp).filter(function(v){return v==='done';}).length;
  var inprog=Object.values(cp).filter(function(v){return v==='inprog';}).length;
  var pdone=document.getElementById('ps-certs-done');if(pdone)pdone.textContent=done;
  var pprog=document.getElementById('ps-certs-prog');if(pprog)pprog.textContent=inprog;
  // Cert summary
  var csEl=document.getElementById('profile-cert-summary');
  if(csEl&&(done>0||inprog>0)){
    csEl.innerHTML='<div class="pcs-row"><span class="pcs-item pcs-done">✅ '+done+' earned</span><span class="pcs-item pcs-prog">⏳ '+inprog+' in progress</span></div>'
      +'<p style="margin:8px 0 0;font-size:.8rem;color:var(--mt);">Right-click any cert badge on the Certifications page to update status.</p>';
  }
}

// ─── SALARY CALC FIX (commas, accurate market data) ──────
var CALC_BASE_SAL={
  soc:{min:70000,max:95000},
  de:{min:110000,max:150000},
  ir:{min:100000,max:140000},
  ti:{min:95000,max:130000},
  ma:{min:100000,max:142000},
  pt:{min:115000,max:160000},
  rt:{min:130000,max:185000},
  as:{min:120000,max:165000},
  iam:{min:110000,max:155000},
  vm:{min:90000,max:125000},
  grc:{min:80000,max:115000},
  se:{min:120000,max:170000},
  sa:{min:150000,max:210000},
  cs:{min:125000,max:175000},
  ciso:{min:200000,max:380000},
  risk:{min:110000,max:150000}
};
function fmtSal(n){
  return '$'+Math.round(n).toLocaleString('en-US');
}
// Override calcSalary with corrected version
function calcSalary(){
  var roleKey=document.getElementById('sc-role')&&document.getElementById('sc-role').value;
  var expKey=(document.getElementById('sc-exp')&&document.getElementById('sc-exp').value)||'mid';
  var locKey=(document.getElementById('sc-loc')&&document.getElementById('sc-loc').value)||'remote';
  var res=document.getElementById('sc-result');
  if(!res||!roleKey||typeof JT==='undefined')return;
  var jt=JT[roleKey];if(!jt)return;
  var base=CALC_BASE_SAL[roleKey]||{min:80000,max:120000};
  var baseMin=base.min,baseMax=base.max;
  var expM=EXP_MULT[expKey]||1.0;
  var locM=LOC_MULT[locKey]||1.0;
  var certBonus=0;
  document.querySelectorAll('#sc-cert-bonuses input:checked').forEach(function(cb){certBonus+=(CERT_BONUSES[cb.value]||0);});
  var totalM=expM*locM*(1+certBonus);
  var adjMin=Math.round(baseMin*totalM/1000)*1000;
  var adjMax=Math.round(baseMax*totalM/1000)*1000;
  var adjMid=Math.round((adjMin+adjMax)/2/1000)*1000;
  res.innerHTML='<div class="sc-result-role">'+jt.icon+' '+jt.title+'</div>'
    +'<div class="sc-range-wrap">'
    +'<div class="sc-range-labels"><span>'+fmtSal(adjMin)+'</span><span class="sc-mid-label">~'+fmtSal(adjMid)+' median</span><span>'+fmtSal(adjMax)+'</span></div>'
    +'<div class="sc-range-bar"><div class="sc-range-fill"></div></div></div>'
    +'<div class="sc-tip">'+jt.domain+' · '+(certBonus>0?'Cert bonuses: +'+Math.round(certBonus*100)+'%. ':'')+
    (locKey!=='remote'?'Adjusted for local market. ':'National remote average. ')+'Private sector rates.</div>';
}

// Update cert bonuses with top-paying certs + Master's degree
CERT_BONUSES={
  cissp:0.15,
  cism:0.12,
  aws_sec:0.15,
  ccsp:0.12,
  oscp:0.14,
  cisa:0.10,
  crisc:0.11,
  azure_sec:0.10,
  gcp_sec:0.10,
  gpen:0.09,
  gcih:0.08,
  gcfa:0.09,
  gcfe:0.08,
  masters:0.12,
  phd:0.08
};
// Rebuild the cert bonus checkboxes with new list
function initSalaryCalc(){
  var roleEl=document.getElementById('sc-role');
  if(!roleEl||roleEl.dataset.init)return;
  roleEl.dataset.init='1';
  if(typeof JT!=='undefined'){
    Object.keys(JT).sort(function(a,b){return JT[a].title.localeCompare(JT[b].title);}).forEach(function(k){
      var o=document.createElement('option');o.value=k;o.textContent=JT[k].title;roleEl.appendChild(o);
    });
  }
  var locEl=document.getElementById('sc-loc');
  if(locEl){
    var locs=[['remote','Remote / National Avg'],['sf','San Francisco Bay Area (+28%)'],['nyc','New York City (+22%)'],['seattle','Seattle (+18%)'],['dc','Washington D.C. (+16%)'],['boston','Boston (+14%)'],['austin','Austin (+9%)'],['chicago','Chicago (+5%)'],['southwest','Southwest (-8%)'],['midwest','Midwest (-10%)'],['southeast','Southeast (-13%)']];
    locs.forEach(function(l){var o=document.createElement('option');o.value=l[0];o.textContent=l[1];locEl.appendChild(o);});
  }
  var cbEl=document.getElementById('sc-cert-bonuses');
  if(cbEl){
    var pc=[['cissp','CISSP (+15%)'],['cism','CISM (+12%)'],['aws_sec','AWS Security Specialty (+15%)'],['ccsp','CCSP (+12%)'],['oscp','OSCP (+14%)'],['cisa','CISA (+10%)'],['crisc','CRISC (+11%)'],['azure_sec','AZ-500 Azure Security (+10%)'],['gcp_sec','GCP Security Engineer (+10%)'],['gpen','GPEN (+9%)'],['gcih','GCIH (+8%)'],['gcfa','GCFA (+9%)'],['masters','Master\'s Degree (+12%)'],['phd','Ph.D. (+8%)']];
    cbEl.innerHTML=pc.map(function(c){return '<label class="sc-cert-cb"><input type="checkbox" value="'+c[0]+'" onchange="calcSalary()"> '+c[1]+'</label>';}).join('');
  }
  calcSalary();
}
// Also update exp multipliers for correct labels
EXP_MULT={entry:0.78,mid:1.0,senior:1.22,lead:1.45};

// ─── CERT COMPARISON FIX ─────────────────────────────────
function renderCertComparison(){
  var sa=document.getElementById('ccm-a'),sb=document.getElementById('ccm-b');
  var t=document.getElementById('ccm-table');
  if(!sa||!sb||!t||typeof CERTS==='undefined')return;
  var ca=CERTS[sa.value],cb=CERTS[sb.value];
  if(!ca||!cb){t.innerHTML='<div class="ccm-msg">Select two certifications above.</div>';return;}
  function parsePrice(s){var m=(s||'').match(/\$([\d,]+)/);return m?'$'+m[1]:'N/A';}
  function parseExpiry(s){if(!s)return'N/A';if(s.toLowerCase().indexOf('3 yr')>-1||s.toLowerCase().indexOf('3-yr')>-1)return'3 years';if(s.toLowerCase().indexOf('2 yr')>-1)return'2 years';if(s.toLowerCase().indexOf('5 yr')>-1)return'5 years';if(s.toLowerCase().indexOf('no exp')>-1||s.toLowerCase().indexOf('does not exp')>-1)return'Does not expire';return'See issuer';}
  function getDomains(c){return (c.domains||[]).join(', ')||'—';}
  function getTags(c){return (c.tags||[]).slice(0,4).join(', ')||'—';}
  var rows=[
    {label:'Tier / Level',a:ca.tier||'—',b:cb.tier||'—'},
    {label:'Issuing Body',a:(ca.issuer||'—').split('·')[0].trim(),b:(cb.issuer||'—').split('·')[0].trim()},
    {label:'Exam Cost',a:parsePrice(ca.issuer),b:parsePrice(cb.issuer)},
    {label:'Security Domains',a:getDomains(ca),b:getDomains(cb)},
    {label:'Key Tags / Focus',a:getTags(ca),b:getTags(cb)},
    {label:'Validity',a:parseExpiry(ca.issuer+' '+(ca.desc||'')),b:parseExpiry(cb.issuer+' '+(cb.desc||''))},
    {label:'Best For',a:(ca.desc||'—').substring(0,90)+'…',b:(cb.desc||'—').substring(0,90)+'…'},
  ];
  var html='<div class="ccm-row ccm-row-hd"><div class="ccm-row-label"></div>'
    +'<div class="ccm-col ccm-col-hd">'+ca.name+'</div><div class="ccm-col ccm-col-hd">'+cb.name+'</div></div>';
  rows.forEach(function(r){
    var diff=r.a!==r.b&&r.a!=='—'&&r.b!=='—'&&r.a!=='N/A'&&r.b!=='N/A';
    html+='<div class="ccm-row'+(diff?' ccm-diff':'')+'"><div class="ccm-row-label">'+r.label+'</div>'
      +'<div class="ccm-col">'+r.a+'</div><div class="ccm-col">'+r.b+'</div></div>';
  });
  // Learning resources
  var aLinks=(ca.links||[]).slice(0,2).map(function(l){return '<a href="'+l.l+'" target="_blank" class="ccm-link">'+l.tx.replace(/^[^ ]+ /,'')+'</a>';}).join(' ');
  var bLinks=(cb.links||[]).slice(0,2).map(function(l){return '<a href="'+l.l+'" target="_blank" class="ccm-link">'+l.tx.replace(/^[^ ]+ /,'')+'</a>';}).join(' ');
  html+='<div class="ccm-row"><div class="ccm-row-label">Study Resources</div><div class="ccm-col">'+aLinks+'</div><div class="ccm-col">'+bLinks+'</div></div>';
  t.innerHTML=html;
}

// ─── CALENDAR: FILTER PAST EVENTS + 2026 EVENTS ──────────
// Replace EVENTS with updated 2026 data
var EVENTS=[
  // Ongoing / recurring webinars (always show)
  {name:'CTFtime — All Competitions',type:'ctf',date:'2026-03-10',url:'https://ctftime.org',cost:'free',virtual:true,desc:'Aggregator for all ongoing and upcoming CTF competitions worldwide. Check here for the full live schedule.',diff:'All Levels'},
  {name:'SANS Webcasts (Ongoing)',type:'webinar',date:'2026-03-15',url:'https://www.sans.org/webcasts/',cost:'free',virtual:true,desc:'Regular free webcasts from SANS instructors covering current threats, tools, and techniques.',diff:null},
  {name:'ISC2 CPE Webinars (Ongoing)',type:'webinar',date:'2026-03-15',url:'https://www.isc2.org/professional-development/webinars',cost:'free',virtual:true,desc:'Free CPE-eligible webinars for ISC2 members covering all CISSP and associate domains.',diff:null},
  {name:'CISA Events (Ongoing)',type:'webinar',date:'2026-03-20',url:'https://www.cisa.gov/events',cost:'free',virtual:true,desc:'Free government webinars on threat advisories, critical infrastructure security, and IR.',diff:null},
  // 2026 events
  {name:'picoCTF 2026',type:'ctf',date:'2026-03-21',url:'https://picoctf.org',cost:'free',virtual:true,desc:'Beginner-friendly CTF from Carnegie Mellon University. Perfect for newcomers learning the fundamentals.',diff:'Beginner'},
  {name:'BSides Austin 2026',type:'conference',date:'2026-04-03',url:'https://bsidesaustin.com',cost:'free',virtual:false,desc:'Community-run security conference in Austin with talks, workshops, and CTF challenges.',diff:null},
  {name:'BSides San Francisco 2026',type:'conference',date:'2026-04-25',url:'https://bsidessf.org',cost:'free',virtual:false,desc:'Long-running BSides event with diverse security research presentations and community networking.',diff:null},
  {name:'RSA Conference 2026',type:'conference',date:'2026-04-27',url:'https://www.rsaconference.com',cost:'paid',virtual:false,desc:'World\'s largest cybersecurity conference — 500+ sessions, keynotes, Expo Hall, and networking events. San Francisco.',diff:null},
  {name:'ISACA North America CACS 2026',type:'conference',date:'2026-05-03',url:'https://www.isaca.org',cost:'paid',virtual:false,desc:'ISACA flagship North America conference covering GRC, audit, risk, and governance topics.',diff:null},
  {name:'NahamCon 2026',type:'conference',date:'2026-06-05',url:'https://www.nahamcon.com',cost:'free',virtual:true,desc:'Free online hacking conference with CTF competition, workshops, and industry speakers.',diff:null},
  {name:'NahamCon CTF 2026',type:'ctf',date:'2026-06-05',url:'https://ctf.nahamcon.com',cost:'free',virtual:true,desc:'Beginner to intermediate CTF running alongside NahamCon. Great for building practical skills.',diff:'Beginner'},
  {name:'Google CTF 2026',type:'ctf',date:'2026-07-11',url:'https://capturetheflag.withgoogle.com',cost:'free',virtual:true,desc:'Google\'s annual CTF with high-quality challenges across web, crypto, pwn, and reversing.',diff:'Advanced'},
  {name:'Black Hat USA 2026',type:'conference',date:'2026-08-01',url:'https://www.blackhat.com',cost:'paid',virtual:false,desc:'Premier technical security conference with in-depth trainings, briefings, and Arsenal tool demos. Las Vegas.',diff:null},
  {name:'BSides Las Vegas 2026',type:'conference',date:'2026-08-04',url:'https://bsideslv.org',cost:'free',virtual:false,desc:'Community-driven conference running alongside DEF CON. Two days of talks and networking.',diff:null},
  {name:'DEF CON 34',type:'conference',date:'2026-08-06',url:'https://defcon.org',cost:'paid',virtual:false,desc:'The world\'s largest hacker convention — villages, CTF, talks, and everything in between. Las Vegas.',diff:null},
  {name:'DEF CON CTF 2026',type:'ctf',date:'2026-08-06',url:'https://defcon.org',cost:'free',virtual:false,desc:'The most prestigious CTF in the world. Attack/Defense format for elite teams. Finals at DEF CON.',diff:'Expert'},
  {name:'BlueTeamCon 2026',type:'conference',date:'2026-08-28',url:'https://blueteamcon.com',cost:'paid',virtual:false,desc:'Defensive security-focused conference in Chicago covering blue team tools, tactics, and careers.',diff:null},
  {name:'GrrCON 2026',type:'conference',date:'2026-10-08',url:'https://grrcon.com',cost:'paid',virtual:false,desc:'Midwest information security and hacking event held annually in Grand Rapids, MI.',diff:null},
  {name:'ISC2 Security Congress 2026',type:'conference',date:'2026-10-12',url:'https://www.isc2.org',cost:'paid',virtual:false,desc:'ISC2\'s annual congress covering CISSP domains, member networking, and CPE opportunities.',diff:null},
  {name:'ToorCon San Diego 2026',type:'conference',date:'2026-10-16',url:'https://toorcon.net',cost:'paid',virtual:false,desc:'San Diego\'s premier hacker conference with technical talks, workshops, and CTF challenges.',diff:null},
  {name:'SecTor 2026',type:'conference',date:'2026-10-20',url:'https://www.sector.ca',cost:'paid',virtual:false,desc:'Canada\'s premier cybersecurity conference in Toronto with technical and strategic security tracks.',diff:null},
  {name:'Wild West Hackin\' Fest 2026',type:'conference',date:'2026-10-21',url:'https://wildwesthackinfest.com',cost:'paid',virtual:true,desc:'Community security conference with in-person (Deadwood, SD) and virtual attendance options.',diff:null},
  {name:'HackTheBox University CTF 2026',type:'ctf',date:'2026-11-13',url:'https://ctf.hackthebox.com',cost:'free',virtual:true,desc:'Annual HTB CTF open to all skill levels with team format covering all security domains.',diff:'Intermediate'},
  {name:'SANS Holiday Hack / KringleCon 2026',type:'ctf',date:'2026-12-01',url:'https://www.sans.org/mlp/holiday-hack-challenge/',cost:'free',virtual:true,desc:'Annual SANS holiday CTF with a fun narrative storyline. Great for all skill levels.',diff:'Beginner'},
  {name:'SANS Cyber Defense Forum 2026',type:'conference',date:'2026-12-07',url:'https://www.sans.org',cost:'paid',virtual:true,desc:'SANS annual virtual summit covering defensive security techniques, threat hunting, and detection.',diff:null},
];
// Patch renderCalendar to filter past events and only show ≤1 year out
function renderCalendar(typeFilter,freeOnly){
  var list=document.getElementById('cal-list');
  if(!list)return;
  var now=new Date();
  var oneYearOut=new Date(now.getTime()+365*24*3600*1000);
  var filtered=EVENTS.filter(function(e){
    var d=new Date(e.date+'T12:00:00');
    if(d<now)return false; // hide past events
    if(d>oneYearOut)return false; // hide >1 year out
    var matchType=(typeFilter==='all'||e.type===typeFilter);
    var matchFree=!freeOnly||(e.cost==='free');
    return matchType&&matchFree;
  }).sort(function(a,b){return new Date(a.date)-new Date(b.date);});
  if(!filtered.length){list.innerHTML='<div class="cal-empty">No upcoming events match your filters.</div>';return;}
  var groups={};
  filtered.forEach(function(e){
    var d=new Date(e.date+'T12:00:00');
    var key=d.getFullYear()+'-'+(d.getMonth()+1);
    var label=d.toLocaleDateString('en-US',{month:'long',year:'numeric'});
    if(!groups[key])groups[key]={label:label,events:[]};
    groups[key].events.push(e);
  });
  var typeColors={conference:'#4d9eff',ctf:'#f05d78',webinar:'#10e87e',training:'#f5c842'};
  var html='';
  Object.keys(groups).sort().forEach(function(k){
    var g=groups[k];
    html+='<div class="cal-month-group"><div class="cal-month-label">'+g.label+'</div>';
    g.events.forEach(function(e){
      var d=new Date(e.date+'T12:00:00');
      var day=d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
      html+='<div class="cal-event">'
        +'<div class="ce-date">'+day+'</div>'
        +'<div class="ce-body">'
        +'<div class="ce-title-row"><span class="ce-title">'+e.name+'</span>'
        +'<span class="ce-type-badge" style="background:'+typeColors[e.type]+'22;color:'+typeColors[e.type]+'">'+e.type+'</span>'
        +(e.cost==='free'?'<span class="ce-free-tag">FREE</span>':'')
        +(e.virtual?'<span class="ce-virtual-tag">VIRTUAL</span>':'')
        +'</div>'
        +'<div class="ce-desc">'+e.desc+'</div>'
        +(e.diff?'<div class="ce-diff">Difficulty: <strong>'+e.diff+'</strong></div>':'')
        +'</div>'
        +'<a class="ce-link" href="'+e.url+'" target="_blank" rel="noopener">Visit &rarr;</a>'
        +'</div>';
    });
    html+='</div>';
  });
  list.innerHTML=html;
}

// ─── TOOL URLS (add url field to existing TOOLS) ─────────
(function(){
var TOOL_URLS={
  'Splunk Enterprise':'https://www.splunk.com/en_us/products/splunk-enterprise.html',
  'Microsoft Sentinel':'https://azure.microsoft.com/en-us/products/microsoft-sentinel',
  'IBM QRadar':'https://www.ibm.com/products/qradar-siem',
  'Elastic SIEM':'https://www.elastic.co/security/siem',
  'LogRhythm SIEM':'https://logrhythm.com/',
  'Exabeam':'https://www.exabeam.com/',
  'Chronicle SIEM':'https://cloud.google.com/chronicle',
  'CrowdStrike Falcon':'https://www.crowdstrike.com/products/endpoint-security/falcon-platform/',
  'SentinelOne':'https://www.sentinelone.com/',
  'Carbon Black':'https://www.vmware.com/products/carbon-black-cloud-endpoint.html',
  'Microsoft Defender for Endpoint':'https://www.microsoft.com/en-us/security/business/endpoint-security/microsoft-defender-endpoint',
  'Cortex XDR':'https://www.paloaltonetworks.com/cortex/cortex-xdr',
  'Tenable Nessus':'https://www.tenable.com/products/nessus',
  'Qualys VMDR':'https://www.qualys.com/apps/vulnerability-management-detection-response/',
  'OpenVAS / Greenbone':'https://www.greenbone.net/en/vulnerability-management/',
  'Rapid7 InsightVM':'https://www.rapid7.com/products/insightvm/',
  'Trivy':'https://trivy.dev/',
  'Nikto':'https://cirt.net/Nikto2',
  'Metasploit Framework':'https://www.metasploit.com/',
  'Burp Suite':'https://portswigger.net/burp',
  'Nmap':'https://nmap.org/',
  'BloodHound':'https://bloodhoundad.com/',
  'Cobalt Strike':'https://www.cobaltstrike.com/',
  'Impacket':'https://github.com/fortra/impacket',
  'Hashcat':'https://hashcat.net/hashcat/',
  'ffuf':'https://github.com/ffuf/ffuf',
  'Autopsy':'https://www.autopsy.com/',
  'Volatility':'https://volatilityfoundation.org/',
  'FTK Imager':'https://www.exterro.com/ftk-product-suite/ftk-imager',
  'Cellebrite UFED':'https://cellebrite.com/en/ufed/',
  'x64dbg':'https://x64dbg.com/',
  'MISP':'https://www.misp-project.org/',
  'OpenCTI':'https://www.filigran.io/opencti/',
  'VirusTotal':'https://www.virustotal.com/',
  'Shodan':'https://www.shodan.io/',
  'AlienVault OTX':'https://otx.alienvault.com/',
  'Wiz':'https://www.wiz.io/',
  'Prisma Cloud':'https://www.paloaltonetworks.com/prisma/cloud',
  'AWS Security Hub':'https://aws.amazon.com/security-hub/',
  'Prowler':'https://github.com/prowler-cloud/prowler',
  'REMnux':'https://remnux.org/',
  'Radare2':'https://rada.re/n/'
};
if(typeof TOOLS!=='undefined'){
  TOOLS.forEach(function(t){if(!t.url&&TOOL_URLS[t.name])t.url=TOOL_URLS[t.name];});
}
})();

// Patch renderTools to make cards clickable
function renderTools(q,cat){
  var grid=document.getElementById('tools-grid');
  if(!grid)return;
  q=(q||'').toLowerCase();cat=cat||'All';
  var filtered=TOOLS.filter(function(t){
    var matchCat=(cat==='All'||t.cat===cat);
    var matchQ=!q||(t.name.toLowerCase().indexOf(q)>-1)||(t.desc.toLowerCase().indexOf(q)>-1)||(t.vendor.toLowerCase().indexOf(q)>-1)||((t.tags||[]).some(function(tg){return tg.indexOf(q)>-1;}));
    return matchCat&&matchQ;
  });
  var tierColors={paid:'#f05d78',freemium:'#f5c842',free:'#10e87e','open-source':'#4d9eff'};
  grid.innerHTML=filtered.length?filtered.map(function(t){
    var clickHandler=t.url?'onclick="window.open(\''+t.url+'\',\'_blank\')"':'' ;
    var linkInd=t.url?'<span class="tc-ext-link">↗</span>':'';
    return '<div class="tool-card tool-card-link" '+clickHandler+' '+(t.url?'title="Visit '+t.name+' website"':'')+' style="'+(t.url?'cursor:pointer;':'')+'">'
      +'<div class="tc-head"><span class="tc-name">'+t.name+linkInd+'</span><span class="tc-tier-badge" style="background:'+tierColors[t.tier]+'22;color:'+tierColors[t.tier]+'">'+t.tier+'</span></div>'
      +'<div class="tc-vendor">'+t.vendor+' &middot; <span class="tc-cat-tag">'+t.cat+'</span></div>'
      +'<div class="tc-desc">'+t.desc+'</div>'
      +'<div class="tc-tags">'+(t.tags||[]).slice(0,4).map(function(tg){return '<span class="tc-tag">'+tg+'</span>';}).join('')+'</div>'
      +'</div>';
  }).join(''):'<div class="tools-no-results">No tools match your search.</div>';
  var cnt=document.getElementById('tools-count');
  if(cnt)cnt.textContent=filtered.length+' tool'+(filtered.length!==1?'s':'');
}

// ─── RESUME TEMPLATE FIX (generate text template) ────────
function openResumeTemplate(id){
  var t=RESUME_TEMPLATES.find(function(x){return x.id===id;});
  if(!t)return;
  var panel=document.getElementById('resume-detail');
  if(!panel)return;
  var templateText=generateResumeText(t);
  panel.innerHTML='<button class="rd-close" onclick="var d=document.getElementById(\'resume-detail\');var g=document.getElementById(\'resume-grid\');if(d)d.style.display=\'none\';if(g)g.style.display=\'\';">&larr; Back to Templates</button>'
    +'<div class="rd-header" style="border-color:'+t.color+'">'
    +'<span class="rd-icon">'+t.icon+'</span>'
    +'<div><div class="rd-role" style="color:'+t.color+'">'+t.role+'</div><div class="rd-level">'+t.level+'</div></div>'
    +'</div>'
    +'<h3 class="rd-tips-hd">Resume Tips for '+t.role+'</h3>'
    +'<ul class="rd-tips-list">'+t.tips.map(function(tip){return '<li>'+tip+'</li>';}).join('')+'</ul>'
    +'<h3 class="rd-tips-hd" style="margin-top:32px;">Resume Template</h3>'
    +'<p style="font-size:.82rem;color:var(--mt);margin-bottom:12px;">Copy the template below, paste into Google Docs or Word, then customize with your details.</p>'
    +'<div class="rd-template-box">'
    +'<button class="rd-copy-btn" onclick="copyResumeTemplate(\''+id+'\')">📋 Copy Template</button>'
    +'<pre id="rt-text-'+id+'" class="rd-template-text">'+templateText+'</pre>'
    +'</div>'
    +'<a href="https://docs.google.com/document/create" target="_blank" class="rd-template-btn" style="margin-top:16px;display:inline-block;">Open Blank Google Doc ↗</a>';
  panel.style.display='block';
  document.getElementById('resume-grid').style.display='none';
}
function copyResumeTemplate(id){
  var el=document.getElementById('rt-text-'+id);
  if(!el)return;
  try{navigator.clipboard.writeText(el.textContent).then(function(){showToast('Template copied! Paste into Google Docs or Word.');});}
  catch(e){el.select&&el.select();showToast('Select all text in the box and copy manually.');}
}
function generateResumeText(t){
  var templates={
    soc:'[YOUR NAME]\n[City, State | Phone | Email | LinkedIn | GitHub]\n\nSUMMARY\nDetail-oriented Security Operations professional with hands-on experience in threat detection, SIEM analysis, and incident triage. Proficient in Splunk, Microsoft Sentinel, and threat intelligence platforms.\n\nTECHNICAL SKILLS\n• SIEM Platforms: Splunk, Microsoft Sentinel, IBM QRadar\n• Tools: Wireshark, VirusTotal, MISP, CrowdStrike Falcon\n• Languages: Python (basic scripting), KQL, SPL\n• Frameworks: MITRE ATT&CK, NIST CSF\n\nEXPERIENCE\n[Job Title] | [Company Name] | [City, ST] | [Month Year – Present]\n• Triaged [X]+ security alerts daily using [SIEM Platform]\n• Investigated [X] phishing incidents, reducing MTTD by [X]%\n• [Quantified achievement with tool/metric]\n\nCERTIFICATIONS\n• CompTIA Security+ (SY0-701)\n• [CompTIA CySA+ | Splunk Core Certified | BTL1]\n\nEDUCATION\n[Degree, if applicable] — [Institution] — [Year]',
    pentest:'[YOUR NAME]\n[City, State | Phone | Email | LinkedIn | HackTheBox Profile]\n\nSUMMARY\nResults-driven penetration tester with expertise in network, web application, and Active Directory security assessments. OSCP certified. Strong report writing and clear risk communication skills.\n\nTECHNICAL SKILLS\n• Pentest Tools: Metasploit, Burp Suite, Nmap, BloodHound, Impacket, Cobalt Strike\n• Web: OWASP Top 10, SQLi, XSS, SSRF, XXE, IDOR\n• AD Attacks: Kerberoasting, Pass-the-Hash, DCSync, LDAP enumeration\n• Languages: Python, Bash, PowerShell\n\nEXPERIENCE\n[Penetration Tester | Company] | [Month Year – Present]\n• Conducted [X] external/internal pentests per quarter for clients across [industries]\n• Discovered and responsibly disclosed [X] critical vulnerabilities\n• Wrote executive and technical reports for C-suite and engineering audiences\n\nBUG BOUNTY & CTF\n• HackTheBox: [Rank / Points] | TryHackMe: Top [X]%\n• Responsible disclosures: [CVE-XXXX-XXXXX if applicable]\n\nCERTIFICATIONS\n• OSCP (Offensive Security Certified Professional)\n• [PNPT | eJPT | CEH | GPEN]',
    'cloud-sec':'[YOUR NAME]\n[City, State | Phone | Email | LinkedIn | AWS/Azure Badge URL]\n\nSUMMARY\nCloud Security Engineer with [X] years securing AWS/Azure/GCP environments at scale. Expertise in CSPM, IaC security, container security, and cloud-native incident response.\n\nTECHNICAL SKILLS\n• Platforms: AWS, Microsoft Azure, Google Cloud Platform\n• CSPM/CNAPP: Wiz, Prisma Cloud, AWS Security Hub, Prowler\n• IaC: Terraform, CloudFormation, Pulumi\n• Containers: Docker, Kubernetes, EKS, AKS\n• Languages: Python, Go, Bash\n\nEXPERIENCE\n[Cloud Security Engineer | Company] | [Month Year – Present]\n• Secured [X]+ cloud accounts across AWS/Azure using CSPM tooling\n• Reduced critical cloud security findings by [X]% through automated remediation\n• Built IaC security scanning pipeline using Trivy + OPA/Rego in CI/CD\n\nCERTIFICATIONS\n• AWS Security Specialty (SCS-C02)\n• [AZ-500 | CCSP | GCSA | GCP Professional Security Engineer]'
  };
  if(templates[t.id])return templates[t.id];
  return '[YOUR NAME]\n[City, State | Phone | Email | LinkedIn]\n\nSUMMARY\n['+t.role+'] with expertise in [key skills]. Focused on [core responsibility].\n\nTECHNICAL SKILLS\n• [Skill category 1]: [Tool 1], [Tool 2], [Tool 3]\n• [Skill category 2]: [Tool 4], [Tool 5]\n• Frameworks: [Framework 1], [Framework 2]\n\nEXPERIENCE\n['+t.role+'] | [Company Name] | [City, ST] | [Dates]\n• [Quantified achievement 1]\n• [Quantified achievement 2]\n• [Quantified achievement 3]\n\nCERTIFICATIONS\n• '+t.tips[t.tips.length-1]+'\n\nEDUCATION\n[Degree] — [Institution] — [Year]';
}

