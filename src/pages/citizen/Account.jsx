// src/pages/citizen/Account.jsx — Full demographics profile editor
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

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

export default function CitizenAccount() {
  var auth = useAuth(); var user = auth.user; var profile = auth.profile;
  var [form, setForm] = useState({ full_name:'',phone:'',state:'',county:'',city:'',zip:'',race:'',sex:'',dob:'',education:'',employment:'',income:'',marital_status:'',party:'',voter_registered:false,veteran:false,housing:'' });
  var [loading, setLoading] = useState(true);
  var [saving, setSaving] = useState(false);
  var [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(function(){ if (profile) { setForm({ full_name: profile.full_name||'', phone: profile.phone||'', state: profile.state||'', county: profile.county||'', city: profile.city||'', zip: profile.zip||'', race: profile.race||'', sex: profile.sex||'', dob: profile.date_of_birth||'', education: profile.education||'', employment: profile.employment||'', income: profile.income||'', marital_status: profile.marital_status||'', party: profile.party||'', voter_registered: profile.voter_registered||false, veteran: profile.veteran||false, housing: profile.housing||'' }); setLoading(false); } }, [profile]);

  function update(f,v){ setForm(function(p){ var n=Object.assign({},p,{[f]:v}); if(f==='state'){n.county='';} return n; }); setMsg({type:'',text:''}); }
  function formatPhone(v){ var d=(v||'').replace(/\D/g,'').slice(0,10); if(d.length>=7) return '('+d.slice(0,3)+') '+d.slice(3,6)+'-'+d.slice(6); if(d.length>=4) return '('+d.slice(0,3)+') '+d.slice(3); if(d.length>0) return '('+d; return ''; }

  var counties = form.state && STATE_COUNTIES[form.state] ? STATE_COUNTIES[form.state] : [];

  async function save() {
    if (!form.full_name.trim()) return setMsg({type:'error',text:'Name is required'});
    if (!form.state) return setMsg({type:'error',text:'State is required'});
    setSaving(true);
    var phoneDigits = form.phone.replace(/\D/g,'');
    if (phoneDigits && phoneDigits !== profile.phone) {
      var r = await supabase.from('users').select('id').eq('phone',phoneDigits).neq('id',user.id).limit(1);
      if (r.data && r.data.length > 0) { setSaving(false); return setMsg({type:'error',text:'Phone already linked to another account.'}); }
    }
    var res = await supabase.from('users').update({
      full_name: form.full_name.trim(), phone: phoneDigits||null,
      state: form.state, county: form.county.trim()||null, city: form.city.trim()||null, zip: form.zip.replace(/\D/g,'').slice(0,5)||null,
      race: form.race||null, sex: form.sex||null, date_of_birth: form.dob||null,
      education: form.education||null, employment: form.employment||null, income: form.income||null,
      marital_status: form.marital_status||null, party: form.party||null,
      voter_registered: form.voter_registered, veteran: form.veteran, housing: form.housing||null
    }).eq('id', user.id);
    setSaving(false);
    if (res.error) return setMsg({type:'error',text:res.error.message});
    setMsg({type:'success',text:'Profile updated successfully!'});
  }

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:80}}><div style={{width:36,height:36,border:'3px solid '+C.gold,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/><style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style></div>;

  var fields = [form.full_name,form.phone,form.state,form.city,form.zip,form.race,form.sex,form.dob,form.education,form.employment,form.income,form.party,form.housing];
  var filled = fields.filter(function(f){return f;}).length;
  var completeness = Math.round((filled / fields.length) * 100);

  function Sel(props){ return <select value={props.value} onChange={function(e){update(props.field,e.target.value)}} style={selectStyle}><option value="">{props.ph||'Select...'}</option>{props.opts.map(function(o){return <option key={o} value={o}>{o}</option>;})}</select>; }

  function Section(props){ return <div style={{background:'#fff',borderRadius:14,padding:24,border:'1px solid rgba(11,37,69,0.06)',marginBottom:20}}><h2 style={{fontSize:16,fontWeight:700,color:C.navy,margin:'0 0 '+(props.sub?'4':'16')+'px',display:'flex',alignItems:'center',gap:8}}>{props.icon} {props.title}</h2>{props.sub?<p style={{fontSize:12,color:'rgba(11,37,69,0.25)',margin:'0 0 16px'}}>{props.sub}</p>:null}{props.children}</div>; }

  return (
    <div style={{ maxWidth: 680, fontFamily: 'DM Sans, sans-serif' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>My Profile</h1>
      <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.35)', margin: '0 0 24px' }}>Complete your profile for better poll matching</p>

      {/* Completeness */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid rgba(11,37,69,0.06)', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>Profile Completeness</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: completeness >= 80 ? C.green : C.gold }}>{completeness}%</span>
        </div>
        <div style={{ width: '100%', height: 6, background: 'rgba(11,37,69,0.04)', borderRadius: 3 }}>
          <div style={{ height: '100%', background: completeness >= 80 ? C.green : C.gold, borderRadius: 3, transition: 'width 0.5s', width: completeness + '%' }} />
        </div>
      </div>

      {msg.text ? <div style={{ background: msg.type==='success'?C.green+'08':C.red+'08', border: '1px solid '+(msg.type==='success'?C.green:C.red)+'20', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}><p style={{ fontSize: 13, color: msg.type==='success'?C.green:C.red, margin: 0 }}>{msg.type==='success'?'\u2713':'\u26A0'} {msg.text}</p></div> : null}

      <Section icon={'\uD83D\uDC64'} title="Account">
        <div style={{ marginBottom: 16 }}><label style={labelStyle}>Full Name <span style={{color:C.red}}>*</span></label><input value={form.full_name} onChange={function(e){update('full_name',e.target.value)}} style={inputStyle} /></div>
        <div style={{ marginBottom: 16 }}><label style={labelStyle}>Email</label><input value={profile?profile.email||'':''} disabled style={Object.assign({},inputStyle,{background:'rgba(11,37,69,0.02)',color:'rgba(11,37,69,0.3)'})} /></div>
        <div style={{ marginBottom: 0 }}><label style={labelStyle}>Phone</label><input value={formatPhone(form.phone)} onChange={function(e){update('phone',e.target.value.replace(/\D/g,'').slice(0,10))}} placeholder="(555) 123-4567" style={inputStyle} /></div>
      </Section>

      <Section icon={'\uD83D\uDCCD'} title="Location" sub="Used to match you with local polls. Never shared publicly.">
        <div style={{ marginBottom: 16 }}><label style={labelStyle}>State <span style={{color:C.red}}>*</span></label><Sel value={form.state} field="state" opts={US_STATES} ph="Select state" /></div>
        <div style={{ marginBottom: 16 }}><label style={labelStyle}>County</label>{counties.length>0?<Sel value={form.county} field="county" opts={counties} ph="Select county" />:<input value={form.county} onChange={function(e){update('county',e.target.value)}} placeholder="Enter county" style={inputStyle} />}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>City</label><input value={form.city} onChange={function(e){update('city',e.target.value)}} placeholder="e.g., Indianapolis" style={inputStyle} /></div>
          <div><label style={labelStyle}>ZIP Code</label><input value={form.zip} onChange={function(e){update('zip',e.target.value.replace(/\D/g,'').slice(0,5))}} placeholder="e.g., 46201" maxLength={5} style={inputStyle} /></div>
        </div>
      </Section>

      <Section icon={'\uD83D\uDCCA'} title="Demographics" sub="Helps match you with relevant surveys. All data is anonymous.">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div><label style={labelStyle}>Race / Ethnicity</label><Sel value={form.race} field="race" opts={RACE_OPTIONS} /></div>
          <div><label style={labelStyle}>Sex</label><Sel value={form.sex} field="sex" opts={SEX_OPTIONS} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div><label style={labelStyle}>Date of Birth</label><input type="date" value={form.dob} onChange={function(e){update('dob',e.target.value)}} style={inputStyle} /></div>
          <div><label style={labelStyle}>Education</label><Sel value={form.education} field="education" opts={EDUCATION_OPTIONS} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div><label style={labelStyle}>Employment</label><Sel value={form.employment} field="employment" opts={EMPLOYMENT_OPTIONS} /></div>
          <div><label style={labelStyle}>Income</label><Sel value={form.income} field="income" opts={INCOME_OPTIONS} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div><label style={labelStyle}>Marital Status</label><Sel value={form.marital_status} field="marital_status" opts={MARITAL_OPTIONS} /></div>
          <div><label style={labelStyle}>Party Affiliation</label><Sel value={form.party} field="party" opts={PARTY_OPTIONS} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>Housing</label><Sel value={form.housing} field="housing" opts={HOUSING_OPTIONS} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'rgba(11,37,69,0.5)' }}><input type="checkbox" checked={form.voter_registered} onChange={function(e){update('voter_registered',e.target.checked)}} style={{accentColor:C.gold,width:16,height:16}} /> Registered Voter</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'rgba(11,37,69,0.5)' }}><input type="checkbox" checked={form.veteran} onChange={function(e){update('veteran',e.target.checked)}} style={{accentColor:C.gold,width:16,height:16}} /> Veteran</label>
          </div>
        </div>
      </Section>

      <Section icon={'\uD83D\uDEE1\uFE0F'} title="Verification">
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex:1, padding:16, borderRadius:10, background: profile&&profile.is_verified?C.green+'08':'rgba(11,37,69,0.02)', border:'1px solid '+(profile&&profile.is_verified?C.green+'20':'rgba(11,37,69,0.06)'), textAlign:'center' }}>
            <span style={{fontSize:24,display:'block',marginBottom:4}}>{profile&&profile.is_verified?'\u2705':'\u23F3'}</span>
            <p style={{fontSize:12,fontWeight:600,color:profile&&profile.is_verified?C.green:'rgba(11,37,69,0.3)',margin:0}}>{profile&&profile.is_verified?'Email Verified':'Email Pending'}</p>
          </div>
          <div style={{ flex:1, padding:16, borderRadius:10, background: profile&&profile.identity_verified?C.green+'08':'rgba(11,37,69,0.02)', border:'1px solid '+(profile&&profile.identity_verified?C.green+'20':'rgba(11,37,69,0.06)'), textAlign:'center' }}>
            <span style={{fontSize:24,display:'block',marginBottom:4}}>{profile&&profile.identity_verified?'\u2705':'\u23F3'}</span>
            <p style={{fontSize:12,fontWeight:600,color:profile&&profile.identity_verified?C.green:'rgba(11,37,69,0.3)',margin:0}}>{profile&&profile.identity_verified?'ID Verified':'ID Not Verified'}</p>
          </div>
        </div>
      </Section>

      <button onClick={save} disabled={saving} style={{ width:'100%', padding:14, background:C.gold, color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:600, cursor:'pointer', opacity:saving?0.6:1 }}>{saving?'Saving...':'Save Changes'}</button>
    </div>
  );
}
