const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'server/routes/staff.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace exactly the 5 lines at the end of reject
content = content.replace("            });\r\n        });\r\n    });\r\n    });\r\n});", "            });\r\n        });\r\n    });\r\n});");
content = content.replace("            });\n        });\n    });\n    });\n});", "            });\n        });\n    });\n});");

fs.writeFileSync(filePath, content, 'utf8');
console.log('staff.js brackets fixed');
