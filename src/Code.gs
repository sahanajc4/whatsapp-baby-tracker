const T={A:'Activity_Log',C:'Caregivers',S:'Daily_Summary',D:'Dashboard',I:'Webhook_Inbox'};
const AH=['record_id','event_date','event_time','activity','feeding_type','quantity','unit','side','duration_minutes','supplement_name','bath_type','caregiver_name','caregiver_phone','source_message_id','original_message','created_at','status'];
const CH=['phone_e164','caregiver_name','role','enabled','notes'];
const SH=['event_date','formula_ml','expressed_milk_ml','breastfeeding_sessions','breastfeeding_minutes','wet_diapers','dirty_diapers','supplement_doses','baths'];
const IH=['message_id','received_at','sender','processing_status'];

function cfg(){const p=PropertiesService.getScriptProperties(),o={};['SPREADSHEET_ID','WHATSAPP_ACCESS_TOKEN','WHATSAPP_PHONE_NUMBER_ID','WHATSAPP_API_VERSION','WHATSAPP_VERIFY_TOKEN','WEBHOOK_URL_SECRET'].forEach(k=>o[k]=p.getProperty(k));const m=Object.keys(o).filter(k=>!o[k]);if(m.length)throw Error('Missing Script Properties: '+m.join(', '));return o;}
function doGet(e){const p=e.parameter||{},c=cfg();if(p['hub.mode']==='subscribe'&&p['hub.verify_token']===c.WHATSAPP_VERIFY_TOKEN&&p['hub.challenge'])return ContentService.createTextOutput(String(p['hub.challenge']));if(p.health==='1'&&eq_(p.k||'',c.WEBHOOK_URL_SECRET))return ContentService.createTextOutput('OK');return ContentService.createTextOutput('WhatsApp Baby Tracker');}
function doPost(e){const c=cfg();if(!eq_((e.parameter||{}).k||'',c.WEBHOOK_URL_SECRET))return ContentService.createTextOutput('Forbidden');let p;try{p=JSON.parse(e.postData.contents||'{}');}catch(x){return ContentService.createTextOutput('Bad JSON');}try{(p.entry||[]).forEach(en=>(en.changes||[]).forEach(ch=>{if(ch.field==='messages')(ch.value.messages||[]).forEach(m=>handle_(m));}));}catch(x){console.error(x.stack||x);}return ContentService.createTextOutput('EVENT_RECEIVED');}
function setupBabyTracker(){const c=cfg(),ss=SpreadsheetApp.openById(c.SPREADSHEET_ID);[[T.A,AH],[T.C,CH],[T.S,SH],[T.I,IH]].forEach(x=>{let s=ss.getSheetByName(x[0])||ss.insertSheet(x[0]);if(!s.getLastRow())s.appendRow(x[1]);if(s.getRange(1,1,1,x[1].length).getDisplayValues()[0].join('|')!==x[1].join('|'))throw Error('Header mismatch: '+x[0]);s.setFrozenRows(1);s.getRange(1,1,1,x[1].length).setFontWeight('bold').setBackground('#d9ead3');});ss.getSheetByName(T.A).getRange('B:C').setNumberFormat('@');ss.getSheetByName(T.C).getRange('A:A').setNumberFormat('@');ss.getSheetByName(T.S).getRange('A:A').setNumberFormat('@');ss.getSheetByName(T.I).getRange('A:A').setNumberFormat('@');let d=ss.getSheetByName(T.D)||ss.insertSheet(T.D);d.clear();d.getRange('A1').setValue('BABY ACTIVITY DASHBOARD').setFontSize(16).setFontWeight('bold');d.getRange('A3').setValue('Charts refresh when a caregiver sends SUMMARY.');return 'Setup complete. Add caregivers to Caregivers tab.';}
function handle_(m){const lock=LockService.getScriptLock();lock.waitLock(20000);try{const id=String(m.id||''),from=digits_(m.from||'');if(!id||seen_(id))return;const care=caregiver_(from);if(!care){inbox_(id,from,'UNAUTHORISED');return;}if(m.type!=='text'){send_(from,'Please send text only. Voice and images are not enabled.');inbox_(id,from,'UNSUPPORTED');return;}const text=(m.text&&m.text.body||'').trim(),r=parse_(text,new Date());if(r.cmd==='HELP'){send_(from,help_());inbox_(id,from,'HELP');return;}if(r.cmd==='SUMMARY'){const s=summary_(r.date);upsert_(r.date,s);dashboard_();send_(from,summaryText_(r.date,s));inbox_(id,from,'SUMMARY');return;}if(!r.ok){send_(from,r.reply);inbox_(id,from,'CLARIFICATION');return;}const ss=SpreadsheetApp.openById(cfg().SPREADSHEET_ID);ss.getSheetByName(T.A).appendRow([Utilities.getUuid(),r.date,r.time,r.activity,r.type||'',r.qty===undefined?'':r.qty,r.unit||'',r.side||'',r.mins||'',r.name||'',r.bath||'',care.name,from,id,text,new Date(),'RECORDED']);inbox_(id,from,'RECORDED');send_(from,'Recorded successfully.\nActivity: '+r.activity+'\nDate/time: '+r.date+' '+r.time+'\nCaregiver: '+care.name+'\nSend SUMMARY for today.');}finally{lock.releaseLock();}}
function parse_(s,now){const l=s.toLowerCase();if(/^(help|\/help|menu)$/i.test(s))return{cmd:'HELP'};let sm=l.match(/^summary(?:\s+(today|yesterday))?$/);if(sm){let d=new Date(now);if(sm[1]==='yesterday')d.setDate(d.getDate()-1);return{cmd:'SUMMARY',date:date_(d)};}let d=new Date(now);if(/\byesterday\b/i.test(s))d.setDate(d.getDate()-1);let tm=s.match(/\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i),time=tm?clock_(tm):Utilities.formatDate(now,Session.getScriptTimeZone(),'HH:mm');if(/formula|expressed\s+milk|pumped\s+milk|breast\s*feed|breastfed|breastfeeding/i.test(s)){let type=/formula/i.test(s)?'formula':(/expressed\s+milk|pumped\s+milk/i.test(s)?'expressed_milk':'breastfeeding'),q=s.match(/\b(\d+(?:\.\d+)?)\s*(ml|millilit(?:er|re)s?)\b/i),mi=s.match(/\b(\d+)\s*(minutes?|mins?)\b/i),side=l.match(/\b(left|right|both)\b/);if(type!=='breastfeeding'&&!q)return{ok:false,reply:'Please include milk quantity in ml. Example: 90 ml formula at 10:30 AM.'};if(type==='breastfeeding'&&!mi&&!side)return{ok:false,reply:'Include side or duration. Example: Breastfed left side for 15 minutes.'};if(q&&Number(q[1])<=0)return{ok:false,reply:'Quantity must be greater than zero.'};return{ok:true,activity:'feeding',type:type,qty:q?Number(q[1]):'',unit:q?'ml':'',side:side?side[1]:'',mins:mi?Number(mi[1]):'',date:date_(d),time:time};}if(/wet\s+diaper|urine|\bpee(d|ing)?\b|urinated/i.test(s))return{ok:true,activity:'urine',date:date_(d),time:time};if(/dirty\s+diaper|passed\s+stool|\bstool\b|poop|bowel\s+movement/i.test(s))return{ok:true,activity:'stool',date:date_(d),time:time};if(/vitamin|supplement|medicine|medication|drops/i.test(s)){let n=s.replace(/\b(gave|given|baby|the|at|today|yesterday)\b/ig,' ').replace(/\b\d{1,2}(?::\d{2})?\s*(am|pm)\b/ig,' ').replace(/\s+/g,' ').trim();return{ok:true,activity:'supplement',name:n||'Unspecified',qty:1,unit:'dose',date:date_(d),time:time};}if(/\bbath\b/i.test(s))return{ok:true,activity:'bath',bath:/\bboth\b/i.test(s)?'both':(/\bhead\b/i.test(s)?'head':'body'),date:date_(d),time:time};return{ok:false,reply:'Could not identify activity. Try: 90 ml formula; 60 ml expressed milk; Breastfed left side for 15 minutes; Wet diaper; Baby passed stool; Vitamin D given; Baby had body bath. Send HELP.'};}
function clock_(m){let h=+m[1],n=+(m[2]||0);if(h<1||h>12||n>59)return Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'HH:mm');h=h%12+(m[3].toLowerCase()==='pm'?12:0);return('0'+h).slice(-2)+':'+('0'+n).slice(-2);}

