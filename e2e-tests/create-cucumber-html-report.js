const report = require("multiple-cucumber-html-reporter");
report.generate({
  jsonDir: "cypress/json_logs",
  reportPath: "./cypress/reports/cucumber_html_report",
  metadata: {
    app: {
      name: "Gradido webapp"
    },
    device: "Github worker",
    plattform: {
      name: "ubuntu",
      version: "latest"
    }
  }
});