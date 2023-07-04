const report = require("multiple-cucumber-html-reporter");
report.generate({
  jsonDir: "cypress/jsonlogs",
  reportPath: "./cypress/reports/cucumber-htmlreport.html"
});