function caregiver_(p) {
  const target = digits_(String(p || '').trim());

  const s = SpreadsheetApp
    .openById(cfg().SPREADSHEET_ID)
    .getSheetByName(T.C);

  if (!s || s.getLastRow() < 2) {
    Logger.log('Caregivers sheet missing or empty');
    return null;
  }

  const rows = s.getRange(
    2, 1, s.getLastRow() - 1, 5
  ).getDisplayValues();

  for (const r of rows) {
    const phone = digits_(String(r[0] || '').trim());
    const enabled = String(r[3] || '').trim().toUpperCase();

    Logger.log(JSON.stringify({
      received_sender: target,
      sheet_phone: phone,
      enabled: enabled,
      match: phone === target && enabled === 'YES'
    }));

    if (phone === target && enabled === 'YES') {
      return {
        name: r[1] || 'Caregiver'
      };
    }
  }

  Logger.log('UNAUTHORISED sender: ' + target);
  return null;
}

function seen_(id){let s=SpreadsheetApp.openById(cfg().SPREADSHEET_ID).getSheetByName(T.I);if(s.getLastRow()<2)return false;return !!s.getRange(2,1,s.getLastRow()-1,1).createTextFinder(id).matchEntireCell(true).findNext();}
function inbox_(id,from,status){SpreadsheetApp.openById(cfg().SPREADSHEET_ID).getSheetByName(T.I).appendRow([id,new Date(),from,status]);}
function summary_(day){let o={formula:0,expressed:0,sessions:0,mins:0,wet:0,stool:0,supp:0,bath:0},s=SpreadsheetApp.openById(cfg().SPREADSHEET_ID).getSheetByName(T.A);if(s.getLastRow()<2)return o;s.getRange(2,1,s.getLastRow()-1,AH.length).getDisplayValues().forEach(r=>{if(String(r[1])!==day)return;let a=r[3],t=r[4];if(a==='feeding'){if(t==='formula')o.formula+=+r[5]||0;else if(t==='expressed_milk')o.expressed+=+r[5]||0;else if(t==='breastfeeding'){o.sessions++;o.mins+=+r[8]||0;}}else if(a==='urine')o.wet++;else if(a==='stool')o.stool++;else if(a==='supplement')o.supp++;else if(a==='bath')o.bath++;});return o;}
function upsert_(day,o){let s=SpreadsheetApp.openById(cfg().SPREADSHEET_ID).getSheetByName(T.S),row=[day,o.formula,o.expressed,o.sessions,o.mins,o.wet,o.stool,o.supp,o.bath],last=s.getLastRow();if(last>1){let ds=s.getRange(2,1,last-1,1).getDisplayValues();for(let i=0;i<ds.length;i++)if(ds[i][0]===day){s.getRange(i+2,1,1,row.length).setValues([row]);return;}}s.appendRow(row);}
function dashboard_(){let ss=SpreadsheetApp.openById(cfg().SPREADSHEET_ID),d=ss.getSheetByName(T.D),s=ss.getSheetByName(T.S);d.getCharts().forEach(c=>d.removeChart(c));if(s.getLastRow()<2)return;d.getRange('A5').setValue('Milk volumes by day');d.insertChart(d.newChart().setChartType(Charts.ChartType.COLUMN).addRange(s.getRange(1,1,s.getLastRow(),3)).setPosition(7,1,0,0).setOption('title','Milk volumes (ml)').build());d.insertChart(d.newChart().setChartType(Charts.ChartType.COLUMN).addRange(s.getRange(1,1,s.getLastRow(),1)).addRange(s.getRange(1,6,s.getLastRow(),4)).setPosition(7,8,0,0).setOption('title','Care activities').build());}
function summaryText_(d,o){return'Baby activity summary — '+d+'\nFormula: '+o.formula+' ml\nExpressed milk: '+o.expressed+' ml\nDirect breastfeeding: '+o.sessions+' sessions ('+o.mins+' min recorded)\nWet diapers: '+o.wet+'\nDirty diapers: '+o.stool+'\nSupplement entries: '+o.supp+'\nBaths: '+o.bath;}
function help_(){return'BABY TRACKER\n90 ml formula at 10:30 AM\n60 ml expressed milk\nBreastfed left side for 15 minutes\nWet diaper\nBaby passed stool\nVitamin D given\nBaby had body bath\nSUMMARY / SUMMARY YESTERDAY';}
function send_(to,body){let c=cfg(),url='https://graph.facebook.com/'+c.WHATSAPP_API_VERSION+'/'+c.WHATSAPP_PHONE_NUMBER_ID+'/messages',r=UrlFetchApp.fetch(url,{method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+c.WHATSAPP_ACCESS_TOKEN},payload:JSON.stringify({messaging_product:'whatsapp',to:to,type:'text',text:{preview_url:false,body:body}}),muteHttpExceptions:true});if(r.getResponseCode()<200||r.getResponseCode()>299)console.error('WhatsApp API '+r.getResponseCode()+': '+r.getContentText());}
function digits_(v){return String(v||'').replace(/\D/g,'');}
function date_(d){return Utilities.formatDate(d,Session.getScriptTimeZone(),'yyyy-MM-dd');}
function eq_(a,b){if(!a||!b||a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0;}
function testParser(){let n=new Date('2026-11-16T10:00:00+05:30'),tests=[['90 ml formula at 10:30 AM','feeding'],['60 ml expressed milk','feeding'],['Breastfed left side for 15 minutes','feeding'],['Wet diaper','urine'],['Baby passed stool','stool'],['Vitamin D given','supplement'],['Baby had body bath','bath']];tests.forEach(t=>{let r=parse_(t[0],n);if(!r.ok||r.activity!==t[1])throw Error('Failed: '+t[0]+' '+JSON.stringify(r));});return'All parser tests passed.';}
function dryRun01Spreadsheet() {
  const spreadsheetId = cfg().SPREADSHEET_ID;

  const ss = SpreadsheetApp.openById(spreadsheetId);

  const requiredSheets = [
    'Activity_Log',
    'Caregivers',
    'Daily_Summary',
    'Dashboard',
    'Webhook_Inbox'
  ];

  Logger.log('Spreadsheet: ' + ss.getName());

  requiredSheets.forEach(name => {
    const sheet = ss.getSheetByName(name);

    Logger.log(
      name + ': ' + (sheet ? 'FOUND' : 'MISSING')
    );
  });
}

function dryRun02Caregivers() {
  const ss = SpreadsheetApp.openById(cfg().SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Caregivers');

  if (!sheet) {
    throw new Error('Caregivers sheet not found');
  }

  const rows = sheet.getDataRange().getDisplayValues();

  rows.forEach((row, index) => {
    Logger.log(JSON.stringify({
      row: index + 1,
      phone: row[0],
      name: row[1],
      role: row[2],
      enabled: row[3]
    }));
  });
}

function dryRun03Authorization() {
  // Use the phone number from the Caregivers sheet.
  const testSender = '919164264627';

  Logger.log('Testing sender: ' + testSender);

  const result = caregiver_(testSender);

  Logger.log('Authorization result: ' + JSON.stringify(result));

  if (result) {
    Logger.log('PASS: Caregiver authorized');
  } else {
    Logger.log('FAIL: Caregiver not authorized');
  }
}

function dryRun04MessageParsing() {
  const fixedTime = new Date('2026-11-16T10:00:00+05:30');

  const testMessages = [
    '90 ml formula at 10:30 AM',
    '60 ml expressed milk',
    'Breastfed left side for 15 minutes',
    'Wet diaper',
    'Baby passed stool',
    'Vitamin D given',
    'Baby had body bath'
  ];

  let passed = 0;
  let failed = 0;

  testMessages.forEach(message => {
    Logger.log('INPUT: ' + message);

    try {
      const result = parse_(message, fixedTime);

      Logger.log('OUTPUT: ' + JSON.stringify(result));

      if (result.ok === true) {
        passed++;
        Logger.log('RESULT: PASS');
      } else {
        failed++;
        Logger.log('RESULT: FAIL');
      }
    } catch (error) {
      failed++;
      Logger.log('ERROR: ' + error.message);
    }

    Logger.log('----------------------------');
  });

  Logger.log('TOTAL PASSED: ' + passed);
  Logger.log('TOTAL FAILED: ' + failed);

  if (failed > 0) {
    throw new Error('Message parsing test failed: ' + failed);
  }

  Logger.log('DRY-RUN 04: ALL TESTS PASSED');
}

function dryRun05ActivityLogging() {
  const testSender = '919164264627';
  const testDate = new Date('2099-01-01T10:00:00+05:30');

  const messages = [
    '90 ml formula at 10:30 AM',
    '60 ml expressed milk',
    'Breastfed left side for 15 minutes',
    'Wet diaper',
    'Baby passed stool',
    'Vitamin D given',
    'Baby had body bath'
  ];

  const caregiver = caregiver_(testSender);

  if (!caregiver) {
    throw new Error('Test caregiver is not authorized.');
  }

  const ss = SpreadsheetApp.openById(cfg().SPREADSHEET_ID);
  const sheet = ss.getSheetByName(T.A);

  if (!sheet) {
    throw new Error('Activity_Log sheet not found.');
  }

  const runId = Utilities.getUuid();
  let count = 0;

  messages.forEach((message, index) => {
    const r = parse_(message, testDate);

    if (!r.ok) {
      throw new Error('Parsing failed: ' + message);
    }

    const testMessageId = 'DRYRUN05-' + runId + '-' + (index + 1);

    sheet.appendRow([
      Utilities.getUuid(),
      r.date,
      r.time,
      r.activity,
      r.type || '',
      r.qty === undefined ? '' : r.qty,
      r.unit || '',
      r.side || '',
      r.mins || '',
      r.name || '',
      r.bath || '',
      caregiver.name,
      testSender,
      testMessageId,
      message,
      new Date(),
      'TEST'
    ]);

    count++;

    Logger.log(
      'RECORDED: ' + message +
      ' | Activity: ' + r.activity +
      ' | Test ID: ' + testMessageId
    );
  });

  Logger.log('TOTAL TEST RECORDS WRITTEN: ' + count);
  Logger.log('TEST DATE: 2099-01-01');
  Logger.log('STATUS: TEST');
  Logger.log('DRY-RUN 05: COMPLETED');
}

function dryRun05Cleanup() {
  const ss = SpreadsheetApp.openById(cfg().SPREADSHEET_ID);
  const sheet = ss.getSheetByName(T.A);

  if (!sheet || sheet.getLastRow() < 2) {
    Logger.log('No activity records to inspect.');
    return;
  }

  const rows = sheet.getRange(
    2, 1, sheet.getLastRow() - 1, AH.length
  ).getDisplayValues();

  let deleted = 0;

  for (let i = rows.length - 1; i >= 0; i--) {
    const sourceId = rows[i][13];
    const status = rows[i][16];

    if (
      sourceId.startsWith('DRYRUN05-') &&
      status === 'TEST'
    ) {
      sheet.deleteRow(i + 2);
      deleted++;
    }
  }

  Logger.log('DRY-RUN 05 test records deleted: ' + deleted);
}

function dryRun06DailySummary() {
  const testDay = '2099-12-31';
  const testSender = '919164264627';
  const runId = Utilities.getUuid();

  const caregiver = caregiver_(testSender);

  if (!caregiver) {
    throw new Error('Test caregiver authorization failed.');
  }

  const ss = SpreadsheetApp.openById(cfg().SPREADSHEET_ID);
  const activitySheet = ss.getSheetByName(T.A);
  const summarySheet = ss.getSheetByName(T.S);

  if (!activitySheet || !summarySheet) {
    throw new Error('Required sheet is missing.');
  }

  // Prevent accidental mixing with existing test data.
  const existing = activitySheet.getDataRange().getDisplayValues();

  if (existing.some(r => r[1] === testDay)) {
    throw new Error('Test date already contains records. Aborting.');
  }

  const testRecords = [
    ['feeding', 'formula', 90, 'ml', '', '', '', '90 ml formula'],
    ['feeding', 'expressed_milk', 60, 'ml', '', '', '', '60 ml expressed milk'],
    ['feeding', 'breastfeeding', '', '', 'left', 15, '', 'Breastfed left side for 15 minutes'],
    ['urine', '', '', '', '', '', '', 'Wet diaper'],
    ['stool', '', '', '', '', '', '', 'Baby passed stool'],
    ['supplement', '', 1, 'dose', '', '', 'Vitamin D', 'Vitamin D given'],
    ['bath', '', '', '', '', '', 'body', 'Baby had body bath']
  ];

  testRecords.forEach((r, index) => {
    const messageId = 'DRYRUN06-' + runId + '-' + (index + 1);

    activitySheet.appendRow([
      Utilities.getUuid(),
      testDay,
      '10:00',
      r[0],
      r[1],
      r[2],
      r[3],
      r[4],
      r[5],
      r[6],
      r[0] === 'bath' ? 'body' : '',
      caregiver.name,
      testSender,
      messageId,
      r[7],
      new Date(),
      'TEST'
    ]);
  });

  Logger.log('Inserted 7 temporary activity records.');

  // Calculate summary using the application's actual function.
  const result = summary_(testDay);

  Logger.log('ACTUAL SUMMARY: ' + JSON.stringify(result));

  const expected = {
    formula: 90,
    expressed: 60,
    sessions: 1,
    mins: 15,
    wet: 1,
    stool: 1,
    supp: 1,
    bath: 1
  };

  let passed = true;

  Object.keys(expected).forEach(key => {
    const actual = Number(result[key] || 0);
    const wanted = expected[key];
    const match = actual === wanted;

    Logger.log(
      key + ' | Expected: ' + wanted +
      ' | Actual: ' + actual +
      ' | ' + (match ? 'PASS' : 'FAIL')
    );

    if (!match) passed = false;
  });

  if (!passed) {
    throw new Error('Daily summary calculation failed. Keep test records for investigation.');
  }

  // Write verified result to Daily_Summary.
  upsert_(testDay, result);

  SpreadsheetApp.flush();

  Logger.log('Daily_Summary updated for: ' + testDay);
  Logger.log('TOTAL CHECKS PASSED: 8');
  Logger.log('DRY-RUN 06: ALL TESTS PASSED');
}

function dryRun06Cleanup() {
  const testDay = '2099-12-31';

  const ss = SpreadsheetApp.openById(cfg().SPREADSHEET_ID);
  const activitySheet = ss.getSheetByName(T.A);
  const summarySheet = ss.getSheetByName(T.S);

  // Remove only Dry-run 06 activity records.
  const rows = activitySheet.getDataRange().getDisplayValues();
  let activityDeleted = 0;

  for (let i = rows.length - 1; i >= 1; i--) {
    if (
      rows[i][1] === testDay &&
      rows[i][13].startsWith('DRYRUN06-') &&
      rows[i][16] === 'TEST'
    ) {
      activitySheet.deleteRow(i + 1);
      activityDeleted++;
    }
  }

  // Remove the corresponding summary row.
  const summaryRows = summarySheet.getDataRange().getDisplayValues();
  let summaryDeleted = 0;

  for (let i = summaryRows.length - 1; i >= 1; i--) {
    if (summaryRows[i][0] === testDay) {
      summarySheet.deleteRow(i + 1);
      summaryDeleted++;
    }
  }

  Logger.log('Activity records deleted: ' + activityDeleted);
  Logger.log('Summary rows deleted: ' + summaryDeleted);
  Logger.log('DRY-RUN 06 CLEANUP COMPLETED');
}