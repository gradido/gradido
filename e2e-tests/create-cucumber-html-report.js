const report = require("multiple-cucumber-html-reporter");

const reportTitle = "Gradido webapp end-to-end test report"

report.generate({
  jsonDir: "cypress/reports/json_logs",
  reportPath: "./cypress/reports/cucumber_html_report",
  pageTitle: reportTitle,
  reportName: reportTitle,
  pageFooter: "<div></div>",
  hideMetadata: true
});