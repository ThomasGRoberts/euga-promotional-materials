/**
 * Proposed Sheet-bound workflow. Configure PHOTO_FOLDER_ID and run
 * syncPhotosFromDrive from the EU Program menu. The public site should
 * consume only an approved, publicly served derivative URL—not a private
 * Drive URL.
 */
const PHOTO_FOLDER_ID = 'REPLACE_WITH_DESIGNATED_DRIVE_FOLDER_ID';
const PHOTO_SHEET_NAME = 'Photos';
const PHOTO_HEADERS = ['Approved/Active','Featured','Preview','Year','City','Caption/Notes','Credit','Drive file ID','Filename','Source URL'];

function onOpen() {
  SpreadsheetApp.getUi().createMenu('EU Program').addItem('Sync Photos from Drive','syncPhotosFromDrive').addToUi();
}
function syncPhotosFromDrive() {
  if (PHOTO_FOLDER_ID.startsWith('REPLACE_')) throw new Error('Configure PHOTO_FOLDER_ID first.');
  const ss=SpreadsheetApp.getActive(); const sheet=ss.getSheetByName(PHOTO_SHEET_NAME)||ss.insertSheet(PHOTO_SHEET_NAME);
  if (sheet.getLastRow()===0) sheet.appendRow(PHOTO_HEADERS);
  const existing=new Set(sheet.getRange(2,8,Math.max(sheet.getLastRow()-1,1),1).getValues().flat().filter(String));
  const folder=DriveApp.getFolderById(PHOTO_FOLDER_ID); const files=folder.getFiles(); const rows=[];
  while(files.hasNext()){const file=files.next(); if(!file.getMimeType().startsWith('image/')) continue; if(existing.has(file.getId())) continue;
    rows.push([false,false,`=IMAGE("${file.getUrl()}",4,80,80),'', '', '', '',file.getId(),file.getName(),file.getUrl()]);
  }
  if(rows.length) sheet.getRange(sheet.getLastRow()+1,1,rows.length,PHOTO_HEADERS.length).setValues(rows);
  sheet.setFrozenRows(1); sheet.autoResizeColumns(1,PHOTO_HEADERS.length);
}
