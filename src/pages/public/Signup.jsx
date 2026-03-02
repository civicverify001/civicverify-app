import CanonicalUrl from '../../components/CanonicalUrl'

// Inside return(), first line:
<CanonicalUrl />
// src/pages/public/Signup.jsx — Full demographics + hCaptcha + 3-step signup
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

var HCAPTCHA_SITEKEY = 'a5ce465a-2468-4390-a696-c932b792aff6';
var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#22863A' };
var font = 'Libre Baskerville, Georgia, serif';

var US_STATES = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];
var RACE_OPTIONS = ['White','Black or African American','Hispanic or Latino','Asian','American Indian or Alaska Native','Native Hawaiian or Pacific Islander','Two or More Races','Other','Prefer not to say'];
var SEX_OPTIONS = ['Male','Female','Non-binary','Prefer not to say'];
var EDUCATION_OPTIONS = ['Less than High School','High School Diploma / GED','Some College','Associate Degree','Bachelor Degree','Master Degree','Doctoral / Professional Degree'];
var EMPLOYMENT_OPTIONS = ['Employed Full-Time','Employed Part-Time','Self-Employed','Unemployed','Retired','Student','Homemaker','Unable to Work'];
var INCOME_OPTIONS = ['Under $25,000','$25,000 - $49,999','$50,000 - $74,999','$75,000 - $99,999','$100,000 - $149,999','$150,000+','Prefer not to say'];
var MARITAL_OPTIONS = ['Single','Married','Divorced','Widowed','Separated','Domestic Partnership'];
var PARTY_OPTIONS = ['Democrat','Republican','Independent','Libertarian','Green Party','Other','Prefer not to say'];
var HOUSING_OPTIONS = ['Homeowner','Renter','Other'];

