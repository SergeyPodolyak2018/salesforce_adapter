// This file is auto-generated
const fs 	    = 	 require("fs");
const path      =    require("path");
const file      =    path.resolve(__dirname, '../../VERSION.TXT');
const targetFile      =  path.resolve(__dirname, '../../lib/version/version.js');

// let version = fs.readFileSync(file, "utf8");
let version = process.env.crmAdapterVersion || fs.readFileSync(file, "utf8");

let target = fs.readFileSync(targetFile, "utf8");
let regex = new RegExp('\"version\":\".*\"', "g");

let out = target.replace(regex, '\"version\":\"'+version+'\"');


fs.writeFileSync(targetFile, out);

