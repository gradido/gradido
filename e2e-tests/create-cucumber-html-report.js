const report = require("multiple-cucumber-html-reporter");
report.generate({
  jsonDir: "cypress/json_logs",
  reportPath: "./cypress/reports/cucumber-htmlreport.html"
});