var STATE_COUNTIES = {"Alabama":["Jefferson","Mobile","Madison","Montgomery","Shelby","Baldwin","Tuscaloosa","Lee","Morgan","Calhoun"],"Alaska":["Anchorage","Fairbanks North Star","Matanuska-Susitna","Kenai Peninsula","Juneau"],"Arizona":["Maricopa","Pima","Pinal","Yavapai","Mohave","Yuma","Coconino","Cochise"],"Arkansas":["Pulaski","Benton","Washington","Sebastian","Faulkner","Saline","Craighead","Garland"],"California":["Los Angeles","San Diego","Orange","Riverside","San Bernardino","Santa Clara","Alameda","Sacramento","Contra Costa","Fresno","San Francisco","Ventura","San Mateo","Kern","San Joaquin"],"Colorado":["Denver","El Paso","Arapahoe","Jefferson","Adams","Douglas","Larimer","Boulder","Weld","Pueblo"],"Connecticut":["Fairfield","Hartford","New Haven","New London","Litchfield","Middlesex","Tolland","Windham"],"Delaware":["New Castle","Sussex","Kent"],"Florida":["Miami-Dade","Broward","Palm Beach","Hillsborough","Orange","Pinellas","Duval","Lee","Polk","Brevard","Volusia","Seminole","Sarasota"],"Georgia":["Fulton","Gwinnett","Cobb","DeKalb","Chatham","Richmond","Clayton","Cherokee","Henry","Forsyth"],"Hawaii":["Honolulu","Hawaii","Maui","Kauai"],"Idaho":["Ada","Canyon","Kootenai","Bonneville","Twin Falls","Bannock"],"Illinois":["Cook","DuPage","Lake","Will","Kane","McHenry","Winnebago","Madison","St. Clair","Champaign","Sangamon","Peoria"],"Indiana":["Marion","Lake","Allen","Hamilton","St. Joseph","Elkhart","Tippecanoe","Vanderburgh","Johnson","Hendricks","Porter","Monroe"],"Iowa":["Polk","Linn","Scott","Johnson","Black Hawk","Woodbury","Dubuque","Story","Dallas","Pottawattamie"],"Kansas":["Johnson","Sedgwick","Shawnee","Douglas","Wyandotte","Leavenworth","Riley","Butler"],"Kentucky":["Jefferson","Fayette","Kenton","Boone","Warren","Hardin","Daviess","Campbell","Bullitt","Madison"],"Louisiana":["East Baton Rouge","Jefferson","Orleans","St. Tammany","Caddo","Calcasieu","Ouachita","Rapides","Lafayette","Livingston"],"Maine":["Cumberland","York","Penobscot","Kennebec","Androscoggin","Aroostook"],"Maryland":["Montgomery","Prince George's","Baltimore County","Anne Arundel","Howard","Baltimore City","Frederick","Harford","Carroll","Charles"],"Massachusetts":["Middlesex","Worcester","Suffolk","Essex","Norfolk","Bristol","Plymouth","Hampden","Barnstable","Hampshire"],"Michigan":["Wayne","Oakland","Macomb","Kent","Genesee","Washtenaw","Ingham","Ottawa","Kalamazoo","Saginaw"],"Minnesota":["Hennepin","Ramsey","Dakota","Anoka","Washington","St. Louis","Stearns","Olmsted","Scott","Wright"],"Mississippi":["Hinds","Harrison","DeSoto","Rankin","Jackson","Madison","Lee","Forrest","Lauderdale","Lowndes"],"Missouri":["St. Louis County","Jackson","St. Charles","St. Louis City","Greene","Clay","Jefferson","Boone","Jasper","Franklin"],"Montana":["Yellowstone","Missoula","Gallatin","Flathead","Cascade","Lewis and Clark"],"Nebraska":["Douglas","Lancaster","Sarpy","Hall","Buffalo","Scotts Bluff","Lincoln","Dodge"],"Nevada":["Clark","Washoe","Carson City","Douglas","Elko","Lyon"],"New Hampshire":["Hillsborough","Rockingham","Merrimack","Strafford","Grafton","Cheshire"],"New Jersey":["Bergen","Middlesex","Essex","Hudson","Monmouth","Ocean","Union","Passaic","Camden","Morris","Burlington","Mercer"],"New Mexico":["Bernalillo","Dona Ana","Santa Fe","Sandoval","San Juan","Valencia","Lea","Chaves"],"New York":["Kings","Queens","New York","Suffolk","Bronx","Nassau","Westchester","Erie","Monroe","Richmond","Albany","Onondaga"],"North Carolina":["Mecklenburg","Wake","Guilford","Forsyth","Cumberland","Durham","Buncombe","Gaston","Union","Cabarrus","New Hanover"],"North Dakota":["Cass","Burleigh","Grand Forks","Ward","Williams","Stark"],"Ohio":["Franklin","Cuyahoga","Hamilton","Summit","Montgomery","Lucas","Butler","Stark","Warren","Lorain","Lake","Mahoning"],"Oklahoma":["Oklahoma","Tulsa","Cleveland","Comanche","Canadian","Rogers","Payne","Creek"],"Oregon":["Multnomah","Washington","Clackamas","Lane","Marion","Jackson","Deschutes","Linn"],"Pennsylvania":["Philadelphia","Allegheny","Montgomery","Bucks","Delaware","Lancaster","Chester","York","Berks","Lehigh","Luzerne","Northampton"],"Rhode Island":["Providence","Kent","Washington","Newport","Bristol"],"South Carolina":["Greenville","Richland","Charleston","Horry","Spartanburg","Lexington","York","Berkeley","Anderson","Beaufort"],"South Dakota":["Minnehaha","Pennington","Lincoln","Brown","Brookings","Codington"],"Tennessee":["Shelby","Davidson","Knox","Hamilton","Rutherford","Williamson","Sumner","Montgomery","Wilson","Blount"],"Texas":["Harris","Dallas","Tarrant","Bexar","Travis","Collin","Hidalgo","El Paso","Denton","Fort Bend","Montgomery","Williamson","Cameron","Nueces"],"Utah":["Salt Lake","Utah","Davis","Weber","Washington","Cache","Tooele","Iron"],"Vermont":["Chittenden","Rutland","Washington","Windsor","Windham","Addison"],"Virginia":["Fairfax","Prince William","Loudoun","Virginia Beach","Chesterfield","Henrico","Arlington","Stafford","Spotsylvania","Richmond City","Norfolk","Chesapeake"],"Washington":["King","Pierce","Snohomish","Spokane","Clark","Thurston","Kitsap","Yakima","Whatcom","Benton"],"West Virginia":["Kanawha","Berkeley","Cabell","Raleigh","Putnam","Wood","Monongalia","Harrison"],"Wisconsin":["Milwaukee","Dane","Waukesha","Brown","Racine","Outagamie","Winnebago","Kenosha","Rock","Marathon","Washington"],"Wyoming":["Laramie","Natrona","Campbell","Sweetwater","Fremont","Albany"]};

