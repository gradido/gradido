const report = require("multiple-cucumber-html-reporter");
report.generate({
  jsonDir: "cypress/reports/json_logs",
  reportPath: "./cypress/reports/cucumber_html_report"
});