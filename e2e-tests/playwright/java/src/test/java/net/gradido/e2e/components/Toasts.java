package net.gradido.e2e.components;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class Toasts {
    public final Locator toastSlot;
    public final Locator toastTypeError;
    public final Locator toastTitle;
    public final Locator toastMessage;

    public Toasts(Page page) {
        toastSlot = page.locator("#__BVID__toaster-container");
        toastTypeError = toastSlot.locator(".toast.text-bg-danger");
        toastTitle = toastTypeError.locator(".gdd-toaster-title");
        toastMessage = toastTypeError.locator(".gdd-toaster-body");
    }

    public void assertErrorToastVisible() {
        toastTypeError.waitFor(); 
        assertTrue(toastTitle.isVisible());
        assertTrue(toastMessage.isVisible());
    }
}