var inputStyle = { width: '100%', padding: '12px 16px', fontSize: 14, border: '1px solid rgba(11,37,69,0.1)', borderRadius: 10, outline: 'none', color: '#0B2545', background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' };
var selectStyle = Object.assign({}, inputStyle, { appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath d=\'M2 4l4 4 4-4\' fill=\'none\' stroke=\'%230B2545\' stroke-width=\'1.5\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', paddingRight: 40 });
var labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(11,37,69,0.35)', marginBottom: 6 };

export default function Signup() {
  var navigate = useNavigate();
  var [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '', phone: '', role: 'citizen',
    state: '', county: '', city: '', zip: '',
    race: '', sex: '', dob: '', education: '', employment: '', income: '', marital_status: '', party: '', voter_registered: false, veteran: false, housing: '',
    agreeTerms: false
  });
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState('');
  var [step, setStep] = useState(1);
  var [captchaToken, setCaptchaToken] = useState('');
  var captchaRef = useRef(null);

  useEffect(function() {
    if (document.getElementById('hcaptcha-script')) return;
    var s = document.createElement('script'); s.id = 'hcaptcha-script'; s.src = 'https://js.hcaptcha.com/1/api.js?render=explicit'; s.async = true; document.head.appendChild(s);
  }, []);

  useEffect(function() {
    if (step !== 3 || !captchaRef.current) return;
    var interval = setInterval(function() {
      if (window.hcaptcha && captchaRef.current && !captchaRef.current.dataset.rendered) {
        captchaRef.current.dataset.rendered = 'true';
        window.hcaptcha.render(captchaRef.current, { sitekey: HCAPTCHA_SITEKEY, callback: function(t){setCaptchaToken(t)}, 'expired-callback': function(){setCaptchaToken('')} });
        clearInterval(interval);
      }
    }, 200);
    return function() { clearInterval(interval); };
  }, [step]);

  function update(field, value) {
    setForm(function(prev) { var n = Object.assign({}, prev, { [field]: value }); if (field === 'state') { n.county = ''; n.city = ''; } return n; });
    setError('');
  }
  function formatPhone(val) { var d = (val||'').replace(/\D/g, '').slice(0,10); if(d.length>=7) return '('+d.slice(0,3)+') '+d.slice(3,6)+'-'+d.slice(6); if(d.length>=4) return '('+d.slice(0,3)+') '+d.slice(3); if(d.length>0) return '('+d; return ''; }
  function calcAge(dob) { if(!dob) return ''; return Math.floor((Date.now()-new Date(dob).getTime())/31557600000); }
  var counties = form.state && STATE_COUNTIES[form.state] ? STATE_COUNTIES[form.state] : [];
  function Sel(p){ return <select value={p.value} onChange={function(e){update(p.field,e.target.value)}} style={selectStyle}><option value="">{p.ph||'Select...'}</option>{p.opts.map(function(o){return <option key={o} value={o}>{o}</option>})}</select>; }

  async function handleStep1() {
    if (!form.fullName.trim()) return setError('Full name is required');
    if (!form.email.trim()||!/\S+@\S+\.\S+/.test(form.email)) return setError('Enter a valid email');
    if (!form.phone||form.phone.replace(/\D/g,'').length<10) return setError('Enter a valid 10-digit phone');
    if (form.password.length<8) return setError('Password must be 8+ characters');
    if (form.password!==form.confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    var ph = form.phone.replace(/\D/g,'');
    var r1 = await supabase.from('users').select('id').eq('phone',ph).limit(1);
    if (r1.data&&r1.data.length>0) { setLoading(false); return setError('Phone already registered.'); }
    var r2 = await supabase.from('users').select('id').eq('email',form.email.toLowerCase().trim()).limit(1);
    if (r2.data&&r2.data.length>0) { setLoading(false); return setError('Email already registered.'); }
    setLoading(false); setStep(2);
  }
  function handleStep2() {
    if (!form.state) return setError('State is required');
    if (!form.city.trim()) return setError('City is required');
    if (!form.zip.trim()||form.zip.replace(/\D/g,'').length<5) return setError('Enter a valid ZIP');
    setStep(3);
  }
  async function handleSignup() {
    if (!form.agreeTerms) return setError('You must agree to the terms');
    if (!captchaToken) return setError('Please complete the captcha');
    setLoading(true);
    var res = await supabase.auth.signUp({ email: form.email.trim().toLowerCase(), password: form.password, options: { data: { full_name: form.fullName.trim() }, captchaToken: captchaToken } });
    if (res.error) { setLoading(false); return setError(res.error.message); }
    if (res.data.user) {
      var p = { id: res.data.user.id, email: form.email.trim().toLowerCase(), full_name: form.fullName.trim(), phone: form.phone.replace(/\D/g,''), role: form.role, state: form.state, county: form.county.trim(), city: form.city.trim(), zip: form.zip.replace(/\D/g,'').slice(0,5), race: form.race||null, sex: form.sex||null, date_of_birth: form.dob||null, education: form.education||null, employment: form.employment||null, income: form.income||null, marital_status: form.marital_status||null, party: form.party||null, voter_registered: form.voter_registered, veteran: form.veteran, housing: form.housing||null, is_verified: false, identity_verified: false };
      var r = await supabase.from('users').upsert(p);
      if (r.error) { setLoading(false); return setError('Profile save failed: '+r.error.message); }
    }
    setLoading(false); navigate('/login?registered=true');
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,'+C.cream+' 0%,#fff 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 16px', fontFamily:'DM Sans,-apple-system,sans-serif' }}>
      <div style={{ width:'100%', maxWidth:520 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={function(){navigate('/')}}>
            <div style={{ width:40,height:40,borderRadius:12,background:C.gold,display:'flex',alignItems:'center',justifyContent:'center' }}><span style={{color:'#fff',fontWeight:700,fontSize:16}}>CV</span></div>
            <span style={{ fontSize:20,fontWeight:700,color:C.navy,fontFamily:font }}>CivicVerify</span>
          </div>
        </div>
        <div style={{ background:'#fff',borderRadius:20,padding:'36px 32px',boxShadow:'0 4px 24px rgba(11,37,69,0.06)',border:'1px solid rgba(11,37,69,0.06)' }}>
          <h1 style={{ fontSize:24,fontWeight:700,color:C.navy,margin:'0 0 4px',fontFamily:font }}>Create Your Account</h1>
          <p style={{ fontSize:14,color:'rgba(11,37,69,0.4)',margin:'0 0 8px' }}>{step===1?'Step 1 of 3: Account Info':step===2?'Step 2 of 3: Location':'Step 3 of 3: Demographics'}</p>
          <div style={{ display:'flex',gap:6,marginBottom:24 }}><div style={{flex:1,height:4,borderRadius:2,background:C.gold}}/><div style={{flex:1,height:4,borderRadius:2,background:step>=2?C.gold:'rgba(11,37,69,0.06)'}}/><div style={{flex:1,height:4,borderRadius:2,background:step>=3?C.gold:'rgba(11,37,69,0.06)'}}/></div>
          {error?<div style={{background:C.red+'08',border:'1px solid '+C.red+'20',borderRadius:10,padding:'10px 14px',marginBottom:16}}><p style={{fontSize:13,color:C.red,margin:0}}>{'\u26A0'} {error}</p></div>:null}

          {step===1&&<div>
            <div style={{marginBottom:16}}><label style={labelStyle}>Full Name <span style={{color:C.red}}>*</span></label><input value={form.fullName} onChange={function(e){update('fullName',e.target.value)}} placeholder="Your legal full name" style={inputStyle}/></div>
            <div style={{marginBottom:16}}><label style={labelStyle}>Email <span style={{color:C.red}}>*</span></label><input type="email" value={form.email} onChange={function(e){update('email',e.target.value)}} placeholder="you@example.com" style={inputStyle}/></div>
            <div style={{marginBottom:16}}><label style={labelStyle}>Phone <span style={{color:C.red}}>*</span></label><input value={formatPhone(form.phone)} onChange={function(e){update('phone',e.target.value.replace(/\D/g,'').slice(0,10))}} placeholder="(555) 123-4567" style={inputStyle}/><p style={{fontSize:11,color:'rgba(11,37,69,0.25)',margin:'4px 0 0'}}>One account per phone number</p></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}><div><label style={labelStyle}>Password <span style={{color:C.red}}>*</span></label><input type="password" value={form.password} onChange={function(e){update('password',e.target.value)}} placeholder="Min 8 chars" style={inputStyle}/></div><div><label style={labelStyle}>Confirm <span style={{color:C.red}}>*</span></label><input type="password" value={form.confirmPassword} onChange={function(e){update('confirmPassword',e.target.value)}} placeholder="Re-enter" style={inputStyle}/></div></div>
            <div style={{marginBottom:16}}><label style={labelStyle}>I am signing up as</label><Sel value={form.role} field="role" opts={['citizen','org']} ph="Select role"/></div>
            <button onClick={handleStep1} disabled={loading} style={{width:'100%',padding:14,background:C.gold,color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:600,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Checking...':'Continue \u2192'}</button>
          </div>}

          {step===2&&<div>
            <div style={{background:C.gold+'08',border:'1px solid '+C.gold+'20',borderRadius:10,padding:'12px 14px',marginBottom:20}}><p style={{fontSize:13,color:'rgba(11,37,69,0.5)',margin:0}}>{'\uD83D\uDCCD'} Location helps match you with community-relevant polls.</p></div>
            <div style={{marginBottom:16}}><label style={labelStyle}>State <span style={{color:C.red}}>*</span></label><Sel value={form.state} field="state" opts={US_STATES} ph="Select state"/></div>
            <div style={{marginBottom:16}}><label style={labelStyle}>County</label>{counties.length>0?<Sel value={form.county} field="county" opts={counties} ph="Select county"/>:<input value={form.county} onChange={function(e){update('county',e.target.value)}} placeholder="Enter county" style={inputStyle}/>}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}><div><label style={labelStyle}>City <span style={{color:C.red}}>*</span></label><input value={form.city} onChange={function(e){update('city',e.target.value)}} placeholder="e.g., Indianapolis" style={inputStyle}/></div><div><label style={labelStyle}>ZIP <span style={{color:C.red}}>*</span></label><input value={form.zip} onChange={function(e){update('zip',e.target.value.replace(/\D/g,'').slice(0,5))}} placeholder="46201" maxLength={5} style={inputStyle}/></div></div>
            <div style={{display:'flex',gap:12}}><button onClick={function(){setStep(1);setError('')}} style={{flex:1,padding:14,background:'rgba(11,37,69,0.05)',color:'rgba(11,37,69,0.5)',border:'none',borderRadius:12,fontSize:14,fontWeight:600,cursor:'pointer'}}>{'\u2190'} Back</button><button onClick={handleStep2} style={{flex:2,padding:14,background:C.gold,color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:600,cursor:'pointer'}}>Continue {'\u2192'}</button></div>
          </div>}

          {step===3&&<div>
            <div style={{background:'#0B254506',border:'1px solid rgba(11,37,69,0.06)',borderRadius:10,padding:'12px 14px',marginBottom:20}}><p style={{fontSize:13,color:'rgba(11,37,69,0.5)',margin:0}}>{'\uD83D\uDD12'} Demographics are for polling accuracy only. All responses anonymous.</p></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}><div><label style={labelStyle}>Race / Ethnicity</label><Sel value={form.race} field="race" opts={RACE_OPTIONS}/></div><div><label style={labelStyle}>Sex</label><Sel value={form.sex} field="sex" opts={SEX_OPTIONS}/></div></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}><div><label style={labelStyle}>Date of Birth</label><input type="date" value={form.dob} onChange={function(e){update('dob',e.target.value)}} style={inputStyle}/>{form.dob?<p style={{fontSize:11,color:'rgba(11,37,69,0.25)',margin:'4px 0 0'}}>Age: {calcAge(form.dob)}</p>:null}</div><div><label style={labelStyle}>Education</label><Sel value={form.education} field="education" opts={EDUCATION_OPTIONS}/></div></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}><div><label style={labelStyle}>Employment</label><Sel value={form.employment} field="employment" opts={EMPLOYMENT_OPTIONS}/></div><div><label style={labelStyle}>Income</label><Sel value={form.income} field="income" opts={INCOME_OPTIONS}/></div></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}><div><label style={labelStyle}>Marital Status</label><Sel value={form.marital_status} field="marital_status" opts={MARITAL_OPTIONS}/></div><div><label style={labelStyle}>Party</label><Sel value={form.party} field="party" opts={PARTY_OPTIONS}/></div></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}><div><label style={labelStyle}>Housing</label><Sel value={form.housing} field="housing" opts={HOUSING_OPTIONS}/></div><div style={{display:'flex',flexDirection:'column',gap:10,paddingTop:20}}><label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,color:'rgba(11,37,69,0.5)'}}><input type="checkbox" checked={form.voter_registered} onChange={function(e){update('voter_registered',e.target.checked)}} style={{accentColor:C.gold,width:16,height:16}}/> Registered Voter</label><label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,color:'rgba(11,37,69,0.5)'}}><input type="checkbox" checked={form.veteran} onChange={function(e){update('veteran',e.target.checked)}} style={{accentColor:C.gold,width:16,height:16}}/> Veteran</label></div></div>

            <div style={{display:'flex',justifyContent:'center',marginBottom:16}}><div ref={captchaRef}></div></div>

            <label style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer',marginBottom:16}}><input type="checkbox" checked={form.agreeTerms} onChange={function(e){update('agreeTerms',e.target.checked)}} style={{marginTop:3,width:18,height:18,accentColor:C.gold}}/><span style={{fontSize:13,color:'rgba(11,37,69,0.45)',lineHeight:1.5}}>I agree to the <span style={{color:C.gold,fontWeight:600}}>Terms</span> and <span style={{color:C.gold,fontWeight:600}}>Privacy Policy</span>. This is my only account.</span></label>
            <div style={{display:'flex',gap:12}}><button onClick={function(){setStep(2);setError('')}} style={{flex:1,padding:14,background:'rgba(11,37,69,0.05)',color:'rgba(11,37,69,0.5)',border:'none',borderRadius:12,fontSize:14,fontWeight:600,cursor:'pointer'}}>{'\u2190'} Back</button><button onClick={handleSignup} disabled={loading} style={{flex:2,padding:14,background:C.gold,color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:600,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Creating...':'Create Account'}</button></div>
          </div>}

          <p style={{textAlign:'center',fontSize:13,color:'rgba(11,37,69,0.35)',marginTop:20}}>Already have an account? <span onClick={function(){navigate('/login')}} style={{color:C.gold,fontWeight:600,cursor:'pointer'}}>Sign In</span></p>
        </div>
        <p style={{textAlign:'center',fontSize:11,color:'rgba(11,37,69,0.2)',marginTop:20}}>{'\u00A9'} {new Date().getFullYear()} CivicVerify. One person, one verified voice.</p>
      </div>
    </div>
  );
}
