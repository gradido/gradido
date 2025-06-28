package net.gradido.e2e.components;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class Toasts {
    private final Page page;

    public final Locator toastSlot;
    public final Locator toastTypeError;
    public final Locator toastTitle;
    public final Locator toastMessage;

    public Toasts(Page page) {
        this.page = page;
        toastSlot = page.locator("#__BVID__toaster-container");
        toastTypeError = toastSlot.locator(".toast.text-bg-danger");
        toastTitle = toastTypeError.locator(".gdd-toaster-title");
        toastMessage = toastTypeError.locator(".gdd-toaster-body");
    }

    public void assertErrorToastVisible() {
        toastTypeError.waitFor(); // auf Fehler-Toast warten
        assertTrue(toastTitle.isVisible());
        assertTrue(toastMessage.isVisible());
    }
}
