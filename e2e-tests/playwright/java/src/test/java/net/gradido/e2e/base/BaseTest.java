package net.gradido.e2e.base;

import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.Playwright;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Tracing;
import org.junit.jupiter.api.*;
import java.nio.file.Path;
import java.nio.file.Paths;

// Subclasses will inherit PER_CLASS behavior.
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class BaseTest {

    protected Playwright playwright;
    protected Browser browser;

    @BeforeAll
    void setUpAll() {
        playwright = Playwright.create();
        browser = playwright.chromium().launch();
    }

    @AfterAll
    void tearDownAll() {
        playwright.close();
    }

    // New instance for each test method.
    protected BrowserContext context;
    protected Page page;
    protected Path currentTracePath;

    @BeforeEach
    void setUp(TestInfo testInfo) {
        context = browser.newContext(
          new Browser.NewContextOptions().setBaseURL("http://localhost:3000")
        );
        context.route("**/*", route -> {
          String url = route.request().url();

          // we skip fontawesome and googleapis requests, we don't need them for functions test, but they cost time
          if (url.contains("use.fontawesome.com") || url.contains("fonts.googleapis.com")) {
            route.abort(); 
            return;
          } 
          route.resume();
        });

        // Start tracing before creating
        String testName = testInfo.getDisplayName().replaceAll("[^a-zA-Z0-9]", "");
        currentTracePath = Paths.get("target/traces/" + testName + ".zip");
        context.tracing().start(new Tracing.StartOptions()
          .setScreenshots(true)
          .setSnapshots(true)
          .setSources(true));
        page = context.newPage();
    }

    @AfterEach
    void tearDown() {
        // Stop tracing and export it into a zip archive.
        context.tracing().stop(new Tracing.StopOptions().setPath(currentTracePath));

        page.close();
        context.close();
    }
}