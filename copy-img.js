const fs = require('fs');

const src = 'C:\\Users\\ichill shop\\.gemini\\antigravity\\brain\\341d6489-9470-468c-b138-a4e6667ac4b4\\pet_clinic_login_cover_1784458565198.png';
const dest = 'c:\\xampp\\htdocs\\smilepet\\public\\login-cover.png';

fs.copyFileSync(src, dest);
console.log('Copied successfully!');
